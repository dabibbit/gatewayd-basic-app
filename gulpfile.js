"use strict";

var fs = require('fs');
var _ = require('lodash');
var path = require('path');
var packageConfig = require('./package.json');
var NAME = packageConfig.name;
var posix = require('posix');

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

// message formatting
var error = chalk.bold.red;
var warning = chalk.bold.yellow;
var info = chalk.black.bgMagenta;
var message = chalk.bold.black.bgGreen;

var logBanner = function(message) {
  if (message) {
    return [
      '======= '+ message + ' =======',
    ].join('\n');
  } else {
    return '====================\n';
  }
};

// prod build
var tar = require('gulp-tar');
var gzip = require('gulp-gzip');

// server deploy
var rsync = require('gulp-rsync');
var gulpSSH = (function() {
  var sshKeyPath = getSecret('sshKeyPath') || '',
      config, errorMessage;

  errorMessage = function() {
    console.log(error("Your secret key configuration is invalid. You will not be able to deploy"));
  };

  if (!fs.existsSync(sshKeyPath)) {
    errorMessage();
    return false;
  }

  config = {
    ignoreErrors: false,
    sshConfig: {
      host: getSecret('hostName'),
      username: getSecret('userName'),
      privateKey: require('fs').readFileSync(getSecret('sshKeyPath')),
      passphrase: getSecret('passPhrase')
    }
  };

  var isValid = function(obj) {
    return _.reduce(obj.sshConfig, function(accumulator, value, key) {

      if (!accumulator) {
        return false;
      }

      return accumulator && !_.isEmpty(value);
    }, true);
  };

  if (!isValid(config)) {
    errorMessage();
    return null;
  }

  return require('gulp-ssh')(config);
})();

// environment flags
var isProduction = flags.production || false;
var isDeploy = flags.deploy || false;
var isRollback = flags.rollback || false;
var watching = flags.watch || false;

//server
var livereload = require('gulp-livereload');
var connect = require('gulp-connect');

// todo: clean up and standardize config
var paths = (function() {
  var root = path.join(__dirname),
      devDir = "dist",
      prodDir = "build",
      scripts = "app/scripts/",
      styles = "app/styles/",
      setPath;

  setPath = function() {
    var args = Array.prototype.slice.call(arguments);

    args.unshift(root);

    return  path.join.apply(this, args);
  };

  return {
    sass: setPath(styles, '**/*.scss'),
    html: setPath('app/*.html'),
    main_js: setPath(scripts, 'main.jsx'),
    js: setPath(scripts, '**/*.js'),
    jsx: setPath(scripts, '**/*.jsx'),
    json: setPath(scripts, '**/*.json'),
    fonts: setPath('./app/libs/bootstrap-sass-official/assets/fonts/**/*.{ttf,woff,eot,svg}'),
    dist: setPath(devDir),
    devBuild: {
      fonts: setPath(devDir, 'fonts'),
      styles: setPath(devDir, 'styles'),
      html: setPath(devDir),
      scripts: setPath(devDir, 'scripts')
    },
    prodBuild: {
      dir: setPath(prodDir),
      name: 'archive.tar'
    },
    deploy: {
      dir: '/srv/' + NAME,
      buildDir: prodDir,
      releaseDir: '/releases',
      currentDir: '/current'
    }
  };
})();


