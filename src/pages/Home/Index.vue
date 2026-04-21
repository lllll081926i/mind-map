<template>
  <div class="homePage" :class="{ isDark: isDark }">
    <div class="workspaceShell">
      <aside class="workspaceSidebar">
        <div class="sidebarMeta">{{ $t('home.eyebrow') }}</div>
        <div class="sidebarIntro">
          <h1>{{ $t('home.brandTitle') }}</h1>
          <p>{{ $t('home.brandDescription') }}</p>
        </div>

        <div class="actionList">
          <button
            type="button"
            class="primaryAction"
            :disabled="busy"
            @click="createBlankProject"
          >
            <svg viewBox="0 0 24 24" aria-hidden="true">
              <line x1="12" y1="5" x2="12" y2="19"></line>
              <line x1="5" y1="12" x2="19" y2="12"></line>
            </svg>
            <span>{{ $t('home.createNew') }}</span>
          </button>

          <button
            type="button"
            class="secondaryAction"
            :disabled="busy"
            @click="createFlowchart"
          >
            <svg viewBox="0 0 24 24" aria-hidden="true">
              <rect x="4" y="5" width="6" height="4" rx="1"></rect>
              <rect x="14" y="15" width="6" height="4" rx="1"></rect>
              <path d="M10 7h4"></path>
              <path d="M14 17h-4"></path>
              <path d="M12 9v6"></path>
            </svg>
            <span>{{ $t('home.createFlowchart') }}</span>
          </button>

          <button
            type="button"
            class="actionItem"
            :disabled="busy"
            @click="openLocalFile"
          >
            <div class="actionIcon">
              <svg viewBox="0 0 24 24" aria-hidden="true">
                <path
                  d="M13 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V9z"
                ></path>
                <polyline points="13 2 13 9 20 9"></polyline>
              </svg>
            </div>
            <div class="actionText">
              <strong>{{ $t('home.openLocalFile') }}</strong>
              <span>{{ $t('home.openLocalFileDesc') }}</span>
            </div>
          </button>

          <button
            type="button"
            class="actionItem"
            :disabled="busy"
            @click="openLocalDirectory"
          >
            <div class="actionIcon">
              <svg viewBox="0 0 24 24" aria-hidden="true">
                <path
                  d="M22 19a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h5l2 3h9a2 2 0 0 1 2 2z"
                ></path>
              </svg>
            </div>
            <div class="actionText">
              <strong>{{ $t('home.openLocalFolder') }}</strong>
              <span>{{ $t('home.openLocalFolderDesc') }}</span>
            </div>
          </button>
        </div>
      </aside>

      <main class="workspaceMain">
        <section class="resumeSection">
          <div class="resumeHeader">
            <h2>{{ $t('home.continueTitle') }}</h2>
            <span v-if="hasDirtyDraft" class="dirtyBadge">
              {{ $t('home.unsavedBadge') }}
            </span>
          </div>

          <button
            v-if="hasResumeEntry"
            type="button"
            class="resumeCard"
            :disabled="busy"
            @click="continueWorkspace"
          >
            <div class="resumeMain">
              <strong>{{ resumeEntry.title }}</strong>
              <span>{{ resumeEntry.path || $t('home.resumeUnsavedPath') }}</span>
              <em class="resumeHint">
                {{
                  hasDirtyDraft
                    ? $t('home.resumeDirtyHint')
                    : $t('home.resumeReadyHint')
                }}
              </em>
            </div>
            <span class="resumeAction">{{ $t('home.continueAction') }}</span>
          </button>

          <div v-else class="resumeEmpty">
            <p>{{ $t('home.continueEmpty') }}</p>
          </div>
        </section>

        <header class="mainHeader">
          <h2>{{ $t('home.recentTitle') }}</h2>
          <button
            type="button"
            class="textButton"
            :disabled="busy || recentFiles.length <= 0"
            @click="clearRecents"
          >
            {{ $t('home.clearRecents') }}
          </button>
        </header>

        <div v-if="recentFiles.length > 0" class="recentList">
          <button
            v-for="item in recentFiles"
            :key="item.path"
            type="button"
            class="recentItem"
            :disabled="busy"
            @click="openRecent(item)"
          >
            <div class="recentMain">
              <div class="recentTitleRow">
                <strong>{{ resolveRecentTitle(item) }}</strong>
                <em class="recentMode">
                  {{
                    item.documentMode === 'flowchart'
                      ? $t('home.documentModeFlowchart')
                      : $t('home.documentModeMindmap')
                  }}
                </em>
              </div>
              <span>{{ item.path }}</span>
              <em v-if="lastDirectory" class="recentHint">
                {{ $t('home.currentDirectory') }}{{ lastDirectory }}
              </em>
            </div>
            <time class="recentMeta">{{ formatUpdatedAt(item.updatedAt) }}</time>
          </button>
        </div>

        <div v-else class="emptyState">
          <svg viewBox="0 0 24 24" aria-hidden="true">
            <rect x="3" y="3" width="18" height="18" rx="2" ry="2"></rect>
            <line x1="3" y1="9" x2="21" y2="9"></line>
            <line x1="9" y1="21" x2="9" y2="9"></line>
          </svg>
          <p>{{ $t('home.emptyTitle') }}</p>
        </div>

      </main>
    </div>
  </div>
