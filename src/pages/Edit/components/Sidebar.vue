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
import { store } from '@/config'
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
      return {
        zIndex: this.zIndex,
        right: this.isShown ? '0' : '-300px',
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
  right: -300px;
  top: 110px;
  bottom: 0;
  width: 300px;
  z-index: 1100;
  background-color: #fff;
  border-left: 1px solid #e8e8e8;
  display: flex;
  flex-direction: column;
  transition:
    right 0.3s ease,
    opacity 0.3s ease;

  &.isDark {
    background-color: #262a2e;
    border-left-color: hsla(0, 0%, 100%, 0.1);

    .sidebarHeader {
      border-bottom-color: hsla(0, 0%, 100%, 0.1);
      color: #fff;
    }

    .closeBtn {
      color: #fff;
    }
  }

  .closeBtn {
    position: absolute;
    right: 20px;
    top: 12px;
    cursor: pointer;
    border: none;
    background: transparent;
    color: inherit;
    width: 24px;
    height: 24px;
    padding: 0;
    display: flex;
    align-items: center;
    justify-content: center;

    .iconfont {
      font-size: 14px;
      line-height: 1;
    }
  }

  .sidebarHeader {
    width: 100%;
    height: 44px;
    border-bottom: 1px solid #e8e8e8;
    display: flex;
    justify-content: center;
    align-items: center;
    flex-grow: 0;
    flex-shrink: 0;
  }

  .sidebarContent {
    width: 100%;
    height: 100%;
    overflow: auto;
  }
}
</style>
