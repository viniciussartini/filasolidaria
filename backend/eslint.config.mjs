// @ts-check
import eslint from '@eslint/js';
import tseslint from 'typescript-eslint';
import prettierConfig from 'eslint-config-prettier';

export default tseslint.config(
    eslint.configs.recommended,
    ...tseslint.configs.recommended,
    prettierConfig,
    {
        languageOptions: {
        parser: tseslint.parser,
        parserOptions: {
            project: true,
            tsconfigRootDir: import.meta.dirname,
        },
        },
    },
    {
        ignores: [
        'dist/',
        'node_modules/',
        'prisma/',
        '*.db'
        ],
    }
);