</template>

<script>
import { mapState } from 'pinia'
import { useEditorStore } from '@/stores/editor'
import { useThemeStore } from '@/stores/theme'

let workspaceActionsPromise = null

const loadWorkspaceActions = async () => {
  if (!workspaceActionsPromise) {
    workspaceActionsPromise = import('@/services/workspaceActions')
      .catch(error => {
        workspaceActionsPromise = null
        throw error
      })
  }
  return workspaceActionsPromise
}

export default {
  name: 'HomePage',
  data() {
    return {
      busy: false,
      homeRefreshFrame: 0,
      homeRefreshTimer: 0,
      workspaceWarmupTimer: 0
    }
  },
  computed: {
    ...mapState(useEditorStore, {
      recentFiles: 'recentFiles',
      resumeEntry: 'resumeEntry',
      hasResumeEntry: 'hasResumeEntry',
      hasDirtyDraft: 'hasDirtyDraft',
      lastDirectory: 'lastDirectory'
    }),
    ...mapState(useThemeStore, {
      isDark: 'isDark'
    })
  },
  mounted() {
    this.scheduleRefreshHomeData()
    this.scheduleWarmupWorkspaceActions()
  },
  beforeUnmount() {
    this.clearHomeRefreshTask()
    this.clearWorkspaceWarmupTask()
  },
  methods: {
    clearHomeRefreshTask() {
      if (this.homeRefreshFrame) {
        cancelAnimationFrame(this.homeRefreshFrame)
        this.homeRefreshFrame = 0
      }
      if (this.homeRefreshTimer) {
        clearTimeout(this.homeRefreshTimer)
        this.homeRefreshTimer = 0
      }
    },

    clearWorkspaceWarmupTask() {
      if (this.workspaceWarmupTimer) {
        clearTimeout(this.workspaceWarmupTimer)
        this.workspaceWarmupTimer = 0
      }
    },

    scheduleRefreshHomeData() {
      this.clearHomeRefreshTask()
      this.homeRefreshFrame = requestAnimationFrame(() => {
        this.homeRefreshFrame = 0
        this.homeRefreshTimer = window.setTimeout(() => {
          this.homeRefreshTimer = 0
          void this.refreshHomeData()
        }, 80)
      })
    },

    scheduleWarmupWorkspaceActions() {
      this.clearWorkspaceWarmupTask()
      this.workspaceWarmupTimer = window.setTimeout(() => {
        this.workspaceWarmupTimer = 0
        void loadWorkspaceActions().catch(error => {
          console.warn('warmup workspace actions failed', error)
        })
      }, 160)
    },

    async refreshHomeData() {
      const { refreshWorkspaceRecentFiles } = await loadWorkspaceActions()
      refreshWorkspaceRecentFiles()
    },

    resolveRecentTitle(item) {
      const name = String(item?.name || '').trim()
      return name ? name.replace(/\.[^.]+$/u, '') : this.$t('home.untitledProject')
    },

    formatUpdatedAt(updatedAt) {
      if (!updatedAt) {
        return this.$t('home.justNow')
      }
      try {
        return new Intl.DateTimeFormat('zh-CN', {
          month: '2-digit',
          day: '2-digit',
          hour: '2-digit',
          minute: '2-digit'
        }).format(updatedAt)
      } catch (error) {
        console.error('formatUpdatedAt failed', error)
        return this.$t('home.recentlyUsed')
      }
    },

    async runWorkspaceAction(action) {
      if (this.busy) return
      this.busy = true
      try {
        await action()
        await this.refreshHomeData()
      } catch (error) {
        console.error('workspace action failed', error)
        this.$message.error(error?.message || this.$t('home.actionFailed'))
      } finally {
        this.busy = false
      }
    },

    async createBlankProject() {
      await this.runWorkspaceAction(async () => {
        const { createWorkspaceLocalFile } = await loadWorkspaceActions()
        return createWorkspaceLocalFile({
          router: this.$router
        })
      })
    },

    async createBlankFlowchartProject() {
      await this.runWorkspaceAction(async () => {
        const { createWorkspaceFlowchartFile } = await loadWorkspaceActions()
        return createWorkspaceFlowchartFile({
          router: this.$router
        })
      })
    },

    async createFlowchart() {
      await this.createBlankFlowchartProject()
    },

    async openLocalFile() {
      await this.runWorkspaceAction(async () => {
        const { openWorkspaceLocalFile } = await loadWorkspaceActions()
        return openWorkspaceLocalFile(this.$router)
      })
    },

    async openLocalDirectory() {
      await this.runWorkspaceAction(async () => {
        const { openWorkspaceDirectory } = await loadWorkspaceActions()
        const result = await openWorkspaceDirectory()
        if (!result) return
        this.$message.success(this.$t('home.workspaceRecorded'))
      })
    },

    async continueWorkspace() {
      await this.runWorkspaceAction(async () => {
        const { resumeWorkspaceSession } = await loadWorkspaceActions()
        return resumeWorkspaceSession(this.$router)
      })
    },

    async openRecent(item) {
      await this.runWorkspaceAction(async () => {
        const { openWorkspaceRecentFile } = await loadWorkspaceActions()
        return openWorkspaceRecentFile(item, this.$router)
      })
    },

    async clearRecents() {
      if (this.recentFiles.length <= 0) return
      try {
        await this.$confirm(
          this.$t('home.clearRecentsConfirmMessage'),
          this.$t('home.clearRecentsConfirmTitle'),
          {
            type: 'warning'
          }
        )
      } catch (_error) {
        return
      }
      await this.runWorkspaceAction(async () => {
        const { clearWorkspaceRecentFiles } = await loadWorkspaceActions()
        await clearWorkspaceRecentFiles()
      })
    }
  }
}
</script>

