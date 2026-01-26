const { src, dest } = require('gulp');

function buildIcons() {
	return src('nodes/**/*.svg')
		.pipe(dest('dist/nodes'));
}

function copyCredentialIcons() {
	return src('credentials/**/*.svg')
		.pipe(dest('dist/credentials'));
}

exports['build:icons'] = async function() {
	await buildIcons();
	await copyCredentialIcons();
};
