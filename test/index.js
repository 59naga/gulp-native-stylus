import {describe} from 'ava-spec'
import {File} from 'gulp-util'
import stripIndent from 'strip-indent'

// target
import plugin from '../src'

// helpers
const pluginTest = (file, args = [], expected = '') => new Promise((resolve, reject) => {
  const stream = plugin(...args)
  stream.write(file)
  stream.end()

  stream.on('error', (error) => reject(error))

  stream.on('data', (file) => {
    stream.once('data', () => {
      reject(new Error('unexpected data. twice `data` event has been called'))
    })

    // little wait for unknown data...
    setTimeout(() => {
      resolve([file.contents.toString().trim(), stripIndent(expected).trim(), file])
    }, 50)
  })
})

// specs
describe('basic', it => {
  const basicFixture = stripIndent(`
    body
      color white
  `)

  it('should pretty compile .styl to .css', async t => {
    const [left, right] = await pluginTest(new File({
      path: 'dummy.styl',
      contents: new Buffer(basicFixture)
    }), [], `
      body {
        color: #fff;
      }
    `)
    t.true(left === right)
  })

  it('should ignore unless .styl file', async t => {
    const [left, right, file] = await pluginTest(new File({
      path: 'un.less',
      contents: new Buffer(basicFixture)
    }), [],
      basicFixture
    )
    t.true(left === right)
    t.true(file.path === 'un.less')
  })

  it('should throw on parse error', t => {
    t.throws(pluginTest(new File({
      path: 'dummy.styl',
      contents: new Buffer(`{`)
    })))
  })

  it('should compress if specify options.compress is true', async t => {
    const [left, right] = await pluginTest(new File({
      path: 'dummy.styl',
      contents: new Buffer(basicFixture)
    }), [
      {compress: true}
    ],
      'body{color:#fff}'
    )
    t.true(left === right)
  })

  it('should import fixture.styl if specify options.import', async t => {
    const [left, right] = await pluginTest(new File({
      path: 'dummy.styl',
      contents: new Buffer('')
    }), [
      {import: `${__dirname}/fixture.styl`}
    ], `
      body {
        color: #808080;
      }
    `)
    t.true(left === right)
  })

  it('should import fixture.styl using @import', async t => {
    const [left, right] = await pluginTest(new File({
      path: 'dummy.styl',
      contents: new Buffer(`@import './fixture.styl'`)
    }), [], `
      body {
        color: #808080;
      }
    `)
    t.true(left === right)
  })

  it('should include paths if specify options.include', async t => {
    const [left, right] = await pluginTest(new File({
      path: 'dummy.styl',
      contents: new Buffer(`@import 'fixture-2'`)
    }), [
      {
        include: `${__dirname}/fixtures`
      }
    ], `
      body {
        opacity: 0.5;
      }
    `)
    t.true(left === right)
  })

  it('should load plugin if specify options.use', async t => {
    const [left, right] = await pluginTest(new File({
      path: 'dummy.styl',
      contents: new Buffer(`
        body
          content foo
      `)
    }), [
      {
        use: [(style) => style.define('foo', 'bar')]
      }
    ], `
      body {
        content: 'bar';
      }
    `)
    t.true(left === right)
  })

  it('should load plugin if dynamic first argument with options', async t => {
    const [left, right] = await pluginTest(new File({
      path: 'dummy.styl',
      contents: new Buffer(`
        body
          {foo} bar
      `)
    }), [(style) => style.define('bar', 'baz'), {define: {foo: 'content'}}], `
      body {
        content: 'baz';
      }
    `)
    t.true(left === right)
  })

  it('should enable variable if specify options.define', async t => {
    const [left, right] = await pluginTest(new File({
      path: 'dummy.styl',
      contents: new Buffer(basicFixture)
    }), [{
      define: {
        white: '#000'
      }
    }], `
      body {
        color: '#000';
      }
    `)
    t.true(left === right)
  })

  it('should enable variable if using gulp-data', async t => {
    const file = new File({
      path: 'dummy.styl',
      contents: new Buffer(basicFixture)
    })
    file.data = {
      white: '#000'
    }

    const [left, right] = await pluginTest(file, [], `
      body {
        color: '#000';
      }
    `)
    t.true(left === right)
  })

  it('should enable raw-variable if specify options.rawDefine', async t => {
    const [left, right] = await pluginTest(new File({
      path: 'dummy.styl',
      contents: new Buffer(stripIndent(`
        body
          color raw['color']
      `))
    }), [{
      rawDefine: {raw: {color: '#000'}}
    }], `
      body {
        color: '#000';
      }
    `)
    t.true(left === right)
  })

  it('should generate sourceMap if specify options.sourcemap', async t => {
    const [left, right, file] = await pluginTest(new File({
      base: '.',
      cwd: '.',
      path: 'dummy.styl',
      contents: new Buffer(basicFixture)
    }), [{sourcemap: true}], `
      body {
        color: #fff;
      }
    `)
    t.true(left === right)
    t.true(file.sourceMap.file === 'dummy.css')
    t.true(file.sourceMap.mappings.length > 1)
    t.true(file.sourceMap.sources[0] === 'dummy.styl')
  })

  it('should export stylus reference', t => {
    t.truthy(plugin.stylus)
  })
})

// 'should import other .styl files'