<style lang="less" scoped>
.homePage {
  min-height: 100vh;
  background: #fff;
  color: #111827;
  display: flex;
  flex-direction: column;

  &.isDark {
    background:
      radial-gradient(circle at top left, rgba(64, 158, 255, 0.08), transparent 28%),
      #171a1f;
    color: hsla(0, 0%, 100%, 0.88);

    .workspaceSidebar {
      background: rgba(28, 32, 38, 0.92);
      border-right-color: hsla(0, 0%, 100%, 0.08);
      box-shadow: inset -1px 0 0 hsla(0, 0%, 100%, 0.04);
    }

    .sidebarMeta {
      color: hsla(0, 0%, 100%, 0.46);

      &::before {
        background: rgba(64, 158, 255, 0.72);
      }
    }

    .sidebarIntro p,
    .actionText span,
    .resumeMain span,
    .resumeMain .resumeHint,
    .resumeEmpty p,
    .recentMain span,
    .recentMeta,
    .textButton,
    .emptyState p {
      color: hsla(0, 0%, 100%, 0.56);
    }

    .workspaceMain {
      background:
        linear-gradient(180deg, rgba(255, 255, 255, 0.02), transparent 20%),
        transparent;
    }

    .primaryAction {
      background: #409eff;

      &:hover:not(:disabled) {
        background: #67b1ff;
      }
    }

    .secondaryAction {
      background: rgba(255, 255, 255, 0.05);
      color: hsla(0, 0%, 100%, 0.92);

      &:hover:not(:disabled) {
        background: rgba(255, 255, 255, 0.08);
      }
    }

    .actionItem {
      &:hover:not(:disabled) {
        background: rgba(255, 255, 255, 0.05);
      }
    }

    .actionIcon,
    .recentHint,
    .recentMode {
      color: hsla(0, 0%, 100%, 0.42);
    }

    .actionText strong,
    .resumeHeader h2,
    .resumeMain strong,
    .resumeAction,
    .mainHeader h2,
    .recentMain strong,
    .textButton:hover:not(:disabled) {
      color: hsla(0, 0%, 100%, 0.92);
    }

    .mainHeader {
      border-bottom-color: hsla(0, 0%, 100%, 0.08);
    }

    .resumeCard {
      background: rgba(255, 255, 255, 0.02);
      border-color: hsla(0, 0%, 100%, 0.08);

      &:hover:not(:disabled) {
        background: rgba(255, 255, 255, 0.04);
        border-color: hsla(0, 0%, 100%, 0.14);
      }
    }

    .resumeEmpty {
      border-color: hsla(0, 0%, 100%, 0.1);
    }

    .dirtyBadge {
      background: rgba(251, 191, 36, 0.18);
      color: #fcd34d;
    }

    .recentItem {
      border-bottom-color: hsla(0, 0%, 100%, 0.08);

      &:hover:not(:disabled) {
        .recentMain strong {
          color: #fff;
        }
      }
    }

    .emptyState svg {
      stroke: hsla(0, 0%, 100%, 0.12);
    }
  }
}

