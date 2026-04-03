const path = require('path')
const pkg = require('./package.json')
const { defineConfig } = require('vite')
const vue = require('@vitejs/plugin-vue')
const Components = require('unplugin-vue-components/vite')
const {
  ElementPlusResolver
} = require('unplugin-vue-components/resolvers')
const utilShimPath = path.resolve(__dirname, 'src/shims/browserUtil.js')

const elementPlusOptimizedDeps = [
  'element-plus/es',
  'element-plus/es/components/base/style/css',
  'element-plus/es/components/button/style/css',
  'element-plus/es/components/checkbox/style/css',
  'element-plus/es/components/color-picker/style/css',
  'element-plus/es/components/dialog/style/css',
  'element-plus/es/components/dropdown/style/css',
  'element-plus/es/components/dropdown-item/style/css',
  'element-plus/es/components/dropdown-menu/style/css',
  'element-plus/es/components/form/style/css',
  'element-plus/es/components/form-item/style/css',
  'element-plus/es/components/input/style/css',
  'element-plus/es/components/input-number/style/css',
  'element-plus/es/components/loading/style/css',
  'element-plus/es/components/message/style/css',
  'element-plus/es/components/message-box/style/css',
  'element-plus/es/components/notification/style/css',
  'element-plus/es/components/option/style/css',
  'element-plus/es/components/popover/style/css',
  'element-plus/es/components/radio/style/css',
  'element-plus/es/components/radio-button/style/css',
  'element-plus/es/components/radio-group/style/css',
  'element-plus/es/components/select/style/css',
  'element-plus/es/components/slider/style/css',
  'element-plus/es/components/switch/style/css',
  'element-plus/es/components/tooltip/style/css',
  'element-plus/es/components/tree/style/css',
  'element-plus/es/components/upload/style/css'
]

const isPathMatch = (id, keyword) => {
  return id.includes(`/${keyword}/`) || id.includes(`\\${keyword}\\`)
}

const createManualChunks = id => {
  if (id.includes('node_modules')) {
    if (
      isPathMatch(id, 'vue') ||
      isPathMatch(id, 'vue-router') ||
      isPathMatch(id, 'vue-i18n') ||
      isPathMatch(id, 'pinia')
    ) {
      return 'vendor-vue'
    }
    if (isPathMatch(id, 'element-plus')) {
      return 'vendor-element-plus'
    }
    if (isPathMatch(id, '@toast-ui')) {
      return 'vendor-toastui'
    }
    if (isPathMatch(id, 'codemirror')) {
      return 'vendor-codemirror'
    }
    if (isPathMatch(id, 'highlight.js')) {
      return 'vendor-highlight'
    }
    if (isPathMatch(id, 'katex')) {
      return 'vendor-katex'
    }
    if (isPathMatch(id, 'viewerjs') || isPathMatch(id, 'v-viewer')) {
      return 'vendor-viewer'
    }
    if (isPathMatch(id, 'xlsx')) {
      return 'vendor-xlsx'
    }
    if (isPathMatch(id, 'axios')) {
      return 'vendor-network'
    }
  }

  if (isPathMatch(id, 'simple-mind-map')) {
    if (isPathMatch(id, 'simple-mind-map-plugin-themes')) {
      return 'mind-map-themes'
    }
    if (id.includes('/src/plugins/') || id.includes('\\src\\plugins\\')) {
      if (/(^|[\\/])Export\.js$/.test(id)) {
        return 'mind-map-export-base'
      }
      if (/(^|[\\/])ExportPDF\.js$/.test(id)) {
        return 'mind-map-export-pdf'
      }
      if (/(^|[\\/])ExportXMind\.js$/.test(id)) {
        return 'mind-map-export-xmind'
      }
      if (/(^|[\\/])(RichText|Formula)\.js$/.test(id)) {
        return 'mind-map-richtext'
      }
      return 'mind-map-plugins'
    }
    if (id.includes('/src/parse/') || id.includes('\\src\\parse\\')) {
      return 'mind-map-parse'
    }
    if (id.includes('/src/svg/') || id.includes('\\src\\svg\\')) {
      return 'mind-map-svg'
    }
    if (id.includes('/src/utils/') || id.includes('\\src\\utils\\')) {
      return 'mind-map-utils'
    }
    if (
      id.includes('/src/core/render/') ||
      id.includes('\\src\\core\\render\\')
    ) {
      return 'mind-map-render'
    }
    if (id.includes('/src/core/') || id.includes('\\src\\core\\')) {
      return 'mind-map-core-runtime'
    }
    return 'mind-map-core'
  }
  if (id.includes('/src/config/icon.js') || id.includes('\\src\\config\\icon.js')) {
    return 'mind-map-icons'
  }
  if (
    id.includes('/src/config/image.js') ||
    id.includes('\\src\\config\\image.js')
  ) {
    return 'mind-map-images'
  }

  return undefined
}

module.exports = defineConfig(({ command, mode: _mode }) => {
  const isBuild = command === 'build'
  const defaultReleaseUrl = 'https://github.com/lllll081926i/mind-map/releases'
  const defaultUpdateManifestUrl =
    'https://github.com/lllll081926i/mind-map/releases/latest/download/latest.json'
  const releaseUrl = process.env.APP_RELEASE_URL || defaultReleaseUrl
  const updateManifestUrl =
    process.env.APP_UPDATE_MANIFEST_URL || defaultUpdateManifestUrl

  return {
    plugins: [
      vue(),
      Components({
        dts: false,
        resolvers: [
          ElementPlusResolver({
            importStyle: 'css'
          })
        ]
      })
    ],
    resolve: {
      alias: {
        '@': path.resolve(__dirname, 'src'),
        buffer: require.resolve('buffer/'),
        events: require.resolve('events/'),
        punycode: require.resolve('punycode/'),
        stream: require.resolve('stream-browserify'),
        util: utilShimPath
      }
    },
    define: {
      global: 'globalThis',
      __APP_VERSION__: JSON.stringify(pkg.version),
      __APP_PLATFORM__: JSON.stringify(process.platform),
      __APP_RUNTIME__: JSON.stringify('desktop'),
      __APP_RELEASE_URL__: JSON.stringify(releaseUrl),
      __APP_UPDATE_MANIFEST_URL__: JSON.stringify(updateManifestUrl),
      __VUE_OPTIONS_API__: true,
      __VUE_PROD_DEVTOOLS__: false
    },
    optimizeDeps: {
      entries: ['index.html'],
      include: [
        'buffer',
        'events',
        'punycode',
        'stream-browserify',
        ...elementPlusOptimizedDeps
      ]
    },
    base: isBuild ? './' : '/',
    server: {
      watch: {
        ignored: [
          '**/dist/**',
          '**/dist-desktop/**',
          '**/src-tauri/target/**',
          '**/node_modules/**'
        ]
      },
      proxy: {
        '^/api/v3/': {
          target: 'http://ark.cn-beijing.volces.com',
          changeOrigin: true
        }
      }
    },
    build: {
      outDir: 'dist-desktop',
      emptyOutDir: true,
      chunkSizeWarningLimit: 1200,
      rollupOptions: {
        output: {
          manualChunks: createManualChunks
        }
      }
    }
  }
})
