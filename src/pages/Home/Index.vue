<template>
  <div class="homePage">
    <aside class="homeSidebar">
      <div class="brandBlock">
        <span class="brandEyebrow">MindMap</span>
        <h1>桌面工作台</h1>
        <p>更快进入编辑、更快恢复最近项目、更少首屏负担。</p>
      </div>

      <div class="quickActions">
        <button
          type="button"
          class="actionCard primary"
          :disabled="busy"
          @click="createBlankProject"
        >
          <strong>新建项目</strong>
          <span>创建空白思维导图并直接进入编辑页</span>
        </button>
        <button
          type="button"
          class="actionCard"
          :disabled="busy"
          @click="openLocalFile"
        >
          <strong>打开文件</strong>
          <span>读取本地 `.smm` 或 `.json` 文档</span>
        </button>
        <button
          type="button"
          class="actionCard"
          :disabled="busy"
          @click="openLocalDirectory"
        >
          <strong>打开文件夹</strong>
          <span>查看目录内容并记录最近工作区路径</span>
        </button>
      </div>
    </aside>

    <main class="homeMain">
      <header class="mainHeader">
        <div>
          <span class="sectionEyebrow">Recent</span>
          <h2>最近项目</h2>
        </div>
        <button
          type="button"
          class="textButton"
          :disabled="busy || recentFiles.length <= 0"
          @click="clearRecents"
        >
          清空记录
        </button>
      </header>

      <div v-if="directorySummary" class="directoryBanner">
        <strong>最近打开的文件夹</strong>
        <span>{{ directorySummary }}</span>
      </div>

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
          </div>
          <time class="recentMeta">{{ formatUpdatedAt(item.updatedAt) }}</time>
        </button>
      </div>
      <div v-else class="emptyState">
        <strong>还没有最近项目</strong>
        <span>从左侧新建或打开文件后，会在这里保留最近记录。</span>
      </div>
    </main>
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
      return name ? name.replace(/\.[^.]+$/u, '') : '未命名项目'
    },

    formatUpdatedAt(updatedAt) {
      if (!updatedAt) {
        return '刚刚'
      }
      try {
        return new Intl.DateTimeFormat('zh-CN', {
          month: '2-digit',
          day: '2-digit',
          hour: '2-digit',
          minute: '2-digit'
        }).format(updatedAt)
      } catch (_error) {
        return '最近使用'
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
        this.$message.error(error?.message || '操作失败，请稍后重试')
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
        this.$message.success('已记录工作区目录')
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
  display: grid;
  grid-template-columns: 340px minmax(0, 1fr);
  background:
    linear-gradient(135deg, #eef4ff 0%, #f7f9fc 46%, #ffffff 100%);
}

.homeSidebar {
  padding: 28px;
  border-right: 1px solid rgba(15, 23, 42, 0.08);
  background: rgba(255, 255, 255, 0.82);
  backdrop-filter: blur(14px);
}

.brandBlock {
  margin-bottom: 24px;

  h1 {
    margin: 6px 0 10px;
    font-size: 30px;
    line-height: 1.1;
    color: #0f172a;
  }

  p {
    font-size: 14px;
    line-height: 1.7;
    color: rgba(15, 23, 42, 0.62);
  }
}

.brandEyebrow,
.sectionEyebrow {
  display: inline-flex;
  align-items: center;
  height: 24px;
  padding: 0 10px;
  border-radius: 999px;
  background: rgba(59, 130, 246, 0.12);
  color: #2563eb;
  font-size: 12px;
  font-weight: 700;
  letter-spacing: 0.08em;
  text-transform: uppercase;
}

.quickActions {
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.actionCard {
  display: flex;
  flex-direction: column;
  gap: 6px;
  width: 100%;
  padding: 16px 18px;
  border-radius: 16px;
  border: 1px solid rgba(15, 23, 42, 0.08);
  background: #fff;
  color: #0f172a;
  text-align: left;
  cursor: pointer;
  transition: transform 0.2s ease, box-shadow 0.2s ease;

  strong {
    font-size: 16px;
  }

  span {
    font-size: 13px;
    line-height: 1.6;
    color: rgba(15, 23, 42, 0.6);
  }

  &:hover:not(:disabled) {
    transform: translateY(-1px);
    box-shadow: 0 16px 32px rgba(15, 23, 42, 0.08);
  }

  &.primary {
    background: linear-gradient(135deg, #2563eb, #3b82f6);
    border-color: transparent;
    color: #fff;

    span {
      color: rgba(255, 255, 255, 0.82);
    }
  }

  &:disabled {
    opacity: 0.6;
    cursor: default;
  }
}

.homeMain {
  padding: 28px 32px;
}

.mainHeader {
  display: flex;
  align-items: flex-end;
  justify-content: space-between;
  gap: 16px;
  margin-bottom: 18px;

  h2 {
    margin-top: 8px;
    font-size: 28px;
    color: #0f172a;
  }
}

.textButton {
  height: 36px;
  padding: 0 14px;
  border-radius: 999px;
  border: 1px solid rgba(15, 23, 42, 0.08);
  background: #fff;
  cursor: pointer;
}

.directoryBanner {
  display: flex;
  flex-direction: column;
  gap: 6px;
  margin-bottom: 16px;
  padding: 14px 16px;
  border-radius: 14px;
  background: rgba(255, 255, 255, 0.88);
  border: 1px solid rgba(15, 23, 42, 0.08);

  span {
    font-size: 13px;
    line-height: 1.6;
    color: rgba(15, 23, 42, 0.62);
    word-break: break-all;
  }
}

.recentList {
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.recentItem {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 16px;
  width: 100%;
  padding: 16px 18px;
  border-radius: 18px;
  border: 1px solid rgba(15, 23, 42, 0.08);
  background: rgba(255, 255, 255, 0.9);
  cursor: pointer;
  text-align: left;
}

.recentMain {
  min-width: 0;
  display: flex;
  flex-direction: column;
  gap: 6px;

  strong {
    font-size: 16px;
    color: #0f172a;
  }

  span {
    font-size: 13px;
    color: rgba(15, 23, 42, 0.58);
    word-break: break-all;
  }
}

.recentMeta {
  flex-shrink: 0;
  font-size: 12px;
  color: rgba(15, 23, 42, 0.46);
}

.emptyState {
  display: flex;
  flex-direction: column;
  gap: 8px;
  padding: 32px;
  border-radius: 20px;
  border: 1px dashed rgba(15, 23, 42, 0.14);
  background: rgba(255, 255, 255, 0.68);

  strong {
    font-size: 18px;
    color: #0f172a;
  }

  span {
    font-size: 14px;
    line-height: 1.7;
    color: rgba(15, 23, 42, 0.58);
  }
}

@media (max-width: 980px) {
  .homePage {
    grid-template-columns: 1fr;
  }

  .homeSidebar {
    border-right: none;
    border-bottom: 1px solid rgba(15, 23, 42, 0.08);
  }
}

@media (max-width: 720px) {
  .homeSidebar,
  .homeMain {
    padding: 20px;
  }

  .recentItem,
  .mainHeader {
    flex-direction: column;
    align-items: stretch;
  }
}
</style>
