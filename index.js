var path = require('path');
var gulp = require('gulp');
var livereload = require('gulp-livereload');
var concat = require('gulp-concat');
var argv = require('yargs').argv;
var uglify = require('gulp-uglify');
var gulpif = require('gulp-if');
var babel = require('gulp-babel');
var cached = require('gulp-cached');
var remember = require('gulp-remember');
var streamqueue = require('streamqueue');

function handleError(e) {
  console.log(e.toString());
  this.emit('end');
}

module.exports = function(options) {
  options = options || {};

  options.files = options.files || [];
  options.moduleFiles = options.moduleFiles || ['src/**/*.js'];
  options.bootstrapFiles = options.bootstrapFiles || ['bootstrap.js'];
  options.outputFile = options.outputFile || 'dist/extension.js';

  gulp.task('default', function() {
    var stream = streamqueue({objectMode: true});

    stream.queue(gulp.src(options.files));

    stream.queue(gulp.src(options.moduleFiles)
      .pipe(cached('scripts'))
      .pipe(babel({
        modules: 'amd',
        moduleIds: true,
        moduleRoot: options.modulePrefix,
        externalHelpers: options.externalHelpers,
        jsxPragma: 'm',
        plugins: [require('babel-plugin-object-assign')]
      }))
      .on('error', handleError)
      .pipe(remember('scripts')));

    stream.queue(gulp.src(options.bootstrapFiles)
      .pipe(babel({
        externalHelpers: options.externalHelpers,
        jsxPragma: 'm',
        plugins: [require('babel-plugin-object-assign')]
      }))
      .on('error', handleError));

    stream.done()
      .pipe(concat(path.basename(options.outputFile)))
      .pipe(gulpif(argv.production, uglify()))
      .pipe(gulp.dest(path.dirname(options.outputFile)))
      .pipe(livereload());
  });

  gulp.task('watch', ['default'], function () {
    livereload.listen();
    var watcher = gulp.watch(options.moduleFiles.concat(options.files).concat(options.bootstrapFiles), ['default']);
    watcher.on('change', function (event) {
      if (event.type === 'deleted') {
        delete cached.caches.scripts[event.path];
        remember.forget('scripts', event.path);
      }
    });
  });
};