.workspaceShell {
  min-height: 100vh;
  display: flex;
}

.workspaceSidebar {
  width: 320px;
  padding: 48px 32px;
  border-right: 1px solid #f0f0f0;
  display: flex;
  flex-direction: column;
  background: #fff;
}

.sidebarMeta {
  font-size: 11px;
  font-weight: 600;
  color: #9ca3af;
  letter-spacing: 0.05em;
  text-transform: uppercase;
  display: flex;
  gap: 6px;
  align-items: center;
  justify-content: flex-start;
  margin-bottom: 12px;

  &::before {
    content: '';
    width: 6px;
    height: 6px;
    border-radius: 50%;
    background: #9ca3af;
    display: inline-block;
  }
}

.sidebarIntro {
  margin-bottom: 48px;

  h1 {
    font-size: 24px;
    font-weight: 600;
    margin-bottom: 8px;
    letter-spacing: -0.03em;
  }

  p {
    font-size: 13px;
    line-height: 1.6;
    color: #4b5563;
  }
}

.actionList {
  display: flex;
  flex-direction: column;
  gap: 4px;
}

.primaryAction {
  width: 100%;
  border: none;
  border-radius: 6px;
  padding: 12px 16px;
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 8px;
  background: #000;
  color: #fff;
  font-size: 14px;
  font-weight: 500;
  cursor: pointer;
  transition: background-color 0.2s ease;
  margin-bottom: 8px;

  svg {
    width: 16px;
    height: 16px;
    fill: none;
    stroke: currentColor;
    stroke-width: 2;
    stroke-linecap: round;
    stroke-linejoin: round;
  }

  &:hover:not(:disabled) {
    background: #333;
  }

  &:disabled {
    opacity: 0.6;
    cursor: default;
  }
}

.secondaryAction {
  width: 100%;
  border: 1px solid #e5e7eb;
  border-radius: 6px;
  padding: 12px 16px;
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 8px;
  background: #f8fafc;
  color: #111827;
  font-size: 14px;
  font-weight: 500;
  cursor: pointer;
  transition: background-color 0.2s ease;
  margin-bottom: 16px;

  svg {
    width: 16px;
    height: 16px;
    fill: none;
    stroke: currentColor;
    stroke-width: 2;
    stroke-linecap: round;
    stroke-linejoin: round;
  }

  &:hover:not(:disabled) {
    background: #eef2f7;
  }

  &:disabled {
    opacity: 0.6;
    cursor: default;
  }
}

.actionItem {
  border: none;
  background: transparent;
  border-radius: 6px;
  padding: 12px;
  display: flex;
  align-items: flex-start;
  gap: 12px;
  text-align: left;
  cursor: pointer;
  transition: background-color 0.2s ease;

  &:hover:not(:disabled) {
    background: #f9fafb;
  }

  &:disabled {
    opacity: 0.6;
    cursor: default;
  }
}

.actionIcon {
  color: #4b5563;
  margin-top: 2px;

  svg {
    width: 18px;
    height: 18px;
    fill: none;
    stroke: currentColor;
    stroke-width: 1.5;
    stroke-linecap: round;
    stroke-linejoin: round;
    display: block;
  }
}

.actionText {
  display: flex;
  flex-direction: column;
  gap: 2px;

  strong {
    font-size: 14px;
    font-weight: 500;
    color: #111827;
  }

  span {
    font-size: 12px;
    color: #9ca3af;
  }
}

.workspaceMain {
  flex: 1;
  padding: 48px 64px;
  display: flex;
  flex-direction: column;
  background: #fff;
  gap: 32px;
}

.resumeSection {
  margin-bottom: 0;
}

