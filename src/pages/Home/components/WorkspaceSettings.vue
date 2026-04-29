<template>
  <div class="workspaceSettings" :class="{ isDark: isDark }">
    <aside class="settingsNav">
      <button
        v-for="section in sections"
        :key="section.key"
        type="button"
        class="settingsNavItem"
        :class="{ active: currentSection === section.key }"
        @click="currentSection = section.key"
      >
        {{ section.label }}
      </button>
    </aside>
    <section class="settingsPanel customScrollbar">
      <div v-if="currentSection === 'basic'" class="settingsSection">
        <h3>基础</h3>
        <div class="settingRow">
          <span>是否开启节点富文本编辑</span>
          <el-switch
            :model-value="localConfig.openNodeRichText"
            @change="updateLocalConfig('openNodeRichText', $event)"
          />
        </div>
        <div class="settingRow">
          <span>是否显示滚动条</span>
          <el-switch
            :model-value="localConfig.isShowScrollbar"
            @change="updateLocalConfig('isShowScrollbar', $event)"
          />
        </div>
        <div class="settingRow">
          <span>是否允许直接拖拽文件到页面进行导入</span>
          <el-switch
            :model-value="localConfig.enableDragImport"
            @change="updateLocalConfig('enableDragImport', $event)"
          />
        </div>
        <div class="settingRow">
          <span>是否开启AI功能</span>
          <el-switch
            :model-value="localConfig.enableAi"
            @change="updateLocalConfig('enableAi', $event)"
          />
        </div>
        <div class="settingRow">
          <span>左键框选 / 右键拖动画布</span>
          <el-switch
            :model-value="localConfig.useLeftKeySelectionRightKeyDrag"
            @change="
              updateLocalConfig('useLeftKeySelectionRightKeyDrag', $event)
            "
          />
        </div>
        <div class="settingRow">
          <span>开启性能模式</span>
          <el-switch
            :model-value="docConfig.openPerformance"
            @change="updateDocConfig('openPerformance', $event)"
          />
        </div>
        <div class="settingRow">
          <span>节点自由拖拽</span>
          <el-switch
            :model-value="docConfig.enableFreeDrag"
            @change="updateDocConfig('enableFreeDrag', $event)"
          />
        </div>
        <div class="settingRow">
          <span>文本编辑实时渲染</span>
          <el-switch
            :model-value="docConfig.openRealtimeRenderOnNodeTextEdit"
            @change="
              updateDocConfig('openRealtimeRenderOnNodeTextEdit', $event)
            "
          />
        </div>
        <div class="settingRow">
          <span>始终显示展开收起按钮</span>
          <el-switch
            :model-value="docConfig.alwaysShowExpandBtn"
            @change="updateDocConfig('alwaysShowExpandBtn', $event)"
          />
        </div>
        <div class="settingRow">
          <span>键盘输入时自动进入文本编辑</span>
          <el-switch
            :model-value="docConfig.enableAutoEnterTextEditWhenKeydown"
            @change="
              updateDocConfig('enableAutoEnterTextEditWhenKeydown', $event)
            "
          />
        </div>
        <div class="settingRow">
          <span>节点连线样式继承祖先节点的样式</span>
          <el-switch
            :model-value="docConfig.enableInheritAncestorLineStyle"
            @change="
              updateDocConfig('enableInheritAncestorLineStyle', $event)
            "
          />
        </div>
        <div class="settingRow sliderRow">
          <span>节点图片和文本间隔</span>
          <el-slider
            :model-value="docConfig.imgTextMargin"
            :min="0"
            :max="100"
            @change="updateDocConfig('imgTextMargin', $event)"
          />
        </div>
        <div class="settingRow sliderRow">
          <span>节点各种内容间隔</span>
          <el-slider
            :model-value="docConfig.textContentMargin"
            :min="0"
            :max="100"
            @change="updateDocConfig('textContentMargin', $event)"
          />
        </div>
        <div class="settingRow inlineRow">
          <span>鼠标滚轮行为</span>
          <el-select
            :model-value="docConfig.mousewheelAction"
            style="width: 180px"
            @change="updateDocConfig('mousewheelAction', $event)"
          >
            <el-option label="缩放视图" value="zoom" />
            <el-option label="上下移动视图" value="move" />
          </el-select>
        </div>
        <div class="settingRow inlineRow" v-if="docConfig.mousewheelAction === 'zoom'">
          <span>鼠标滚轮缩放</span>
          <el-select
            :model-value="docConfig.mousewheelZoomActionReverse"
            style="width: 180px"
            @change="updateDocConfig('mousewheelZoomActionReverse', $event)"
          >
            <el-option label="向前缩小向后放大" :value="false" />
            <el-option label="向前放大向后缩小" :value="true" />
          </el-select>
        </div>
        <div class="settingRow inlineRow">
          <span>创建新节点的行为</span>
          <el-select
            :model-value="docConfig.createNewNodeBehavior"
            style="width: 180px"
            @change="updateDocConfig('createNewNodeBehavior', $event)"
          >
            <el-option label="激活新节点及进入编辑" value="default" />
            <el-option label="不激活新节点" value="notActive" />
            <el-option label="只激活新节点，不进入编辑" value="activeOnly" />
          </el-select>
        </div>
        <div class="guideCard workflowGuideCard">
          <h4>工作流建议</h4>
          <p>恢复文件会在正式保存后自动清理，异常退出后也能尽量帮你接回未保存内容。</p>
          <p>导出中心会记住你最近一次的导出参数，适合连续导出时减少重复设置。</p>
        </div>
        <div class="guideCard efficiencyGuideCard">
          <h4>效率提示</h4>
          <p>Ctrl + F 可快速搜索节点，适合在长图里直接定位关键内容。</p>
          <p>快捷键面板和首页工作台会保留高频入口，尽量减少来回切换页面。</p>
        </div>
        <div class="appInfoCard">
          <div class="appInfoRow">
            <span>运行时</span>
            <strong class="sidebarReadonlyMetric">桌面版</strong>
          </div>
          <div class="appInfoRow">
            <span>平台</span>
            <strong class="sidebarReadonlyMetric">{{ appPlatformLabel }}</strong>
          </div>
          <div class="appInfoRow">
            <span>版本</span>
            <strong class="sidebarReadonlyMetric">v{{ appVersion }}</strong>
          </div>
          <div class="appInfoActions">
            <el-button
              size="small"
              :loading="checkingForUpdates"
              @click="checkForUpdates"
            >
              {{ $t('setting.checkUpdate') }}
            </el-button>
          </div>
        </div>
        <div class="appInfoCard recoveryInfoCard">
          <div class="appInfoRow">
            <span>恢复文件</span>
            <strong class="sidebarReadonlyMetric">{{ recoverySummary.entries.length }} 个</strong>
          </div>
          <div class="appInfoRow">
            <span>当前目录</span>
            <strong class="sidebarReadonlyMetric">{{
              recoverySummary.rootPath || '未初始化'
            }}</strong>
          </div>
          <div class="appInfoRow">
            <span>生效模式</span>
            <strong class="sidebarReadonlyMetric">{{
              recoverySummary.origin || '未初始化'
            }}</strong>
          </div>
          <p class="recoveryHint">
            删除异常退出后用于恢复未保存内容的恢复文件，不影响正式文档和最近文件。恢复文件会在正式保存后自动清理。
          </p>
          <div class="appInfoActions">
            <el-button
              size="small"
              :loading="clearingRecoveryFiles"
              @click="clearRecoveryFiles"
            >
              清理恢复文件
            </el-button>
          </div>
        </div>
      </div>

      <div v-else-if="currentSection === 'font'" class="settingsSection">
        <h3>字体</h3>
        <p class="sectionDesc">桌面版当前没有独立的全局字体方案，编辑器字体跟随节点样式与主题设置。</p>
        <div class="chipList">
          <span v-for="item in fontFamilyOptions" :key="item.value" class="chip">
            {{ item.name }}
          </span>
        </div>
      </div>

      <div v-else-if="currentSection === 'shortcut'" class="settingsSection">
        <h3>快捷键</h3>
        <div
          v-for="group in shortcutGroups"
          :key="group.type"
          class="shortcutGroup"
        >
          <h4>{{ group.type }}</h4>
          <div
            v-for="item in group.list"
            :key="item.name"
            class="shortcutRow"
          >
            <span>{{ item.name }}</span>
            <code>{{ item.value }}</code>
          </div>
        </div>
      </div>

      <div v-else-if="currentSection === 'contextmenu'" class="settingsSection">
        <h3>右键菜单</h3>
        <p class="sectionDesc">右键菜单项当前跟随编辑器能力集，桌面工作台仅做说明，不提供单独裁剪配置。</p>
        <div class="chipList">
          <span v-for="item in contextMenuTips" :key="item" class="chip">
            {{ item }}
          </span>
        </div>
      </div>

      <div v-else-if="currentSection === 'ai'" class="settingsSection">
        <h3>AI</h3>
        <div class="settingRow">
          <span>AI 能力开关</span>
          <el-switch
            :model-value="localConfig.enableAi"
            @change="updateLocalConfig('enableAi', $event)"
          />
        </div>
        <div class="appInfoCard">
          <div class="appInfoRow">
            <span>Provider</span>
            <strong>{{ aiConfig.provider || '未设置' }}</strong>
          </div>
          <div class="appInfoRow">
            <span>Base URL</span>
            <strong>{{ aiConfig.baseUrl || '未设置' }}</strong>
          </div>
          <div class="appInfoRow">
            <span>模型</span>
            <strong>{{ aiConfig.model || '未设置' }}</strong>
          </div>
          <div class="appInfoActions">
            <el-button size="small" @click="showAiConfig = true">
              修改 AI 配置
            </el-button>
          </div>
        </div>
      </div>

      <div v-else-if="currentSection === 'image-bed'" class="settingsSection">
        <h3>图床</h3>
        <p class="sectionDesc">桌面版图床配置尚未抽离为独立设置页，本期先保留扩展位。</p>
      </div>

      <div v-else-if="currentSection === 'sync'" class="settingsSection">
        <h3>同步空间</h3>
        <p class="sectionDesc">同步空间能力后续进入桌面工作台统一接入，本期先保留页面结构与导航位置。</p>
      </div>
    </section>
    <AiConfigDialog v-model:visible="showAiConfig" />
  </div>
