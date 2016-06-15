:straight_ruler: `gulp-native-stylus`
---
<p align="right">
  <a href="https://npmjs.org/package/gulp-native-stylus">
    <img src="https://img.shields.io/npm/v/gulp-native-stylus.svg?style=flat-square">
  </a>
  <a href="https://travis-ci.org/59naga/gulp-native-stylus">
    <img src="http://img.shields.io/travis/59naga/gulp-native-stylus.svg?style=flat-square">
  </a>
  <a href="https://codeclimate.com/github/59naga/gulp-native-stylus/coverage">
    <img src="https://img.shields.io/codeclimate/github/59naga/gulp-native-stylus.svg?style=flat-square">
  </a>
  <a href="https://codeclimate.com/github/59naga/gulp-native-stylus">
    <img src="https://img.shields.io/codeclimate/coverage/github/59naga/gulp-native-stylus.svg?style=flat-square">
  </a>
  <a href="https://gemnasium.com/59naga/gulp-native-stylus">
    <img src="https://img.shields.io/gemnasium/59naga/gulp-native-stylus.svg?style=flat-square">
  </a>
</p>

[gulp](https://github.com/gulpjs/gulp#readme) [stylus](https://github.com/stylus/stylus#readme) plugin without accord for [pnpm] compatibility.

:inbox_tray: Installation
---
```bash
npm install stylus gulp-native-stylus --save
```

:bulb: Motivation
---
[gulp-stylus](https://github.com/stevelacy/gulp-stylus#readme) hates [pnpm].
but `gulp-native-stylus` frinedly to [pnpm]!!

[pnpm]: https://github.com/rstacruz/pnpm#readme

:scroll: API
---

## `gulp-native-stylus([use, [use, ..]], opts={})`

* `opts.compress=false`: if specify `true`, compress the compiled css.
* `opts.import`: if specify `string/array`, add `@import` to beggining of the line.
* `opts.include`: if specify `string/array`, add paths of stylus for `@import`.
* `opts.use`: if specify `function/array`, use stylus plugins.
* `opts.set`: if specify `object`, set environment of stylus.
* `opts.define`: if specify `object`, set variables of stylus.
* `opts.rawDefine`: if specify `object`, set raw variables of stylus.
* `opts.urlfunc`: if specify `string/object/array`, set `stylus.url()`.
  * if `string`, performs conversions of data uri at specified function name.
  * if `object`, performs conversions of data uri at
    * `object.name{string}`: a function name. (default `data-uri`)
    * `object.path{array}`: an include paths. (default `opts.set.paths`)
    * `object.limit{number|bool}`: a max size of conversion. ignore the exceeded files. (default `false` unlimited)
  * if `array`, handles the value of the array as the `object`.
* `opts['resolve url']`: if specify `true`, set `opts.define('url', stylus.resolver())`.
* `opts['resolve url nocheck']`: if specify `true`, set `opts.define('url', stylus.resolver({nocheck: true}))`.

example:

```js
import gulp from 'gulp'
import data from 'gulp-data'
import sourcemaps from 'gulp-sourcemaps'

import autoprefixer from 'autoprefixer-stylus'
import ks from 'kouto-swiss'
import sanitize from 'sanitize.styl'
import jeet from 'jeet'
import srb from 'stylus-responsive-breakpoints'

import stylus from 'gulp-native-stylus'

gulp.task('simple', () =>
  gulp.src('src/index.styl')
  .pipe(stylus())
  .pipe(gulp.dest('release'))
)

gulp.task('dynamic-use-plugin-with-sourcemaps', () =>
  gulp.src('src/index.styl')
  .pipe(sourcemaps.init())
  .pipe(stylus(autoprefixer(), ks(), sanitize(), jeet(), srb(), {compress: true}))
  .pipe(sourcemaps.write('.'))
  .pipe(gulp.dest('release'))
)

const rawDefine = {red: '#000'}
gulp.task('use-rawdefine', () =>
  gulp.src('src/index.styl')
    .pipe(stylus({rawDefine}))
    .pipe(gulp.dest('release'))
)

gulp.task('use-gulp-data', () =>
  gulp.src('src/index.styl')
    .pipe(data(() => {
      return {red: '#000'}
    }))
    .pipe(stylus())
    .pipe(gulp.dest('release'))
)
```

:wrench: Development
---
Requirement global
* NodeJS v5.11.1
* Npm v3.8.6 (or [pnpm](https://github.com/rstacruz/pnpm))

```bash
git clone https://github.com/59naga/gulp-native-stylus
cd gulp-native-stylus
npm install

npm test
```

<br><br>
<p align="right">
  <a href="http://59naga.mit-license.org/">
    MIT License :clipboard:
  </a>
</p>
