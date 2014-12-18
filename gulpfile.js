"use strict";

var chalk = require('chalk');
var gulp = require('gulp');
var sass = require('gulp-sass');
var autoprefixer = require('gulp-autoprefixer');
var merge = require('merge-stream');

var browserify = require('browserify');
var del = require('del');
var reactify = require('reactify');
var source = require('vinyl-source-stream');
var buffer = require('vinyl-buffer');
var uglify = require('gulp-uglify');
var jshint = require('gulp-jshint');
var stylish = require('jshint-stylish');
var sequence = require('run-sequence');
var gulpif = require('gulp-if');
var flags = require('minimist')(process.argv.slice(2));
var plumber = require('gulp-plumber');

var isProduction = flags.production || flags.prod || false;
var watching = flags.watch || false;

var error = chalk.bold.red;
var warning = chalk.bold.yellow;
var info = chalk.black.bgMagenta;
var message = chalk.bold.black.bgGreen;

var logBanner = function(message) {
  if (message) {
    return [
      '',
      '======= '+ message + ' =======',
      ''
    ].join('\n');
  }
};

//server
var livereload = require('gulp-livereload');
var connect = require('gulp-connect');

var paths = {
    sass: './app/styles/**/*.scss',
    html: './app/*.html',
    main_js: ['./app/scripts/main.jsx'],
    js: 'app/scripts/**/*.js',
    jsx: 'app/scripts/**/*.jsx',
    json: 'app/scripts/**/*.json',
    fonts: './app/libs/bootstrap-sass-official/assets/fonts/**/*.{ttf,woff,eot,svg}',
    build: {
      fonts: './dist/fonts/',
      styles: './dist/styles/',
      html: './dist/',
      scripts: './dist/scripts/'
    }
};

// build
gulp.task('build', function() {

  console.log(
    message(
      logBanner('Building ' + (flags.production ? 'production' : 'dev'))
    )
  );

  if (watching) {
    sequence(
      'clean',
      [
        'copy',
        'connect',
        'sass',
        'js'
      ],
      'watch',
      function() {
        console.log(info(logBanner("Watching...")));
      });
  } else {
    sequence(
      'clean',
      [
        'copy',
        'sass',
        'js'
      ],
      function() {
        console.log(message(logBanner("Build Completed")));
      });
  }
});


// scripts
gulp.task('clean', function(cb) {
  del(['build'], cb);
});

gulp.task('copy', ['clean'], function() {
  var fonts, index;

  fonts = gulp.src(paths.fonts)
          .pipe(gulp.dest(paths.build.fonts));

  index = gulp.src(paths.html)
          .pipe(gulp.dest(paths.build.html));

  return merge(fonts, index);
});

gulp.task('sass', ['clean'], function() {
  gulp
    .src([paths.sass])
    .pipe(sass({
      errLogToConsole: true,
      outputStyle: isProduction ? 'compressed' : 'nested'
    }))
    .pipe(autoprefixer({
      browsers: ['last 2 versions'],
      cascade: false
    }))
    .pipe(gulp.dest(paths.build.styles));
});

// need to do something about jsx before using this
gulp.task('jshint', function() {
  return gulp.src([paths.js, paths.jsx])
  .pipe(plumber())
  .pipe(jshint('.jshintrc'))
  .pipe(jshint.reporter(stylish));
});


gulp.task('js', ['clean'], function() {

  // Browserify/bundle the JS.
  browserify(paths.main_js)
    .transform(reactify)
    .bundle()
    .pipe(source('bundle.js'))
    .pipe(buffer())
    .pipe(gulpif(isProduction, uglify()))
    .pipe(gulp.dest(paths.build.scripts));
});

gulp.task('connect', function() {
  connect.server({
    root: './dist/'
  });
});

// Rerun the task when a file changes
gulp.task('watch', function() {
  livereload.listen();

  gulp.watch(paths.sass, ['sass']);
  gulp.watch(paths.html, ['copy']);
  gulp.watch(paths.js, ['js']);
  gulp.watch(paths.jsx, ['js']);
  gulp.watch(paths.json, ['js']);
  gulp.watch('./dist/**/*.{html,css,js}').on('change', function() {
    console.log(info("watch"), arguments);
    livereload.changed();
  });
});

// The default task (called when you run `gulp` from cli)
gulp.task('default', function() {
  gulp.start('build');
});