</template>

<script>
import { defineAsyncComponent } from 'vue'
import { mapState } from 'pinia'
import { getConfig, storeConfig } from '@/api'
import { fontFamilyList, shortcutKeyList } from '@/config'
import { useAiStore } from '@/stores/ai'
import { useSettingsStore } from '@/stores/settings'
import { useThemeStore } from '@/stores/theme'
import { applyLocalConfigPatch } from '@/stores/runtime'
import {
  checkForUpdates as runUpdateCheck,
  createUpdateDialogMessage
} from '@/services/updateService'
import { openExternalUrl } from '@/platform'
import {
  clearAllRecoveryDrafts,
  refreshRecoveryState
} from '@/services/recoveryStorage'

const AiConfigDialog = defineAsyncComponent(() =>
  import('@/pages/Edit/components/AiConfigDialog.vue')
)

const defaultDocConfig = () => ({
  openPerformance: true,
  enableFreeDrag: false,
  mousewheelAction: 'zoom',
  mousewheelZoomActionReverse: false,
  createNewNodeBehavior: 'default',
  openRealtimeRenderOnNodeTextEdit: true,
  alwaysShowExpandBtn: false,
  enableAutoEnterTextEditWhenKeydown: true,
  imgTextMargin: 0,
  textContentMargin: 0,
  enableInheritAncestorLineStyle: false
})

