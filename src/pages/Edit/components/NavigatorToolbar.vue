<template>
  <div class="navigatorContainer customScrollbar" :class="{ isDark: isDark }">
    <div class="item">
      <el-tooltip
        effect="dark"
        :content="$t('navigatorToolbar.backToRoot')"
        placement="top"
      >
        <div
          class="btn iconfont icondingwei"
          role="button"
          tabindex="0"
          :aria-label="$t('navigatorToolbar.backToRoot')"
          @click="backToRoot"
          @keydown.enter.prevent="backToRoot"
          @keydown.space.prevent="backToRoot"
        ></div>
      </el-tooltip>
    </div>
    <div class="item">
      <div
        class="btn iconfont iconsousuo"
        role="button"
        tabindex="0"
        :aria-label="$t('search.searchPlaceholder')"
        @click="showSearch"
        @keydown.enter.prevent="showSearch"
        @keydown.space.prevent="showSearch"
      ></div>
    </div>
    <div class="item">
      <MouseAction :isDark="isDark" :mindMap="mindMap"></MouseAction>
    </div>
    <div class="item">
      <el-tooltip
        effect="dark"
        :content="
          openMiniMap
            ? $t('navigatorToolbar.closeMiniMap')
            : $t('navigatorToolbar.openMiniMap')
        "
        placement="top"
      >
        <div
          class="btn iconfont icondaohang1"
          role="button"
          tabindex="0"
          :aria-label="
            openMiniMap
              ? $t('navigatorToolbar.closeMiniMap')
              : $t('navigatorToolbar.openMiniMap')
          "
          @click="toggleMiniMap"
          @keydown.enter.prevent="toggleMiniMap"
          @keydown.space.prevent="toggleMiniMap"
        ></div>
      </el-tooltip>
    </div>
    <div class="item">
      <!-- <el-switch
        v-model="isReadonly"
        :active-text="$t('navigatorToolbar.readonly')"
        :inactive-text="$t('navigatorToolbar.edit')"
        @change="readonlyChange"
      >
      </el-switch> -->
      <el-tooltip
        effect="dark"
        :content="
          isReadonly
            ? $t('navigatorToolbar.edit')
            : $t('navigatorToolbar.readonly')
        "
        placement="top"
      >
        <div
          class="btn iconfont"
          :class="[isReadonly ? 'iconyanjing' : 'iconbianji1']"
          role="button"
          tabindex="0"
          :aria-label="
            isReadonly
              ? $t('navigatorToolbar.edit')
              : $t('navigatorToolbar.readonly')
          "
          @click="readonlyChange"
          @keydown.enter.prevent="readonlyChange"
          @keydown.space.prevent="readonlyChange"
        ></div>
      </el-tooltip>
    </div>
    <div class="item">
      <Fullscreen :isDark="isDark" :mindMap="mindMap"></Fullscreen>
    </div>
    <div class="item">
      <Scale :isDark="isDark" :mindMap="mindMap"></Scale>
    </div>
    <div class="item">
      <div
        class="btn iconfont"
        :class="[isDark ? 'iconmoon_line' : 'iconlieri']"
        role="button"
        tabindex="0"
        :aria-label="
          isDark ? $t('navigatorToolbar.lightMode') : $t('navigatorToolbar.darkMode')
        "
        @click="toggleDark"
        @keydown.enter.prevent="toggleDark"
        @keydown.space.prevent="toggleDark"
      ></div>
    </div>
    <!-- <div class="item">
      <el-tooltip
        effect="dark"
        :content="$t('navigatorToolbar.changeSourceCodeEdit')"
        placement="top"
      >
        <div class="btn iconfont iconyuanma" @click="openSourceCodeEdit"></div>
      </el-tooltip>
    </div> -->
    <div class="item">
      <Demonstrate :isDark="isDark" :mindMap="mindMap"></Demonstrate>
    </div>
    <div class="item">
      <el-tooltip
        effect="dark"
        :content="$t('navigatorToolbar.shortcutKeys')"
        placement="top"
      >
        <div
          class="btn iconfont iconjianpan"
          role="button"
          tabindex="0"
          :aria-label="$t('navigatorToolbar.shortcutKeys')"
          @click="openShortcutKey"
          @keydown.enter.prevent="openShortcutKey"
          @keydown.space.prevent="openShortcutKey"
        ></div>
      </el-tooltip>
    </div>
  </div>
</template>

<script>
import Scale from './Scale.vue'
import Fullscreen from './Fullscreen.vue'
import MouseAction from './MouseAction.vue'
import { mapState } from 'pinia'
import Demonstrate from './Demonstrate.vue'
import { useAppStore } from '@/stores/app'
import {
  emitShowLoading,
  emitShowSearch,
  emitToggleMiniMap
} from '@/services/appEvents'
import { useThemeStore } from '@/stores/theme'
import {
  setActiveSidebar,
  setIsReadonly,
  toggleMindMapThemeMode
} from '@/stores/runtime'

