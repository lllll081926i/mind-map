<template>
  <div class="fullscreenContainer" :class="{ isDark: isDark }">
    <el-tooltip
      class="item"
      effect="dark"
      :content="$t('fullscreen.fullscreenShow')"
      placement="top"
    >
      <div class="btn iconfont iconquanping" @click="toFullscreenShow"></div>
    </el-tooltip>
    <el-tooltip
      class="item"
      effect="dark"
      :content="$t('fullscreen.fullscreenEdit')"
      placement="top"
    >
      <div class="btn iconfont iconquanping1" @click="toFullscreenEdit"></div>
    </el-tooltip>
  </div>
</template>

<script>
import { fullscreenEvent, fullScreen } from '@/utils'

// 全屏
export default {
  props: {
    mindMap: {
      type: Object
    },
    isDark: {
      type: Boolean
    }
  },
  data() {
    return {
      resizeTimer: null,
      fullscreenListenerName: fullscreenEvent
        ? fullscreenEvent.replace(/^on/, '')
        : '',
      handleFullscreenChange: null
    }
  },
  created() {
    if (!this.fullscreenListenerName) {
      return
    }
    this.handleFullscreenChange = () => {
      clearTimeout(this.resizeTimer)
      this.resizeTimer = setTimeout(() => {
        this.mindMap?.resize()
      }, 1000)
    }
    document.addEventListener(
      this.fullscreenListenerName,
      this.handleFullscreenChange
    )
  },
  beforeUnmount() {
    clearTimeout(this.resizeTimer)
    if (!this.fullscreenListenerName || !this.handleFullscreenChange) {
      return
    }
    document.removeEventListener(
      this.fullscreenListenerName,
      this.handleFullscreenChange
    )
  },
  methods: {
    // 全屏查看
    toFullscreenShow() {
      fullScreen(this.mindMap.el)
    },

    // 全屏编辑
    toFullscreenEdit() {
      fullScreen(document.body)
    }
  }
}
</script>

<style lang="less" scoped>
.fullscreenContainer {
  display: flex;
  align-items: center;
  gap: 6px;

  &.isDark {
    .btn {
      color: var(--navigator-text, hsla(0, 0%, 100%, 0.72));
    }
  }

  .btn {
    cursor: pointer;
    font-size: 16px;
  }
}
</style>