export default {
  components: {
    AiConfigDialog
  },
  data() {
    return {
      currentSection: 'basic',
      sections: [
        { key: 'basic', label: '基础' },
        { key: 'font', label: '字体' },
        { key: 'shortcut', label: '快捷键' },
        { key: 'contextmenu', label: '右键菜单' },
        { key: 'ai', label: 'AI' },
        { key: 'image-bed', label: '图床' },
        { key: 'sync', label: '同步空间' }
      ],
      docConfig: defaultDocConfig(),
      checkingForUpdates: false,
      clearingRecoveryFiles: false,
      showAiConfig: false,
      recoverySummary: {
        rootPath: '',
        origin: '',
        entries: []
      },
      contextMenuTips: [
        '插入同级节点',
        '插入子级节点',
        '插入父节点',
        '复制节点',
        '粘贴节点',
        '一键整理布局',
        '导出该节点为图片'
      ]
    }
  },
  computed: {
    ...mapState(useSettingsStore, {
      localConfig: 'localConfig'
    }),
    ...mapState(useThemeStore, {
      isDark: 'isDark'
    }),
    ...mapState(useAiStore, {
      aiConfig: 'config'
    }),
    appVersion() {
      return __APP_VERSION__
    },
    appPlatformLabel() {
      const platformMap = {
        win32: 'Windows',
        darwin: 'macOS',
        linux: 'Linux'
      }
      return platformMap[__APP_PLATFORM__] || __APP_PLATFORM__
    },
    fontFamilyOptions() {
      return fontFamilyList.zh || []
    },
    shortcutGroups() {
      return shortcutKeyList.zh || []
    }
  },
  created() {
    this.initDocConfig()
  },
  mounted() {
    void this.loadRecoverySummary()
  },
  methods: {
    initDocConfig() {
      this.docConfig = {
        ...defaultDocConfig(),
        ...(getConfig() || {})
      }
    },

    updateLocalConfig(key, value) {
      applyLocalConfigPatch({
        [key]: value
      })
    },

    updateDocConfig(key, value) {
      this.docConfig = {
        ...this.docConfig,
        [key]: value
      }
      storeConfig(this.docConfig)
    },

    async loadRecoverySummary() {
      try {
        this.recoverySummary = await refreshRecoveryState()
      } catch (error) {
        console.error('loadRecoverySummary failed', error)
      }
    },

    async clearRecoveryFiles() {
      if (this.clearingRecoveryFiles) return
      try {
        await this.$confirm(
          '确认清理恢复文件吗？此操作不会影响正式文档和最近文件。',
          '清理恢复文件',
          {
            confirmButtonText: '清理',
            cancelButtonText: '取消',
            type: 'warning'
          }
        )
      } catch (_error) {
        return
      }
      this.clearingRecoveryFiles = true
      try {
        const result = await clearAllRecoveryDrafts()
        this.recoverySummary = await refreshRecoveryState()
        this.$message.success(
          `已清理 ${result?.deletedCount || 0} 个恢复文件，失败 ${
            result?.failedCount || 0
          } 个`
        )
      } catch (error) {
        this.$message.error(error?.message || '清理恢复文件失败')
      } finally {
        this.clearingRecoveryFiles = false
      }
    },

    async checkForUpdates() {
      if (this.checkingForUpdates) return
      this.checkingForUpdates = true
      try {
        const result = await runUpdateCheck(this.appVersion)
        if (result.status === 'update-available') {
          if (result.url) {
            const action = await this.$confirm(
              createUpdateDialogMessage(result, this.$t),
              this.$t('setting.updateAvailableTitle'),
              {
                confirmButtonText: this.$t('setting.openReleasePage'),
                cancelButtonText: this.$t('setting.updateLater'),
                type: 'info'
              }
            ).catch(action => action)
            if (action !== 'confirm') {
              return
            }
            try {
              await openExternalUrl(result.url)
            } catch (error) {
              this.$message.error(
                error?.message || this.$t('setting.updateOpenReleasePageFailed')
              )
            }
            return
          }
          this.$message.info(
            this.$t('setting.updateFoundWithoutUrl', {
              version: result.latestVersion
            })
          )
          return
        }
        if (result.status === 'up-to-date') {
          this.$message.success(
            this.$t('setting.updateAlreadyLatest', {
              version: result.latestVersion
            })
          )
          return
        }
        this.$message.info(this.$t('setting.updateCheckFailed'))
      } catch (error) {
        this.$message.error(error?.message || this.$t('setting.updateCheckFailed'))
      } finally {
        this.checkingForUpdates = false
      }
    }
  }
}
</script>

