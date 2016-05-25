import gulp from 'gulp'
import lazypipe from 'lazypipe'
import loadPlugins from 'gulp-load-plugins'
import runSequence from 'run-sequence'
import {Instrumenter} from 'isparta'

const paths = {}
paths.src = 'src'
paths.dist = 'dist'
paths.scripts = [
  `${paths.src}/**/!(*.spec|*.integration).js`,
  `!${paths.src}/config/local.env.sample.js`
]
paths.test = {
  unit: [`${paths.src}/**/*.spec.js`, 'mocha.global.js'],
  integration: [`${paths.src}/**/*.integration.js`, 'mocha.global.js']
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
