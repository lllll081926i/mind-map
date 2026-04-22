<template>
  <div class="exportPage" :class="{ isDark: isDark }">
    <div class="exportOverlay" @click.self="onMaskClick">
      <section class="exportDialog">
        <header class="dialogHeader">
          <div class="dialogHeaderMain">
            <h1>{{ $t('exportPage.title') }}</h1>
            <p>{{ $t('exportPage.description') }}</p>
          </div>
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
              <span>{{ item.displayName }}</span>
              <span v-if="item.disabled" class="badgeSoon">{{
                $t('exportPage.upcoming')
              }}</span>
            </button>
          </aside>

          <section class="settingsPanel">
            <div class="settingsHeader">
              <h2>{{ currentFormat.displayName }}</h2>
              <span class="tagExtension">.{{ currentFileExtension }}</span>
            </div>

            <div class="statusMetaList">
              <div class="statusMetaItem">
                <span>{{ $t('exportPage.currentDocumentLabel') }}</span>
                <strong>{{ currentDocumentName }}</strong>
              </div>
              <div class="statusMetaItem">
                <span>{{ $t('exportPage.rememberedLabel') }}</span>
                <strong>{{ rememberedSummary }}</strong>
              </div>
            </div>
            <p class="rememberedTip">{{ $t('exportPage.rememberedTip') }}</p>

            <div class="settingGroup">
              <label class="settingLabel" for="exportFileName">{{
                $t('exportPage.fileName')
              }}</label>
              <div class="inputWrapper">
                <el-input
                  id="exportFileName"
                  v-model="exportState.fileName"
                  maxlength="80"
                  @keydown.stop
                />
                <div class="inputSuffix">.{{ currentFileExtension }}</div>
              </div>
            </div>

            <div class="settingGroup">
              <label class="settingLabel">{{
                $t('exportPage.descriptionLabel')
              }}</label>
              <div class="infoText">
                <span class="infoDot"></span>
                <span>{{ currentFormat.desc }}</span>
              </div>
            </div>

            <div class="settingGroup">
              <label class="settingLabel">{{ $t('exportPage.optionsLabel') }}</label>

              <div v-if="isDisabledFormat" class="emptyOption">
                {{ $t('exportPage.disabledTip') }}
              </div>

              <template v-else>
                <div class="toggleRow" v-if="showConfigOption">
                  <span>{{ $t('exportPage.includeConfig') }}</span>
                  <el-switch v-model="exportState.withConfig" />
                </div>

                <div class="toggleRow stacked" v-if="showImageOptions">
                  <span>{{ $t('exportPage.imageFormat') }}</span>
                  <el-radio-group v-model="exportState.imageFormat">
                    <el-radio value="png">PNG</el-radio>
                    <el-radio value="jpg">JPG</el-radio>
                  </el-radio-group>
                </div>

                <div class="toggleRow stacked" v-if="showPaddingOptions">
                  <span>{{ $t('exportPage.paddingX') }}</span>
                  <el-input-number
                    v-model="exportState.paddingX"
                    :min="0"
                    :max="500"
                  />
                </div>

                <div class="toggleRow stacked" v-if="showPaddingOptions">
                  <span>{{ $t('exportPage.paddingY') }}</span>
                  <el-input-number
                    v-model="exportState.paddingY"
                    :min="0"
                    :max="500"
                  />
                </div>

                <div class="settingGroup nested" v-if="showFooterOption">
                  <label class="settingLabel">{{ $t('exportPage.extraText') }}</label>
                  <div class="inputWrapper single">
                    <el-input
                      v-model="exportState.extraText"
                      :placeholder="$t('exportPage.extraTextPlaceholder')"
                      @keydown.stop
                    />
                  </div>
                </div>

                <div class="toggleRow" v-if="showTransparentOption">
                  <span>{{ $t('exportPage.transparentBg') }}</span>
                  <el-switch v-model="exportState.isTransparent" />
                </div>

                <div class="toggleRow" v-if="showFitBgOption">
                  <span>{{ $t('exportPage.fitBg') }}</span>
                  <el-switch v-model="exportState.isFitBg" />
                </div>

                <div v-if="!hasVisibleOptions" class="emptyOption">
                  {{ $t('exportPage.noExtraOptions') }}
                </div>
              </template>
            </div>
          </section>

          <aside class="previewPanel" v-loading="previewLoading">
            <div class="previewTitle">{{ $t('exportPage.preview') }}</div>
            <div class="previewHeader">{{ $t('exportPage.previewDesc') }}</div>
            <div class="previewWarmupHint">{{ $t('exportPage.warmupHint') }}</div>
            <div class="previewSurface">
              <div
                ref="previewRef"
                class="previewCanvas"
                :class="previewCanvasClass"
                :style="flowchartPreviewStyle"
              ></div>
            </div>
          </aside>
        </div>

        <footer class="dialogFooter">
          <div class="statusText">{{ statusText }}</div>
          <el-button
            type="primary"
            :loading="exporting"
            :disabled="isDisabledFormat || !canExportCurrentDocument"
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
import platform, { ensureBootstrapDocumentState, getBootstrapState } from '@/platform'
import { getCurrentFileRef, getLastDirectory } from '@/services/documentSession'
import {
  buildFlowchartSvgMarkup,
  createDefaultFlowchartData,
  getFlowchartExportBounds
} from '@/services/flowchartDocument'
import { buildMindMapHtmlDocument } from '@/services/htmlExport'
import { createWorkspaceTemplateData } from '@/services/workspaceActions'
import { useEditorStore } from '@/stores/editor'
import { useThemeStore } from '@/stores/theme'
import { sanitizeFileName } from '@/utils'
import {
  getDesktopExportFormats,
  getResolvedExportType,
  isExportFormatDisabled,
  persistExportStateSnapshot,
  restorePersistedExportState,
  resolveExportContext
} from '@/services/exportState'
import defaultNodeImage from '@/assets/img/图片加载失败.svg'