<style lang="less" scoped>
.workspaceSettings {
  display: grid;
  grid-template-columns: 180px 1fr;
  min-height: 100%;
  background: #fff;
  border-radius: 24px;
  overflow: hidden;
  border: 1px solid rgba(31, 41, 55, 0.08);

  &.isDark {
    background: #111827;
    border-color: rgba(255, 255, 255, 0.08);

    .settingsNav {
      background: #0f172a;
      border-right-color: rgba(255, 255, 255, 0.08);
    }

    .settingsNavItem {
      color: rgba(255, 255, 255, 0.72);

      &:hover {
        background: rgba(255, 255, 255, 0.06);
      }

      &.active {
        background: #3b82f6;
        color: #fff;
      }
    }

    .settingsPanel {
      color: rgba(255, 255, 255, 0.88);
    }

    .settingRow,
    .appInfoCard,
    .guideCard,
    .shortcutGroup,
    .chip {
      background: rgba(255, 255, 255, 0.04);
      border-color: rgba(255, 255, 255, 0.08);
    }

    .sectionDesc,
    .shortcutRow span,
    .guideCard p,
    .recoveryHint {
      color: rgba(255, 255, 255, 0.68);
    }
  }
}

.settingsNav {
  display: flex;
  flex-direction: column;
  gap: 10px;
  padding: 20px 16px;
  background: #f8fafc;
  border-right: 1px solid rgba(31, 41, 55, 0.08);
}

