<template>
  <div
    class="container"
    :class="{ isDark: isDark, activeSidebar: activeSidebar }"
  >
    <template v-if="show">
      <Toolbar v-if="!isZenMode"></Toolbar>
      <Edit></Edit>
      <ExportDialog v-if="isExportRoute"></ExportDialog>
    </template>
  </div>
</template>

<script>
import { defineAsyncComponent } from 'vue'
import { mapState } from 'pinia'
import { useAppStore } from '@/stores/app'
import { useSettingsStore } from '@/stores/settings'
import { useThemeStore } from '@/stores/theme'

const Toolbar = defineAsyncComponent(() => import('./components/Toolbar.vue'))
const Edit = defineAsyncComponent(() => import('./components/Edit.vue'))
const ExportDialog = defineAsyncComponent(() => import('../Export/Index.vue'))

const EDIT_PAGE_UI_ICON_STYLE_ID = 'edit-page-ui-icons'

const strokeIcon = inner => {
  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="black" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round">${inner}</svg>`
}

const glyphIcon = inner => {
  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24">${inner}</svg>`
}

const EDIT_PAGE_UI_ICON_MAP = {
  iconguanbi: strokeIcon(`<path d="M6 6l12 12"/><path d="M18 6 6 18"/>`),
  iconsousuo: strokeIcon(
    `<circle cx="11" cy="11" r="6.5"/><path d="m16 16 4.5 4.5"/>`
  ),
  iconbianji1: strokeIcon(
    `<path d="M4 20h4l9.5-9.5a2.1 2.1 0 0 0-4-4L4 16v4Z"/><path d="m13 7 4 4"/>`
  ),
  iconwushuju: strokeIcon(
    `<path d="M4 7.5A2.5 2.5 0 0 1 6.5 5h11A2.5 2.5 0 0 1 20 7.5v9a2.5 2.5 0 0 1-2.5 2.5h-11A2.5 2.5 0 0 1 4 16.5v-9Z"/><path d="M8 10h8"/><path d="M8 14h5"/>`
  ),
  iconprinting: strokeIcon(
    `<path d="M7 8V4h10v4"/><rect x="6" y="14" width="12" height="6" rx="1.5"/><path d="M6 17H5a2 2 0 0 1-2-2v-4a3 3 0 0 1 3-3h12a3 3 0 0 1 3 3v4a2 2 0 0 1-2 2h-1"/><path d="M17 11h.01"/>`
  ),
  iconquanping: strokeIcon(
    `<path d="M8 4H4v4"/><path d="M16 4h4v4"/><path d="M20 16v4h-4"/><path d="M4 16v4h4"/>`
  ),
  iconquanping1: strokeIcon(
    `<path d="M9 4H4v5"/><path d="M15 4h5v5"/><path d="M20 15v5h-5"/><path d="M4 15v5h5"/><path d="M9 9h6v6H9z"/>`
  ),
  icondingwei: strokeIcon(
    `<circle cx="12" cy="12" r="7"/><circle cx="12" cy="12" r="1.5"/><path d="M12 2v3"/><path d="M12 19v3"/><path d="M2 12h3"/><path d="M19 12h3"/>`
  ),
  icondaohang1: strokeIcon(
    `<rect x="4" y="5" width="16" height="14" rx="2"/><path d="m9 9 2.5 3 3-2 2.5 5"/><path d="M15 9h.01"/>`
  ),
  iconjianpan: strokeIcon(
    `<rect x="3" y="6" width="18" height="12" rx="2"/><path d="M7 10h.01"/><path d="M11 10h.01"/><path d="M15 10h.01"/><path d="M7 14h10"/>`
  ),
  iconAIshengcheng: strokeIcon(
    `<path d="M12 3l1.9 4.6 4.6 1.9-4.6 1.9L12 16l-1.9-4.6-4.6-1.9 4.6-1.9L12 3Z"/><path d="M19 3v4"/><path d="M21 5h-4"/><path d="M4 14v4"/><path d="M6 16H2"/>`
  ),
  icongithub: strokeIcon(
    `<path d="M9 18c-4 1.2-4-2-6-2"/><path d="M15 18c4 1.2 4-2 6-2"/><path d="M9 21v-3.5c-2-.7-3.5-2.5-3.5-5.5 0-1.2.4-2.3 1.1-3.1-.2-.6-.5-1.9.1-3.9 0 0 1.1-.4 3.6 1.3A12.8 12.8 0 0 1 12 6c.6 0 1.1.1 1.7.3 2.5-1.7 3.6-1.3 3.6-1.3.6 2 .3 3.3.1 3.9.7.8 1.1 1.9 1.1 3.1 0 3-1.5 4.8-3.5 5.5V21"/>`
  ),
  iconwangzhan: strokeIcon(
    `<circle cx="12" cy="12" r="9"/><path d="M3 12h18"/><path d="M12 3a15 15 0 0 1 0 18"/><path d="M12 3a15 15 0 0 0 0 18"/>`
  ),
  iconyuanma: strokeIcon(
    `<path d="m8 8-4 4 4 4"/><path d="m16 8 4 4-4 4"/><path d="m13 5-2 14"/>`
  ),
  iconyanjing: strokeIcon(
    `<path d="M2.5 12S6.5 5.5 12 5.5 21.5 12 21.5 12 17.5 18.5 12 18.5 2.5 12 2.5 12Z"/><circle cx="12" cy="12" r="2.5"/>`
  ),
  iconlieri: strokeIcon(
    `<circle cx="12" cy="12" r="4"/><path d="M12 2v2.5"/><path d="M12 19.5V22"/><path d="m4.9 4.9 1.8 1.8"/><path d="m17.3 17.3 1.8 1.8"/><path d="M2 12h2.5"/><path d="M19.5 12H22"/><path d="m4.9 19.1 1.8-1.8"/><path d="m17.3 6.7 1.8-1.8"/>`
  ),
  iconmoon_line: strokeIcon(`<path d="M18 14.5A7.5 7.5 0 0 1 9.5 6a8 8 0 1 0 8.5 8.5Z"/>`),
  iconmouseL: strokeIcon(
    `<path d="M9.2 3.5h5.6c1.9 0 3.2 1.5 3.2 3.4v8.2c0 3.1-2.6 5.4-6 5.4s-6-2.3-6-5.4V6.9c0-1.9 1.3-3.4 3.2-3.4Z" stroke-width="2.2"/><path d="M12 3.5v7" stroke-width="2.2"/><path d="M3.8 11.8h2.6" stroke-width="2.2"/>`
  ),
  iconmouseR: strokeIcon(
    `<path d="M9.2 3.5h5.6c1.9 0 3.2 1.5 3.2 3.4v8.2c0 3.1-2.6 5.4-6 5.4s-6-2.3-6-5.4V6.9c0-1.9 1.3-3.4 3.2-3.4Z" stroke-width="2.2"/><path d="M12 3.5v7" stroke-width="2.2"/><path d="M17.6 11.8h2.6" stroke-width="2.2"/>`
  ),
  iconyanshibofang: strokeIcon(
    `<rect x="3" y="5" width="18" height="12" rx="2"/><path d="M8 21h8"/><path d="M12 17v4"/><path d="m10 9 5 3-5 3z"/>`
  ),
  'iconhoutui-shi': strokeIcon(
    `<path d="M9 7 4 12l5 5"/><path d="M4 12h9a7 7 0 0 1 7 7"/>`
  ),
  iconqianjin1: strokeIcon(
    `<path d="M15 7 20 12l-5 5"/><path d="M20 12h-9a7 7 0 0 0-7 7"/>`
  ),
  iconjiedian: strokeIcon(
    `<rect x="4" y="9" width="7" height="6" rx="1.2"/><rect x="15" y="5" width="5" height="4" rx="1"/><rect x="15" y="15" width="5" height="4" rx="1"/><path d="M11 12h4"/>`
  ),
  icontianjiazijiedian: strokeIcon(
    `<rect x="4" y="9" width="5" height="6" rx="1.2"/><rect x="14" y="9" width="6" height="6" rx="1.2"/><path d="M9 12h5"/><path d="M17 6v6"/><path d="M14 9h6"/>`
  ),
  iconshanchu: strokeIcon(
    `<path d="M4 7h16"/><path d="M9 7V4h6v3"/><path d="M7 7l1 12h8l1-12"/><path d="M10 11v5"/><path d="M14 11v5"/>`
  ),
  iconimage: strokeIcon(
    `<rect x="4" y="5" width="16" height="14" rx="2"/><circle cx="9" cy="10" r="1.5"/><path d="m20 16-4.5-4.5L8 19"/>`
  ),
  iconxiaolian: strokeIcon(
    `<circle cx="12" cy="12" r="8"/><path d="M9 10h.01"/><path d="M15 10h.01"/><path d="M8.5 14c1 .9 2.1 1.5 3.5 1.5s2.5-.6 3.5-1.5"/>`
  ),
  iconchaolianjie: strokeIcon(
    `<path d="M10 14a4 4 0 0 1 0-5.7l2.3-2.3a4 4 0 1 1 5.7 5.7L16.5 13"/><path d="M14 10a4 4 0 0 1 0 5.7l-2.3 2.3a4 4 0 1 1-5.7-5.7L7.5 11"/>`
  ),
  'iconflow-Mark': strokeIcon(`<path d="M6 5h12a2 2 0 0 1 2 2v10l-4-3H6a2 2 0 0 1-2-2V7a2 2 0 0 1 2-2Z"/>`),
  iconbiaoqian: strokeIcon(`<path d="M20 10 12 18 4 10V5h5l11 11Z"/><path d="M7.5 7.5h.01"/>`),
  icongaikuozonglan: strokeIcon(
    `<rect x="5" y="6" width="14" height="12" rx="2"/><path d="M8 10h8"/><path d="M8 14h5"/>`
  ),
  iconlianjiexian: strokeIcon(
    `<circle cx="6" cy="17" r="2"/><circle cx="18" cy="7" r="2"/><path d="M8 16c2.5-4.5 5.5-6.5 8-8"/>`
  ),
  icongongshi: glyphIcon(
    `<text x="12" y="16" font-size="14" text-anchor="middle" font-family="Arial, sans-serif" font-weight="700" fill="black">fx</text>`
  ),
  iconfujian: strokeIcon(`<path d="M8 12.5 13.5 7a3.5 3.5 0 1 1 5 5l-7.5 7.5a5 5 0 1 1-7-7L12 4.5"/>`),
  iconwaikuang: strokeIcon(`<rect x="4" y="4" width="16" height="16" rx="2.5"/><path d="M8 8h8v8H8z"/>`),
  icondakai: strokeIcon(
    `<path d="M3.5 8.5A2.5 2.5 0 0 1 6 6h4l2 2h6A2.5 2.5 0 0 1 20.5 10.5v7A2.5 2.5 0 0 1 18 20H6a2.5 2.5 0 0 1-2.5-2.5v-9Z"/><path d="M3.5 10h17"/>`
  ),
  iconxinjian: strokeIcon(
    `<path d="M8 4h6l4 4v12H8a2 2 0 0 1-2-2V6a2 2 0 0 1 2-2Z"/><path d="M14 4v4h4"/><path d="M12 11v6"/><path d="M9 14h6"/>`
  ),
  iconwenjian1: strokeIcon(`<path d="M8 4h6l4 4v12H8a2 2 0 0 1-2-2V6a2 2 0 0 1 2-2Z"/><path d="M14 4v4h4"/>`),
  iconwenjian: strokeIcon(
    `<path d="M8 4h6l4 4v12H8a2 2 0 0 1-2-2V6a2 2 0 0 1 2-2Z"/><path d="M14 4v4h4"/><path d="M9 13h6"/><path d="M9 17h4"/>`
  ),
  iconlingcunwei: strokeIcon(`<path d="M5 5h12l2 2v12H5z"/><path d="M8 5v6h8V5"/><path d="M9 17h6"/>`),
  icondaoru: strokeIcon(`<path d="M12 4v11"/><path d="m7.5 9.5 4.5-4.5 4.5 4.5"/><path d="M5 19h14"/>`),
  iconexport: strokeIcon(`<path d="M12 20V9"/><path d="m16.5 13.5-4.5 4.5-4.5-4.5"/><path d="M5 5h14"/>`),
  iconzhuye: strokeIcon(`<path d="M4 10.5 12 4l8 6.5V20H4z"/><path d="M9 20v-6h6v6"/>`),
  iconjiantouyou: strokeIcon(`<path d="m9 6 6 6-6 6"/>`),
  iconzhuti: strokeIcon(`<path d="M12 3 14.4 8 20 10l-4 4 .9 5.5L12 17l-4.9 2.5L8 14 4 10l5.6-2Z"/>`),
  iconyangshi: strokeIcon(
    `<path d="m6 4 14 14"/><path d="M15 4h5v5"/><path d="M4 15v5h5"/><path d="m8 8 2.5-2.5"/><path d="m13.5 13.5 2.5-2.5"/>`
  ),
  iconjingzi: strokeIcon(`<path d="m12 3 7 4v10l-7 4-7-4V7z"/><path d="m5 7 7 4 7-4"/><path d="M12 11v10"/>`),
  iconjiegou: strokeIcon(
    `<rect x="10" y="4" width="4" height="4" rx="1"/><rect x="4" y="16" width="4" height="4" rx="1"/><rect x="10" y="16" width="4" height="4" rx="1"/><rect x="16" y="16" width="4" height="4" rx="1"/><path d="M12 8v4"/><path d="M6 16v-2h12v2"/>`
  ),
  'iconfuhao-dagangshu': strokeIcon(`<path d="M7 6h11"/><path d="M7 12h11"/><path d="M7 18h11"/><path d="M4 6h.01"/><path d="M4 12h.01"/><path d="M4 18h.01"/>`),
  iconshezhi: strokeIcon(
    `<circle cx="12" cy="12" r="2.5"/><path d="M19.4 15a1.8 1.8 0 0 0 .3 2l.1.1a2 2 0 0 1-2.8 2.8l-.1-.1a1.8 1.8 0 0 0-2-.3 1.8 1.8 0 0 0-1.1 1.7V21a2 2 0 0 1-4 0v-.1a1.8 1.8 0 0 0-1.1-1.7 1.8 1.8 0 0 0-2 .3l-.1.1a2 2 0 0 1-2.8-2.8l.1-.1a1.8 1.8 0 0 0 .3-2 1.8 1.8 0 0 0-1.7-1.1H3a2 2 0 0 1 0-4h.1a1.8 1.8 0 0 0 1.7-1.1 1.8 1.8 0 0 0-.3-2l-.1-.1A2 2 0 0 1 7.2 3.6l.1.1a1.8 1.8 0 0 0 2 .3A1.8 1.8 0 0 0 10.4 2.3V2a2 2 0 0 1 4 0v.1A1.8 1.8 0 0 0 15.6 4a1.8 1.8 0 0 0 2-.3l.1-.1a2 2 0 1 1 2.8 2.8l-.1.1a1.8 1.8 0 0 0-.3 2A1.8 1.8 0 0 0 21.8 9H22a2 2 0 0 1 0 4h-.1a1.8 1.8 0 0 0-1.7 1.1Z"/>`
  ),
  iconcontentleft: strokeIcon(`<rect x="4" y="6" width="6" height="12" rx="1.5"/><path d="M14 8h6"/><path d="M14 12h6"/><path d="M14 16h6"/>`),
  iconshanchuxian: glyphIcon(
    `<text x="12" y="16" font-size="13" text-anchor="middle" font-family="Arial, sans-serif" font-weight="700" fill="black">S</text><path d="M6 19h12" stroke="black" stroke-width="1.8" stroke-linecap="round"/>`
  ),
  iconzitijiacu: glyphIcon(
    `<text x="12" y="17" font-size="14" text-anchor="middle" font-family="Arial, sans-serif" font-weight="700" fill="black">B</text>`
  ),
  iconzitixieti: glyphIcon(
    `<text x="12" y="17" font-size="14" text-anchor="middle" font-family="Georgia, serif" font-style="italic" font-weight="700" fill="black">I</text>`
  ),
  iconzitixiahuaxian: glyphIcon(
    `<text x="12" y="15" font-size="13" text-anchor="middle" font-family="Arial, sans-serif" font-weight="700" fill="black">U</text><path d="M7 18h10" stroke="black" stroke-width="1.8" stroke-linecap="round"/>`
  ),
  'iconxingzhuang-wenzi': glyphIcon(
    `<text x="12" y="16" font-size="11" text-anchor="middle" font-family="Arial, sans-serif" font-weight="700" fill="black">Aa</text>`
  ),
  iconcase: glyphIcon(
    `<text x="12" y="17" font-size="14" text-anchor="middle" font-family="Arial, sans-serif" font-weight="700" fill="black">A</text>`
  ),
  iconzitiyanse: glyphIcon(
    `<text x="12" y="15" font-size="13" text-anchor="middle" font-family="Arial, sans-serif" font-weight="700" fill="black">A</text><path d="M7 18h10" stroke="black" stroke-width="2.4" stroke-linecap="round"/>`
  ),
  iconbeijingyanse: strokeIcon(
    `<path d="m6 16 7-7 5 5-7 7H6v-5Z"/><path d="m14 8 2-2 4 4-2 2"/>`
  ),
  iconjuzhongduiqi: strokeIcon(`<path d="M6 7h12"/><path d="M4 12h16"/><path d="M7 17h10"/>`),
  iconqingchu: strokeIcon(`<path d="m7 15 6-8 4 3-6 8H7Z"/><path d="M5 19h10"/>`),
  'edit-icon-more': strokeIcon(`<path d="M6 12h.01"/><path d="M12 12h.01"/><path d="M18 12h.01"/>`),
  'edit-icon-painter': strokeIcon(
    `<path d="M14 5h4l1 3-8 8-4 1 1-4 6-6Z"/><path d="M11 8 16 13"/><path d="M5 19h6"/>`
  ),
  icontouming: strokeIcon(`<circle cx="12" cy="12" r="8"/><path d="M6.5 17.5 17.5 6.5"/>`)
}

