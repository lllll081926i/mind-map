<template>
  <div class="exportPage" :class="{ isDark: isDark }">
    <div class="exportOverlay" @click.self="onMaskClick">
      <section class="exportDialog">
        <header class="dialogHeader">
          <div class="dialogHeaderMain">
            <div class="dialogEyebrow">{{ $t('exportPage.eyebrow') }}</div>
            <h1>{{ $t('exportPage.title') }}</h1>
            <p>{{ $t('exportPage.description') }}</p>
          </div>
          <div class="dialogHeaderActions">
            <button
              type="button"
              class="headerActionBtn"
              :aria-label="$t('exportPage.backHome')"
              @click="goHome"
            >
              {{ $t('exportPage.backHome') }}
            </button>
            <button
              type="button"
              class="headerActionBtn primary"
              :aria-label="$t('exportPage.backEdit')"
              @click="goEdit"
            >
              {{ $t('exportPage.backEdit') }}
            </button>
          </div>
          <button
            type="button"
            class="dialogCloseBtn"
            :aria-label="$t('dialog.close')"
            @click="closeDialog"
          >
            ×
          </button>
        </header>

        <div class="dialogBody">
          <aside class="formatRail">
            <button
              v-for="item in exportFormats"
              :key="item.type"
              type="button"
              class="formatNavItem"
              :aria-pressed="exportState.exportType === item.type"
              :aria-label="item.displayName"
              :class="{
                active: exportState.exportType === item.type,
                disabled: item.disabled
              }"
              @click="selectFormat(item)"
            >
              <span class="formatMarker">{{ item.displayName.slice(0, 2) }}</span>
              <span class="formatNavLabel">{{ item.displayName }}</span>
              <span
                v-if="exportState.exportType === item.type && !item.disabled"
                class="formatSelected"
                aria-hidden="true"
              >
                ✓
              </span>
              <span v-if="item.disabled" class="formatHint">{{
                $t('exportPage.upcoming')
              }}</span>
            </button>
          </aside>

          <main class="dialogContent" v-loading="previewLoading">
            <div class="contentShell">
              <section class="contentMain">
                <div class="contentHeader">
                  <strong>{{ currentFormat.displayName }}</strong>
                  <span class="contentExt">.{{ currentFileExtension }}</span>
                </div>
                <div class="formRow">
                  <label class="formLabel" for="exportFileName">{{
                    $t('exportPage.fileName')
                  }}</label>
                  <div class="formValue">
                    <el-input
                      id="exportFileName"
                      v-model="exportState.fileName"
                      maxlength="80"
                      @keydown.stop
                    />
                    <div class="fileSuffix">.{{ currentFileExtension }}</div>
                  </div>
                </div>

                <div class="formRow">
                  <span class="formLabel">{{ $t('exportPage.descriptionLabel') }}</span>
                  <div class="formValue">
                    <div class="descBadge">{{ currentFormat.desc }}</div>
                  </div>
                </div>

                <div class="formRow optionGroupRow">
                  <span class="formLabel">{{ $t('exportPage.optionsLabel') }}</span>
                  <div class="formValue optionGroup">
                    <div v-if="isDisabledFormat" class="emptyOption">
                      {{ $t('exportPage.disabledTip') }}
                    </div>

                    <template v-else>
                      <div class="optionInlineRow" v-if="showConfigOption">
                        <span class="optionName">{{ $t('exportPage.includeConfig') }}</span>
                        <el-switch v-model="exportState.withConfig" />
                      </div>

                      <div class="optionInlineRow" v-if="showImageOptions">
                        <span class="optionName">{{ $t('exportPage.imageFormat') }}</span>
                        <el-radio-group v-model="exportState.imageFormat">
                          <el-radio value="png">PNG</el-radio>
                          <el-radio value="jpg">JPG</el-radio>
                        </el-radio-group>
                      </div>

                      <div class="optionInlineRow" v-if="showPaddingOptions">
                        <span class="optionName">{{ $t('exportPage.paddingX') }}</span>
                        <el-input-number
                          v-model="exportState.paddingX"
                          :min="0"
                          :max="500"
                        />
                      </div>

                      <div class="optionInlineRow" v-if="showPaddingOptions">
                        <span class="optionName">{{ $t('exportPage.paddingY') }}</span>
                        <el-input-number
                          v-model="exportState.paddingY"
                          :min="0"
                          :max="500"
                        />
                      </div>

                      <div class="optionInlineRow" v-if="showFooterOption">
                        <span class="optionName">{{ $t('exportPage.extraText') }}</span>
                        <el-input
                          v-model="exportState.extraText"
                          :placeholder="$t('exportPage.extraTextPlaceholder')"
                          @keydown.stop
                        />
                      </div>

                      <div class="optionInlineRow" v-if="showTransparentOption">
                        <span class="optionName">{{ $t('exportPage.transparentBg') }}</span>
                        <el-switch v-model="exportState.isTransparent" />
                      </div>

                      <div class="optionInlineRow" v-if="showFitBgOption">
                        <span class="optionName">{{ $t('exportPage.fitBg') }}</span>
                        <el-switch v-model="exportState.isFitBg" />
                      </div>

                      <div v-if="!hasVisibleOptions" class="emptyOption">
                        {{ $t('exportPage.noExtraOptions') }}
                      </div>
                    </template>
                  </div>
                </div>
              </section>

              <aside class="previewPanel">
                <div class="previewPanelHeader">
                  <strong>{{ $t('exportPage.preview') }}</strong>
                  <span>{{ $t('exportPage.previewDesc') }}</span>
                </div>
                <div class="previewSurface">
                  <div ref="previewRef" class="previewCanvas"></div>
                </div>
              </aside>
            </div>
          </main>
        </div>

        <footer class="dialogFooter">
          <div class="statusText">
            {{ statusText }}
          </div>
          <el-button :disabled="exporting" @click="goEdit">{{
            $t('search.cancel')
          }}</el-button>
          <el-button
            type="primary"
            :loading="exporting"
            :disabled="isDisabledFormat || !mindMap"
            @click="handleExport"
          >
            {{ $t('exportPage.export') }}
          </el-button>
        </footer>
      </section>

    </div>
  </div>
