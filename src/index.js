import {obj as throughObject} from 'through2'
import {PluginError} from 'gulp-util'
import stylus from 'stylus'
import vinylSourcemapsApply from 'vinyl-sourcemaps-apply'

const pluginName = 'gulp-native-stylus'
const stylExtension = /\.styl$/
const toArray = (arg) => arg instanceof Array ? arg : [arg]

const plugin = (...args) => {
  const stylusPlugins = []
  let options = {}
  args.forEach(arg => {
    if (typeof arg === 'function') {
      stylusPlugins.push(arg)
    } else {
      options = arg
    }
  })

  return throughObject((file, encode, callback) => {
    if (file.isStream()) {
      return callback(new PluginError(pluginName, 'Streaming not supported'))
    }
    if (file.isNull() || stylExtension.test(file.path) === false) {
      return callback(null, file)
    }

    const opts = {filename: file.path, ...options}
    opts.sourcemap = {
      comment: false,
      basePath: file.base
    }
    if (stylusPlugins.length) {
      opts.use = stylusPlugins.concat(opts.use || [])
    }
    if (file.data) {
      opts.define = {...opts.define, ...file.data}
    }

    const styl = stylus(file.contents.toString(encode || 'utf8'), opts)

    if (opts.include) {
      toArray(opts.include).forEach(name => {
        styl.include(name)
      })
    }
    if (opts.import) {
      toArray(opts.import).forEach(name => {
        styl.import(name)
      })
    }
    if (opts.set) {
      Object.keys(opts.set).forEach(key => {
        styl.set(key, opts.set[key])
      })
    }
    if (opts.define) {
      Object.keys(opts.define).forEach(key => {
        styl.define(key, opts.define[key])
      })
    }
    if (opts.rawDefine) {
      Object.keys(opts.rawDefine).forEach(key => {
        styl.define(key, opts.rawDefine[key], true)
      })
    }

    if (opts.urlfunc) {
      if (typeof opts.urlfunc === 'string') {
        styl.define(opts.urlfunc, stylus.url())
      } else {
        toArray(opts.urlfunc).forEach(urlfunc => {
          const urlOptions = {
            name: 'data-uri',
            paths: styl.get('paths'),
            limit: false,
            ...urlfunc
          }
          styl.define(urlOptions.name, stylus.url(urlOptions))
        })
      }
    }

    if (opts['resolve url']) {
      styl.define('url', stylus.resolver())
    }
    if (opts['resolve url nocheck']) {
      styl.define('url', stylus.resolver({nocheck: true}))
    }

    styl
    .render((error, code) => {
      if (error) {
        return callback(new PluginError(pluginName, error))
      }

      file.path = file.path.replace(stylExtension, '.css')
      file.contents = new Buffer(code)
      if (styl.sourcemap) {
        styl.sourcemap.file = file.relative
        vinylSourcemapsApply(file, styl.sourcemap)
      }

      callback(null, file)
    })
  })
}

plugin.stylus = stylus

export default plugin