const EDIT_PAGE_UI_ICON_NAMES = Object.keys(EDIT_PAGE_UI_ICON_MAP)

const toMaskUrl = svg => {
  return `data:image/svg+xml,${encodeURIComponent(svg)}`
}

const buildEditPageIconCss = () => {
  const selectors = EDIT_PAGE_UI_ICON_NAMES.map(name => {
    return `body.edit-page .iconfont.${name}`
  }).join(',\n')
  const pseudoSelectors = EDIT_PAGE_UI_ICON_NAMES.map(name => {
    return `body.edit-page .iconfont.${name}::before`
  }).join(',\n')
  const iconRules = EDIT_PAGE_UI_ICON_NAMES.map(name => {
    const url = toMaskUrl(EDIT_PAGE_UI_ICON_MAP[name])
    return `body.edit-page .iconfont.${name}::before {\n  -webkit-mask-image: url("${url}");\n  mask-image: url("${url}");\n}`
  }).join('\n\n')
  return `${selectors} {\n  font-family: inherit !important;\n  font-size: inherit !important;\n  font-style: normal;\n  line-height: 1;\n  display: inline-flex;\n  align-items: center;\n  justify-content: center;\n  vertical-align: middle;\n  flex-shrink: 0;\n}\n\n${pseudoSelectors} {\n  content: '' !important;\n  display: block;\n  width: 2em;\n  height: 2em;\n  background-color: currentColor;\n  -webkit-mask-position: center;\n  -webkit-mask-size: contain;\n  -webkit-mask-repeat: no-repeat;\n  mask-position: center;\n  mask-size: contain;\n  mask-repeat: no-repeat;\n}\n\n${iconRules}`
}

