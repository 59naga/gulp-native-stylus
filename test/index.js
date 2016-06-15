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
  const basicFixture = new Buffer(stripIndent(`
    body
      color white
  `))

  it('should pretty compile .styl to .css', async t => {
    const [left, right] = await pluginTest(new File({
      path: 'dummy.styl',
      contents: basicFixture
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
      contents: basicFixture
    }), [],
      basicFixture.toString()
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

  it('should compress if specify opts.compress is true', async t => {
    const [left, right] = await pluginTest(new File({
      path: 'dummy.styl',
      contents: basicFixture
    }), [
      {compress: true}
    ],
      'body{color:#fff}'
    )
    t.true(left === right)
  })

  it('should import fixture.styl if specify opts.import', async t => {
    const [left, right] = await pluginTest(new File({
      path: 'dummy.styl',
      contents: new Buffer('')
    }), [
      {import: `${__dirname}/fixtures/import.styl`}
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
      contents: new Buffer(`@import './fixtures/import.styl'`)
    }), [], `
      body {
        color: #808080;
      }
    `)
    t.true(left === right)
  })

  it('should include paths if specify opts.include', async t => {
    const [left, right] = await pluginTest(new File({
      path: 'dummy.styl',
      contents: new Buffer(`@import 'include'`)
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

  it('should load plugin if specify opts.use', async t => {
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

  it('should enable variable if specify opts.define', async t => {
    const [left, right] = await pluginTest(new File({
      path: 'dummy.styl',
      contents: basicFixture
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
      contents: basicFixture
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

  it('should enable raw-variable if specify opts.rawDefine', async t => {
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

  it('should resolve url if specify opts[`resolve url`]', async t => {
    const [left, right] = await pluginTest(new File({
      path: 'dummy.styl',
      contents: new Buffer('@import "fixtures/resolve-url"')
    }), [{
      'resolve url': true
    }], `
      body {
        background: url("fixtures/resolve-url.png");
      }
    `)
    t.true(left === right)
  })

  it('should resolve url with nocheck if specify opts[`resolve url nocheck`]', async t => {
    const [left, right] = await pluginTest(new File({
      path: 'dummy.styl',
      contents: new Buffer('@import "fixtures/resolve-url-nocheck"')
    }), [{
      'resolve url nocheck': true
    }], `
      body {
        background: url("fixtures/resolve-url-nocheck/child/child.png");
      }
    `)
    t.true(left === right)
  })

  it('should convert url to datauri if specify opts.urlfunc', async t => {
    const [left, right] = await pluginTest(new File({
      path: 'dummy.styl',
      contents: new Buffer(`
        body
          background url('fixtures/resolve-url.png')
      `)
    }), [{
      urlfunc: 'url'
    }], `
      body {
        background: url("data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVQImWNgYGD4DwABBAEAfbLI3wAAAABJRU5ErkJggg==");
      }
    `)
    t.true(left === right)
  })

  it('should convert url to datauri if specify opts.urlfunc at object/array', async t => {
    const [left, right] = await pluginTest(new File({
      path: 'dummy.styl',
      contents: new Buffer(`
        body
          background data-url('fixtures/resolve-url.png')
        body
          background data-url-unlimited('fixtures/resolve-url.png')
      `)
    }), [{
      urlfunc: [
        {name: 'data-url', limit: 10},
        {name: 'data-url-unlimited'}
      ]
    }], `
      body {
        background: url("fixtures/resolve-url.png");
      }
      body {
        background: url("data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVQImWNgYGD4DwABBAEAfbLI3wAAAABJRU5ErkJggg==");
      }
    `)
    t.true(left === right)
  })

  it('should export stylus reference', t => {
    t.truthy(plugin.stylus)
  })
})

// 'should import other .styl files'
