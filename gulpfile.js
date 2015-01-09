"use strict";

var fs = require('fs');
var _ = require('lodash');
var packageConfig = require('./package.json');
var NAME = packageConfig.name;

// todo: clean this up and modularize with variable file name/path
// handle secrets. Make npm module for this in the future
var secrets = {};

if (fs.existsSync('./secrets.json')) {
  secrets = require('./secrets.json');
}

var getSecret = function(key) {
  if (secrets[key]) {
    return secrets[key];
  }

  return false;
};
// end secrets

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
var debug = require('gulp-debug');

// prod build
var tar = require('gulp-tar');
var gzip = require('gulp-gzip');

// server deploy
var rsync = require('gulp-rsync');
var gulpSSH = require('gulp-ssh')({
  ignoreErrors: false,
  sshConfig: {
    host: 'gatewayd.org',
    username: 'ubuntu',
    privateKey: require('fs').readFileSync('/Users/haroun/.ssh/id_rsa'),
    passphrase: getSecret('passPhrase')
  }
});

// message formatting
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

// environment flags
var isProduction = flags.production || false;
var isDeploy = flags.deploy || false;
var isRollback = flags.rollback || false;
var watching = flags.watch || false;

//server
var livereload = require('gulp-livereload');
var connect = require('gulp-connect');

// todo: clean up and standardize config
var paths = {
      sass: './app/styles/**/*.scss',
      html: './app/*.html',
      main_js: ['./app/scripts/main.jsx'],
      js: 'app/scripts/**/*.js',
      jsx: 'app/scripts/**/*.jsx',
      json: 'app/scripts/**/*.json',
      fonts: './app/libs/bootstrap-sass-official/assets/fonts/**/*.{ttf,woff,eot,svg}',
      dist: './dist/',
      build: {
        fonts: './dist/fonts/',
        styles: './dist/styles/',
        html: './dist/',
        scripts: './dist/scripts/'
      },
      archive: {
        dir: '/build',
        name: 'archive.tar'
      },
      deploy: {
        dir: '/srv/' + NAME,
        release_dir: '/releases',
        current_dir: '/current'
      }
    };

// build
// todo: clean this up, abstract the sequnce calls and args to config
gulp.task('build', function(callback) {

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
  } else if (isProduction) {
    sequence(
      'clean',
      [
        'copy',
        'sass',
        'js'
      ],
      'archive',
      function() {
        console.log(message(logBanner("Build Completed")));
        process.exit(0);
      });
  } else if (isDeploy) {
    sequence(
      'ssh-mkdir',
      'upload',
      'ssh-unpack',
      function() {
        console.log(message(logBanner("Deploy Completed")));
        process.exit(0);
      });
  } else if (isRollback) {
    sequence(
      'ssh-rollback',
      function() {
        console.log(message(logBanner("Rollback Completed")));
        process.exit(0);
      });
  }
});


// scripts
gulp.task('clean', function(cb) {
  del(['.' + paths.archive.dir, '.' + paths.dist], cb);
});

gulp.task('copy', function() {
  var fonts, index;

  fonts = gulp.src(paths.fonts)
          .pipe(gulp.dest(paths.build.fonts));

  index = gulp.src(paths.html)
          .pipe(gulp.dest(paths.build.html));

  return merge(fonts, index);
});

gulp.task('sass', function() {
  return gulp
    .src([paths.sass])
    .pipe(sass({
      errLogToConsole: true,
      outputStyle: isProduction ? 'compressed' : 'nested'
    }))
    .pipe(autoprefixer({
      browsers: ['last 2 versions'],
      cascade: false
    }))
    //.pipe(debug({verbose: true, title: "SASS LOG"}))
    .pipe(gulp.dest(paths.build.styles));
});

// need to do something about jsx before using this
gulp.task('jshint', function() {
  return gulp.src([paths.js, paths.jsx])
  .pipe(plumber())
  .pipe(jshint('.jshintrc'))
  .pipe(jshint.reporter(stylish));
});


// build bundle.js
gulp.task('js', function() {

  // Browserify/bundle the JS.
  return browserify(paths.main_js)
    .transform(reactify)
    .bundle()
    .pipe(source('bundle.js'))
    .pipe(buffer())
    //.pipe(debug({verbose: true}))
    .pipe(gulpif(isProduction, uglify()))
    .pipe(gulp.dest(paths.build.scripts));
});

