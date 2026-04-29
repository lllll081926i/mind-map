<template>
  <div
    class="sidebarContainer sidebarPanel"
    @click.stop
    :class="{ isDark: isDark, isSwapTransition: isSwapTransition }"
    :style="sidebarStyle"
  >
    <button class="closeBtn" type="button" @click="close">
      <span class="iconfont iconguanbi"></span>
    </button>
    <div class="sidebarHeader sidebarPanelHeader" v-if="title">
      {{ title }}
    </div>
    <div
      class="sidebarContent sidebarPanelBody customScrollbar"
      ref="sidebarContent"
    >
      <slot></slot>
    </div>
  </div>
</template>

<script>
import { sidebarLayout, store } from '@/config'
import { mapState } from 'pinia'
import { useAppStore } from '@/stores/app'
import { useThemeStore } from '@/stores/theme'
import { setActiveSidebar } from '@/stores/runtime'

// 侧边栏容器
export default {
  props: {
    title: {
      type: String,
      default: ''
    },
    forceShow: {
      type: Boolean,
      default: false
    }
  },
  data() {
    return {
      zIndex: 1100,
      enterFrame: 0,
      entered: false
    }
  },
  computed: {
    ...mapState(useThemeStore, {
      isDark: 'isDark'
    }),
    ...mapState(useAppStore, {
      sidebarTransitionMode: 'sidebarTransitionMode'
    }),
    isShown() {
      return this.forceShow
    },
    isSwapTransition() {
      return this.sidebarTransitionMode === 'swap'
    },
    sidebarStyle() {
      const isVisible = this.isShown && this.entered
      const isSwapVisible = this.isSwapTransition && this.isShown
      const hiddenRight = `-${sidebarLayout.panelWidth + sidebarLayout.panelRight + 20}px`
      const right = isSwapVisible
        ? `${sidebarLayout.panelRight}px`
        : isVisible
          ? `${sidebarLayout.panelRight}px`
          : hiddenRight
      return {
        zIndex: this.zIndex,
        top: `${sidebarLayout.panelTop}px`,
        bottom: `${sidebarLayout.panelBottom}px`,
        width: `${sidebarLayout.panelWidth}px`,
        right,
        opacity: isVisible ? 1 : 0,
        transform:
          isSwapVisible && !isVisible ? 'translateX(18px)' : 'translateX(0)',
        pointerEvents: isVisible ? 'auto' : 'none'
      }
    }
  },
  watch: {
    isShown(val, oldVal) {
      if (val && !oldVal) {
        this.zIndex = 1100 + store.sidebarZIndex++
      }
      this.syncEnteredState(val)
    }
  },
  created() {
    this.$bus.$on('closeSideBar', this.handleCloseSidebar)
  },
  mounted() {
    this.syncEnteredState(this.isShown)
  },
  beforeUnmount() {
    this.$bus.$off('closeSideBar', this.handleCloseSidebar)
    this.clearEnterFrame()
  },
  methods: {
    clearEnterFrame() {
      if (!this.enterFrame) {
        return
      }
      cancelAnimationFrame(this.enterFrame)
      this.enterFrame = 0
    },

    syncEnteredState(isShown) {
      this.clearEnterFrame()
      if (!isShown) {
        this.entered = false
        return
      }
      if (this.isSwapTransition) {
        this.entered = true
        return
      }
      this.entered = false
      this.enterFrame = requestAnimationFrame(() => {
        this.enterFrame = 0
        this.entered = true
      })
    },

    handleCloseSidebar() {
      if (!this.isShown) {
        return
      }
      this.close()
    },

    close() {
      setActiveSidebar('')
    },

    getEl() {
      return this.$refs.sidebarContent
    }
  }
}
</script>

<style lang="less" scoped>
.sidebarContainer {
  position: fixed;
  right: -360px;
  top: 84px;
  bottom: 20px;
  width: 320px;
  z-index: 1100;
  background-color: #fff;
  border: 1px solid rgba(0, 0, 0, 0.06);
  border-right: none;
  border-radius: 8px 0 0 8px;
  box-shadow: 0 2px 16px 0 rgba(0, 0, 0, 0.06);
  display: flex;
  flex-direction: column;
  transform: translateX(0);
  will-change: right, opacity, transform;
  transition:
    right 0.28s cubic-bezier(0.22, 1, 0.36, 1),
    opacity 0.18s ease,
    transform 0.22s ease;

  &.isSwapTransition {
    will-change: opacity, transform;
    transition:
      opacity 0.18s ease,
      transform 0.22s ease;
  }

  &.isDark {
    background-color: #262a2e;
    border-color: hsla(0, 0%, 100%, 0.08);
    color: hsla(0, 0%, 100%, 0.86);

    .sidebarHeader {
      border-bottom-color: hsla(0, 0%, 100%, 0.1);
      color: #fff;
    }

    .closeBtn {
      color: #fff;
      background: hsla(0, 0%, 100%, 0.04);
    }

    .sidebarContent {
      color: hsla(0, 0%, 100%, 0.82);
    }
  }

  .closeBtn {
    position: absolute;
    right: 12px;
    top: 12px;
    cursor: pointer;
    border: none;
    background: rgba(15, 23, 42, 0.04);
    color: inherit;
    width: 28px;
    height: 28px;
    padding: 0;
    display: flex;
    align-items: center;
    justify-content: center;
    border-radius: 6px;

    .iconfont {
      font-size: 14px;
      line-height: 1;
    }
  }

  .sidebarHeader {
    width: 100%;
    min-height: 48px;
    border-bottom: 1px solid rgba(0, 0, 0, 0.06);
    display: flex;
    justify-content: flex-start;
    align-items: center;
    flex-grow: 0;
    flex-shrink: 0;
    padding: 0 16px;
    font-size: 14px;
    font-weight: 600;
  }

  .sidebarContent {
    width: 100%;
    height: 100%;
    overflow: auto;
    padding: 0 0 16px;
    color: rgba(26, 26, 26, 0.88);
  }
}
</style>
