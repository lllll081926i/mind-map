<template>
  <div class="workspacePage" :class="{ isDark: isDark }">
    <header class="workspaceHeader">
      <div class="workspaceBrand">
        <div class="brandTitle">{{ $t('home.brandTitle') }}</div>
        <div class="brandMeta">{{ $t('home.brandMeta') }}</div>
      </div>
      <div class="workspaceHeaderActions">
        <button type="button" class="ghostBtn" @click="refreshRecent">
          {{ $t('home.refresh') }}
        </button>
      </div>
    </header>

    <div class="workspaceBody">
      <aside class="workspaceSidebar">
        <div class="quickActionsCard">
          <button type="button" class="primaryAction" @click="createNewFile">
            {{ $t('home.createNew') }}
          </button>
          <button
            type="button"
            class="secondaryAction"
            @click="templateDialogVisible = true"
          >
            {{ $t('home.createFromTemplate') }}
          </button>
        </div>

        <div class="sidebarSection">
          <button type="button" class="sideAction" @click="openLocalFile">
            <span class="iconfont iconwenjian1"></span>
            <span>{{ $t('home.openLocalFile') }}</span>
          </button>
          <button type="button" class="sideAction" @click="openLocalFolder">
            <span class="iconfont icondakai"></span>
            <span>{{ $t('home.openLocalFolder') }}</span>
          </button>
        </div>

        <div v-if="folders.length" class="sidebarSection folderSection">
          <div
            v-for="folder in folders"
            :key="folder.path"
            class="folderItem"
            role="button"
            tabindex="0"
            :aria-label="folder.name"
            :class="{ active: activeFolderPath === folder.path }"
            @click="activeFolderPath = folder.path"
            @keydown.enter.prevent="activeFolderPath = folder.path"
            @keydown.space.prevent="activeFolderPath = folder.path"
          >
            <span class="iconfont icondakai"></span>
            <span class="folderName">{{ folder.name }}</span>
          </div>
        </div>
      </aside>

      <main class="workspaceMain">
        <section class="workspacePanel">
          <div class="panelHeader">
            <div>
              <h2>{{ panelTitle }}</h2>
              <p>{{ panelDescription }}</p>
            </div>
            <div class="panelHeaderActions">
              <el-input
                v-model="searchText"
                :placeholder="$t('home.searchPlaceholder')"
                style="width: 240px"
                @keydown.stop
              />
              <button
                v-if="!activeFolder"
                type="button"
                class="ghostBtn danger"
                @click="clearRecent"
              >
                {{ $t('home.clearRecent') }}
              </button>
            </div>
          </div>

          <div class="workspaceTable">
            <div class="tableHead">
              <span class="cell checkboxCell"></span>
              <span class="cell nameCell">{{ $t('home.tableName') }}</span>
              <span class="cell pathCell">{{ $t('home.tablePath') }}</span>
              <span class="cell actionCell">{{ $t('home.tableAction') }}</span>
            </div>
            <div v-if="displayItems.length === 0" class="emptyState">
              {{ $t('home.empty') }}
            </div>
            <div
              v-for="item in displayItems"
              :key="item.path"
              class="tableRow"
            >
              <span class="cell checkboxCell">
                <span class="checkboxStub"></span>
              </span>
              <span class="cell nameCell">{{ item.name }}</span>
              <span class="cell pathCell" :title="item.path">{{ item.path }}</span>
              <span class="cell actionCell">
                <button type="button" class="rowAction" @click="openItem(item)">
                  {{ $t('home.open') }}
                </button>
              </span>
            </div>
          </div>
        </section>
      </main>
    </div>

    <el-dialog
      v-model="templateDialogVisible"
      width="560px"
      :title="$t('home.templateDialogTitle')"
      append-to-body
    >
      <div class="templateGrid">
        <button
          v-for="item in templates"
          :key="item.key"
          type="button"
          class="templateCard"
          @click="createFromTemplate(item)"
        >
          <strong>{{ item.name }}</strong>
          <span>{{ item.desc }}</span>
        </button>
      </div>
    </el-dialog>
  </div>
</template>

<script>
import { mapState } from 'pinia'
import { useThemeStore } from '@/stores/theme'
import { onBootstrapStateReady } from '@/services/appEvents'
import {
  clearWorkspaceRecentFiles,
  createWorkspaceTemplateData,
  createWorkspaceLocalFile,
  openWorkspaceDirectory,
  openWorkspaceLocalFile,
  openWorkspaceRecentFile,
  refreshWorkspaceRecentFiles
} from '@/services/workspaceActions'

