import { defineConfig, pvtnbr } from 'lintroll';

export default defineConfig([
	{
		ignores: ['README.md'],
	},
	...pvtnbr({ node: true }),
	{
		files: ['tests/**/*', 'eslint.config.ts'],
		rules: {
			'n/no-unpublished-import': 'off',
		},
	},
]);
