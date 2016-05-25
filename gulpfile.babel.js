import gulp from 'gulp'
import lazypipe from 'lazypipe'
import loadPlugins from 'gulp-load-plugins'
import runSequence from 'run-sequence'

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

gulp.task('env:all', () => {
  let vars = require('./src/config/local.env')
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

gulp.task('mocha:unit', () => {
  return gulp.src(paths.test.unit)
    .pipe(mocha())
})

gulp.task('mocha:integration', () => {
  return gulp.src(paths.test.integration)
    .pipe(mocha())
})

gulp.task('test', (cb) => {
  runSequence(
    'env:all',
    'env:test',
    'mocha:unit',
    'mocha:integration',
    cb
  )
})