const createTemplateData = title => createWorkspaceTemplateData(title)

export default {
  data() {
    return {
      recentFiles: [],
      folders: [],
      activeFolderPath: '',
      searchText: '',
      templateDialogVisible: false
    }
  },
  computed: {
    ...mapState(useThemeStore, {
      isDark: 'isDark'
    }),
    templates() {
      return ['project', 'study', 'brainstorm'].map(key => ({
        key,
        name: this.$t(`home.templates.${key}.name`),
        desc: this.$t(`home.templates.${key}.desc`)
      }))
    },
    activeFolder() {
      return this.folders.find(item => item.path === this.activeFolderPath) || null
    },
    panelTitle() {
      return this.activeFolder ? this.activeFolder.name : this.$t('home.recentTitle')
    },
    panelDescription() {
      return this.activeFolder
        ? this.$t('home.folderFilesDesc')
        : this.$t('home.recentFilesDesc')
    },
    displayItems() {
      const keyword = this.searchText.trim().toLowerCase()
      const sourceList = this.activeFolder
        ? (this.activeFolder.entries || []).filter(item => item.type === 'file')
        : this.recentFiles
      if (!keyword) return sourceList
      return sourceList.filter(item => {
        return [item.name, item.path].some(value => {
          return String(value || '').toLowerCase().includes(keyword)
        })
      })
    }
  },
  mounted() {
    this.refreshRecent()
    this.removeBootstrapStateReadyListener = onBootstrapStateReady(
      this.refreshRecent
    )
  },
  beforeUnmount() {
    this.removeBootstrapStateReadyListener &&
      this.removeBootstrapStateReadyListener()
  },
  methods: {
    async withAction(action) {
      try {
        await action()
      } catch (error) {
        this.$message.error(error?.message || this.$t('home.fileActionFailed'))
      }
    },

    refreshRecent() {
      this.recentFiles = refreshWorkspaceRecentFiles()
    },

    async createNewFile() {
      await this.withAction(async () => {
        await createWorkspaceLocalFile({
          router: this.$router
        })
      })
    },

    async createFromTemplate(item) {
      await this.withAction(async () => {
        await createWorkspaceLocalFile({
          router: this.$router,
          suggestedName: item.name,
          content: createTemplateData(item.name)
        })
        this.templateDialogVisible = false
      })
    },

    async openLocalFile() {
      await this.withAction(async () => {
        await openWorkspaceLocalFile(this.$router)
      })
    },

    async openItem(item) {
      await this.withAction(async () => {
        await openWorkspaceRecentFile(item, this.$router)
      })
    },

    async openLocalFolder() {
      await this.withAction(async () => {
        const folderPayload = await openWorkspaceDirectory()
        if (!folderPayload) return
        const target = {
          path: folderPayload.directoryRef.path,
          name: folderPayload.directoryRef.name,
          entries: folderPayload.entries || []
        }
        const nextFolders = this.folders.filter(item => item.path !== target.path)
        this.folders = [target, ...nextFolders]
        this.activeFolderPath = target.path
      })
    },

    async clearRecent() {
      await this.withAction(async () => {
        await clearWorkspaceRecentFiles()
        this.refreshRecent()
      })
    }
  }
}
</script>

<style lang="less" scoped>
.workspacePage {
  min-height: 100vh;
  padding: 18px;
  background: #f5f5f5;
  color: rgba(26, 26, 26, 0.88);

  &.isDark {
    background: #1f2329;
    color: hsla(0, 0%, 100%, 0.88);

    .workspaceSidebar,
    .workspacePanel,
    .quickActionsCard,
    .sideAction,
    .folderItem,
    .tableHead,
    .tableRow,
    .sidebarSection {
      background: #2b2f36;
      border-color: hsla(0, 0%, 100%, 0.08);
      color: inherit;
    }

    .ghostBtn,
    .iconBtn,
    .rowAction {
      background: #363b3f;
      border-color: hsla(0, 0%, 100%, 0.1);
      color: inherit;
    }

    .secondaryAction {
      background: #3c8c4a;
    }

    .brandMeta,
    .panelHeader p,
    .emptyState {
      color: hsla(0, 0%, 100%, 0.54);
    }
  }
}

.workspaceHeader {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 20px;
}

.brandTitle {
  font-size: 28px;
  font-weight: 800;
}

.brandMeta {
  margin-top: 6px;
  font-size: 13px;
  color: rgba(15, 23, 42, 0.56);
}

.workspaceHeaderActions {
  display: flex;
  align-items: center;
  gap: 12px;
}

