<template>
  <div
    class="sidebarTriggerContainer"
    @click.stop
    :class="{ show: show, isDark: isDark }"
    :style="containerStyle"
  >
    <button
      class="toggleShowBtn"
      :class="{ hide: !show }"
      type="button"
      :aria-label="show ? '收起侧边栏入口' : '展开侧边栏入口'"
      @click="show = !show"
    >
      <span class="iconfont iconjiantouyou"></span>
    </button>
    <div class="trigger customScrollbar">
      <div
        class="triggerItem"
        v-for="item in triggerList"
        :key="item.value"
        :class="{ active: activeSidebar === item.value }"
        @click="trigger(item)"
      >
        <div class="triggerIcon iconfont" :class="[item.icon]"></div>
        <div class="triggerName">{{ item.name }}</div>
      </div>
    </div>
  </div>
</template>

<script>
import { mapState } from 'pinia'
import { sidebarLayout, sidebarTriggerList } from '@/config'
import { useAppStore } from '@/stores/app'
import { useSettingsStore } from '@/stores/settings'
import { useThemeStore } from '@/stores/theme'
import { setActiveSidebar } from '@/stores/runtime'

// 侧边栏触发器
const READONLY_ALLOWED_SIDEBARS = ['outline', 'shortcutKey', 'ai']

export default {
  data() {
    return {
      show: true,
      maxHeight: 0
    }
  },
  computed: {
    ...mapState(useThemeStore, {
      isDark: 'isDark'
    }),
    ...mapState(useAppStore, {
      activeSidebar: 'activeSidebar',
      isReadonly: 'isReadonly'
    }),
    ...mapState(useSettingsStore, {
      enableAi: store => store.localConfig.enableAi
    }),
    containerStyle() {
      const activeOffset =
        sidebarLayout.panelWidth +
        sidebarLayout.panelRight +
        sidebarLayout.triggerGap
      const collapsedRight =
        sidebarLayout.collapsedVisibleWidth - sidebarLayout.triggerWidth
      const right = this.show
        ? this.activeSidebar
          ? activeOffset
          : 0
        : collapsedRight
      return {
        top: `${sidebarLayout.panelTop}px`,
        bottom: `${sidebarLayout.panelBottom}px`,
        width: `${sidebarLayout.triggerWidth}px`,
        maxHeight: this.maxHeight + 'px',
        right: `${right}px`
      }
    },

    triggerList() {
      let list = sidebarTriggerList[this.$i18n.locale] || sidebarTriggerList.zh
      if (this.isReadonly) {
        list = list.filter(item => {
          return READONLY_ALLOWED_SIDEBARS.includes(item.value)
        })
      }
      if (!this.enableAi) {
        list = list.filter(item => {
          return item.value !== 'ai'
        })
      }
      return list
    }
  },
  watch: {
    activeSidebar(val) {
      if (val && !this.show) {
        this.show = true
      }
    },
    isReadonly(val) {
      if (
        val &&
        this.activeSidebar &&
        !READONLY_ALLOWED_SIDEBARS.includes(this.activeSidebar)
      ) {
        setActiveSidebar('')
      }
    }
  },
  created() {
    window.addEventListener('resize', this.onResize)
    this.updateSize()
  },
  beforeUnmount() {
    window.removeEventListener('resize', this.onResize)
  },
  methods: {
    trigger(item) {
      setActiveSidebar(item.value)
    },

    onResize() {
      this.updateSize()
    },

    updateSize() {
      this.maxHeight = Math.max(
        0,
        window.innerHeight - sidebarLayout.panelTop - sidebarLayout.panelBottom
      )
    }
  }
}
</script>

<style lang="less" scoped>
.sidebarTriggerContainer {
  position: fixed;
  top: 84px;
  bottom: 20px;
  right: 0;
  z-index: 1201;
  transition:
    right 0.3s ease,
    max-height 0.2s ease;
  display: flex;
  flex-direction: column;
  justify-content: center;

  &.isDark {
    .trigger {
      background-color: #262a2e;
      border-color: hsla(0, 0%, 100%, 0.08);

      .triggerItem {
        color: hsla(0, 0%, 100%, 0.72);

        &:hover {
          background-color: hsla(0, 0%, 100%, 0.05);
        }

        &.active {
          color: #8ec5ff;
        }
      }
    }
  }

  .toggleShowBtn {
    position: absolute;
    left: -6px;
    width: 35px;
    height: 60px;
    background: #409eff;
    top: 50%;
    transform: translateY(-50%);
    cursor: pointer;
    transition: left 0.1s linear;
    z-index: 0;
    border: none;
    border-top-left-radius: 10px;
    border-bottom-left-radius: 10px;
    display: flex;
    align-items: center;
    padding-left: 4px;

    &.hide {
      left: -8px;

      span {
        transform: rotateZ(180deg);
      }
    }

    &:hover {
      left: -18px;
    }

    span {
      color: #fff;
      transition: all 0.1s;
    }
  }

  .trigger {
    position: relative;
    width: 100%;
    border-color: #eee;
    background-color: #fff;
    box-shadow: 0 2px 16px 0 rgba(0, 0, 0, 0.06);
    border-radius: 6px 0 0 6px;
    max-height: 100%;
    overflow-y: auto;
    overflow-x: hidden;

    .triggerItem {
      height: 60px;
      display: flex;
      flex-direction: column;
      justify-content: center;
      align-items: center;
      cursor: pointer;
      color: #464646;
      user-select: none;
      white-space: nowrap;

      &:hover {
        background-color: #ededed;
      }

      &.active {
        color: #409eff;
        font-weight: bold;
      }

      .triggerIcon {
        font-size: 18px;
        margin-bottom: 5px;
      }

      .triggerName {
        font-size: 13px;
      }
    }
  }
}
</style>
