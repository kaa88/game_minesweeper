// Includes //
const { src, dest } = require('gulp'),
	gulp = require('gulp'),
	browsersync = require('browser-sync').create(),
	del = require('del'),
	rename = require('gulp-rename'),
	fileinclude = require('gulp-file-include'), // html & js
	sass = require('gulp-sass')(require('sass')),
	autoprefixer = require('gulp-autoprefixer'), // css
	clean_css = require('gulp-clean-css'),
	clean_js = require('gulp-uglify-es').default

///////////////////////////////////////////////////////

// Path //
let $source = 'src';
let $baseDir = {
	html: $source + '/',
	css: $source + '/css/',
	js: $source + '/js/',
}
let $project = 'dist';
let $path = {
	clean: ['./dist/', './assets/'],
	watch: {
		html: $baseDir.html + '**/*.html',
		scss: $baseDir.css + '**/*.scss',
		js: $baseDir.js + '**/*.js',
	},
	src: {
		html: [$baseDir.html + '**/*.html', '!' + $baseDir.html + '**/#*.html', '!' + $baseDir.html + '**/parts/*'],
		css: $baseDir.css + '*.css',
		scss: $baseDir.css + '*style.scss',
		js: $baseDir.js + '*.js',
	},
	build: {
		html: $project + '/',
		css: $project + '/css/',
		js: $project + '/js/',
	}
}

///////////////////////////////////////////////////////

function clean() {
	return del($path.clean);
}

///////////////////////////////////////////////////////

function html() {
	return src($path.src.html)
		.pipe(fileinclude({
			indent: true,
		}))
		.pipe(dest($path.build.html))
		.pipe(browsersync.stream())
}

///////////////////////////////////////////////////////

function scss() {
	return src($path.src.scss)
		.pipe(sass({ outputStyle: 'expanded' }))
		.pipe(autoprefixer({
			overrideBrowserslist: ['last 5 versions'],
			cascade: true
		}))
		// .pipe(clean_css())
		// .pipe(rename({ extname: '.min.css' }))
		.pipe(dest($path.build.css))
		.pipe(browsersync.stream())
}

///////////////////////////////////////////////////////

function js() {
	return src($path.src.js)
		.pipe(fileinclude({
			indent: true,
		}))
		// .pipe(clean_js())
		// .pipe(rename({ extname: '.min.js' }))
		.pipe(dest($path.build.js))
		.pipe(browsersync.stream())
}

///////////////////////////////////////////////////////

function browserSyncInit() {
	setTimeout(() => {
		browsersync.init({
			server: { baseDir: './' + $project + '/' },
			port: 3000,
			notify: false
		})
	}, 1000)
}

function watchFiles() {
	function fixPath(path) { return path.replace(/\\/g, "/") }
	function conditionalWatch(item, f) {
		item.on('change', function (path, stats) {
			f(undefined, fixPath(path));
		});
		item.on('add', function (path, stats) {
			f(undefined, fixPath(path));
		});
	}
	gulp.watch([$path.watch.scss], scss);//.on('change', browsersync.reload);
	gulp.watch([$path.watch.js], js);
	conditionalWatch(gulp.watch([$path.watch.html]), html);
}

let start = gulp.parallel(
	watchFiles,
	gulp.series(
		clean,
		gulp.parallel(html, scss, js),
		browserSyncInit
	)
)

exports.js = js;
exports.scss = scss;
exports.html = html;
exports.start = start;
exports.default = start;