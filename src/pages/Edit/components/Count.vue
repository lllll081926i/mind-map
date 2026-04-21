<template>
  <div class="countContainer" :class="{ isDark: isDark }">
    <div class="item">
      <span class="name">{{ $t('count.words') }}</span>
      <span class="value">{{ words }}</span>
    </div>
    <div class="item">
      <span class="name">{{ $t('count.nodes') }}</span>
      <span class="value">{{ num }}</span>
    </div>
  </div>
</template>

<script>
import { mapState } from 'pinia'
import { useThemeStore } from '@/stores/theme'

const COUNT_UPDATE_DEBOUNCE_MS = 120

// 字数及节点数量统计
export default {
  props: {
    mindMap: {
      type: Object
    }
  },
  data() {
    return {
      words: 0,
      num: 0,
      countUpdateFrame: 0,
      countUpdateTimer: 0,
      pendingCountData: null,
      htmlParser: null
    }
  },
  computed: {
    ...mapState(useThemeStore, {
      isDark: 'isDark'
    })
  },
  created() {
    this.$bus.$on('data_change', this.onDataChange)
    if (this.mindMap) {
      this.scheduleCountUpdate(this.mindMap.getData())
    }
  },
  beforeUnmount() {
    this.$bus.$off('data_change', this.onDataChange)
    this.cancelScheduledCountUpdate()
  },
  methods: {
    extractText(value) {
      const source = String(value || '')
      if (!source) return ''
      if (!/[<&]/.test(source)) {
        return source
      }
      if (!this.htmlParser) {
        this.htmlParser = new DOMParser()
      }
      return (
        this.htmlParser.parseFromString(source, 'text/html').body.textContent || ''
      )
    },

    cancelScheduledCountUpdate() {
      if (this.countUpdateFrame) {
        cancelAnimationFrame(this.countUpdateFrame)
        this.countUpdateFrame = 0
      }
      if (this.countUpdateTimer) {
        clearTimeout(this.countUpdateTimer)
        this.countUpdateTimer = 0
      }
    },

    scheduleCountUpdate(data) {
      this.pendingCountData = data
      if (this.countUpdateFrame || this.countUpdateTimer) {
        return
      }
      this.countUpdateFrame = requestAnimationFrame(() => {
        this.countUpdateFrame = 0
        this.countUpdateTimer = window.setTimeout(() => {
          this.countUpdateTimer = 0
          this.flushCountUpdate()
        }, COUNT_UPDATE_DEBOUNCE_MS)
      })
    },

    flushCountUpdate() {
      const stats = this.countStats(this.pendingCountData)
      this.pendingCountData = null
      this.words = stats.words
      this.num = stats.num
    },

    countStats(data) {
      const stats = {
        words: 0,
        num: 0
      }
      this.walk(data, node => {
        stats.num += 1
        stats.words += this.extractText(node?.data?.text).length
      })
      return stats
    },

    // 监听数据变化
    onDataChange(data) {
      this.scheduleCountUpdate(data)
    },

    // 遍历
    walk(data, visit) {
      if (!data) return
      visit(data)
      if (data.children && data.children.length > 0) {
        data.children.forEach(item => {
          this.walk(item, visit)
        })
      }
    }
  }
}
</script>

<style lang="less" scoped>
.countContainer {
  padding: 0 12px;
  position: fixed;
  left: 20px;
  bottom: 20px;
  background: hsla(0, 0%, 100%, 0.8);
  border-radius: 2px;
  opacity: 0.8;
  height: 22px;
  line-height: 22px;
  font-size: 12px;
  display: flex;

  &.isDark {
    background: #262a2e;

    .item {
      color: hsla(0, 0%, 100%, 0.6);
    }
  }

  .item {
    color: #555;
    margin-right: 15px;

    &:last-of-type {
      margin-right: 0;
    }

    .name {
      margin-right: 5px;
    }
  }
}

@media screen and (max-width: 900px) {
  .countContainer {
    display: none;
  }
}
</style>