let exportBasePluginPromise = null
let exportPdfPluginPromise = null
let exportXMindPluginPromise = null
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

const createFallbackFlowchartData = () => createDefaultFlowchartData('流程图')

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
    ])
      .then(([mindMapModule, themesModule]) => {
        const MindMap = mindMapModule.default
        const Themes = themesModule.default
        Themes.init(MindMap)
        if (typeof globalThis.MoreThemes?.init === 'function') {
          globalThis.MoreThemes.init(MindMap)
        }
        return {
          MindMap
        }
      })
      .catch(error => {
        mindMapRuntimePromise = null
        throw error
      })
  }
  return mindMapRuntimePromise
}

const loadExportBasePlugin = async () => {
  if (!exportBasePluginPromise) {
    exportBasePluginPromise = import('simple-mind-map/src/plugins/Export.js')
      .then(module => module.default)
      .catch(error => {
        exportBasePluginPromise = null
        throw error
      })
  }
  return exportBasePluginPromise
}

const loadExportPdfPlugin = async () => {
  if (!exportPdfPluginPromise) {
    exportPdfPluginPromise = import('simple-mind-map/src/plugins/ExportPDF.js')
      .then(module => module.default)
      .catch(error => {
        exportPdfPluginPromise = null
        throw error
      })
  }
  return exportPdfPluginPromise
}

const loadExportXMindPlugin = async () => {
  if (!exportXMindPluginPromise) {
    exportXMindPluginPromise = import(
      'simple-mind-map/src/plugins/ExportXMind.js'
    )
      .then(module => module.default)
      .catch(error => {
        exportXMindPluginPromise = null
        throw error
      })
  }
  return exportXMindPluginPromise
}

const loadRichTextPlugins = async () => {
  if (!richTextPluginsPromise) {
    richTextPluginsPromise = Promise.all([
      import('simple-mind-map/src/plugins/RichText.js'),
      import('simple-mind-map/src/plugins/Formula.js')
    ])
      .then(([richTextModule, formulaModule]) => ({
        RichText: richTextModule.default,
        Formula: formulaModule.default
      }))
      .catch(error => {
        richTextPluginsPromise = null
        throw error
      })
  }
  return richTextPluginsPromise
}

