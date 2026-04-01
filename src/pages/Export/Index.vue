<template>
  <div class="exportPage" :class="{ isDark: isDark }">
    <header class="exportHeader">
      <div>
        <div class="headerEyebrow">{{ $t('exportPage.eyebrow') }}</div>
        <h1>{{ $t('exportPage.title') }}</h1>
        <p>{{ $t('exportPage.description') }}</p>
      </div>
      <div class="headerActions">
        <button
          type="button"
          class="ghostBtn"
          :aria-label="$t('exportPage.backHome')"
          @click="goHome"
        >
          {{ $t('exportPage.backHome') }}
        </button>
        <button
          type="button"
          class="primaryBtn"
          :aria-label="$t('exportPage.backEdit')"
          @click="goEdit"
        >
          {{ $t('exportPage.backEdit') }}
        </button>
      </div>
    </header>

    <div class="exportBody">
      <aside class="formatRail">
        <button
          v-for="item in exportFormats"
          :key="item.type"
          type="button"
          class="formatCard"
          :aria-pressed="exportState.exportType === item.type"
          :aria-label="item.displayName"
          :class="{
            active: exportState.exportType === item.type,
            disabled: item.disabled
          }"
          @click="selectFormat(item)"
        >
          <div class="formatCardTop">
            <strong>{{ item.displayName }}</strong>
            <span v-if="item.disabled" class="formatBadge">{{
              $t('exportPage.upcoming')
            }}</span>
          </div>
          <span class="formatCardDesc">{{ item.desc }}</span>
        </button>
      </aside>

      <main class="exportPanel">
        <section class="infoPanel">
          <div class="panelTitleRow">
            <h2>{{ currentFormat.displayName }}</h2>
            <span class="formatExt">.{{ currentFileExtension }}</span>
          </div>

          <div class="settingGroup">
            <div class="settingBlock">
              <label class="settingLabel" for="exportFileName">{{
                $t('exportPage.fileName')
              }}</label>
              <el-input
                id="exportFileName"
                v-model="exportState.fileName"
                maxlength="80"
                @keydown.stop
              />
            </div>

            <div class="settingBlock">
              <span class="settingLabel">{{ $t('exportPage.descriptionLabel') }}</span>
              <div class="plainCard">
                {{ currentFormat.desc }}
              </div>
            </div>

            <div class="settingBlock">
              <span class="settingLabel">{{ $t('exportPage.optionsLabel') }}</span>
              <div class="optionsCard">
                <div v-if="isDisabledFormat" class="emptyOption">
                  {{ $t('exportPage.disabledTip') }}
                </div>

                <template v-else>
                  <div class="optionRow" v-if="showConfigOption">
                    <span>{{ $t('exportPage.includeConfig') }}</span>
                    <el-switch v-model="exportState.withConfig" />
                  </div>

                  <div class="optionRow" v-if="showImageOptions">
                    <span>{{ $t('exportPage.imageFormat') }}</span>
                    <el-radio-group v-model="exportState.imageFormat">
                      <el-radio value="png">PNG</el-radio>
                      <el-radio value="jpg">JPG</el-radio>
                    </el-radio-group>
                  </div>

                  <div class="optionRow" v-if="showPaddingOptions">
                    <span>{{ $t('exportPage.paddingX') }}</span>
                    <el-input-number
                      v-model="exportState.paddingX"
                      :min="0"
                      :max="500"
                    />
                  </div>

                  <div class="optionRow" v-if="showPaddingOptions">
                    <span>{{ $t('exportPage.paddingY') }}</span>
                    <el-input-number
                      v-model="exportState.paddingY"
                      :min="0"
                      :max="500"
                    />
                  </div>

                  <div class="optionRow" v-if="showFooterOption">
                    <span>{{ $t('exportPage.extraText') }}</span>
                    <el-input
                      v-model="exportState.extraText"
                      :placeholder="$t('exportPage.extraTextPlaceholder')"
                      @keydown.stop
                    />
                  </div>

                  <div class="optionRow" v-if="showTransparentOption">
                    <span>{{ $t('exportPage.transparentBg') }}</span>
                    <el-switch v-model="exportState.isTransparent" />
                  </div>

                  <div class="optionRow" v-if="showFitBgOption">
                    <span>{{ $t('exportPage.fitBg') }}</span>
                    <el-switch v-model="exportState.isFitBg" />
                  </div>

                  <div v-if="!hasVisibleOptions" class="emptyOption">
                    {{ $t('exportPage.noExtraOptions') }}
                  </div>
                </template>
              </div>
            </div>
          </div>

          <div class="actionBar">
            <div class="statusText">
              {{ statusText }}
            </div>
            <el-button :disabled="exporting" @click="goEdit">{{
              $t('exportPage.backEdit')
            }}</el-button>
            <el-button
              type="primary"
              :loading="exporting"
              :disabled="isDisabledFormat || !mindMap"
              @click="handleExport"
            >
              {{ $t('exportPage.export') }}
            </el-button>
          </div>
        </section>

        <section class="previewPanel">
          <div class="previewHeader">
            <h3>{{ $t('exportPage.preview') }}</h3>
            <span>{{ $t('exportPage.previewDesc') }}</span>
          </div>
          <div
            v-loading="previewLoading"
            class="previewCanvasWrap"
          >
            <div ref="previewRef" class="previewCanvas"></div>
          </div>
        </section>
      </main>
    </div>
  </div>