.settingsNavItem {
  border: none;
  background: transparent;
  border-radius: 14px;
  padding: 14px 16px;
  text-align: left;
  font-size: 15px;
  font-weight: 600;
  color: rgba(15, 23, 42, 0.78);
  cursor: pointer;
  transition: all 0.2s ease;

  &:hover {
    background: rgba(59, 130, 246, 0.08);
  }

  &.active {
    background: #3b82f6;
    color: #fff;
  }
}

.settingsPanel {
  padding: 28px 32px;
  overflow: auto;
}

.settingsSection {
  h3 {
    font-size: 28px;
    margin-bottom: 10px;
  }

  h4 {
    font-size: 16px;
    margin-bottom: 12px;
  }
}

.sectionDesc {
  font-size: 14px;
  line-height: 1.7;
  color: rgba(15, 23, 42, 0.62);
  margin-bottom: 18px;
}

.settingRow {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 20px;
  padding: 16px 18px;
  border-radius: 16px;
  border: 1px solid rgba(31, 41, 55, 0.08);
  background: #f8fafc;
  margin-bottom: 14px;

  span {
    font-size: 14px;
    line-height: 1.6;
  }

  &.sliderRow {
    display: block;

    span {
      display: block;
      margin-bottom: 12px;
    }
  }

  &.inlineRow {
    span {
      white-space: nowrap;
    }
  }
}

.appInfoCard,
.guideCard,
.shortcutGroup {
  margin-top: 20px;
  border-radius: 18px;
  border: 1px solid rgba(31, 41, 55, 0.08);
  background: #f8fafc;
  padding: 18px;
}

.guideCard {
  h4 {
    font-size: 16px;
    margin-bottom: 10px;
  }

  p {
    font-size: 13px;
    line-height: 1.8;
    color: rgba(15, 23, 42, 0.62);
  }

  p + p {
    margin-top: 8px;
  }
}

.recoveryInfoCard {
  strong {
    max-width: 70%;
    text-align: right;
    word-break: break-all;
  }
}

.appInfoRow,
.shortcutRow {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 16px;
  padding: 8px 0;
}

.appInfoActions {
  padding-top: 12px;
}

.sidebarReadonlyMetric {
  user-select: none;
  -webkit-user-select: none;
}

.recoveryHint {
  margin: 12px 0 0;
  font-size: 13px;
  line-height: 1.7;
  color: rgba(15, 23, 42, 0.62);
}

.shortcutRow code {
  font-size: 12px;
  padding: 4px 8px;
  border-radius: 999px;
  background: rgba(59, 130, 246, 0.12);
  color: #2563eb;
}

.chipList {
  display: flex;
  flex-wrap: wrap;
  gap: 10px;
}

.chip {
  padding: 10px 14px;
  border-radius: 999px;
  background: #f8fafc;
  border: 1px solid rgba(31, 41, 55, 0.08);
  font-size: 13px;
}
</style>