</template>

<script>
import { mapState } from 'pinia'
import { getConfig, getData } from '@/api'
import { ensureBootstrapDocumentState } from '@/platform'
import { getCurrentFileRef } from '@/services/documentSession'
import { createWorkspaceTemplateData } from '@/services/workspaceActions'
import { useSettingsStore } from '@/stores/settings'
import { useThemeStore } from '@/stores/theme'
import {
  createExportStateFromFileRef,
  getDesktopExportFormats,
  getResolvedExportType,
  isExportFormatDisabled,
  resolveExportContext
} from '@/services/exportState'
import defaultNodeImage from '@/assets/img/图片加载失败.svg'

let exportPluginsPromise = null
let richTextPluginsPromise = null
let mindMapRuntimePromise = null
let extendedIconListPromise = null
const BUILTIN_NODE_ICON_TYPES = ['expression', 'priority', 'progress', 'sign']

const FORMAT_NAME_KEY_MAP = {
  smm: 'smm',
  png: 'png',
  svg: 'svg',
  pdf: 'pdf',
  'pdf-hd': 'pdfHd',
  md: 'md',
  xmind: 'xmind',
  txt: 'txt',
  json: 'json',
  html: 'html',
  word: 'word'
}

const getFormatDisplayName = (t, type) => {
  const key = FORMAT_NAME_KEY_MAP[type]
  return key ? t(`exportPage.formatNames.${key}`) : type
}