.ghostBtn,
.iconBtn,
.rowAction {
  border: 1px solid rgba(15, 23, 42, 0.08);
  background: rgba(255, 255, 255, 0.82);
  color: inherit;
  border-radius: 14px;
  padding: 10px 14px;
  cursor: pointer;
  transition: all 0.2s ease;
}

.ghostBtn.danger {
  color: #dc2626;
}

.iconBtn {
  display: inline-flex;
  align-items: center;
  gap: 8px;
}

.workspaceBody {
  display: grid;
  grid-template-columns: 320px 1fr;
  gap: 16px;
  min-height: calc(100vh - 96px);
}

.workspaceSidebar {
  display: flex;
  flex-direction: column;
  gap: 12px;
  min-width: 0;
}

.quickActionsCard,
.sidebarSection {
  padding: 14px;
  border-radius: 8px;
  background: #fff;
  border: 1px solid rgba(0, 0, 0, 0.06);
  box-shadow: 0 2px 16px 0 rgba(0, 0, 0, 0.06);
  margin-bottom: 0;
}

.primaryAction,
.secondaryAction {
  width: 100%;
  border: none;
  border-radius: 6px;
  padding: 12px 14px;
  font-size: 14px;
  font-weight: 700;
  cursor: pointer;
}

.primaryAction {
  margin-bottom: 12px;
  background: #3b82f6;
  color: #fff;
}

.secondaryAction {
  background: #84cc16;
  color: #fff;
}

.sideAction,
.folderItem {
  width: 100%;
  display: flex;
  align-items: center;
  gap: 10px;
  border: 1px solid rgba(0, 0, 0, 0.06);
  background: #fff;
  border-radius: 6px;
  padding: 11px 12px;
  cursor: pointer;
  transition: background-color 0.2s ease, border-color 0.2s ease;

  & + & {
    margin-top: 8px;
  }
}

.folderItem.active {
  background: rgba(64, 158, 255, 0.08);
  border-color: rgba(64, 158, 255, 0.24);
}

.folderName {
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.workspaceMain {
  min-width: 0;
}

.workspacePanel {
  border-radius: 8px;
  background: #fff;
  border: 1px solid rgba(0, 0, 0, 0.06);
  box-shadow: 0 2px 16px 0 rgba(0, 0, 0, 0.06);
  min-height: 100%;
  padding: 18px;
}

.panelHeader {
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
  gap: 16px;
  margin-bottom: 18px;

  h2 {
    font-size: 24px;
    margin-bottom: 6px;
  }

  p {
    font-size: 13px;
    color: rgba(26, 26, 26, 0.56);
  }
}

.panelHeaderActions {
  display: flex;
  align-items: center;
  gap: 10px;
}

.workspaceTable {
  border-radius: 8px;
  overflow: hidden;
  border: 1px solid rgba(0, 0, 0, 0.06);
}

.tableHead,
.tableRow {
  display: grid;
  grid-template-columns: 44px minmax(160px, 1fr) minmax(260px, 2fr) 120px;
  align-items: center;
  gap: 16px;
  padding: 14px 16px;
  background: #fff;
}

.tableHead {
  font-size: 13px;
  font-weight: 700;
  color: rgba(26, 26, 26, 0.56);
  border-bottom: 1px solid rgba(0, 0, 0, 0.06);
}

.tableRow {
  border-bottom: 1px solid rgba(0, 0, 0, 0.06);

  &:last-child {
    border-bottom: none;
  }
}

.cell {
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.checkboxStub {
  width: 16px;
  height: 16px;
  display: inline-block;
  border-radius: 4px;
  border: 1px solid rgba(148, 163, 184, 0.8);
}

.emptyState {
  padding: 56px 24px;
  text-align: center;
  color: rgba(26, 26, 26, 0.48);
}

.templateGrid {
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: 14px;
}

.templateCard {
  border: 1px solid rgba(0, 0, 0, 0.08);
  background: #f8f8f8;
  border-radius: 8px;
  padding: 18px;
  text-align: left;
  cursor: pointer;

  strong {
    display: block;
    margin-bottom: 8px;
    font-size: 15px;
  }

  span {
    font-size: 13px;
    line-height: 1.7;
    color: rgba(26, 26, 26, 0.56);
  }
}

@media (max-width: 1080px) {
  .workspaceBody {
    grid-template-columns: 260px 1fr;
  }
}

@media (max-width: 860px) {
  .workspaceBody {
    grid-template-columns: 1fr;
  }
}
</style>
