/* eslint-env node */
require('@rushstack/eslint-patch/modern-module-resolution')

module.exports = {
    root: true,
    ignorePatterns: ['dist', 'node_modules', '*.min.js', 'backend/dist'],
    'extends': [
        'plugin:vue/vue3-essential',
        'eslint:recommended',
        '@vue/eslint-config-typescript',
        '@vue/eslint-config-prettier/skip-formatting'
    ],
    parserOptions: {
        ecmaVersion: 'latest'
    },
    plugins: ['unused-imports'],
    rules: {
        // Vue 规则
        'vue/multi-word-component-names': 'off',

        // 基础规则
        'no-undef': 'off',

        // 未使用变量 - 使用 unused-imports 插件
        'no-unused-vars': 'off',
        '@typescript-eslint/no-unused-vars': 'off',
        'unused-imports/no-unused-imports': 'error',
        'unused-imports/no-unused-vars': [
            'warn',
            { 'vars': 'all', 'varsIgnorePattern': '^_', 'args': 'after-used', 'argsIgnorePattern': '^_' }
        ],

        // 新增：禁止 any 类型（warn 级别，逐步修复）
        '@typescript-eslint/no-explicit-any': 'warn',

        // 新增：禁止 console（生产代码）
        'no-console': ['warn', { allow: ['warn', 'error'] }],

        // 返回类型注解：Vue/TS 项目中函数返回类型多由类型推断覆盖，强制要求反而增加噪音
        '@typescript-eslint/explicit-function-return-type': 'off',
    }
}