const ensureEditPageIconStyles = () => {
  if (typeof document === 'undefined') return
  let styleEl = document.getElementById(EDIT_PAGE_UI_ICON_STYLE_ID)
  if (!styleEl) {
    styleEl = document.createElement('style')
    styleEl.id = EDIT_PAGE_UI_ICON_STYLE_ID
    document.head.appendChild(styleEl)
  }
  if (!styleEl.textContent) {
    styleEl.textContent = buildEditPageIconCss()
  }
}

export default {
  components: {
    Toolbar,
    Edit,
    ExportDialog
  },
  data() {
    return {
      show: false
    }
  },
  computed: {
    ...mapState(useSettingsStore, {
      localConfig: 'localConfig'
    }),
    ...mapState(useThemeStore, {
      isDark: 'isDark'
    }),
    ...mapState(useAppStore, {
      activeSidebar: 'activeSidebar'
    }),
    isZenMode() {
      return this.localConfig.isZenMode
    },
    isExportRoute() {
      return this.$route.path === '/export'
    }
  },
  watch: {
    isDark() {
      this.setBodyDark()
    }
  },
  created() {
    this.show = true
    this.setBodyDark()
    this.setBodyEditPage(true)
    ensureEditPageIconStyles()
  },
  beforeUnmount() {
    this.setBodyEditPage(false)
  },
  methods: {
    setBodyDark() {
      this.isDark
        ? document.body.classList.add('isDark')
        : document.body.classList.remove('isDark')
    },
    setBodyEditPage(value) {
      if (value) {
        document.body.classList.add('edit-page')
        return
      }
      document.body.classList.remove('edit-page')
    }
  }
}
</script>

