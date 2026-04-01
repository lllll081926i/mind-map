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
      <el-dropdown @command="handleCommand">
        <div
          class="btn moreBtn"
          role="button"
          tabindex="0"
          :aria-label="$t('toolbar.more')"
        >
          ...
        </div>
        <template #dropdown>
          <el-dropdown-menu>
            <el-dropdown-item command="shortcutKey">
              <span class="iconfont iconjianpan"></span>
              {{ $t('navigatorToolbar.shortcutKeys') }}
            </el-dropdown-item>
            <el-dropdown-item v-if="enableAi" command="aiChat">
              <span class="iconfont iconAIshengcheng"></span>
              {{ $t('navigatorToolbar.ai') }}
            </el-dropdown-item>
            <el-dropdown-item command="github">
              <span class="iconfont icongithub"></span>
              Github
            </el-dropdown-item>
            <el-dropdown-item command="site">
              <span class="iconfont iconwangzhan"></span>
              {{ $t('navigatorToolbar.site') }}
            </el-dropdown-item>
            <el-dropdown-item disabled
              >{{ $t('navigatorToolbar.current') }}v{{
                version
              }}</el-dropdown-item
            >
          </el-dropdown-menu>
        </template>
      </el-dropdown>
    </div>
  </div>
</template>

<script>
import Scale from './Scale.vue'
import Fullscreen from './Fullscreen.vue'
import MouseAction from './MouseAction.vue'
import { storeData } from '@/api'
import { mapState } from 'pinia'
import pkg from 'simple-mind-map/package.json'
import Demonstrate from './Demonstrate.vue'
import themeList from 'simple-mind-map-plugin-themes/themeList'
import { useAppStore } from '@/stores/app'
import {
  emitShowLoading,
  emitShowSearch,
  emitToggleMiniMap
} from '@/services/appEvents'
import { useSettingsStore } from '@/stores/settings'
import { useThemeStore } from '@/stores/theme'
import {
  applyLocalConfigPatch,
  setActiveSidebar,
  setIsReadonly,
  setIsSourceCodeEdit
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
      version: pkg.version,
      openMiniMap: false
    }
  },
  computed: {
    ...mapState(useAppStore, {
      isReadonly: 'isReadonly'
    }),
    ...mapState(useThemeStore, {
      isDark: 'isDark',
      extendThemeGroupList: 'extendThemeGroupList'
    }),
    ...mapState(useSettingsStore, {
      localConfig: 'localConfig',
      enableAi: store => store.localConfig.enableAi
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

    getAllThemes() {
      const extendThemeList = []
      this.extendThemeGroupList.forEach(group => {
        extendThemeList.push(...group.list)
      })
      return [
        {
          name: this.$t('theme.default'),
          value: 'default',
          dark: false
        },
        ...themeList,
        ...extendThemeList
      ]
    },

    getThemeMeta(themeValue) {
      return this.getAllThemes().find(item => {
        return item.value === themeValue
      })
    },

    getPreferredThemeValue(expectDark) {
      const fallbackTheme = expectDark ? 'dark4' : 'default'
      const rememberKey = expectDark ? 'lastDarkTheme' : 'lastLightTheme'
      const preferredTheme = this.localConfig[rememberKey] || fallbackTheme
      const target = this.getThemeMeta(preferredTheme)
      if (target && target.dark === expectDark) {
        return target.value
      }
      const fallbackTarget = this.getThemeMeta(fallbackTheme)
      if (fallbackTarget && fallbackTarget.dark === expectDark) {
        return fallbackTarget.value
      }
      const firstMatchedTheme = this.getAllThemes().find(item => {
        return item.dark === expectDark
      })
      return firstMatchedTheme ? firstMatchedTheme.value : this.mindMap.getTheme()
    },

    toggleDark() {
      const currentTheme = this.mindMap.getTheme()
      const currentThemeMeta = this.getThemeMeta(currentTheme)
      const nextIsDark = !this.isDark
      const nextTheme = this.getPreferredThemeValue(nextIsDark)
      const customThemeConfig = this.mindMap.getCustomThemeConfig()
      const nextLocalConfig = {
        isDark: nextIsDark
      }
      if (currentThemeMeta) {
        if (currentThemeMeta.dark) {
          nextLocalConfig.lastDarkTheme = currentThemeMeta.value
          nextLocalConfig.lastLightTheme = this.localConfig.lastLightTheme
        } else {
          nextLocalConfig.lastLightTheme = currentThemeMeta.value
          nextLocalConfig.lastDarkTheme = this.localConfig.lastDarkTheme
        }
      }
      if (nextIsDark) {
        nextLocalConfig.lastDarkTheme = nextTheme
      } else {
        nextLocalConfig.lastLightTheme = nextTheme
      }
      emitShowLoading()
      this.mindMap.setTheme(nextTheme)
      storeData({
        theme: {
          template: nextTheme,
          config: customThemeConfig
        }
      })
      applyLocalConfigPatch({
        ...nextLocalConfig
      })
    },

    handleCommand(command) {
      if (command === 'shortcutKey') {
        setActiveSidebar('shortcutKey')
        return
      } else if (command === 'aiChat') {
        setActiveSidebar('ai')
        return
      }
      let url = ''
      switch (command) {
        case 'github':
          url = 'https://github.com/lllll081926i/mind-map'
          break
        case 'helpDoc':
          url = 'https://wanglin2.github.io/mind-map-docs/help/help1.html'
          break
        case 'devDoc':
          url =
            'https://wanglin2.github.io/mind-map-docs/start/introduction.html'
          break
        case 'site':
          url = 'https://wanglin2.github.io/mind-map-docs/'
          break
        case 'issue':
          url = 'https://github.com/lllll081926i/mind-map/issues/new'
          break

        default:
          break
      }
      const a = document.createElement('a')
      a.href = url
      a.target = '_blank'
      a.click()
    },

    backToRoot() {
      this.mindMap.renderer.setRootNodeCenter()
    },

    openSourceCodeEdit() {
      setIsSourceCodeEdit(true)
    }
  }
}
</script>

<style lang="less" scoped>
.navigatorContainer {
  padding: 0 10px;
  position: fixed;
  right: 20px;
  bottom: 20px;
  background: hsla(0, 0%, 100%, 0.8);
  border-radius: 5px;
  opacity: 0.8;
  height: 44px;
  font-size: 12px;
  display: flex;
  align-items: center;

  &.isDark {
    background: #262a2e;

    .item {
      a {
        color: hsla(0, 0%, 100%, 0.6);
      }

      .btn {
        color: hsla(0, 0%, 100%, 0.6);
      }
    }
  }

  .item {
    display: flex;
    align-items: center;
    height: 100%;
    flex: 0 0 auto;
    margin-right: 8px;

    &:last-of-type {
      margin-right: 0;
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
      color: #303133;
      text-decoration: none;
    }

    > .btn,
    :deep(.btn) {
      cursor: pointer;
      font-size: 18px;
      width: 24px;
      height: 24px;
      display: flex;
      align-items: center;
      justify-content: center;
      line-height: 1;
      flex: 0 0 24px;
    }

    .moreBtn {
      font-size: 14px;
      font-weight: 700;
      letter-spacing: 1px;
    }
  }
}

@media screen and (max-width: 700px) {
  .navigatorContainer {
    left: 20px;
    overflow-x: auto;
    overflow-y: hidden;
    height: 60px;
  }
}
</style>
