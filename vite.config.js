const path = require('path')
const pkg = require('./package.json')
const { defineConfig } = require('vite')
const vue = require('@vitejs/plugin-vue')
const utilShimPath = path.resolve(__dirname, 'src/shims/browserUtil.js')

const isPathMatch = (id, keyword) => {
  return id.includes(`/${keyword}/`) || id.includes(`\\${keyword}\\`)
}

const createManualChunks = id => {
  if (id.includes('node_modules')) {
    if (
      isPathMatch(id, 'vue') ||
      isPathMatch(id, 'vue-router') ||
      isPathMatch(id, 'vue-i18n') ||
      isPathMatch(id, 'pinia') ||
      isPathMatch(id, 'element-plus')
    ) {
      return 'vendor-framework'
    }
    if (
      isPathMatch(id, '@toast-ui') ||
      isPathMatch(id, 'codemirror') ||
      isPathMatch(id, 'highlight.js') ||
      isPathMatch(id, 'katex')
    ) {
      return 'vendor-editor'
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
    return 'mind-map-core'
  }
  if (isPathMatch(id, 'simple-mind-map-plugin-themes')) {
    return 'mind-map-themes'
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
      vue()
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
      include: ['buffer', 'events', 'punycode', 'stream-browserify']
    },
    base: isBuild ? './' : '/',
    server: {
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