const createFallbackExportFormat = t => ({
  name: t('exportPage.fallbackFormat.name'),
  type: 'smm',
  desc: t('exportPage.fallbackFormat.desc'),
  displayName: t('exportPage.fallbackFormat.displayName')
})

const createFallbackData = () => createWorkspaceTemplateData()

const normalizeMindMapData = data => {
  if (
    data &&
    typeof data === 'object' &&
    data.root &&
    data.theme &&
    typeof data.theme === 'object'
  ) {
    return data
  }
  return createFallbackData()
}

const loadExtendedIconList = async () => {
  if (!extendedIconListPromise) {
    extendedIconListPromise = import('@/config/icon').then(module => {
      return Array.isArray(module.default) ? module.default : []
    })
  }
  return extendedIconListPromise
}

const hasExtendedNodeIcons = data => {
  const visit = node => {
    if (!node || typeof node !== 'object') return false
    const nodeIcons = Array.isArray(node.data?.icon) ? node.data.icon : []
    if (
      nodeIcons.some(item => {
        const [type = ''] = String(item || '').split('_')
        return type && !BUILTIN_NODE_ICON_TYPES.includes(type)
      })
    ) {
      return true
    }
    const children = Array.isArray(node.children) ? node.children : []
    return children.some(child => visit(child))
  }
  return visit(data?.root || data)
}

const hasRichTextNodes = data => {
  const visit = node => {
    if (!node || typeof node !== 'object') return false
    if (node.data?.richText) {
      return true
    }
    const children = Array.isArray(node.children) ? node.children : []
    return children.some(child => visit(child))
  }
  return visit(data?.root || data)
}

const loadMindMapRuntime = async () => {
  if (!mindMapRuntimePromise) {
    mindMapRuntimePromise = Promise.all([
      import('simple-mind-map'),
      import('simple-mind-map-plugin-themes')
    ]).then(([mindMapModule, themesModule]) => {
      const MindMap = mindMapModule.default
      const Themes = themesModule.default
      Themes.init(MindMap)
      if (typeof MoreThemes !== 'undefined') {
        MoreThemes.init(MindMap)
      }
      return {
        MindMap
      }
    })
  }
  return mindMapRuntimePromise
}

const loadExportPlugins = async () => {
  if (!exportPluginsPromise) {
    exportPluginsPromise = Promise.all([
      import('simple-mind-map/src/plugins/ExportPDF.js'),
      import('simple-mind-map/src/plugins/ExportXMind.js'),
      import('simple-mind-map/src/plugins/Export.js')
    ]).then(([exportPdfModule, exportXMindModule, exportModule]) => ({
      ExportPDF: exportPdfModule.default,
      ExportXMind: exportXMindModule.default,
      Export: exportModule.default
    }))
  }
  return exportPluginsPromise
}

const loadRichTextPlugins = async () => {
  if (!richTextPluginsPromise) {
    richTextPluginsPromise = Promise.all([
      import('simple-mind-map/src/plugins/RichText.js'),
      import('simple-mind-map/src/plugins/Formula.js')
    ]).then(([richTextModule, formulaModule]) => ({
      RichText: richTextModule.default,
      Formula: formulaModule.default
    }))
  }
  return richTextPluginsPromise
}

