'use strict';

var gulp = require('gulp'),
    browserSync = require('browser-sync'),
    reload = browserSync.reload,
    $ = require('gulp-load-plugins')();

var config = {
    bowerDir: './bower_components'
}

gulp.task('bower', function() {
    return bower()
        .pipe(gulp.dest(config.bowerDir));
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
        .pipe($.sass({errLogToConsole: true}))
        .pipe($.cmq())
        .pipe($.autoprefixer('last 1 version'))
        .pipe(gulp.dest('public/styles'))
        .pipe(reload({stream:true}))
//        .pipe($.notify("Compilation complete."))
        ;
});

gulp.task('minifyCSS', ['fileinclude'], function() {
    return gulp.src('app/sass/**/*.scss')
        .pipe($.sass({errLogToConsole: true}))
        .pipe($.cmq())
        //.pipe($.uncss({html:['public/index.html']}))
        .pipe($.autoprefixer('last 1 version'))
        .pipe($.minifyCSS({keepBreaks:false}))
        .pipe(gulp.dest('public/styles'))
        .pipe(reload({stream:true}))
        ;    
});

gulp.task('images', function() {
  return gulp.src('app/images/*')
    .pipe($.imagemin({ optimizationLevel: 5, progressive: true, interlaced: true }))
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

gulp.task('minifyJS', function () {    
    return gulp.src('app/scripts/**/*.js')
        .pipe($.jshint())
        .pipe($.jshint.reporter(require('jshint-stylish')))
        .pipe($.order([
            "scripts/b.js",
            "scripts/a.js"
        ]))
        .pipe($.concat("main.js"))
        .pipe($.stripDebug())
        .pipe($.uglify())    
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
        'public/*.html',
        'public/styles/*.css',
        'public/scripts/*.js'
    ]).on('change', function (file) {
        server.changed(file.path);
    });

});


gulp.task('fileinclude', function() {
  gulp.src('app/index.html')
    .pipe($.fileinclude({
      prefix: '@@',
      basepath: '@file'
    }))
    .pipe(gulp.dest('public/'));
});

gulp.task('default', ['scripts', 'styles', 'fileinclude', 'images', 'connect','serve','watch']);

gulp.task('build', ['fileinclude', 'minifyCSS', 'minifyJS', 'images', 'serve' ]);

