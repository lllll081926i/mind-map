const normalizeSvgMarkup = svgMarkup => {
  return String(svgMarkup || '')
    .trim()
    .replace(/<\?xml[\s\S]*?\?>/gi, '')
}

const stripUnsafeSvgMarkupFallback = svgMarkup => {
  return String(svgMarkup || '')
    .replace(/<script[\s\S]*?>[\s\S]*?<\/script>/gi, '')
    .replace(/\s+on[a-z-]+\s*=\s*("[^"]*"|'[^']*'|[^\s>]+)/gi, '')
    .replace(
      /\s+(href|xlink:href)\s*=\s*(['"])\s*javascript:[\s\S]*?\2/gi,
      ''
    )
}

export const sanitizeSvgMarkup = svgMarkup => {
  const normalizedSvgMarkup = normalizeSvgMarkup(svgMarkup)
  if (!normalizedSvgMarkup) {
    return ''
  }
  if (
    typeof DOMParser === 'undefined' ||
    typeof XMLSerializer === 'undefined'
  ) {
    return stripUnsafeSvgMarkupFallback(normalizedSvgMarkup)
  }
  try {
    const svgDocument = new DOMParser().parseFromString(
      normalizedSvgMarkup,
      'image/svg+xml'
    )
    if (
      svgDocument.querySelector('parsererror') ||
      svgDocument.documentElement?.nodeName?.toLowerCase() !== 'svg'
    ) {
      return stripUnsafeSvgMarkupFallback(normalizedSvgMarkup)
    }
    svgDocument.querySelectorAll('script').forEach(node => {
      node.remove()
    })
    svgDocument.querySelectorAll('*').forEach(element => {
      Array.from(element.attributes).forEach(attribute => {
        const name = attribute.name.toLowerCase()
        const value = String(attribute.value || '')
        if (name.startsWith('on')) {
          element.removeAttribute(attribute.name)
          return
        }
        if (
          (name === 'href' || name === 'xlink:href') &&
          /^\s*javascript:/i.test(value)
        ) {
          element.removeAttribute(attribute.name)
        }
      })
    })
    return new XMLSerializer().serializeToString(svgDocument.documentElement)
  } catch (error) {
    console.error('sanitizeSvgMarkup failed', error)
    return stripUnsafeSvgMarkupFallback(normalizedSvgMarkup)
  }
}

const serializeForInlineScript = value => {
  return JSON.stringify(String(value || '')).replace(/</g, '\\u003c')
}

const DEFAULT_HTML_EXPORT_TITLE = '思维导图'

const normalizeDocumentTitle = fileName => {
  return String(fileName || DEFAULT_HTML_EXPORT_TITLE)
    .trim()
    .replace(/[<>&]/g, '')
}

export const buildMindMapHtmlDocument = ({ fileName, svgMarkup } = {}) => {
  const normalizedTitle = normalizeDocumentTitle(fileName)
  const normalizedSvgMarkup = sanitizeSvgMarkup(svgMarkup)
  const serializedSvgMarkup = serializeForInlineScript(normalizedSvgMarkup)

  return `<!DOCTYPE html>
<html lang="zh-CN">
  <head>
    <meta charset="UTF-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1.0" />
    <title>${normalizedTitle}</title>
    <style>
      :root {
        color-scheme: light;
        --stage-bg: #f3f6fb;
        --stage-grid: rgba(15, 23, 42, 0.08);
        --stage-shadow: 0 18px 60px rgba(15, 23, 42, 0.16);
      }

      * {
        box-sizing: border-box;
      }

      html,
      body {
        width: 100%;
        height: 100%;
        margin: 0;
        overflow: hidden;
        background:
          linear-gradient(90deg, transparent 23px, var(--stage-grid) 24px),
          linear-gradient(transparent 23px, var(--stage-grid) 24px),
          var(--stage-bg);
        background-size: 24px 24px;
      }

      body {
        font-family: "Microsoft YaHei", "PingFang SC", "Noto Sans SC", sans-serif;
      }

      .html-export-shell,
      .html-export-stage,
      .html-export-viewport {
        width: 100%;
        height: 100%;
      }

      .html-export-stage {
        position: relative;
        overflow: hidden;
      }

      .html-export-viewport {
        position: relative;
        overflow: hidden;
        cursor: grab;
        user-select: none;
      }

      .html-export-viewport.is-dragging {
        cursor: grabbing;
      }

      .html-export-canvas {
        position: absolute;
        left: 0;
        top: 0;
        transform-origin: 0 0;
        will-change: transform;
        filter: drop-shadow(var(--stage-shadow));
      }

      .html-export-canvas svg {
        display: block;
        overflow: visible;
      }
    </style>
  </head>
  <body>
    <div class="html-export-shell">
      <div class="html-export-stage">
        <div class="html-export-viewport" id="html-export-viewport">
          <div class="html-export-canvas" id="html-export-canvas"></div>
        </div>
      </div>
    </div>
    <script>
      (function () {
        const svgMarkup = ${serializedSvgMarkup}
        const viewport = document.getElementById('html-export-viewport')
        const canvas = document.getElementById('html-export-canvas')
        const state = {
          x: 0,
          y: 0,
          scale: 1,
          minScale: 0.08,
          maxScale: 6
        }
        const dragState = {
          active: false,
          pointerX: 0,
          pointerY: 0,
          originX: 0,
          originY: 0
        }

        if (!viewport || !canvas || !svgMarkup) {
          return
        }

        const svgDocument = new DOMParser().parseFromString(
          svgMarkup,
          'image/svg+xml'
        )
        const nextSvgEl = svgDocument.documentElement
        if (
          svgDocument.querySelector('parsererror') ||
          !nextSvgEl ||
          nextSvgEl.nodeName.toLowerCase() !== 'svg'
        ) {
          return
        }
        canvas.replaceChildren(document.importNode(nextSvgEl, true))
        const svgEl = canvas.querySelector('svg')

        function getSvgSize() {
          const viewBox = String(svgEl.getAttribute('viewBox') || '').trim()
          if (viewBox) {
            const nums = viewBox.split(/[ ,]+/).map(Number).filter(Number.isFinite)
            if (nums.length === 4 && nums[2] > 0 && nums[3] > 0) {
              return { width: nums[2], height: nums[3] }
            }
          }
          const widthAttr = parseFloat(svgEl.getAttribute('width') || '')
          const heightAttr = parseFloat(svgEl.getAttribute('height') || '')
          if (widthAttr > 0 && heightAttr > 0) {
            return { width: widthAttr, height: heightAttr }
          }
          const rect = svgEl.getBoundingClientRect()
          return {
            width: rect.width || 1200,
            height: rect.height || 800
          }
        }

        function clampScale(scale) {
          return Math.min(state.maxScale, Math.max(state.minScale, scale))
        }

        function applyTransform() {
          canvas.style.transform = 'translate(' + state.x + 'px, ' + state.y + 'px) scale(' + state.scale + ')'
        }

        function fitToViewport() {
          const viewportRect = viewport.getBoundingClientRect()
          const svgSize = getSvgSize()
          if (!viewportRect.width || !viewportRect.height || !svgSize.width || !svgSize.height) {
            return
          }
          const padding = 36
          const fitScale = clampScale(
            Math.min(
              (viewportRect.width - padding * 2) / svgSize.width,
              (viewportRect.height - padding * 2) / svgSize.height
            )
          )
          state.scale = Number.isFinite(fitScale) && fitScale > 0 ? fitScale : 1
          state.x = (viewportRect.width - svgSize.width * state.scale) / 2
          state.y = (viewportRect.height - svgSize.height * state.scale) / 2
          applyTransform()
        }

        function onPointerDown(event) {
          if (event.button !== 0) {
            return
          }
          dragState.active = true
          dragState.pointerX = event.clientX
          dragState.pointerY = event.clientY
          dragState.originX = state.x
          dragState.originY = state.y
          viewport.classList.add('is-dragging')
          event.preventDefault()
        }

        function onPointerMove(event) {
          if (!dragState.active) {
            return
          }
          state.x = dragState.originX + event.clientX - dragState.pointerX
          state.y = dragState.originY + event.clientY - dragState.pointerY
          applyTransform()
        }

        function onPointerUp() {
          dragState.active = false
          viewport.classList.remove('is-dragging')
        }

        function onWheel(event) {
          event.preventDefault()
          const rect = viewport.getBoundingClientRect()
          const pointerX = event.clientX - rect.left
          const pointerY = event.clientY - rect.top
          const zoomFactor = event.deltaY < 0 ? 1.12 : 0.9
          const nextScale = clampScale(state.scale * zoomFactor)
          if (nextScale === state.scale) {
            return
          }
          const worldX = (pointerX - state.x) / state.scale
          const worldY = (pointerY - state.y) / state.scale
          state.scale = nextScale
          state.x = pointerX - worldX * state.scale
          state.y = pointerY - worldY * state.scale
          applyTransform()
        }

        viewport.addEventListener('mousedown', onPointerDown)
        window.addEventListener('mousemove', onPointerMove)
        window.addEventListener('mouseup', onPointerUp)
        window.addEventListener('mouseleave', onPointerUp)
        viewport.addEventListener('touchstart', function (event) {
          if (event.touches.length === 1) {
            var touch = event.touches[0]
            onPointerDown({ button: 0, clientX: touch.clientX, clientY: touch.clientY, preventDefault: function () { event.preventDefault() } })
          }
        }, { passive: false })
        window.addEventListener('touchmove', function (event) {
          if (event.touches.length === 1 && dragState.active) {
            var touch = event.touches[0]
            onPointerMove({ clientX: touch.clientX, clientY: touch.clientY })
            event.preventDefault()
          }
        }, { passive: false })
        window.addEventListener('touchend', onPointerUp)
        window.addEventListener('touchcancel', onPointerUp)
        viewport.addEventListener('wheel', onWheel, { passive: false })
        window.addEventListener('resize', fitToViewport)

        fitToViewport()
      })()
    </script>
  </body>
</html>`
}

export default {
  buildMindMapHtmlDocument
}