export default {
  data() {
    const exportContext = resolveExportContext(getCurrentFileRef())
    const exportFormats = getDesktopExportFormats().map(item => ({
      ...item,
      displayName: getFormatDisplayName(this.$t, item.type)
    }))
    const fallbackExportFormat = createFallbackExportFormat(this.$t)
    return {
      previewLoading: true,
      exporting: false,
      mindMap: null,
      exportPluginsInstalled: false,
      extendedIconList: [],
      exportContext,
      exportState: createExportStateFromFileRef(exportContext.fileRef),
      exportFormats: exportFormats.length ? exportFormats : [fallbackExportFormat],
      boundExportKeydown: null,
      boundPreviewResize: null
    }
  },
  computed: {
    ...mapState(useThemeStore, {
      isDark: 'isDark'
    }),
    ...mapState(useSettingsStore, {
      localConfig: 'localConfig'
    }),
    currentFormat() {
      return (
        this.exportFormats.find(item => item.type === this.exportState.exportType) ||
        this.exportFormats[0] ||
        createFallbackExportFormat(this.$t)
      )
    },
    isDisabledFormat() {
      return isExportFormatDisabled(this.exportState.exportType)
    },
    currentFileExtension() {
      if (this.exportState.exportType === 'png') {
        return this.exportState.imageFormat
      }
      return getResolvedExportType(this.exportState.exportType)
    },
    showConfigOption() {
      return ['smm', 'json'].includes(this.exportState.exportType)
    },
    showImageOptions() {
      return this.exportState.exportType === 'png'
    },
    showPaddingOptions() {
      return ['png', 'svg', 'pdf', 'pdf-hd'].includes(this.exportState.exportType)
    },
    showFooterOption() {
      return ['png', 'svg', 'pdf', 'pdf-hd'].includes(this.exportState.exportType)
    },
    showTransparentOption() {
      return ['png', 'pdf', 'pdf-hd'].includes(this.exportState.exportType)
    },
    showFitBgOption() {
      return (
        ['png', 'pdf', 'pdf-hd'].includes(this.exportState.exportType) &&
        !this.exportState.isTransparent
      )
    },
    hasVisibleOptions() {
      return [
        this.showConfigOption,
        this.showImageOptions,
        this.showPaddingOptions,
        this.showFooterOption,
        this.showTransparentOption,
        this.showFitBgOption
      ].some(Boolean)
    },
    statusText() {
      if (this.isDisabledFormat) {
        return this.$t('exportPage.statusDisabled')
      }
      if (this.exporting) {
        return this.$t('exportPage.statusPreparing')
      }
      return this.$t('exportPage.statusReady', {
        extension: this.currentFileExtension
      })
    }
  },
  async mounted() {
    this.bindExportKeydown()
    this.bindPreviewResize()
    await ensureBootstrapDocumentState()
    await this.initPreview()
  },
  beforeUnmount() {
    this.unbindExportKeydown()
    this.unbindPreviewResize()
    if (this.mindMap) {
      this.mindMap.destroy()
    }
  },
  methods: {
    onMaskClick() {
      if (this.exporting) {
        return
      }
      this.closeDialog()
    },

    async closeDialog() {
      if (this.exporting) {
        return
      }
      await this.goEdit()
    },

    onKeydown(event) {
      if (this.exporting) {
        return
      }
      if (event.key !== 'Escape') {
        return
      }
      event.preventDefault()
      this.closeDialog()
    },

    bindExportKeydown() {
      if (typeof window === 'undefined' || this.boundExportKeydown) {
        return
      }
      this.boundExportKeydown = event => this.onKeydown(event)
      window.addEventListener('keydown', this.boundExportKeydown)
    },

    unbindExportKeydown() {
      if (typeof window === 'undefined' || !this.boundExportKeydown) {
        return
      }
      window.removeEventListener('keydown', this.boundExportKeydown)
      this.boundExportKeydown = null
    },

    bindPreviewResize() {
      if (typeof window === 'undefined' || this.boundPreviewResize) {
        return
      }
      this.boundPreviewResize = () => this.syncPreviewViewport()
      window.addEventListener('resize', this.boundPreviewResize)
    },

    unbindPreviewResize() {
      if (typeof window === 'undefined' || !this.boundPreviewResize) {
        return
      }
      window.removeEventListener('resize', this.boundPreviewResize)
      this.boundPreviewResize = null
    },

    syncPreviewViewport() {
      if (!this.mindMap) {
        return
      }
      this.$nextTick(() => {
        if (!this.mindMap) {
          return
        }
        if (typeof this.mindMap.emit === 'function') {
          this.mindMap.emit('resize')
        }
        if (this.mindMap.view && typeof this.mindMap.view.fit === 'function') {
          this.mindMap.view.fit()
        }
      })
    },

    selectFormat(item) {
      this.exportState.exportType = item.type
    },

    async goHome() {
      await this.$router.push('/home')
    },

    async goEdit() {
      await this.$router.push('/edit')
    },

    createFooterContent() {
      const text = String(this.exportState.extraText || '').trim()
      if (!text) return null
      const el = document.createElement('div')
      el.className = 'footer'
      el.textContent = text
      const cssText = `
        .footer {
          width: 100%;
          height: 30px;
          display: flex;
          justify-content: center;
          align-items: center;
          font-size: 12px;
          color: #64748b;
        }
      `
      return {
        el,
        cssText,
        height: 30
      }
    },

    async initPreview() {
      this.previewLoading = true
      try {
        await this.$nextTick()
        if (!this.$refs.previewRef) {
          throw new Error(this.$t('exportPage.previewContainerMissing'))
        }
        const { MindMap } = await loadMindMapRuntime()
        const fullData = normalizeMindMapData(getData())
        if (hasExtendedNodeIcons(fullData)) {
          this.extendedIconList = await loadExtendedIconList()
        }
        const { root, layout, theme, view } = fullData
        const config = getConfig() || {}
        const fallbackData = createFallbackData()
        this.mindMap = new MindMap({
          el: this.$refs.previewRef,
          data: root,
          fit: true,
          layout,
          theme: theme?.template || fallbackData.theme.template,
          themeConfig: theme?.config || fallbackData.theme.config,
          viewData: view,
          customInnerElsAppendTo: null,
          iconList: [...this.extendedIconList],
          defaultNodeImage,
          addContentToFooter: () => this.createFooterContent(),
          ...(config || {})
        })
        if (hasRichTextNodes(fullData)) {
          const { RichText, Formula } = await loadRichTextPlugins()
          this.mindMap.addPlugin(RichText)
          this.mindMap.addPlugin(Formula)
        }
        this.syncPreviewViewport()
      } catch (error) {
        console.error('init export preview failed', error)
        this.$message.error(this.$t('exportPage.previewInitFailed'))
      } finally {
        this.previewLoading = false
      }
    },

    async ensureExportPluginsInstalled() {
      if (!this.mindMap || this.exportPluginsInstalled) return
      const { ExportPDF, ExportXMind, Export } = await loadExportPlugins()
      this.mindMap.addPlugin(ExportPDF)
      this.mindMap.addPlugin(ExportXMind)
      this.mindMap.addPlugin(Export)
      this.exportPluginsInstalled = true
    },

    async handleExport() {
      if (!this.mindMap || this.isDisabledFormat || this.exporting) {
        return
      }
      const safeFileName =
        String(this.exportState.fileName || '').trim() ||
        this.$t('exportPage.fallbackFileName')
      const resolvedType =
        this.exportState.exportType === 'png'
          ? this.exportState.imageFormat
          : getResolvedExportType(this.exportState.exportType)
      this.exporting = true
      try {
        await this.ensureExportPluginsInstalled()
        this.mindMap.updateConfig({
          exportPaddingX: Number(this.exportState.paddingX) || 0,
          exportPaddingY: Number(this.exportState.paddingY) || 0
        })
        if (['smm', 'json'].includes(this.exportState.exportType)) {
          await this.mindMap.export(
            resolvedType,
            true,
            safeFileName,
            this.exportState.withConfig
          )
        } else if (['png', 'jpg'].includes(resolvedType)) {
          await this.mindMap.export(
            resolvedType,
            true,
            safeFileName,
            this.exportState.isTransparent,
            null,
            this.exportState.isFitBg
          )
        } else if (resolvedType === 'svg') {
          await this.mindMap.export(
            resolvedType,
            true,
            safeFileName,
            `* {
              margin: 0;
              padding: 0;
              box-sizing: border-box;
            }`
          )
        } else if (resolvedType === 'pdf') {
          await this.mindMap.export(
            resolvedType,
            true,
            safeFileName,
            this.exportState.isTransparent,
            this.exportState.isFitBg
          )
        } else {
          await this.mindMap.export(resolvedType, true, safeFileName)
        }
        this.$notify.success({
          title: this.$t('exportPage.exportDoneTitle'),
          message: this.$t('exportPage.exportDoneMessage', {
            extension: this.currentFileExtension
          })
        })
      } catch (error) {
        console.error('export failed', error)
        this.$message.error(error?.message || this.$t('exportPage.exportFailed'))
      } finally {
        this.exporting = false
      }
    }
  }
}
</script>

