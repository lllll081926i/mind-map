<template>
  <div class="mouseActionContainer" :class="{ isDark: isDark }">
    <el-tooltip
      class="item"
      effect="dark"
      :content="
        useLeftKeySelectionRightKeyDrag
          ? $t('mouseAction.tip2')
          : $t('mouseAction.tip1')
      "
      placement="top"
    >
      <div
        class="btn iconfont"
        :class="[useLeftKeySelectionRightKeyDrag ? 'iconmouseR' : 'iconmouseL']"
        @click="toggleAction"
      ></div>
    </el-tooltip>
  </div>
</template>

<script>
import { mapState } from 'pinia'
import { useSettingsStore } from '@/stores/settings'
import { applyLocalConfigPatch } from '@/stores/runtime'

// 鼠标操作设置
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
    return {}
  },
  computed: {
    ...mapState(useSettingsStore, {
      localConfig: 'localConfig'
    }),
    useLeftKeySelectionRightKeyDrag() {
      return !!this.localConfig.useLeftKeySelectionRightKeyDrag
    }
  },
  methods: {
    toggleAction() {
      let val = !this.localConfig.useLeftKeySelectionRightKeyDrag
      this.mindMap.updateConfig({
        useLeftKeySelectionRightKeyDrag: val
      })
      applyLocalConfigPatch({
        useLeftKeySelectionRightKeyDrag: val
      })
    }
  }
}
</script>

<style lang="less" scoped>
.mouseActionContainer {
  display: flex;
  align-items: center;

  &.isDark {
    .btn {
      color: var(--navigator-text, hsla(0, 0%, 100%, 0.72));
    }
  }

  .item {
    margin-right: 6px;

    &:last-of-type {
      margin-right: 0;
    }
  }

  .btn {
    cursor: pointer;
    font-size: 16px;
  }
}
</style>