gulp.task('archive', function() {
  return gulp.src(paths.dist + '**')
    .pipe(tar(paths.archive.name))
    .pipe(gzip())
    .pipe(gulp.dest("." + paths.archive.dir));
});

gulp.task('upload', function() {
  console.log( message( logBanner('Begin Deploy')));

  var deployDir = paths.deploy.dir,
      releaseDir = deployDir + paths.deploy.release_dir;

  return gulp.src('.' + paths.archive.dir +
                  '/' + paths.archive.name + '.gz')
    .pipe(rsync({
      hostname: 'gatewayd.org',
      username: 'ubuntu',
      destination: releaseDir,
      incremental: true,
      args: ['--verbose'],
      progress: true
    }, function(error, stdout, stderr, cmd) {
      console.log(message(stdout));
      console.log(message(error));
      console.log(message(stderr));
      console.log(message(cmd));
    }));
});

gulp.task('ssh-mkdir', function() {
  console.log( message( logBanner('Begin SSH-MKDIR')));

  var deployDir = paths.deploy.dir,
      releaseDir = deployDir + paths.deploy.release_dir;

  //todo: improve the way we assign permissions here
  return gulpSSH
    .shell([
      'sudo mkdir -p ' + releaseDir,
      'sudo chown -R ubuntu. /srv'
    ], {filePath: 'shell.log'})
    .pipe(gulp.dest('logs'));
});

gulp.task('ssh-unpack', function() {
  console.log( message( logBanner('Begin unpack')));

  var deployDir = paths.deploy.dir,
      currentDir = deployDir + paths.deploy.current_dir,
      releaseDir = deployDir + paths.deploy.release_dir,
      buildDir = releaseDir + paths.archive.dir,
      archiveName = paths.archive.name + '.gz';

  return gulpSSH
    .shell([
      'TIMESTAMP=$(date +%s)',
      'DEPLOY_DIR=' + deployDir,
      'CURRENT_DIR=' + currentDir,
      'RELEASE_DIR=' + releaseDir + '/' + '$TIMESTAMP',
      'BUILD_DIR=' + buildDir,
      'ARCHIVE_NAME=' + archiveName,
      'mkdir $RELEASE_DIR',
      'tar xzf $BUILD_DIR/$ARCHIVE_NAME -C $RELEASE_DIR && rm -rf $BUILD_DIR',
      'if [ -L $CURRENT_DIR ]; then rm $CURRENT_DIR; fi',
      'ln -s $RELEASE_DIR $CURRENT_DIR'
    ], {filePath: 'deploy.log'})
    .pipe(gulp.dest('logs'));
});

gulp.task('ssh-rollback', function() {
  console.log( message( logBanner('Begin rollback')));

  var deployDir = paths.deploy.dir,
      currentDir = deployDir + paths.deploy.current_dir,
      releaseDir = deployDir + paths.deploy.release_dir,
      buildDir = releaseDir + paths.archive.dir,
      archiveName = paths.archive.name + '.gz';

  // does not rollback if there is no previous release!!
  return gulpSSH
    .shell([
      'DEPLOY_DIR=' + deployDir,
      'CURRENT_DIR=' + currentDir,
      'RELEASE_DIR=' + releaseDir,
      'DIRS=$(find $RELEASE_DIR -mindepth 1 -maxdepth 1 -type d | sort -r | xargs -n 1 basename)',
      'set -- $DIRS ; TO_REMOVE=$1 ; PREVIOUS=$2',
      'if [ $PREVIOUS ]; then rm $CURRENT_DIR;ln -s $RELEASE_DIR/$PREVIOUS $CURRENT_DIR && rm -rf $RELEASE_DIR/$TO_REMOVE; fi'
    ], {filePath: 'rollback.log'})
    .pipe(gulp.dest('logs'));
});

gulp.task('connect', function() {
  connect.server({
    root: paths.dist
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
  gulp.watch(paths.dist + '**/*.{html,css,js}').on('change', function() {
    console.log(info("watch"), arguments);
    livereload.changed();
  });
});

// The default task (called when you run `gulp` from cli)
gulp.task('default', function() {
  gulp.start('build');
});
