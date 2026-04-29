export const FLOWCHART_AUTO_SCROLL_MARGIN = 40
export const FLOWCHART_AUTO_SCROLL_MAX_SPEED = 14
export const FLOWCHART_AUTO_SCROLL_MIN_SPEED = 2

export const flowchartAutoScrollMethods = {
  startAutoScroll(clientX, clientY) {
    this.autoScrollState = {
      clientX: Number(clientX || 0),
      clientY: Number(clientY || 0)
    }
    if (!this.autoScrollFrameId) {
      this.autoScrollFrameId = window.requestAnimationFrame(
        this.autoScrollTick
      )
    }
  },

  updateAutoScroll(clientX, clientY) {
    if (!this.autoScrollState) {
      return
    }
    this.autoScrollState = {
      clientX: Number(clientX || 0),
      clientY: Number(clientY || 0)
    }
    if (!this.autoScrollFrameId) {
      this.autoScrollFrameId = window.requestAnimationFrame(
        this.autoScrollTick
      )
    }
  },

  stopAutoScroll() {
    this.autoScrollState = null
    if (this.autoScrollFrameId) {
      window.cancelAnimationFrame(this.autoScrollFrameId)
      this.autoScrollFrameId = 0
    }
  },

  autoScrollTick() {
    this.autoScrollFrameId = 0
    if (!this.autoScrollState) {
      return
    }
    const rect = this.getCanvasRect?.()
    if (!rect) {
      return
    }
    const { clientX, clientY } = this.autoScrollState
    const margin = FLOWCHART_AUTO_SCROLL_MARGIN
    const maxSpeed = FLOWCHART_AUTO_SCROLL_MAX_SPEED
    const minSpeed = FLOWCHART_AUTO_SCROLL_MIN_SPEED

    let dx = 0
    let dy = 0

    const leftDist = clientX - rect.left
    const rightDist = rect.right - clientX
    const topDist = clientY - rect.top
    const bottomDist = rect.bottom - clientY

    if (leftDist >= 0 && leftDist < margin) {
      const ratio = 1 - leftDist / margin
      dx = -(minSpeed + (maxSpeed - minSpeed) * ratio)
    } else if (rightDist >= 0 && rightDist < margin) {
      const ratio = 1 - rightDist / margin
      dx = minSpeed + (maxSpeed - minSpeed) * ratio
    }

    if (topDist >= 0 && topDist < margin) {
      const ratio = 1 - topDist / margin
      dy = -(minSpeed + (maxSpeed - minSpeed) * ratio)
    } else if (bottomDist >= 0 && bottomDist < margin) {
      const ratio = 1 - bottomDist / margin
      dy = minSpeed + (maxSpeed - minSpeed) * ratio
    }

    if (dx === 0 && dy === 0) {
      if (this.autoScrollState) {
        this.autoScrollFrameId = window.requestAnimationFrame(
          this.autoScrollTick
        )
      }
      return
    }

    const viewport = this.getViewport?.()
    if (viewport) {
      this.setViewportPatch?.({
        x: viewport.x + dx,
        y: viewport.y + dy
      })
    }

    if (this.autoScrollState) {
      this.autoScrollFrameId = window.requestAnimationFrame(
        this.autoScrollTick
      )
    }
  }
}
