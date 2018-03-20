var babel = require('gulp-babel');
var es2015 = require('babel-preset-es2015');

gulp.task('babel', function() {
	presets: ["babel-preset-es2015", "babel-preset-es2016", "babel-preset-es2017"].map(require.resolve)
    return gulp.src('./imobiliare.js')
    .pipe(babel({
        presets: [es2015]
    }))
    .pipe(gulp.dest('dist'));
});