export default {
  data() {
    const exportContext = resolveExportContext(getCurrentFileRef())
    const exportState = restorePersistedExportState(exportContext.fileRef)
    return {
      previewLoading: true,
      exporting: false,
      mindMap: null,
      flowchartPreviewMarkup: '',
      exportPluginState: {
        base: false,
        pdf: false,
        xmind: false
      },
      extendedIconList: [],
      exportContext,
      exportState,
      boundPreviewResize: null,
      previewResizeFrame: 0,
      exportWarmupTimer: 0
    }
  },
  computed: {
    ...mapState(useThemeStore, {
      isDark: 'isDark'
    }),
    ...mapState(useEditorStore, {
      currentDocument: 'currentDocument'
    }),
    documentMode() {
      return (
        this.currentDocument?.documentMode ||
        this.exportContext.fileRef?.documentMode ||
        'mindmap'
      )
    },
    exportFormats() {
      const exportFormats = getDesktopExportFormats(this.documentMode).map(item => ({
        ...item,
        displayName: getFormatDisplayName(this.$t, item.type)
      }))
      return exportFormats.length
        ? exportFormats
        : [createFallbackExportFormat(this.$t)]
    },
    currentFormat() {
      return (
        this.exportFormats.find(
          item => item.type === this.exportState.exportType
        ) ||
        this.exportFormats[0] ||
        createFallbackExportFormat(this.$t)
      )
    },
    isDisabledFormat() {
      return isExportFormatDisabled(this.exportState.exportType, this.documentMode)
    },
    currentFileExtension() {
      if (this.documentMode === 'flowchart') {
        return this.exportState.exportType
      }
      if (this.exportState.exportType === 'png') {
        return this.exportState.imageFormat
      }
      return getResolvedExportType(this.exportState.exportType, this.documentMode)
    },
    showConfigOption() {
      return (
        this.documentMode !== 'flowchart' &&
        ['smm', 'json'].includes(this.exportState.exportType)
      )
    },
    showImageOptions() {
      return this.documentMode !== 'flowchart' && this.exportState.exportType === 'png'
    },
    showPaddingOptions() {
      return ['png', 'svg', 'pdf', 'pdf-hd'].includes(
        this.exportState.exportType
      )
    },
    showFooterOption() {
      return (
        this.documentMode !== 'flowchart' &&
        ['png', 'svg', 'pdf', 'pdf-hd'].includes(
          this.exportState.exportType
        )
      )
    },
    showTransparentOption() {
      if (this.documentMode === 'flowchart') {
        return this.exportState.exportType === 'png'
      }
      return ['png', 'pdf', 'pdf-hd'].includes(this.exportState.exportType)
    },
    showFitBgOption() {
      return (
        this.documentMode !== 'flowchart' &&
        ['png', 'pdf', 'pdf-hd'].includes(this.exportState.exportType) &&
        !this.exportState.isTransparent
      )
    },
    canExportCurrentDocument() {
      if (this.documentMode === 'flowchart') {
        return !!this.getFlowchartData().nodes.length
      }
      return !!this.mindMap
    },
    previewCanvasClass() {
      return {
        isFlowchart: this.documentMode === 'flowchart'
      }
    },
    flowchartPreviewStyle() {
      if (this.documentMode !== 'flowchart') {
        return {}
      }
      const bounds = getFlowchartExportBounds(this.getFlowchartData(), {
        paddingX: this.exportState.paddingX,
        paddingY: this.exportState.paddingY
      })
      return {
        aspectRatio: `${bounds.width} / ${bounds.height}`
      }
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
    rememberedSummary() {
      const summaryList = [
        this.currentFormat.displayName,
        `.${this.currentFileExtension}`
      ]
      if (this.showConfigOption && this.exportState.withConfig) {
        summaryList.push(this.$t('exportPage.includeConfig'))
      }
      if (this.showTransparentOption && this.exportState.isTransparent) {
        summaryList.push(this.$t('exportPage.transparentBg'))
      }
      return summaryList.join(' / ')
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
    },
    currentDocumentName() {
      return (
        this.currentDocument?.name ||
        this.exportContext.fileRef?.name ||
        `${this.exportContext.fileName}.smm`
      )
    }
  },
  watch: {
    exportState: {
      deep: true,
      handler() {
        persistExportStateSnapshot({
          ...this.exportState,
          fileRef: this.exportContext.fileRef
        })
      }
    },
    'exportState.exportType'() {
      this.ensureExportTypeForMode()
      if (this.documentMode === 'flowchart') {
        void this.initPreview()
      }
      this.scheduleExportWarmup()
    },
    'exportState.paddingX'() {
      if (this.documentMode === 'flowchart') {
        void this.initPreview()
      }
    },
    'exportState.paddingY'() {
      if (this.documentMode === 'flowchart') {
        void this.initPreview()
      }
    },
    'exportState.imageFormat'() {
      if (this.documentMode !== 'flowchart' && this.exportState.exportType === 'png') {
        this.scheduleExportWarmup()
      }
    },
    documentMode() {
      this.ensureExportTypeForMode()
      void this.initPreview()
    },
    isDark() {
      if (this.documentMode === 'flowchart') {
        void this.initPreview()
      }
    }
  },
  async mounted() {
    this.bindPreviewResize()
    this.ensureExportTypeForMode()
    this.scheduleExportWarmup()
    await ensureBootstrapDocumentState()
    await this.initPreview()
  },
  beforeUnmount() {
    this.unbindPreviewResize()
    this.clearPreviewResizeFrame()
    this.clearExportWarmupTask()
    if (this.mindMap) {
      this.mindMap.destroy()
      this.mindMap = null
    }
    this.extendedIconList = []
  },
  methods: {
    getPreviewContainerRect() {
      const previewEl = this.$refs.previewRef
      if (!previewEl || typeof previewEl.getBoundingClientRect !== 'function') {
        return null
      }
      const rect = previewEl.getBoundingClientRect()
      if (!rect.width || !rect.height) {
        return null
      }
      return {
        el: previewEl,
        rect
      }
    },

    async waitForPreviewContainerReady(maxAttempts = 24) {
      for (let attempt = 0; attempt < maxAttempts; attempt += 1) {
        await this.$nextTick()
        await new Promise(resolve => requestAnimationFrame(resolve))
        const result = this.getPreviewContainerRect()
        if (result) {
          return result.el
        }
      }
      if (!this.$refs.previewRef) {
        throw new Error(this.$t('exportPage.previewContainerMissing'))
      }
      throw new Error('导出预览容器尺寸尚未就绪')
    },

    async onMaskClick() {
      if (this.exporting) {
        return
      }
      await this.goEdit()
    },

    bindPreviewResize() {
      if (typeof window === 'undefined' || this.boundPreviewResize) {
        return
      }
      this.boundPreviewResize = () => this.syncPreviewViewport()
      window.addEventListener('resize', this.boundPreviewResize)
    },

    clearExportWarmupTask() {
      if (!this.exportWarmupTimer) {
        return
      }
      clearTimeout(this.exportWarmupTimer)
      this.exportWarmupTimer = 0
    },

    scheduleExportWarmup() {
      this.clearExportWarmupTask()
      if (this.documentMode === 'flowchart') {
        return
      }
      this.exportWarmupTimer = window.setTimeout(() => {
        this.exportWarmupTimer = 0
        const resolvedType =
          this.exportState.exportType === 'png'
            ? this.exportState.imageFormat
            : getResolvedExportType(this.exportState.exportType, this.documentMode)
        void this.ensureExportPluginsInstalled(resolvedType).catch(error => {
          console.warn('scheduleExportWarmup failed', error)
        })
      }, 120)
    },

    unbindPreviewResize() {
      if (typeof window === 'undefined' || !this.boundPreviewResize) {
        return
      }
      window.removeEventListener('resize', this.boundPreviewResize)
      this.boundPreviewResize = null
    },

    clearPreviewResizeFrame() {
      if (!this.previewResizeFrame) {
        return
      }
      cancelAnimationFrame(this.previewResizeFrame)
      this.previewResizeFrame = 0
    },

    syncPreviewViewport() {
      if (this.documentMode === 'flowchart') {
        return
      }
      if (!this.mindMap || this.previewResizeFrame) {
        return
      }
      this.previewResizeFrame = requestAnimationFrame(() => {
        this.previewResizeFrame = 0
        this.$nextTick(() => {
          if (!this.mindMap) {
            return
          }
          if (typeof this.mindMap.emit === 'function') {
            this.mindMap.emit('resize')
          }
          if (
            this.mindMap.view &&
            typeof this.mindMap.view.fit === 'function'
          ) {
            this.mindMap.view.fit()
          }
        })
      })
    },

    selectFormat(item) {
      if (!item || item.disabled || item.type === this.exportState.exportType) {
        return
      }
      this.exportState.exportType = item.type
    },

    ensureExportTypeForMode() {
      const formats = this.exportFormats
      if (!formats.length) {
        return
      }
      if (!formats.some(item => item.type === this.exportState.exportType)) {
        this.exportState.exportType = formats[0].type
      }
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
        const previewEl = await this.waitForPreviewContainerReady()
        if (this.documentMode === 'flowchart') {
          this.initFlowchartPreview(previewEl)
          return
        }
        if (this.mindMap) {
          this.mindMap.destroy()
          this.mindMap = null
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
          el: previewEl,
          data: root,
          fit: true,
          readonly: true,
          layout,
          mousewheelAction: 'zoom',
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

    getFlowchartData() {
      return getBootstrapState().flowchartData || createFallbackFlowchartData()
    },

    initFlowchartPreview(previewEl) {
      if (!previewEl) {
        throw new Error(this.$t('exportPage.previewContainerMissing'))
      }
      if (this.mindMap) {
        this.mindMap.destroy()
        this.mindMap = null
      }
      this.flowchartPreviewMarkup = buildFlowchartSvgMarkup(this.getFlowchartData(), {
        isDark: this.isDark,
        transparent: false,
        paddingX: this.exportState.paddingX,
        paddingY: this.exportState.paddingY
      })
      previewEl.innerHTML = this.flowchartPreviewMarkup
    },

    loadImage(url) {
      return new Promise((resolve, reject) => {
        const image = new Image()
        image.onload = () => resolve(image)
        image.onerror = reject
        image.src = url
      })
    },

    async buildFlowchartRasterBlob({ svgMarkup, extension = 'png' }) {
      const bounds = getFlowchartExportBounds(this.getFlowchartData(), {
        paddingX: this.exportState.paddingX,
        paddingY: this.exportState.paddingY
      })
      const blob = new Blob([svgMarkup], {
        type: 'image/svg+xml;charset=utf-8'
      })
      const url = URL.createObjectURL(blob)
      try {
        const image = await this.loadImage(url)
        const canvas = document.createElement('canvas')
        canvas.width = Math.max(bounds.width, image.width)
        canvas.height = Math.max(bounds.height, image.height)
        const context = canvas.getContext('2d')
        if (!context) {
          throw new Error(this.$t('exportPage.exportFailed'))
        }
        if (extension === 'jpg' || !this.exportState.isTransparent) {
          context.fillStyle = this.isDark ? '#171a1f' : '#ffffff'
          context.fillRect(0, 0, canvas.width, canvas.height)
        }
        context.drawImage(image, 0, 0, canvas.width, canvas.height)
        const mimeType = extension === 'jpg' ? 'image/jpeg' : 'image/png'
        const blob = await new Promise((resolve, reject) => {
          canvas.toBlob(nextBlob => {
            if (nextBlob) {
              resolve(nextBlob)
              return
            }
            reject(new Error(this.$t('exportPage.exportFailed')))
          }, mimeType)
        })
        return {
          blob,
          mimeType
        }
      } finally {
        URL.revokeObjectURL(url)
      }
    },

    async exportFlowchartAsRaster({ svgMarkup, fileName, extension = 'png' }) {
      const { blob, mimeType } = await this.buildFlowchartRasterBlob({
        svgMarkup,
        extension
      })
      await platform.saveBinaryFileAs({
        suggestedName: fileName,
        content: await blob.arrayBuffer(),
        defaultPath: this.currentDocument?.path || '',
        extension,
        name: extension === 'jpg' ? 'JPG 文件' : 'PNG 文件',
        mimeType
      })
    },

    async handleFlowchartExport(safeFileName) {
      const exportType = this.exportState.exportType
      const svgMarkup = buildFlowchartSvgMarkup(this.getFlowchartData(), {
        isDark: this.isDark,
        transparent: exportType === 'png' ? this.exportState.isTransparent : false,
        paddingX: this.exportState.paddingX,
        paddingY: this.exportState.paddingY
      })
      if (exportType === 'svg') {
        await platform.saveTextFileAs({
          suggestedName: safeFileName,
          content: svgMarkup,
          defaultPath: this.currentDocument?.path || '',
          extension: 'svg',
          name: 'SVG 文件',
          mimeType: 'image/svg+xml;charset=utf-8'
        })
        return
      }
      await this.exportFlowchartAsRaster({
        svgMarkup,
        fileName: safeFileName,
        extension: 'png'
      })
    },

    async ensureExportPluginsInstalled(exportType) {
      if (this.documentMode === 'flowchart') return
      if (!this.mindMap) return
      if (!this.exportPluginState.base) {
        const ExportPlugin = await loadExportBasePlugin()
        this.mindMap.addPlugin(ExportPlugin)
        this.exportPluginState.base = true
      }
      if (exportType === 'pdf' && !this.exportPluginState.pdf) {
        const ExportPdfPlugin = await loadExportPdfPlugin()
        this.mindMap.addPlugin(ExportPdfPlugin)
        this.exportPluginState.pdf = true
      }
      if (exportType === 'xmind' && !this.exportPluginState.xmind) {
        const ExportXMindPlugin = await loadExportXMindPlugin()
        this.mindMap.addPlugin(ExportXMindPlugin)
        this.exportPluginState.xmind = true
      }
    },

    async handleExport() {
      if (!this.canExportCurrentDocument || this.isDisabledFormat || this.exporting) {
        return
      }
      const safeFileName = sanitizeFileName(
        this.exportState.fileName,
        this.$t('exportPage.fallbackFileName')
      )
      const resolvedType =
        this.documentMode !== 'flowchart' && this.exportState.exportType === 'png'
          ? this.exportState.imageFormat
          : getResolvedExportType(this.exportState.exportType, this.documentMode)
      this.exporting = true
      try {
        if (this.documentMode === 'flowchart') {
          await this.handleFlowchartExport(safeFileName)
        } else if (resolvedType === 'pdf') {
          await this.ensureExportPluginsInstalled(resolvedType)
          this.mindMap.updateConfig({
            exportPaddingX: Number(this.exportState.paddingX) || 0,
            exportPaddingY: Number(this.exportState.paddingY) || 0
          })
          await this.mindMap.export(
            resolvedType,
            true,
            safeFileName,
            this.exportState.isTransparent,
            this.exportState.isFitBg
          )
        } else {
          await this.ensureExportPluginsInstalled(resolvedType)
          this.mindMap.updateConfig({
            exportPaddingX: Number(this.exportState.paddingX) || 0,
            exportPaddingY: Number(this.exportState.paddingY) || 0
          })
          if (this.exportState.exportType === 'html') {
            const svgMarkup = await this.mindMap.export('svg', false, safeFileName)
            const htmlContent = buildMindMapHtmlDocument({
              fileName: safeFileName,
              svgMarkup
            })
            const fileRef = await platform.saveTextFileAs({
              suggestedName: safeFileName,
              content: htmlContent,
              defaultPath: getLastDirectory(),
              extension: 'html',
              name: 'HTML',
              mimeType: 'text/html;charset=utf-8'
            })
            if (!fileRef) {
              return
            }
          } else if (['smm', 'json'].includes(this.exportState.exportType)) {
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
          } else {
            await this.mindMap.export(resolvedType, true, safeFileName)
          }
        }
        this.$notify.success({
          title: this.$t('exportPage.exportDoneTitle'),
          message: this.$t('exportPage.exportDoneMessage', {
            fileName: safeFileName,
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
  color: #111827;

  &.isDark {
    color: hsla(0, 0%, 100%, 0.9);

    .exportDialog,
    .dialogFooter {
      background: #171b22;
      border-color: rgba(255, 255, 255, 0.08);
    }

    .dialogHeader,
    .sidebar,
    .settingsPanel,
    .previewPanel,
    .toggleRow,
    .inputWrapper {
      border-color: rgba(255, 255, 255, 0.08);
    }

    .dialogHeaderMain p,
    .settingLabel,
    .infoText,
    .previewHeader,
    .previewWarmupHint,
    .previewHint,
    .statusText,
    .inputSuffix,
    .emptyOption,
    .rememberedTip,
    .statusMetaItem span {
      color: hsla(0, 0%, 100%, 0.56);
    }

    .sidebar {
      background: #15181e;
    }

    .settingsPanel {
      background: #171b22;
    }

    .previewPanel {
      background: #171b22;
    }

    .statusMetaItem,
    .previewWarmupHint {
      background: rgba(255, 255, 255, 0.03);
      border-color: rgba(255, 255, 255, 0.08);
    }

    .previewSurface {
      background:
        radial-gradient(circle at 1px 1px, rgba(255, 255, 255, 0.06) 1px, transparent 0)
          0 0 / 20px 20px,
        #11151b;
      border-color: rgba(255, 255, 255, 0.08);
      box-shadow: 0 4px 20px rgba(0, 0, 0, 0.18);
    }

    .formatNavItem {
      color: hsla(0, 0%, 100%, 0.72);

      &:hover:not(.active):not(.disabled) {
        background: rgba(255, 255, 255, 0.04);
      }

      &.active {
        background: #f3f4f6;
        color: #0f0f0f;
      }
    }

    .tagExtension {
      background: rgba(255, 255, 255, 0.04);
      border-color: rgba(255, 255, 255, 0.08);
      color: hsla(0, 0%, 100%, 0.62);
    }

    .inputSuffix {
      background: rgba(255, 255, 255, 0.04);
      border-color: rgba(255, 255, 255, 0.08);
    }

    .infoDot {
      background: hsla(0, 0%, 100%, 0.3);
    }

    .badgeSoon {
      background: rgba(255, 255, 255, 0.08);
      color: hsla(0, 0%, 100%, 0.56);
    }

    :deep(.el-input__wrapper),
    :deep(.el-input-number__decrease),
    :deep(.el-input-number__increase) {
      background: #242a33;
      color: hsla(0, 0%, 100%, 0.86);
      box-shadow: none;
    }

    :deep(.el-input__inner),
    :deep(.el-input-number .el-input__inner) {
      color: hsla(0, 0%, 100%, 0.88);
    }

    :deep(.el-radio) {
      color: hsla(0, 0%, 100%, 0.72);
    }

    :deep(.el-radio__input.is-checked + .el-radio__label) {
      color: #8ec5ff;
    }

    .exportOverlay {
      background: rgba(9, 12, 16, 0.66);
      backdrop-filter: blur(18px) saturate(0.82);
    }
  }
}

.exportOverlay {
  width: 100vw;
  height: 100vh;
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 24px;
  background: rgba(245, 247, 250, 0.74);
  backdrop-filter: blur(18px) saturate(0.78);
}

.exportDialog {
  width: min(1280px, calc(100vw - 80px));
  height: min(860px, calc(100vh - 80px));
  display: flex;
  flex-direction: column;
  background: #fff;
  border-radius: 10px;
  border: 1px solid rgba(0, 0, 0, 0.06);
  box-shadow: 0 20px 48px rgba(15, 23, 42, 0.16);
  overflow: hidden;
}

.dialogHeader {
  min-height: 64px;
  display: flex;
  align-items: center;
  padding: 0 32px;
  border-bottom: 1px solid rgba(0, 0, 0, 0.06);
}

.dialogHeaderMain {
  h1 {
    margin: 0 0 2px;
    font-size: 16px;
    font-weight: 600;
  }

  p {
    font-size: 12px;
    color: #9ca3af;
  }
}

.dialogBody {
  flex: 1;
  min-height: 0;
  display: grid;
  grid-template-columns: 240px 420px minmax(0, 1fr);
}

.formatRail {
  padding: 16px 12px;
  background: #fcfcfc;
  border-right: 1px solid rgba(0, 0, 0, 0.06);
  overflow-y: auto;
}

.formatNavItem {
  width: 100%;
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 10px;
  margin-bottom: 4px;
  padding: 10px 16px;
  border-radius: 6px;
  border: 1px solid transparent;
  background: transparent;
  color: #4b5563;
  font-size: 14px;
  font-weight: 500;
  text-align: left;
  cursor: pointer;
  transition: all 0.2s ease;

  &:hover:not(.active):not(.disabled) {
    background: #f3f4f6;
  }

  &.active {
    background: #0f0f0f;
    color: #fff;
  }

  &.disabled {
    opacity: 0.5;
    cursor: not-allowed;
  }
}

.badgeSoon {
  flex-shrink: 0;
  font-size: 10px;
  padding: 2px 6px;
  border-radius: 4px;
  background: #f3f4f6;
  color: #9ca3af;
  font-weight: 400;
}

.settingsPanel {
  padding: 40px;
  border-right: 1px solid rgba(0, 0, 0, 0.06);
  overflow-y: auto;
  background: #fcfcfc;
}

.settingsHeader {
  display: flex;
  align-items: center;
  gap: 12px;
  margin-bottom: 32px;

  h2 {
    font-size: 20px;
    font-weight: 600;
  }
}

.tagExtension {
  padding: 2px 8px;
  border-radius: 4px;
  border: 1px solid rgba(0, 0, 0, 0.06);
  background: #f3f4f6;
  color: #4b5563;
  font-size: 12px;
  font-family: monospace;
}

.settingGroup {
  margin-bottom: 32px;
}

.statusMetaList {
  display: grid;
  gap: 12px;
  margin-bottom: 12px;
}

.statusMetaItem {
  display: flex;
  flex-direction: column;
  gap: 6px;
  padding: 12px 14px;
  border-radius: 8px;
  border: 1px solid rgba(0, 0, 0, 0.06);
  background: rgba(15, 23, 42, 0.02);

  span {
    font-size: 12px;
    color: #6b7280;
  }

  strong {
    font-size: 13px;
    color: #111827;
    word-break: break-all;
  }
}

.rememberedTip {
  margin-bottom: 28px;
  font-size: 12px;
  line-height: 1.6;
  color: #6b7280;
}

.settingGroup.nested {
  margin-top: 16px;
  margin-bottom: 0;
}

.settingLabel {
  display: block;
  margin-bottom: 8px;
  font-size: 13px;
  font-weight: 500;
  color: #4b5563;
}

.inputWrapper {
  display: flex;
  align-items: center;
  border: 1px solid rgba(0, 0, 0, 0.08);
  border-radius: 6px;
  overflow: hidden;
  transition: border-color 0.2s ease;

  &:focus-within {
    border-color: #9ca3af;
  }

  &.single {
    display: block;
  }
}

.inputSuffix {
  padding: 10px 12px;
  border-left: 1px solid rgba(0, 0, 0, 0.06);
  background: #f3f4f6;
  color: #9ca3af;
  font-size: 14px;
  font-family: monospace;
}

.infoText {
  display: flex;
  align-items: flex-start;
  gap: 8px;
  font-size: 12px;
  line-height: 1.5;
  color: #9ca3af;
}

.infoDot {
  width: 6px;
  height: 6px;
  margin-top: 6px;
  border-radius: 50%;
  flex-shrink: 0;
  background: rgba(156, 163, 175, 0.72);
}

.toggleRow {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 20px;
  padding: 12px 0;
  border-bottom: 1px solid rgba(0, 0, 0, 0.06);
  font-size: 14px;
}

.toggleRow.stacked {
  align-items: flex-start;
}

.emptyOption {
  font-size: 13px;
  color: #9ca3af;
}

.previewPanel {
  display: flex;
  flex-direction: column;
  padding: 24px;
  background: #fcfcfc;
}

.previewTitle {
  font-size: 16px;
  font-weight: 600;
  margin-bottom: 6px;
}

.previewHeader {
  font-size: 13px;
  color: #9ca3af;
  margin-bottom: 8px;
}

.previewWarmupHint {
  margin-bottom: 12px;
  padding: 10px 12px;
  border-radius: 8px;
  border: 1px solid rgba(0, 0, 0, 0.06);
  background: rgba(15, 23, 42, 0.02);
  font-size: 12px;
  color: #6b7280;
}

.previewSurface {
  flex: 1;
  min-height: 0;
  border-radius: 8px;
  border: 1px solid rgba(0, 0, 0, 0.06);
  background:
    radial-gradient(circle at 1px 1px, rgba(229, 231, 235, 0.9) 1px, transparent 0)
      0 0 / 20px 20px,
    #ffffff;
  box-shadow: 0 4px 20px rgba(0, 0, 0, 0.02);
  overflow: hidden;
}

.previewCanvas {
  width: 100%;
  height: 100%;
  cursor: grab;

  &.isFlowchart {
    height: auto;
    min-height: 100%;
    padding: 20px;
    cursor: default;
    display: flex;
    align-items: center;
    justify-content: center;

    :deep(svg) {
      width: 100%;
      height: auto;
      max-height: 100%;
      display: block;
    }
  }
}

:deep(.previewCanvas .smm-mind-map-container) {
  width: 100%;
  height: 100%;
}

.dialogFooter {
  min-height: 64px;
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 16px;
  padding: 0 32px;
  border-top: 1px solid rgba(0, 0, 0, 0.06);
  background: #fff;
}

.statusText {
  font-size: 13px;
  color: #4b5563;
}

:deep(.el-input) {
  flex: 1;
}

:deep(.el-input__wrapper) {
  min-height: 42px;
  padding: 0 12px;
  border-radius: 0;
  box-shadow: none;
  background: transparent;
}

:deep(.el-input__inner) {
  font-size: 14px;
}

:deep(.el-input-number) {
  width: 180px;
}

:deep(.el-input-number .el-input__wrapper) {
  box-shadow: none;
}

:deep(.el-radio-group) {
  display: flex;
  gap: 18px;
}

@media (max-width: 1080px) {
  .exportDialog {
    width: calc(100vw - 32px);
    height: calc(100vh - 32px);
  }

  .dialogBody {
    grid-template-columns: 1fr;
  }

  .formatRail {
    max-height: 220px;
    border-right: none;
    border-bottom: 1px solid rgba(0, 0, 0, 0.06);
  }

  .settingsPanel,
  .previewPanel {
    padding: 20px 16px;
  }

  .previewSurface {
    min-height: 320px;
  }
}

@media (max-width: 720px) {
  .exportOverlay {
    padding: 12px;
  }

  .dialogHeader,
  .dialogFooter {
    padding-left: 16px;
    padding-right: 16px;
  }

  .dialogFooter {
    flex-direction: column;
    align-items: stretch;
  }
}

.exportPage.isDark {
  .formatRail {
    background: #171b22;
    border-right-color: rgba(255, 255, 255, 0.08);
  }

  .formatNavItem {
    color: hsla(0, 0%, 100%, 0.72);

    &:hover:not(.active):not(.disabled) {
      background: rgba(255, 255, 255, 0.04);
    }

    &.active {
      background: rgba(255, 255, 255, 0.08);
      color: #ffffff;
      border-color: rgba(255, 255, 255, 0.1);
    }
  }

  .badgeSoon {
    background: rgba(255, 255, 255, 0.08);
    color: hsla(0, 0%, 100%, 0.56);
  }
}
</style>
