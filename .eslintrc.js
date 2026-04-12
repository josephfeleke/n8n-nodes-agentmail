module.exports = {
	root: true,
	parser: '@typescript-eslint/parser',
	plugins: ['eslint-plugin-n8n-nodes-base'],
	extends: ['plugin:n8n-nodes-base/community'],
	ignorePatterns: ['node_modules/', 'dist/', '*.js', '!.eslintrc.js'],
	rules: {
		'n8n-nodes-base/community-package-json-name-still-default': 'off',
	},
};
