<template>
  <div class="doc" :class="{ isDark: isDark }">
    文档已迁移至：<a href="https://wanglin2.github.io/mind-map-docs/">新地址</a>
  </div>
</template>

<script>
import { mapState } from 'pinia'
import { useThemeStore } from '@/stores/theme'

export default {
  name: 'DocPage',
  computed: {
    ...mapState(useThemeStore, {
      isDark: 'isDark'
    })
  }
}
</script>

<style lang="less" scoped>
.doc {
  position: fixed;
  left: 0;
  top: 0;
  width: 100%;
  height: 100%;
  display: flex;
  align-items: center;
  justify-content: center;
  font-weight: bold;
  font-size: 20px;
  background: #ffffff;
  color: #111827;
  transition:
    background-color 0.2s ease,
    color 0.2s ease;

  a {
    color: #1ea59a;
  }

  &.isDark {
    background:
      radial-gradient(circle at top left, rgba(96, 165, 250, 0.12), transparent 30%),
      #0f141b;
    color: #e5e7eb;

    a {
      color: #7dd3fc;
    }
  }
}
</style>
