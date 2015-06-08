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

module.exports = function(options) {
  options = options || {};

  options.files = options.files || ['bootstrap.js'];
  options.moduleFiles = options.moduleFiles || ['src/**/*.js'];
  options.outputFile = options.outputFile || 'dist/extension.js';

  gulp.task('default', function() {
    var stream = streamqueue({objectMode: true});

    if (options.loader) {
      stream.queue(gulp.src(options.loader));
    }

    stream.queue(gulp.src(options.moduleFiles)
      .pipe(cached('scripts'))
      .pipe(babel({ modules: 'amd', moduleIds: true, moduleRoot: options.modulePrefix }))
      .pipe(remember('scripts')));

    stream.queue(gulp.src(options.files)
      .pipe(babel()));

    stream.done()
      .pipe(concat(path.basename(options.outputFile)))
      .pipe(gulpif(argv.production, uglify()))
      .pipe(gulp.dest(path.dirname(options.outputFile)))
      .pipe(livereload());
  });

  gulp.task('watch', ['default'], function () {
    livereload.listen();
    var watcher = gulp.watch(options.moduleFiles.concat(options.files), ['default']);
    watcher.on('change', function (event) {
      if (event.type === 'deleted') {
        delete cached.caches.scripts[event.path];
        remember.forget('scripts', event.path);
      }
    });
  });
};