<style lang="less" scoped>
.exportPage {
  position: fixed;
  inset: 0;
  z-index: 4000;
  background: transparent;
  color: rgba(26, 26, 26, 0.88);

  &.isDark {
    color: hsla(0, 0%, 100%, 0.86);

    .exportDialog,
    .formatRail,
    .dialogContent,
    .formatNavItem,
    .descBadge,
    .optionGroup,
    .dialogFooter {
      background: #2b2f36;
      border-color: hsla(0, 0%, 100%, 0.08);
      color: inherit;
    }

    .dialogHeader p,
    .optionName,
    .statusText,
    .emptyOption,
    .formLabel {
      color: hsla(0, 0%, 100%, 0.56);
    }

    .headerActionBtn {
      background: #363b3f;
      border-color: hsla(0, 0%, 100%, 0.1);
      color: inherit;
    }

    .formatNavItem.active {
      background: rgba(64, 158, 255, 0.14);
      border-color: rgba(64, 158, 255, 0.32);
    }

    .contentExt,
    .formatMarker,
    .descBadge {
      background: rgba(64, 158, 255, 0.14);
      border-color: rgba(64, 158, 255, 0.28);
    }

    .contentMain,
    .previewPanel,
    .previewSurface {
      background: #23272e;
      border-color: hsla(0, 0%, 100%, 0.08);
    }

    .previewPanelHeader span {
      color: hsla(0, 0%, 100%, 0.56);
    }

    .fileSuffix {
      background: rgba(255, 255, 255, 0.04);
      border-color: hsla(0, 0%, 100%, 0.08);
      color: hsla(0, 0%, 100%, 0.56);
    }
  }
}

