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
        <div class="triggerIconShell">
          <div class="triggerIcon iconfont" :class="[item.icon]"></div>
        </div>
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
  --sidebar-trigger-surface: #ffffff;
  --sidebar-trigger-border: #e5e5e5;
  --sidebar-trigger-shadow: -2px 0 12px rgba(0, 0, 0, 0.02);
  --sidebar-trigger-text: #737373;
  --sidebar-trigger-text-strong: #171717;
  --sidebar-trigger-hover-bg: #f4f4f5;
  --sidebar-trigger-active-bg: #e5e5e5;
  --sidebar-toggle-surface: #ffffff;
  --sidebar-toggle-border: #e5e5e5;
  --sidebar-toggle-shadow: -2px 0 12px rgba(0, 0, 0, 0.04);
  position: fixed;
  top: 84px;
  bottom: 20px;
  right: 0;
  z-index: 1201;
  transition:
    right 0.24s ease,
    max-height 0.2s ease;
  display: flex;
  flex-direction: column;
  justify-content: center;

  .triggerItem:nth-child(1) {
    transition-delay: 0.02s;
  }

  .triggerItem:nth-child(2) {
    transition-delay: 0.04s;
  }

  .triggerItem:nth-child(3) {
    transition-delay: 0.06s;
  }

  .triggerItem:nth-child(4) {
    transition-delay: 0.08s;
  }

  .triggerItem:nth-child(5) {
    transition-delay: 0.1s;
  }

  .triggerItem:nth-child(6) {
    transition-delay: 0.12s;
  }

  &.isDark {
    --sidebar-trigger-surface: #1b1f26;
    --sidebar-trigger-border: rgba(255, 255, 255, 0.08);
    --sidebar-trigger-shadow: -2px 0 16px rgba(0, 0, 0, 0.18);
    --sidebar-trigger-text: rgba(255, 255, 255, 0.54);
    --sidebar-trigger-text-strong: rgba(255, 255, 255, 0.92);
    --sidebar-trigger-hover-bg: rgba(255, 255, 255, 0.06);
    --sidebar-trigger-active-bg: rgba(255, 255, 255, 0.1);
    --sidebar-toggle-surface: #1b1f26;
    --sidebar-toggle-border: rgba(255, 255, 255, 0.08);
    --sidebar-toggle-shadow: -2px 0 16px rgba(0, 0, 0, 0.22);

    .trigger {
      background-color: var(--sidebar-trigger-surface);
      border-color: var(--sidebar-trigger-border);
      box-shadow: var(--sidebar-trigger-shadow);

      .triggerItem {
        color: var(--sidebar-trigger-text);

        &:hover {
          background-color: var(--sidebar-trigger-hover-bg);
        }

        &.active {
          color: var(--sidebar-trigger-text-strong);
        }

        .triggerIconShell {
          background: transparent;
          border-color: transparent;
        }
      }
    }

    .toggleShowBtn {
      background: var(--sidebar-toggle-surface);
      border-color: var(--sidebar-toggle-border);
      box-shadow: var(--sidebar-toggle-shadow);

      span {
        color: var(--sidebar-trigger-text-strong);
      }
    }
  }

  .toggleShowBtn {
    position: absolute;
    left: -6px;
    width: 24px;
    height: 48px;
    background: var(--sidebar-toggle-surface);
    border: 1px solid var(--sidebar-toggle-border);
    top: 50%;
    transform: translateY(-50%);
    cursor: pointer;
    transition:
      left 0.16s ease,
      background 0.2s ease;
    z-index: 0;
    border-top-left-radius: 8px;
    border-bottom-left-radius: 8px;
    display: flex;
    align-items: center;
    justify-content: center;
    padding-left: 0;
    box-shadow: var(--sidebar-toggle-shadow);

    &.hide {
      left: -6px;

      span {
        transform: rotateZ(180deg);
      }
    }

    &:hover {
      left: -12px;
    }

    span {
      color: var(--sidebar-trigger-text);
      font-size: 12px;
      transition: transform 0.16s ease;
    }
  }

  .trigger {
    position: relative;
    width: 100%;
    border: 1px solid var(--sidebar-trigger-border);
    background-color: var(--sidebar-trigger-surface);
    box-shadow: var(--sidebar-trigger-shadow);
    border-radius: 8px 0 0 8px;
    max-height: 100%;
    overflow-y: auto;
    overflow-x: hidden;
    padding: 8px 4px;
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: flex-start;
    gap: 4px;
    height: auto;

    .triggerItem {
      width: 44px;
      height: 56px;
      min-height: 56px;
      display: flex;
      flex-direction: column;
      justify-content: center;
      align-items: center;
      cursor: pointer;
      color: var(--sidebar-trigger-text);
      user-select: none;
      white-space: nowrap;
      border-radius: 6px;
      opacity: 0;
      transform: translateX(10px);
      transition:
        background-color 0.22s ease,
        color 0.22s ease,
        transform 0.26s ease,
        opacity 0.24s ease;

      &:hover {
        background-color: var(--sidebar-trigger-hover-bg);
      }

      &.active {
        color: var(--sidebar-trigger-text-strong);
        background-color: var(--sidebar-trigger-active-bg);
        font-weight: 500;
      }

      .triggerIconShell {
        width: auto;
        height: auto;
        border-radius: 0;
        display: flex;
        align-items: center;
        justify-content: center;
        background: transparent;
        border: 1px solid transparent;
        margin-bottom: 4px;
      }

      .triggerIcon {
        font-size: 12px;
        line-height: 1;

        &.iconshezhi {
          font-size: 11px;
        }
      }

      .triggerName {
        font-size: 10px;
        font-weight: 400;
        line-height: 1.15;
        text-align: center;
        width: 100%;
      }
    }
  }

  &.show {
    .trigger {
      .triggerItem {
        opacity: 1;
        transform: translateX(0);
      }
    }
  }
}
</style>
