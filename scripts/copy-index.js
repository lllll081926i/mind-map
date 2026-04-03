const fs = require('fs')
const path = require('path')

const distIndex = path.resolve(__dirname, '../dist-desktop/index.html')
const rootIndex = path.resolve(__dirname, '../index.html')
const tempRootIndex = `${rootIndex}.tmp`

const normalizeAssetPath = assetPath => assetPath.replace(/^\.?\//, '')

const createRuntimeAssetsLoader = ({
  iconPath,
  preloadPaths,
  stylePaths,
  scriptPath
}) => {
  const icon = JSON.stringify(iconPath)
  const preloads = JSON.stringify(preloadPaths)
  const styles = JSON.stringify(stylePaths)
  const script = JSON.stringify(scriptPath)

  return `    <script>
      ;(() => {
        const publicPath = window.externalPublicPath || './dist/'
        const ensurePath = asset => {
          if (!asset) return publicPath
          return publicPath.replace(/\\/?$/, '/') + asset
        }
        const head = document.head
        const iconPath = ${icon}
        if (iconPath) {
          const icon = document.createElement('link')
          icon.rel = 'icon'
          icon.href = ensurePath(iconPath)
          head.appendChild(icon)
        }
        const preloadPaths = ${preloads}
        preloadPaths.forEach(preloadPath => {
          const link = document.createElement('link')
          link.rel = 'modulepreload'
          link.crossOrigin = ''
          link.href = ensurePath(preloadPath)
          head.appendChild(link)
        })
        const stylePaths = ${styles}
        stylePaths.forEach(stylePath => {
          const link = document.createElement('link')
          link.rel = 'stylesheet'
          link.crossOrigin = ''
          link.href = ensurePath(stylePath)
          head.appendChild(link)
        })
        const entry = document.createElement('script')
        entry.type = 'module'
        entry.crossOrigin = true
        entry.src = ensurePath(${script})
        head.appendChild(entry)
      })()
    </script>`
}

if (!fs.existsSync(distIndex)) {
  throw new Error('Cannot find dist/index.html to publish')
}

let html = fs.readFileSync(distIndex, 'utf-8')

const iconMatch = html.match(/<link rel="icon"[^>]*href="([^"]+)"[^>]*>/)
const preloadMatches = [
  ...html.matchAll(/<link rel="modulepreload"[^>]*href="([^"]+)"[^>]*>\s*/g)
]
const styleMatches = [
  ...html.matchAll(/<link rel="stylesheet"[^>]*href="([^"]+)"[^>]*>/g)
]
const scriptMatch = html.match(
  /<script type="module"[^>]*src="([^"]+)"[^>]*><\/script>/
)

if (!scriptMatch) {
  throw new Error('Cannot find build entry script in dist/index.html')
}

const runtimeLoader = createRuntimeAssetsLoader({
  iconPath: iconMatch ? normalizeAssetPath(iconMatch[1]) : 'logo.ico',
  preloadPaths: preloadMatches.map(match => normalizeAssetPath(match[1])),
  stylePaths: styleMatches.map(match => normalizeAssetPath(match[1])),
  scriptPath: normalizeAssetPath(scriptMatch[1])
})

html = html.replace(/<link rel="icon"[^>]*href="([^"]+)"[^>]*>\s*/g, '')
html = html.replace(
  /<link rel="modulepreload"[^>]*href="([^"]+)"[^>]*>\s*/g,
  ''
)
html = html.replace(/<link rel="stylesheet"[^>]*href="([^"]+)"[^>]*>\s*/g, '')
html = html.replace(
  /<script type="module"[^>]*src="([^"]+)"[^>]*><\/script>\s*/g,
  runtimeLoader + '\n'
)

fs.writeFileSync(tempRootIndex, html)
try {
  fs.renameSync(tempRootIndex, rootIndex)
} catch (error) {
  if (error.code === 'EXDEV') {
    fs.copyFileSync(tempRootIndex, rootIndex)
    fs.unlinkSync(tempRootIndex)
  } else {
    throw error
  }
}
fs.unlinkSync(distIndex)
