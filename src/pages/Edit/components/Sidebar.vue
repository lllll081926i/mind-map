<template>
  <div
    class="sidebarContainer sidebarPanel"
    @click.stop
    :class="{ isDark: isDark }"
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
      zIndex: 1100
    }
  },
  computed: {
    ...mapState(useThemeStore, {
      isDark: 'isDark'
    }),
    isShown() {
      return this.forceShow
    },
    sidebarStyle() {
      const hiddenRight = `-${sidebarLayout.panelWidth + sidebarLayout.panelRight + 20}px`
      return {
        zIndex: this.zIndex,
        top: `${sidebarLayout.panelTop}px`,
        bottom: `${sidebarLayout.panelBottom}px`,
        width: `${sidebarLayout.panelWidth}px`,
        right: this.isShown ? `${sidebarLayout.panelRight}px` : hiddenRight,
        opacity: this.isShown ? 1 : 0,
        pointerEvents: this.isShown ? 'auto' : 'none'
      }
    }
  },
  watch: {
    isShown(val, oldVal) {
      if (val && !oldVal) {
        this.zIndex = 1100 + store.sidebarZIndex++
      }
    }
  },
  created() {
    this.$bus.$on('closeSideBar', this.handleCloseSidebar)
  },
  beforeUnmount() {
    this.$bus.$off('closeSideBar', this.handleCloseSidebar)
  },
  methods: {
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
  transition:
    right 0.3s ease,
    opacity 0.3s ease;

  &.isDark {
    background-color: #262a2e;
    border-color: hsla(0, 0%, 100%, 0.08);

    .sidebarHeader {
      border-bottom-color: hsla(0, 0%, 100%, 0.1);
      color: #fff;
    }

    .closeBtn {
      color: #fff;
      background: hsla(0, 0%, 100%, 0.04);
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
  }
}
</style>