.exportOverlay {
  width: 100%;
  height: 100%;
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 24px;
  background: rgba(15, 23, 42, 0.22);
  backdrop-filter: blur(12px);
}

.exportDialog {
  width: min(1020px, calc(100% - 120px));
  min-height: min(660px, calc(100vh - 120px));
  display: flex;
  flex-direction: column;
  background: #fff;
  border-radius: 12px;
  border: 1px solid rgba(0, 0, 0, 0.06);
  box-shadow: 0 22px 60px rgba(15, 23, 42, 0.18);
  overflow: hidden;
}

.dialogHeader {
  display: flex;
  align-items: flex-start;
  justify-content: space-between;
  gap: 20px;
  padding: 18px 22px 12px;
  border-bottom: 1px solid rgba(0, 0, 0, 0.06);
  position: relative;
}

.dialogHeaderMain {
  min-width: 0;

  h1 {
    margin: 2px 0 4px;
    font-size: 18px;
    line-height: 1.2;
    font-weight: 700;
  }

  p {
    max-width: 620px;
    font-size: 12px;
    line-height: 1.5;
    color: rgba(26, 26, 26, 0.56);
  }
}

.dialogEyebrow {
  font-size: 12px;
  font-weight: 700;
  letter-spacing: 0.08em;
  color: #409eff;
  text-transform: uppercase;
}

.dialogHeaderActions {
  display: flex;
  align-items: center;
  gap: 12px;
}