.resumeHeader {
  display: flex;
  align-items: center;
  gap: 10px;
  margin-bottom: 12px;

  h2 {
    font-size: 16px;
    font-weight: 500;
    color: #111827;
  }
}

.dirtyBadge {
  display: inline-flex;
  align-items: center;
  height: 22px;
  padding: 0 8px;
  border-radius: 999px;
  background: rgba(245, 158, 11, 0.14);
  color: #b45309;
  font-size: 12px;
  font-weight: 500;
}

.resumeCard {
  width: 100%;
  padding: 16px 18px;
  border: 1px solid #e5e7eb;
  border-radius: 6px;
  background: #fff;
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 16px;
  text-align: left;
  cursor: pointer;
  transition:
    border-color 0.2s ease,
    background-color 0.2s ease;

  &:hover:not(:disabled) {
    border-color: #d1d5db;
    background: #fafafa;
  }

  &:disabled {
    opacity: 0.6;
    cursor: default;
  }
}

.resumeMain {
  min-width: 0;
  display: flex;
  flex-direction: column;
  gap: 6px;

  strong {
    font-size: 15px;
    font-weight: 500;
    color: #111827;
  }

  span,
  .resumeHint {
    font-size: 12px;
    color: #6b7280;
    word-break: break-all;
    font-style: normal;
  }
}

.resumeAction {
  flex-shrink: 0;
  font-size: 13px;
  font-weight: 500;
  color: #111827;
}

.resumeEmpty {
  padding: 16px 18px;
  border: 1px dashed #e5e7eb;
  border-radius: 6px;

  p {
    font-size: 13px;
    color: #9ca3af;
  }
}

.mainHeader {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding-bottom: 16px;
  border-bottom: 1px solid #f0f0f0;
  margin-bottom: 0;

  h2 {
    font-size: 16px;
    font-weight: 500;
    color: #111827;
  }
}

.textButton {
  border: none;
  background: transparent;
  color: #9ca3af;
  font-size: 13px;
  cursor: pointer;
  transition: color 0.2s ease;

  &:hover:not(:disabled) {
    color: #111827;
  }

  &:disabled {
    cursor: default;
    opacity: 0.5;
  }
}

.recentList {
  display: flex;
  flex-direction: column;
  gap: 10px;
  margin-top: -20px;
}

.recentItem {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 16px;
  width: 100%;
  padding: 14px 0;
  border: none;
  border-bottom: 1px solid #f3f4f6;
  background: transparent;
  cursor: pointer;
  text-align: left;

  &:hover:not(:disabled) {
    .recentMain strong {
      color: #000;
    }
  }

  &:disabled {
    opacity: 0.6;
    cursor: default;
  }
}

.recentMain {
  min-width: 0;
  display: flex;
  flex-direction: column;
  gap: 6px;

  strong {
    font-size: 15px;
    font-weight: 500;
    color: #111827;
  }

  span {
    font-size: 12px;
    color: #9ca3af;
    word-break: break-all;
  }
}

.recentTitleRow {
  display: flex;
  align-items: center;
  gap: 8px;
}

.recentMode {
  font-style: normal;
  font-size: 11px;
  line-height: 1;
  padding: 4px 6px;
  border-radius: 999px;
  background: #f3f4f6;
  color: #6b7280;
}

.recentHint {
  font-style: normal;
  font-size: 12px;
  color: #d1d5db;
  word-break: break-all;
}

.recentMeta {
  flex-shrink: 0;
  font-size: 12px;
  color: #9ca3af;
}

.emptyState {
  min-height: 180px;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  text-align: center;

  svg {
    width: 48px;
    height: 48px;
    fill: none;
    stroke: #f0f0f0;
    stroke-width: 1;
    stroke-linecap: round;
    stroke-linejoin: round;
    margin-bottom: 16px;
  }

  p {
    font-size: 14px;
    color: #9ca3af;
  }
}

@media (max-width: 980px) {
  .workspaceShell {
    flex-direction: column;
  }

  .workspaceSidebar {
    width: 100%;
    border-right: none;
    border-bottom: 1px solid #f0f0f0;
  }

}

@media (max-width: 720px) {
  .workspaceSidebar,
  .workspaceMain {
    padding: 20px;
  }

  .mainHeader {
    flex-direction: column;
    align-items: stretch;
  }

  .recentItem {
    flex-direction: column;
    align-items: flex-start;
  }

  .resumeCard {
    flex-direction: column;
    align-items: flex-start;
  }

  .workspaceMain {
    gap: 24px;
  }
}
</style>
