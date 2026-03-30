const path = require('path')
const { defineConfig } = require('vite')

module.exports = defineConfig({
  resolve: {
    alias: {
      buffer: require.resolve('buffer/'),
      events: require.resolve('events/'),
      punycode: require.resolve('punycode/'),
      stream: require.resolve('stream-browserify')
    }
  },
  define: {
    global: 'globalThis'
  },
  build: {
    lib: {
      entry: path.resolve(__dirname, './simple-mind-map/full.js'),
      name: 'simpleMindMap',
      formats: ['umd', 'es'],
      fileName: format =>
        format === 'es' ? 'simpleMindMap.esm.js' : 'simpleMindMap.umd.js',
      cssFileName: 'simpleMindMap'
    },
    outDir: './simple-mind-map/dist',
    emptyOutDir: true,
    minify: false,
    chunkSizeWarningLimit: 4000
  }
})
