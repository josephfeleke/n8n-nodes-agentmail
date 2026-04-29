import { config } from '@n8n/node-cli/eslint';

export default [
	{
		ignores: ['tests/**', 'jest.config.js', 'coverage/**', 'dist/**'],
	},
	...config,
];
