const path = require('path')
const { defineConfig } = require('vite')
const vue = require('@vitejs/plugin-vue2')

const isPathMatch = (id, keyword) => {
  return id.includes(`/${keyword}/`) || id.includes(`\\${keyword}\\`)
}

const createManualChunks = id => {
  if (id.includes('node_modules')) {
    if (
      isPathMatch(id, 'vue') ||
      isPathMatch(id, 'vue-router') ||
      isPathMatch(id, 'vuex') ||
      isPathMatch(id, 'vue-i18n')
    ) {
      return 'vendor-vue'
    }
    if (isPathMatch(id, 'element-ui')) {
      return 'vendor-element'
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

module.exports = defineConfig(({ command, mode }) => {
  const isBuild = command === 'build'
  const isDesktopBuild = mode === 'desktop'

  return {
    plugins: [vue()],
    resolve: {
      alias: {
        '@': path.resolve(__dirname, 'src'),
        buffer: require.resolve('buffer/'),
        events: require.resolve('events/'),
        punycode: require.resolve('punycode/'),
        stream: require.resolve('stream-browserify')
      }
    },
    define: {
      global: 'globalThis'
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
      outDir: isDesktopBuild ? 'dist-desktop' : '../dist',
      emptyOutDir: true,
      chunkSizeWarningLimit: 4000,
      rollupOptions: {
        output: {
          manualChunks: createManualChunks
        }
      }
    }
  }
})