.dialogCloseBtn {
  position: absolute;
  top: 14px;
  right: 14px;
  width: 32px;
  height: 32px;
  border: none;
  background: transparent;
  font-size: 18px;
  line-height: 1;
  cursor: pointer;
  color: inherit;
  padding: 0;
  border-radius: 50%;
  transition: background 0.2s ease;

  &:hover {
    background: rgba(0, 0, 0, 0.05);
  }
}

.headerActionBtn {
  height: 36px;
  padding: 0 14px;
  border-radius: 6px;
  border: 1px solid rgba(0, 0, 0, 0.08);
  background: #fff;
  cursor: pointer;
  color: inherit;

  &.primary {
    background: #409eff;
    border-color: #409eff;
    color: #fff;
  }
}

.dialogBody {
  flex: 1;
  min-height: 0;
  display: grid;
  grid-template-columns: 198px minmax(0, 1fr);
}

.formatRail {
  padding: 10px 8px 10px 10px;
  border-right: 1px solid rgba(0, 0, 0, 0.06);
  background: #f7f8fa;
  overflow-y: auto;
  display: flex;
  flex-direction: column;
  gap: 6px;
}

.formatNavItem {
  display: flex;
  align-items: center;
  gap: 12px;
  width: 100%;
  min-height: 48px;
  padding: 9px 12px;
  border: 1px solid transparent;
  border-radius: 8px;
  background: transparent;
  text-align: left;
  cursor: pointer;
  transition: background-color 0.2s ease, border-color 0.2s ease;

  &.active {
    background: #fff;
    border-color: rgba(64, 158, 255, 0.2);
  }

  &.disabled {
    opacity: 0.64;
  }
}

.formatMarker {
  width: 28px;
  height: 28px;
  flex-shrink: 0;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  border-radius: 8px;
  background: rgba(64, 158, 255, 0.12);
  color: #409eff;
  font-size: 12px;
  font-weight: 700;
}

.formatNavLabel {
  flex: 1;
  min-width: 0;
  font-size: 14px;
  font-weight: 600;
}

.formatSelected {
  font-size: 16px;
  line-height: 1;
  color: #409eff;
}

.formatHint {
  font-size: 12px;
  color: #409eff;
}

.dialogContent {
  min-width: 0;
  padding: 14px 24px 18px;
  overflow-y: auto;
}

.contentShell {
  min-height: 100%;
  display: grid;
  grid-template-columns: minmax(0, 420px) minmax(0, 1fr);
  gap: 18px;
}

.contentMain,
.previewPanel {
  min-width: 0;
  border: 1px solid rgba(0, 0, 0, 0.06);
  border-radius: 10px;
  background: #fbfcfe;
}

.contentMain {
  padding: 18px 18px 8px;
}

.contentHeader {
  display: flex;
  align-items: center;
  gap: 12px;
  padding-bottom: 12px;
  border-bottom: 1px solid rgba(0, 0, 0, 0.05);

  strong {
    font-size: 16px;
    font-weight: 700;
  }
}

.contentExt {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  min-width: 58px;
  height: 28px;
  padding: 0 10px;
  border-radius: 6px;
  background: rgba(64, 158, 255, 0.08);
  border: 1px solid rgba(64, 158, 255, 0.18);
  color: #409eff;
  font-size: 12px;
  font-weight: 700;
}

.formRow {
  display: flex;
  align-items: center;
  gap: 20px;
  padding: 14px 0;
  border-bottom: 1px solid rgba(0, 0, 0, 0.05);
}

.optionGroupRow {
  align-items: flex-start;
}

.formLabel {
  width: 120px;
  flex-shrink: 0;
  padding-top: 6px;
  font-size: 13px;
  font-weight: 600;
  color: rgba(26, 26, 26, 0.68);
}

.formValue {
  flex: 1;
  min-width: 0;
}