// 导航器工具栏
export default {
  components: {
    Scale,
    Fullscreen,
    MouseAction,
    Demonstrate
  },
  props: {
    mindMap: {
      type: Object
    }
  },
  data() {
    return {
      openMiniMap: false
    }
  },
  computed: {
    ...mapState(useAppStore, {
      isReadonly: 'isReadonly'
    }),
    ...mapState(useThemeStore, {
      isDark: 'isDark'
    })
  },
  methods: {
    readonlyChange() {
      setIsReadonly(!this.isReadonly)
      this.mindMap.setMode(this.isReadonly ? 'readonly' : 'edit')
    },

    toggleMiniMap() {
      this.openMiniMap = !this.openMiniMap
      emitToggleMiniMap(this.openMiniMap)
    },

    showSearch() {
      emitShowSearch()
    },

    openShortcutKey() {
      setActiveSidebar('shortcutKey')
    },

    toggleDark() {
      emitShowLoading()
      void toggleMindMapThemeMode(this.mindMap)
    },

    backToRoot() {
      this.mindMap.renderer.setRootNodeCenter()
    }
  }
}
</script>

<style lang="less" scoped>
.navigatorContainer {
  --navigator-surface: rgba(255, 255, 255, 0.9);
  --navigator-border: rgba(15, 23, 42, 0.08);
  --navigator-shadow: 0 20px 44px rgba(15, 23, 42, 0.14);
  --navigator-text: rgba(15, 23, 42, 0.72);
  --navigator-text-strong: rgba(15, 23, 42, 0.92);
  --navigator-btn-hover: rgba(15, 23, 42, 0.06);
  --navigator-btn-active: rgba(15, 23, 42, 0.1);
  --navigator-btn-border: transparent;
  --navigator-divider: rgba(15, 23, 42, 0.08);
  padding: 0 12px;
  position: fixed;
  right: 20px;
  bottom: 20px;
  background: var(--navigator-surface);
  border-radius: 18px;
  border: 1px solid var(--navigator-border);
  box-shadow: var(--navigator-shadow);
  height: 52px;
  font-size: 12px;
  display: flex;
  align-items: center;
  backdrop-filter: blur(18px);
  z-index: 1200;

  &.isDark {
    --navigator-surface: rgba(24, 28, 34, 0.94);
    --navigator-border: rgba(255, 255, 255, 0.08);
    --navigator-shadow: 0 24px 52px rgba(0, 0, 0, 0.34);
    --navigator-text: hsla(0, 0%, 100%, 0.72);
    --navigator-text-strong: #fff;
    --navigator-btn-hover: hsla(0, 0%, 100%, 0.08);
    --navigator-btn-active: hsla(0, 0%, 100%, 0.14);
    --navigator-btn-border: transparent;
    --navigator-divider: hsla(0, 0%, 100%, 0.1);

    .item {
      a {
        color: var(--navigator-text);
      }

      .btn {
        color: var(--navigator-text);
      }
    }
  }

  .item {
    display: flex;
    align-items: center;
    height: 100%;
    flex: 0 0 auto;
    margin-right: 6px;
    position: relative;

    &:last-of-type {
      margin-right: 0;
    }

    &:not(:last-of-type)::after {
      content: '';
      width: 1px;
      height: 20px;
      background: var(--navigator-divider);
      margin-left: 6px;
    }

    :deep(.mouseActionContainer),
    :deep(.fullscreenContainer),
    :deep(.scaleContainer),
    :deep(.demonstrateContainer),
    :deep(.el-dropdown) {
      display: flex;
      align-items: center;
      height: 100%;
    }

    a {
      color: var(--navigator-text);
      text-decoration: none;
    }

    > .btn,
    :deep(.btn) {
      cursor: pointer;
      color: var(--navigator-text);
      font-size: 16px;
      width: 30px;
      height: 30px;
      display: flex;
      align-items: center;
      justify-content: center;
      line-height: 1;
      flex: 0 0 30px;
      border-radius: 10px;
      border: 1px solid transparent;
      transition:
        color 0.2s ease,
        background 0.2s ease,
        border-color 0.2s ease,
        transform 0.18s ease,
        box-shadow 0.2s ease;

      &:hover {
        color: var(--navigator-text-strong);
        background: var(--navigator-btn-hover);
        border-color: var(--navigator-btn-border);
        transform: translateY(-1px);
        box-shadow: none;
      }
    }
  }
}

@media screen and (max-width: 700px) {
  .navigatorContainer {
    left: 20px;
    overflow-x: auto;
    overflow-y: hidden;
    height: 58px;
  }
}
</style>
