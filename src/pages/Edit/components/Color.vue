<template>
  <div class="colorContainer" :class="{ isDark: isDark }">
    <div class="colorList">
      <span
        class="colorItem iconfont"
        v-for="item in colorList"
        :style="{ backgroundColor: item }"
        :class="{ icontouming: item === 'transparent' }"
        :key="item"
        @click="clickColorItem(item)"
      ></span>
    </div>
    <div class="moreColor">
      <span>{{ $t('color.moreColor') }}</span>
      <span
        class="currentColorPreview"
        :class="{ isTransparent: !selectColor || selectColor === 'transparent' }"
        :style="{ backgroundColor: normalizedPreviewColor }"
      ></span>
      <el-color-picker
        size="small"
        show-alpha
        v-model="selectColor"
        @change="changeColor"
      ></el-color-picker>
    </div>
  </div>
</template>

<script>
import { colorList } from '@/config'
import { mapState } from 'pinia'
import { useThemeStore } from '@/stores/theme'

// 颜色选择器
export default {
  props: {
    color: {
      type: String,
      default: ''
    }
  },
  data() {
    return {
      colorList,
      selectColor: ''
    }
  },
  computed: {
    ...mapState(useThemeStore, {
      isDark: 'isDark'
    }),
    normalizedPreviewColor() {
      if (!this.selectColor || this.selectColor === 'transparent') {
        return 'transparent'
      }
      return this.selectColor
    }
  },
  watch: {
    color() {
      this.selectColor = this.color
    }
  },
  created() {
    this.selectColor = this.color
  },
  methods: {
    // 点击预设颜色
    clickColorItem(color) {
      this.$emit('change', color)
    },

    // 修改颜色
    changeColor() {
      this.$emit('change', this.selectColor)
    }
  }
}
</script>

<style lang="less" scoped>
.colorContainer {
  width: 100%;

  &.isDark {
    .moreColor {
      color: hsla(0, 0%, 100%, 0.6);

      .currentColorPreview {
        border-color: hsla(0, 0%, 100%, 0.18);
      }
    }

    :deep(.el-color-picker__trigger) {
      background-color: #36393d;
      border-color: hsla(0, 0%, 100%, 0.12);
    }

    :deep(.el-color-picker__color) {
      border-color: hsla(0, 0%, 100%, 0.2);
    }
  }
}

.colorList {
  width: 100%;
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(18px, 1fr));
  gap: 6px;

  .colorItem {
    display: flex;
    justify-content: center;
    align-items: center;
    width: 100%;
    min-width: 18px;
    aspect-ratio: 1;
    min-height: 18px;
    cursor: pointer;
    border-radius: 4px;
    overflow: hidden;
  }
}

.moreColor {
  display: flex;
  align-items: center;
  width: 100%;
  gap: 8px;
  margin-top: 4px;
  flex-wrap: wrap;

  span {
    margin-right: 0;
  }

  .currentColorPreview {
    width: 18px;
    height: 18px;
    border: 1px solid #dcdfe6;
    border-radius: 4px;
    flex-shrink: 0;

    &.isTransparent {
      background-image:
        linear-gradient(45deg, #dcdfe6 25%, transparent 25%),
        linear-gradient(-45deg, #dcdfe6 25%, transparent 25%),
        linear-gradient(45deg, transparent 75%, #dcdfe6 75%),
        linear-gradient(-45deg, transparent 75%, #dcdfe6 75%);
      background-size: 8px 8px;
      background-position: 0 0, 0 4px, 4px -4px, -4px 0;
    }
  }

  :deep(.el-color-picker__trigger) {
    border-radius: 6px;
  }

  :deep(.el-color-picker) {
    flex-shrink: 0;
  }
}
</style>