.descBadge {
  display: inline-flex;
  align-items: center;
  min-height: 34px;
  max-width: 100%;
  padding: 0 12px;
  border-radius: 6px;
  border: 1px solid rgba(64, 158, 255, 0.28);
  background: rgba(64, 158, 255, 0.08);
  color: #409eff;
  font-size: 13px;
  line-height: 1.5;
}

.formValue {
  display: flex;
  align-items: center;
  gap: 10px;
}

.fileSuffix {
  flex-shrink: 0;
  min-width: 58px;
  height: 36px;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  border-radius: 6px;
  background: #f5f7fa;
  border: 1px solid rgba(0, 0, 0, 0.06);
  color: rgba(26, 26, 26, 0.56);
  font-size: 13px;
}

.optionGroup {
  display: flex;
  flex-direction: column;
  gap: 10px;
}

.optionInlineRow {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 20px;
  min-height: 36px;
}

.optionName {
  font-size: 13px;
  color: rgba(26, 26, 26, 0.68);
}

.emptyOption {
  font-size: 13px;
  color: rgba(26, 26, 26, 0.48);
}

.dialogFooter {
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 12px 22px;
  border-top: 1px solid rgba(0, 0, 0, 0.06);
  background: #fff;
}

.statusText {
  margin-right: auto;
  font-size: 13px;
  color: rgba(26, 26, 26, 0.56);
}

.previewPanel {
  display: flex;
  flex-direction: column;
  padding: 14px;
  gap: 12px;
}

.previewPanelHeader {
  display: flex;
  flex-direction: column;
  gap: 4px;

  strong {
    font-size: 14px;
    font-weight: 700;
  }

  span {
    font-size: 12px;
    line-height: 1.5;
    color: rgba(26, 26, 26, 0.56);
  }
}

.previewSurface {
  flex: 1;
  min-height: 420px;
  border-radius: 10px;
  border: 1px solid rgba(0, 0, 0, 0.06);
  background:
    linear-gradient(180deg, rgba(255, 255, 255, 0.98), rgba(247, 249, 252, 0.98));
  overflow: hidden;
  box-shadow: inset 0 1px 0 rgba(255, 255, 255, 0.8);
}

.previewCanvas {
  width: 100%;
  height: 100%;
  pointer-events: none;
}

:deep(.el-input-number) {
  width: 220px;
}

@media (max-width: 960px) {
  .exportOverlay {
    padding: 12px;
  }

  .exportDialog {
    width: 100%;
    min-height: calc(100vh - 24px);
  }

  .dialogHeader,
  .dialogFooter {
    padding-left: 16px;
    padding-right: 16px;
  }

  .dialogBody {
    grid-template-columns: 1fr;
  }

  .formatRail {
    max-height: 220px;
    border-right: none;
    border-bottom: 1px solid rgba(0, 0, 0, 0.06);
  }

  .dialogContent {
    padding-left: 16px;
    padding-right: 16px;
  }

  .contentShell {
    grid-template-columns: 1fr;
  }

  .previewSurface {
    min-height: 320px;
  }
}

@media (max-width: 720px) {
  .dialogHeader,
  .formRow,
  .optionInlineRow,
  .dialogFooter {
    flex-direction: column;
    align-items: stretch;
  }

  .dialogHeaderActions {
    width: 100%;
  }

  .headerActionBtn {
    flex: 1;
  }

  .formLabel {
    width: auto;
    padding-top: 0;
  }

  .statusText {
    margin-right: 0;
  }
}

:deep(.el-input__wrapper),
:deep(.el-textarea__inner),
:deep(.el-input-number .el-input__wrapper),
:deep(.el-radio-group),
:deep(.el-switch) {
  font-size: 14px;
}

:deep(.el-input__wrapper),
:deep(.el-textarea__inner),
:deep(.el-input-number .el-input__wrapper) {
  border-radius: 6px;
}

:deep(.el-radio-group) {
  display: flex;
  align-items: center;
  gap: 18px;
}
</style>