</template>

<script>
import { mapState } from 'pinia'
import { getConfig, getData } from '@/api'
import { ensureBootstrapDocumentState, getCurrentFileRef } from '@/platform'
import { createWorkspaceTemplateData } from '@/services/workspaceActions'
import { useSettingsStore } from '@/stores/settings'
import { useThemeStore } from '@/stores/theme'
import {
  createDefaultExportState,
  getDesktopExportFormats,
  getResolvedExportType,
  isExportFormatDisabled
} from '@/services/exportState'
import defaultNodeImage from '@/assets/img/图片加载失败.svg'

let exportPluginsPromise = null
let richTextPluginsPromise = null
let mindMapRuntimePromise = null

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
    const currentFileRef = getCurrentFileRef()
    const baseName = String(
      currentFileRef?.name || this.$t('exportPage.fallbackFileName')
    ).replace(
      /\.[^./\\]+$/,
      ''
    )
    const exportFormats = getDesktopExportFormats().map(item => ({
      ...item,
      displayName: getFormatDisplayName(this.$t, item.type)
    }))
    const fallbackExportFormat = createFallbackExportFormat(this.$t)
    return {
      previewLoading: true,
      exporting: false,
      mindMap: null,
      exportState: createDefaultExportState(baseName),
      exportFormats: exportFormats.length ? exportFormats : [fallbackExportFormat]
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
    await ensureBootstrapDocumentState()
    await this.initPreview()
  },
  beforeUnmount() {
    if (this.mindMap) {
      this.mindMap.destroy()
    }
  },
  methods: {
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
        const { default: icon } = await import('@/config/icon')
        const fullData = normalizeMindMapData(getData())
        const { root, layout, theme, view } = fullData
        const config = getConfig() || {}
        const fallbackData = createFallbackData()
        const { ExportPDF, ExportXMind, Export } = await loadExportPlugins()
        this.mindMap = new MindMap({
          el: this.$refs.previewRef,
          data: root,
          fit: true,
          layout,
          theme: theme?.template || fallbackData.theme.template,
          themeConfig: theme?.config || fallbackData.theme.config,
          viewData: view,
          customInnerElsAppendTo: null,
          iconList: [...icon],
          defaultNodeImage,
          addContentToFooter: () => this.createFooterContent(),
          ...(config || {})
        })
        this.mindMap.addPlugin(ExportPDF)
        this.mindMap.addPlugin(ExportXMind)
        this.mindMap.addPlugin(Export)
        if (this.localConfig.openNodeRichText) {
          const { RichText, Formula } = await loadRichTextPlugins()
          this.mindMap.addPlugin(RichText)
          this.mindMap.addPlugin(Formula)
        }
      } catch (error) {
        console.error('init export preview failed', error)
        this.$message.error(this.$t('exportPage.previewInitFailed'))
      } finally {
        this.previewLoading = false
      }
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
  min-height: 100vh;
  padding: 24px;
  background:
    radial-gradient(circle at top left, rgba(59, 130, 246, 0.2), transparent 28%),
    linear-gradient(180deg, #f6f8fb 0%, #edf2f7 100%);
  color: #0f172a;

  &.isDark {
    background:
      radial-gradient(circle at top left, rgba(59, 130, 246, 0.22), transparent 28%),
      linear-gradient(180deg, #0f172a 0%, #111827 100%);
    color: #e5eefc;

    .formatRail,
    .infoPanel,
    .previewPanel,
    .formatCard,
    .plainCard,
    .optionsCard,
    .previewCanvasWrap {
      background: rgba(15, 23, 42, 0.82);
      border-color: rgba(255, 255, 255, 0.08);
      color: inherit;
    }

    .ghostBtn {
      background: rgba(255, 255, 255, 0.06);
      border-color: rgba(255, 255, 255, 0.12);
      color: inherit;
    }
  }
}

.exportHeader {
  display: flex;
  align-items: flex-start;
  justify-content: space-between;
  gap: 20px;
  margin-bottom: 20px;

  h1 {
    margin: 6px 0 10px;
    font-size: 34px;
    line-height: 1.1;
  }

  p {
    max-width: 720px;
    font-size: 14px;
    line-height: 1.7;
    color: rgba(15, 23, 42, 0.62);
  }
}

.headerEyebrow {
  font-size: 13px;
  font-weight: 700;
  letter-spacing: 0.08em;
  text-transform: uppercase;
  color: #2563eb;
}

.headerActions {
  display: flex;
  align-items: center;
  gap: 12px;
}

.ghostBtn,
.primaryBtn {
  border-radius: 14px;
  padding: 10px 16px;
  cursor: pointer;
  border: 1px solid rgba(15, 23, 42, 0.08);
}

.ghostBtn {
  background: rgba(255, 255, 255, 0.82);
}

.primaryBtn {
  background: #2563eb;
  color: #fff;
  border-color: transparent;
}

.exportBody {
  display: grid;
  grid-template-columns: 280px minmax(0, 1fr);
  gap: 20px;
  min-height: calc(100vh - 138px);
}

.formatRail,
.infoPanel,
.previewPanel {
  border-radius: 24px;
  border: 1px solid rgba(15, 23, 42, 0.06);
  background: rgba(255, 255, 255, 0.82);
}

.formatRail {
  padding: 18px;
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.formatCard {
  border: 1px solid rgba(15, 23, 42, 0.08);
  background: #fff;
  border-radius: 18px;
  padding: 16px;
  text-align: left;
  cursor: pointer;
  transition: all 0.2s ease;

  &.active {
    border-color: rgba(37, 99, 235, 0.36);
    box-shadow: 0 14px 30px rgba(37, 99, 235, 0.12);
  }

  &.disabled {
    opacity: 0.72;
  }
}

.formatCardTop {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 12px;
  margin-bottom: 8px;
}

.formatBadge {
  border-radius: 999px;
  padding: 4px 8px;
  font-size: 12px;
  background: rgba(245, 158, 11, 0.12);
  color: #d97706;
}

.formatCardDesc {
  font-size: 13px;
  line-height: 1.7;
  color: rgba(15, 23, 42, 0.6);
}

.exportPanel {
  display: grid;
  grid-template-columns: minmax(320px, 420px) minmax(0, 1fr);
  gap: 20px;
}

.infoPanel,
.previewPanel {
  padding: 22px;
}

.panelTitleRow,
.previewHeader {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 12px;
  margin-bottom: 18px;

  h2,
  h3 {
    font-size: 24px;
  }
}

.formatExt {
  border-radius: 999px;
  padding: 6px 10px;
  background: rgba(37, 99, 235, 0.12);
  color: #2563eb;
  font-weight: 700;
}

.settingGroup {
  display: flex;
  flex-direction: column;
  gap: 16px;
}

.settingBlock {
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.settingLabel {
  font-size: 13px;
  font-weight: 700;
  color: rgba(15, 23, 42, 0.62);
}

.plainCard,
.optionsCard {
  border-radius: 18px;
  border: 1px solid rgba(15, 23, 42, 0.06);
  background: #fff;
  padding: 16px;
}

.plainCard {
  line-height: 1.7;
}

.optionsCard {
  display: flex;
  flex-direction: column;
  gap: 14px;
}

.optionRow {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 16px;
}

.emptyOption {
  font-size: 13px;
  color: rgba(15, 23, 42, 0.52);
}

.actionBar {
  margin-top: 20px;
  display: flex;
  align-items: center;
  justify-content: flex-end;
  gap: 12px;
}

.statusText {
  margin-right: auto;
  font-size: 13px;
  color: rgba(15, 23, 42, 0.56);
}

.previewHeader span {
  font-size: 13px;
  color: rgba(15, 23, 42, 0.56);
}

.previewCanvasWrap {
  height: calc(100% - 54px);
  min-height: 540px;
  border-radius: 20px;
  border: 1px solid rgba(15, 23, 42, 0.06);
  background: #fff;
  overflow: hidden;
}

.previewCanvas {
  width: 100%;
  height: 100%;
}

@media (max-width: 1200px) {
  .exportBody,
  .exportPanel {
    grid-template-columns: 1fr;
  }

  .previewCanvasWrap {
    min-height: 420px;
  }
}

@media (max-width: 768px) {
  .exportPage {
    padding: 16px;
  }

  .exportHeader,
  .panelTitleRow,
  .previewHeader,
  .optionRow,
  .actionBar {
    flex-direction: column;
    align-items: stretch;
  }

  .headerActions {
    width: 100%;
  }

  .ghostBtn,
  .primaryBtn {
    flex: 1;
  }
}
</style>