// build
// todo: clean this up, abstract the sequnce calls and args to config
// in future use methods to DRY this up
gulp.task('build', function(callback) {

  console.log(
    message(
      logBanner('Building ' + (flags.production ? 'production' : 'dev'))
    )
  );

  if (watching) {
    sequence(
      ['ulimitCheck', 'clean'],
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
      ['ulimitCheck', 'clean'],
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
gulp.task('ulimitCheck', function(cb) {
  var nlimit = posix.getrlimit('nofile').soft;

  if (!(_.isNull(nlimit)) && nlimit < 2048) {
    console.log(info(logBanner('ulimit -n is currently only ' + nlimit)));
    console.log(info(logBanner('Please run "ulimit -n 2048" to ensure resources for node processes')));
  }

  cb();
});

gulp.task('clean', function(cb) {
  return del([paths.prodBuild.dir, paths.dist], cb);
});

gulp.task('copy', function() {
  var fonts, index;

  fonts = gulp.src(paths.fonts)
          .pipe(gulp.dest(paths.devBuild.fonts));

  index = gulp.src(paths.html)
          .pipe(gulp.dest(paths.devBuild.html));

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
    .pipe(gulp.dest(paths.devBuild.styles));
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
    .pipe(gulp.dest(paths.devBuild.scripts));
});

gulp.task('archive', function() {
  return gulp.src(path.join(paths.dist, '**'))
    .pipe(tar(paths.prodBuild.name))
    .pipe(gzip())
    .pipe(gulp.dest(paths.prodBuild.dir));
});

// Quick hack to kill the deploy process if the files do not exists
var checkUploadRequirements = function() {
  var filepath = path.join(paths.prodBuild.dir, paths.prodBuild.name) + '.gz';

  //check if dir/archive exist
  if (!fs.existsSync(filepath)) {
    console.log( error( logBanner('ERROR')));
    console.log(error(filepath + ' does not appear to exist.\n Please run "npm run prod" or check your settings\n\n'));
    process.exit(0);
  }
};

//make destination directory on server
gulp.task('ssh-mkdir', function() {
  console.log( message( logBanner('Begin SSH-MKDIR')));

  checkUploadRequirements();

  var deployDir = paths.deploy.dir,
      releaseDir = path.join(deployDir, paths.deploy.releaseDir);

  //todo: improve the way we assign permissions here
  return gulpSSH
    .shell([
      'sudo mkdir -p ' + releaseDir,
      'sudo chown -R ubuntu. /srv'
    ], {filePath: 'shell.log'})
    .pipe(gulp.dest('logs'));
});

// upload files to destination directory
gulp.task('upload', function() {
  console.log( message( logBanner('Begin Deploy')));

  checkUploadRequirements();

  var deployDir = paths.deploy.dir,
      releaseDir = path.join(deployDir, paths.deploy.releaseDir);

  return gulp.src(path.join(paths.prodBuild.dir, paths.prodBuild.name + '.gz'))
    .pipe(rsync({
      hostname: secrets.hostName,
      username: secrets.userName,
      destination: releaseDir,
      incremental: true,
      args: ['--verbose'],
      progress: true
    }, function(error, stdout, stderr, cmd) {
      console.log(message(stdout));
      console.log(error(error));
      console.log(error(stderr));
      console.log(info(cmd));
    }));
});

// TODO: refactor paths in config so rollback and unpack access same values
// decompress archive and create symlink
gulp.task('ssh-unpack', function() {
  console.log( message( logBanner('Begin unpack')));

  var deployDir = paths.deploy.dir,
      currentDir = path.join(deployDir, paths.deploy.currentDir),
      releaseDir = path.join(deployDir, paths.deploy.releaseDir),
      buildDir = path.join(releaseDir, paths.deploy.buildDir),
      archiveName = paths.prodBuild.name + '.gz';

  return gulpSSH
    .shell([
      'TIMESTAMP=$(date +%s)',
      'DEPLOY_DIR=' + deployDir,
      'CURRENT_DIR=' + currentDir,
      'RELEASE_DIR=' + releaseDir + '/' + '$TIMESTAMP',
      'BUILD_DIR=' + buildDir,
      'ARCHIVE_NAME=' + archiveName,
      'if [ ! -e $BUILD_DIR/$ARCHIVE_NAME ]; then echo "Archive does not exist. Exiting"; exit1; fi',
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
      currentDir = path.join(deployDir, paths.deploy.currentDir),
      releaseDir = path.join(deployDir, paths.deploy.releaseDir),
      buildDir = path.join(releaseDir, paths.deploy.buildDir),
      archiveName = paths.prodBuild.name + '.gz';

  // does not rollback if there is no previous release!!
  return gulpSSH
    .shell([
      'DEPLOY_DIR=' + deployDir,
      'CURRENT_DIR=' + currentDir,
      'RELEASE_DIR=' + releaseDir,
      'DIRS=$(find $RELEASE_DIR -mindepth 1 -maxdepth 1 -type d | sort -r | xargs -n 1 basename)',
      'set -- $DIRS ; TO_REMOVE=$1 ; PREVIOUS=$2',
      'if [ $PREVIOUS ]; then rm $CURRENT_DIR; ln -s $RELEASE_DIR/$PREVIOUS $CURRENT_DIR && rm -rf $RELEASE_DIR/$TO_REMOVE; else echo "No Previous Version. Can\'t rollback"; fi'
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

  //gulp watch uses 'gaze' - paths must be relative
  //let's address this later

  gulp.watch('./app/styles/**/*.scss', ['sass']);
  gulp.watch('./app/*.html', ['copy']);
  gulp.watch('./app/scripts/**/*.js', ['js']);
  gulp.watch('./app/scripts/**/*.jsx', ['js']);
  gulp.watch('./app/scripts/**/*.json', ['js']);
  gulp.watch('./dist/' + '**/*.{html,css,js}').on('change', function() {
    console.log(info("watch"), arguments);
    livereload.changed();
  });
});

// The default task (called when you run `gulp` from cli)
gulp.task('default', function() {
  gulp.start('build');
});
