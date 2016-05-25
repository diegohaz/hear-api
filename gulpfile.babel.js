import gulp from 'gulp'
import del from 'del'
import lazypipe from 'lazypipe'
import loadPlugins from 'gulp-load-plugins'
import runSequence from 'run-sequence'
import {Instrumenter} from 'isparta'

const paths = {}
paths.server = 'server'
paths.dist = 'dist'
paths.scripts = [
  `${paths.server}/**/!(*.spec|*.integration).js`,
  `!${paths.server}/config/local.env.sample.js`
]
paths.test = {
  unit: [`${paths.server}/**/*.spec.js`, 'mocha.global.js'],
  integration: [`${paths.server}/**/*.integration.js`, 'mocha.global.js']
}

const plugins = loadPlugins()

const mocha = lazypipe()
  .pipe(plugins.mocha, {
    reporter: 'spec',
    timeout: 5000,
    require: ['./mocha.conf']
  })

const istanbul = lazypipe()
  .pipe(plugins.istanbul.writeReports)
  .pipe(plugins.istanbulEnforcer, {
    thresholds: {
      global: {
        lines: 80,
        statements: 80,
        branches: 80,
        functions: 80
      }
    },
    coverageDirectory: './coverage',
    rootDirectory: ''
  })

const babel = lazypipe()
  .pipe(plugins.sourcemaps.init)
  .pipe(plugins.babel)
  .pipe(plugins.sourcemaps.write, '.')

gulp.task('env:all', () => {
  const vars = require('./src/config/local.env')
  plugins.env({vars})
})

gulp.task('env:test', () => {
  plugins.env({
    vars: {NODE_ENV: 'test'}
  })
})

gulp.task('env:prod', () => {
  plugins.env({
    vars: {NODE_ENV: 'production'}
  })
})

gulp.task('test:pre', () => {
  return gulp.src(paths.scripts)
    .pipe(plugins.istanbul({
      instrumenter: Instrumenter,
      includeUntested: true
    }))
    .pipe(plugins.istanbul.hookRequire())
})

gulp.task('test:unit', () => {
  return gulp.src(paths.test.unit)
    .pipe(mocha())
    .pipe(istanbul())
})

gulp.task('test:integration', () => {
  return gulp.src(paths.test.integration)
    .pipe(mocha())
    .pipe(istanbul())
})

gulp.task('test', (cb) => {
  runSequence(
    'test:pre',
    'env:all',
    'env:test',
    'test:unit',
    'test:integration',
    cb
  )
})

gulp.task('clean', () => {
  return del([`${paths.dist}/!(.git*|Procfile)**`], {dot: true})
})

gulp.task('copy', () => {
  return gulp.src('package.json')
    .pipe(gulp.dest(paths.dist))
})

gulp.task('transpile', () => {
  return gulp.src(paths.scripts)
    .pipe(babel())
    .pipe(gulp.dest(`${paths.dist}/${paths.server}`))
})

gulp.task('build', (cb) => {
  runSequence(
    'clean',
    ['copy', 'transpile'],
    cb
  )
})
