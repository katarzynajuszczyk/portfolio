'use strict';

var gulp = require('gulp'),
    browserSync = require('browser-sync'),
    reload = browserSync.reload,
    concat = require('gulp-concat'),
    order = require("gulp-order"),
    uglify = require('gulp-uglify'),
    imagemin = require('gulp-imagemin'),
    cache = require('gulp-cache'),
    fileinclude = require('gulp-file-include'),
    $ = require('gulp-load-plugins')();


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
        .pipe($.sass({errLogToConsole: true}))
        .pipe($.autoprefixer('last 1 version'))
        .pipe(gulp.dest('public/styles'))
        .pipe(reload({stream:true}))
//        .pipe($.notify("Compilation complete."))
        ;
});


gulp.task('images', function() {
  return gulp.src('app/images/*')
    .pipe(imagemin({ optimizationLevel: 5, progressive: true, interlaced: true }))
    .pipe(gulp.dest('public/images'));
});


gulp.task('scripts', function () {
    return gulp.src('app/scripts/**/*.js')
        .pipe($.jshint())
        .pipe($.jshint.reporter(require('jshint-stylish')))
        .pipe(order([
            "scripts/b.js",
            "scripts/a.js"
        ]))
        .pipe(concat("main.js"))
        .pipe($.size())
        .pipe(gulp.dest("public/scripts"));
});

gulp.task('minifyJS', function () {
    return gulp.src('app/scripts/**/*.js')
        .pipe($.jshint())
        .pipe($.jshint.reporter(require('jshint-stylish')))
        .pipe(order([
            "scripts/b.js",
            "scripts/a.js"
        ]))
        .pipe(concat("main.js"))
        .pipe(uglify())
        .pipe($.size())
        .pipe(gulp.dest("public/scripts"));
});



gulp.task('watch', ['connect', 'serve'], function () {
    var server = $.livereload();

    gulp.watch('app/sass/**/*.scss', ['styles']);
    gulp.watch('app/scripts/**/*.js', ['scripts']);
    gulp.watch('app/images/*', ['images']);
    gulp.watch('app/*.html', ['fileinclude']);
    gulp.watch('app/partials/*.html', ['fileinclude']);
    
    gulp.watch([
        'app/*.html',
        'public/styles/**/*.css',
        'app/sass/**/*.scss',
        'app/scripts/**/*.js'
    ]).on('change', function (file) {
        server.changed(file.path);
    });

});


gulp.task('fileinclude', function() {
  gulp.src('app/index.html')
    .pipe(fileinclude({
      prefix: '@@',
      basepath: '@file'
    }))
    .pipe(gulp.dest('public/'));
});

gulp.task('default', ['watch', 'scripts', 'styles', 'images', 'connect','serve', 'fileinclude']);

gulp.task('build', ['scripts','styles', 'serve', 'minifyJS', 'images','fileinclude']);

