<template>
  <div class="homePage">
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
              <strong>{{ resolveRecentTitle(item) }}</strong>
              <span>{{ item.path }}</span>
              <em v-if="directorySummary" class="recentHint">
                {{ $t('home.currentDirectory') }}{{ directorySummary }}
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
import {
  clearWorkspaceRecentFiles,
  createWorkspaceLocalFile,
  openWorkspaceDirectory,
  openWorkspaceLocalFile,
  openWorkspaceRecentFile,
  refreshWorkspaceRecentFiles
} from '@/services/workspaceActions'
import { getWorkspaceMetaState } from '@/services/workspaceState'

export default {
  name: 'HomePage',
  data() {
    return {
      busy: false,
      recentFiles: [],
      directorySummary: ''
    }
  },
  created() {
    this.refreshHomeData()
  },
  methods: {
    refreshHomeData() {
      this.recentFiles = refreshWorkspaceRecentFiles()
      const state = getWorkspaceMetaState()
      this.directorySummary = String(state?.lastDirectory || '')
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
        this.refreshHomeData()
      } catch (error) {
        console.error('workspace action failed', error)
        this.$message.error(error?.message || this.$t('home.actionFailed'))
      } finally {
        this.busy = false
      }
    },

    async createBlankProject() {
      await this.runWorkspaceAction(() =>
        createWorkspaceLocalFile({
          router: this.$router
        })
      )
    },

    async openLocalFile() {
      await this.runWorkspaceAction(() => openWorkspaceLocalFile(this.$router))
    },

    async openLocalDirectory() {
      await this.runWorkspaceAction(async () => {
        const result = await openWorkspaceDirectory()
        if (!result) return
        this.directorySummary = String(result.directoryRef?.path || '')
        this.$message.success(this.$t('home.workspaceRecorded'))
      })
    },

    async openRecent(item) {
      await this.runWorkspaceAction(() =>
        openWorkspaceRecentFile(item, this.$router)
      )
    },

    async clearRecents() {
      await this.runWorkspaceAction(async () => {
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
    background: #333;
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
}

.mainHeader {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding-bottom: 16px;
  border-bottom: 1px solid #f0f0f0;
  margin-bottom: 32px;

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
  flex: 1;
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
}
</style>
