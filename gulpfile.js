'use strict';

var gulp = require('gulp'),
    browserSync = require('browser-sync'),
    reload = browserSync.reload,
    wiredep = require('wiredep'),
    $ = require('gulp-load-plugins')();

var config = {
    bowerDir: './bower_components',
    sassPath: './app/sass',
}

gulp.task('run-bower', function() {
    return $.bower()
        .pipe(gulp.dest(config.bowerDir));
});


gulp.task('vendor-scripts', function() {
  return gulp.src(wiredep().js)
    .pipe(gulp.dest('public/vendor'));
});

//gulp.task('vendor-css', function() {
//  return gulp.src(wiredep().css)
//    .pipe(gulp.dest('public/vendor'));
//});

gulp.task('link-assets', ['scripts', 'styles', 'vendor-scripts'], function() {

  return gulp.src('app/index.html')
    .pipe(wiredep.stream({
      fileTypes: {
        html: {
          replace: {
            js: function(filePath) {
              return '<script src="' + 'vendor/' + filePath.split('/').pop() + '"></script>';
            }
          }
        }
      }
    }))
    .pipe($.inject(
      gulp.src(['public/scripts/**/*.js'], { read: false }), {
        addRootSlash: false,
        transform: function(filePath, file, i, length) {
          return '<script src="' + filePath.replace('public/', '') + '"></script>';
        }
    }))
    .pipe($.inject(
      gulp.src(['public/styles/**/*.css'], { read: false }), {
        addRootSlash: false,
        transform: function(filePath, file, i, length) {
          return '<link rel="stylesheet" href="' + filePath.replace('public/', '') + '"/>';
        }
      }))
    .pipe($.fileInclude({
      prefix: '@@',
      basepath: '@file'
    }))
    .pipe(gulp.dest('public'));
});


gulp.task('connect', function () {
    var connect = require('connect');
    var app = connect()
        .use(require('connect-livereload')({ port: 35729 }))
        .use(connect.static('public'))
        .use(connect.directory('public'));

    require('http').createServer(app)
        .listen(9000)
        .on('listening', function () {
            console.log('Started connect web server on http://localhost:9000');
        });
});


gulp.task('serve', ['connect'], function () {
    require('opn')('http://localhost:9000');
});



gulp.task('styles', function () {
    return gulp.src('app/sass/**/*.scss')
        .pipe($.rubySass({
            style: 'expanded',
            precision: 10,
            lineNumbers: true,
            loadPath: [
                 './app/sass',
                 config.bowerDir + '/bootstrap-sass-official/assets/stylesheets',
                 config.bowerDir + '/fontawesome/scss',
                 config.bowerDir + '/singularity/stylesheets'
            ]
         }))
        .pipe($.autoprefixer('last 1 version'))
        .pipe(gulp.dest('public/styles'))
        .pipe(reload({stream:true}))
        .pipe($.size());
});

gulp.task('minifyStyles', ['fileinclude','styles'], function() {
    return gulp.src('public/styles/*.css')
//         .pipe($.uncss({
//            html: ['public/index.html']
//         }))
        .pipe($.combineMediaQueries())
        .pipe($.autoprefixer('last 1 version'))
        .pipe($.minifyCss({keepBreaks:false}))
        .pipe(gulp.dest('public/styles'))
        .pipe(reload({stream:true}));    
});

gulp.task('images', function() {
  return gulp.src('app/images/*')
    .pipe($.imagemin({ 
        optimizationLevel: 5, 
        progressive: true, 
        interlaced: true }))
    .pipe(gulp.dest('public/images'));
});

gulp.task('scripts', function () {
    return gulp.src('app/scripts/**/*.js')
        .pipe($.jshint())
        .pipe($.jshint.reporter(require('jshint-stylish')))
        .pipe($.order([
            "scripts/b.js",
            "scripts/a.js"
        ]))
        .pipe($.concat("main.js"))
        .pipe($.size())
        .pipe(gulp.dest("public/scripts"));
});

gulp.task('minifyJS', ['scripts'], function () {    
    return gulp.src('public/scripts/*.js')
        .pipe($.jshint())
        .pipe($.jshint.reporter(require('jshint-stylish')))
        .pipe($.stripDebug())
        .pipe($.uglify())    
        .pipe($.size())
        .pipe(gulp.dest("public/scripts"));
});


gulp.task('fonts', function () {
    return $.bowerFiles()
        .pipe($.filter('**/*.{eot,svg,ttf,woff}'))
        .pipe($.flatten())
        .pipe(gulp.dest('dist/fonts'))
        .pipe($.size());
});


// inject bower components
gulp.task('wiredep', function () {
    var wiredep = require('wiredep').stream;

    gulp.src('app/styles/*.scss')
        .pipe(wiredep({
            directory: 'app/bower_components'
        }))
        .pipe(gulp.dest('app/styles'));

    gulp.src('app/*.html')
        .pipe(wiredep({
            directory: 'app/bower_components',
            exclude: ['bootstrap-sass-official']
        }))
        .pipe(gulp.dest('app'));
});

gulp.task('watch', ['connect', 'serve'], function () {
    var server = $.livereload();

    gulp.watch('app/sass/**/*.scss', ['styles']);
    gulp.watch('app/scripts/**/*.js', ['scripts']);
    gulp.watch('app/images/*', ['images']);
    gulp.watch('app/*.html', ['fileinclude']);
    gulp.watch('app/partials/*.html', ['fileinclude']);
    gulp.watch('bower.json', ['wiredep']);
    
    gulp.watch([
        'public/*.html',
        'public/styles/*.css',
        'public/scripts/*.js',
        'public/images/**/*'
    ]).on('change', function (file) {
        server.changed(file.path);
    });

});

gulp.task('fileinclude', function() {
  gulp.src('app/index.html')
    .pipe($.fileInclude({
      prefix: '@@',
      basepath: '@file'
    }))
    .pipe(gulp.dest('public/'));
});


gulp.task('default', ['link-assets', 'images', 'connect', 'serve', 'watch']);

gulp.task('build', ['link-assets', 'minifyStyles', 'minifyJS', 'images', 'serve']);


gulp.task('install', ['run-bower']); //always run in gitshell