<style lang="less">
.container {
}

body {
  .el-select__wrapper {
    background-color: #fff;
    color: rgba(26, 26, 26, 0.9);
    box-shadow: 0 0 0 1px #dcdfe6 inset;
  }

  .el-select__selection,
  .el-select__selected-item,
  .el-select__placeholder,
  .el-select__input,
  .el-select__caret,
  .el-select__prefix,
  .el-select__suffix,
  .el-select-dropdown__item {
    color: rgba(26, 26, 26, 0.9);
  }

  .el-select__placeholder.is-transparent {
    color: #909399;
  }

  .el-select-dropdown__item.is-hovering,
  .el-select-dropdown__item.hover,
  .el-select-dropdown__item:hover {
    background-color: #f5f7fa;
  }

  .el-select-dropdown__item.is-selected,
  .el-select-dropdown__item.selected {
    color: #409eff;
    font-weight: 600;
  }

  .el-select__popper.el-popper {
    background-color: #fff;
    border-color: #dcdfe6;
  }

  .el-color-picker__trigger {
    background-color: #fff;
    border-color: #dcdfe6;
  }

  .el-color-picker__color {
    border-color: rgba(26, 26, 26, 0.18);
  }

  .el-select-dropdown,
  .el-popper {
    z-index: 2000 !important;
  }

  &.isDark {
    /* el-button */
    .el-button {
      background-color: #363b3f;
      color: hsla(0, 0%, 100%, 0.9);
      border-color: hsla(0, 0%, 100%, 0.1);
    }

    /* el-input */
    .el-input__inner {
      background-color: #363b3f;
      border-color: hsla(0, 0%, 100%, 0.1);
      color: hsla(0, 0%, 100%, 0.9);
    }

    .el-input.is-disabled .el-input__inner {
      background-color: #363b3f;
      border-color: hsla(0, 0%, 100%, 0.1);
      color: hsla(0, 0%, 100%, 0.3);
    }

    .el-input-group__append,
    .el-input-group__prepend {
      background-color: #363b3f;
      border-color: hsla(0, 0%, 100%, 0.1);
    }

    .el-input-group__append button.el-button {
      color: hsla(0, 0%, 100%, 0.9);
    }

    /* el-select */
    .el-select__wrapper {
      background-color: #36393d;
      color: hsla(0, 0%, 100%, 0.9);
      box-shadow: 0 0 0 1px hsla(0, 0%, 100%, 0.1) inset;
    }

    .el-select__selection,
    .el-select__selected-item,
    .el-select__placeholder,
    .el-select__input,
    .el-select__caret,
    .el-select__prefix,
    .el-select__suffix {
      color: hsla(0, 0%, 100%, 0.9);
    }

    .el-select__placeholder.is-transparent {
      color: hsla(0, 0%, 100%, 0.45);
    }

    .el-select__popper.el-popper,
    .el-select-dropdown {
      background-color: #36393d;
      border-color: hsla(0, 0%, 100%, 0.1);

      .el-select-dropdown__item {
        color: hsla(0, 0%, 100%, 0.78);
      }

      .el-select-dropdown__item.is-selected,
      .el-select-dropdown__item.selected {
        color: #409eff;
      }

      .el-select-dropdown__item.is-hovering,
      .el-select-dropdown__item.hover,
      .el-select-dropdown__item:hover {
        background-color: hsla(0, 0%, 100%, 0.05);
      }
    }

    .el-select .el-input.is-disabled .el-input__inner:hover {
      border-color: hsla(0, 0%, 100%, 0.1);
    }

    .el-color-picker__trigger {
      background-color: #36393d;
      border-color: hsla(0, 0%, 100%, 0.12);
    }

    .el-color-picker__color {
      border-color: hsla(0, 0%, 100%, 0.2);
    }

    .el-color-picker .el-color-picker__empty {
      color: hsla(0, 0%, 100%, 0.72);
    }

    /* el-popper*/
    .el-popper {
      background-color: #36393d;
      border-color: hsla(0, 0%, 100%, 0.1);
    }

    .el-popper[x-placement^='bottom'] .popper__arrow {
      background-color: #36393d;
    }

    .el-popper[x-placement^='bottom'] .popper__arrow::after {
      border-bottom-color: #36393d;
    }

    .el-popper[x-placement^='top'] .popper__arrow {
      background-color: #36393d;
    }

    .el-popper[x-placement^='top'] .popper__arrow::after {
      border-top-color: #36393d;
    }

    /* el-tabs */
    .el-tabs__item {
      color: hsla(0, 0%, 100%, 0.6);

      &:hover,
      &.is-active {
        color: #409eff;
      }
    }

    .el-tabs__nav-wrap::after {
      background-color: hsla(0, 0%, 100%, 0.6);
    }

    /* el-slider */
    .el-slider__runway {
      background-color: hsla(0, 0%, 100%, 0.6);
    }

    /* el-radio-group */
    .el-radio-group {
      .el-radio-button__inner {
        background-color: #36393d;
        color: hsla(0, 0%, 100%, 0.6);
      }

      .el-radio-button__orig-radio:checked + .el-radio-button__inner {
        color: #fff;
        background-color: #409eff;
      }
    }

    /* el-dialog */
    .el-dialog {
      background-color: #262a2e;

      .el-dialog__header {
        border-bottom: 1px solid hsla(0, 0%, 100%, 0.1);
      }

      .el-dialog__title {
        color: hsla(0, 0%, 100%, 0.9);
      }

      .el-dialog__body {
        background-color: #262a2e;
      }

      .el-dialog__footer {
        border-top: 1px solid hsla(0, 0%, 100%, 0.1);
      }
    }

    /* el-upload */
    .el-upload__tip {
      color: #999;
    }

    /* 富文本编辑器 */
    .toastui-editor-main-container {
      background-color: #fff;
    }
  }

  &.edit-page.isDark {
    :where(
      .toolbar,
      .toolbar .text,
      .navigatorContainer,
      .navigatorContainer .item a,
      .sidebarContainer,
      .sidebarContainer .sidebarContent,
      .sidebarTriggerContainer,
      .sidebarTriggerContainer .triggerName,
      .searchContainer,
      .searchContainer .searchInfo,
      .searchContainer .searchResultItem,
      .searchContainer .empty .text,
      .searchContainer .emptyTitle,
      .searchContainer .emptyDesc,
      .searchContainer .emptyTip,
      .richTextToolbar,
      .fontOptionsList .fontOptionItem,
      .nodeTagStyleContainer,
      .nodeTagStyleContainer .text,
      .outlineEditContainer,
      .outlineEditContainer .btn,
      .outlineEditContainer .customNode,
      .aiChatBox,
      .aiChatBox .statusText,
      .aiChatBox .content,
      .panelHeader,
      .panelBody,
      .title,
      .name,
      .text,
      .value,
      p,
      label,
      .el-checkbox__label,
      .el-radio__label,
      .el-dialog__title,
      .el-button span,
      .el-dropdown-menu__item,
      .el-message-box__title,
      .el-message-box__message
    ) {
      color: rgba(255, 255, 255, 0.96) !important;
    }

    .toolbarContainer {
      --toolbar-subtle-text-color: rgba(255, 255, 255, 0.92);
      --toolbar-text-color: rgba(255, 255, 255, 0.96);
      --toolbar-text-hover-color: #fff;
      --toolbar-disabled-color: rgba(255, 255, 255, 0.48);
    }

    .navigatorContainer {
      --navigator-text: rgba(255, 255, 255, 0.92);
      --navigator-text-strong: #fff;
    }
  }
}
</style>
