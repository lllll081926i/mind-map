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
      num: 0
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
      this.onDataChange(this.mindMap.getData())
    }
  },
  beforeUnmount() {
    this.$bus.$off('data_change', this.onDataChange)
  },
  methods: {
    extractText(value) {
      const source = String(value || '')
      if (!source) return ''
      if (!/[<&]/.test(source)) {
        return source
      }
      return (
        new DOMParser().parseFromString(source, 'text/html').body.textContent ||
        ''
      )
    },

    // 监听数据变化
    onDataChange(data) {
      let totalText = ''
      this.num = 0
      this.walk(data, text => {
        totalText += text
      })
      this.words = totalText.length
    },

    // 遍历
    walk(data, collectText) {
      if (!data) return
      this.num++
      collectText(this.extractText(data?.data?.text))
      if (data.children && data.children.length > 0) {
        data.children.forEach(item => {
          this.walk(item, collectText)
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
