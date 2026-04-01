const js = require('@eslint/js')
const globals = require('globals')
const vuePlugin = require('eslint-plugin-vue')
const vueParser = require('vue-eslint-parser')
const eslintConfigPrettier = require('eslint-config-prettier')

module.exports = [
  {
    ignores: [
      'dist/**',
      'dist-desktop/**',
      'node_modules/**',
      'docs/**',
      'src-tauri/target/**',
      'src-tauri/gen/**',
      'simple-mind-map/**',
      'simple-mind-map-plugin-themes/**',
      'simple-mind-map/dist/**',
      'simple-mind-map/types/**',
      'simple-mind-map/node_modules/**',
      'src/config/icon.js',
      'src/config/image.js'
    ]
  },
  {
    files: ['**/*.{js,mjs,cjs,vue}'],
    languageOptions: {
      parser: vueParser,
      parserOptions: {
        ecmaVersion: 'latest',
        sourceType: 'module'
      },
      globals: {
        ...globals.browser,
        ...globals.node,
        MoreThemes: 'readonly',
        __APP_VERSION__: 'readonly',
        __APP_PLATFORM__: 'readonly',
        __APP_RELEASE_URL__: 'readonly',
        __APP_UPDATE_MANIFEST_URL__: 'readonly'
      }
    },
    plugins: {
      vue: vuePlugin
    },
    rules: {
      ...js.configs.recommended.rules,
      ...vuePlugin.configs['flat/essential'].rules,
      ...eslintConfigPrettier.rules,
      'no-console': 'off',
      'no-debugger': 'warn',
      'no-unused-vars': [
        'warn',
        {
          argsIgnorePattern: '^_',
          varsIgnorePattern: '^_',
          caughtErrorsIgnorePattern: '^_'
        }
      ],
      'vue/multi-word-component-names': 'off',
      'vue/no-v-html': 'off',
      'vue/require-default-prop': 'off',
      'vue/no-mutating-props': 'off',
      'vue/attribute-hyphenation': 'off',
      'vue/v-on-event-hyphenation': 'off'
    }
  }
]
