<template>
  <div class="workspacePage" :class="{ isDark: isDark }">
    <header class="workspaceHeader">
      <div class="workspaceBrand">
        <div class="brandIcon">
          <span class="iconfont iconwenjian1"></span>
        </div>
        <div class="brandInfo">
          <div class="brandTitle">{{ $t('home.brandTitle') }}</div>
          <div class="brandMeta">{{ $t('home.brandMeta') }}</div>
        </div>
      </div>
      <div class="workspaceHeaderActions">
        <button type="button" class="ghostBtn" @click="refreshRecent">
          <span class="iconfont iconshuaxin"></span>
          {{ $t('home.refresh') }}
        </button>
      </div>
    </header>

    <div class="workspaceBody">
      <aside class="workspaceSidebar">
        <div class="quickActionsCard">
          <h3 class="sidebarTitle">{{ $t('home.quickActions') }}</h3>
          <button type="button" class="primaryAction" @click="createNewFile">
            <span class="actionIcon">+</span>
            <span>{{ $t('home.createNew') }}</span>
          </button>
          <button
            type="button"
            class="secondaryAction"
            @click="templateDialogVisible = true"
          >
            <span class="actionIcon">&#x2605;</span>
            <span>{{ $t('home.createFromTemplate') }}</span>
          </button>
        </div>

        <div class="sidebarSection">
          <div class="sectionLabel">{{ $t('home.openLocal') }}</div>
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
          <div class="sectionLabel">{{ $t('home.folders') }}</div>
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
              <span class="cell nameCell">{{ $t('home.tableName') }}</span>
              <span class="cell pathCell">{{ $t('home.tablePath') }}</span>
              <span class="cell actionCell">{{ $t('home.tableAction') }}</span>
            </div>
            <div v-if="displayItems.length === 0" class="emptyState">
              <div class="emptyIcon">
                <span class="iconfont iconwenjian1"></span>
              </div>
              {{ $t('home.empty') }}
            </div>
            <div
              v-for="item in displayItems"
              :key="item.path"
              class="tableRow"
              role="button"
              tabindex="0"
              @click="openItem(item)"
              @keydown.enter.prevent="openItem(item)"
              @keydown.space.prevent="openItem(item)"
            >
              <span class="cell nameCell">
                <span class="fileIcon">
                  <span class="iconfont iconwenjian1"></span>
                </span>
                <span class="fileName">{{ item.name }}</span>
              </span>
              <span class="cell pathCell" :title="item.path">{{
                item.path
              }}</span>
              <span class="cell actionCell">
                <button
                  type="button"
                  class="rowAction"
                  @click.stop="openItem(item)"
                >
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
      return (
        this.folders.find(item => item.path === this.activeFolderPath) || null
      )
    },
    panelTitle() {
      return this.activeFolder
        ? this.activeFolder.name
        : this.$t('home.recentTitle')
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
          return String(value || '')
            .toLowerCase()
            .includes(keyword)
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
        const nextFolders = this.folders.filter(
          item => item.path !== target.path
        )
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
  padding: 24px;
  background: linear-gradient(180deg, #f8fafc 0%, #f1f5f9 100%);
  color: rgba(26, 26, 26, 0.88);

  &.isDark {
    background: linear-gradient(180deg, #1a1d23 0%, #1f2329 100%);
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

    .sidebarTitle,
    .sectionLabel {
      color: hsla(0, 0%, 100%, 0.72);
    }

    .fileIcon {
      background: rgba(64, 158, 255, 0.12);
      color: #409eff;
    }

    .emptyIcon span {
      color: hsla(0, 0%, 100%, 0.24);
    }
  }
}

.workspaceHeader {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 24px;
  padding: 0 4px;
}

.workspaceBrand {
  display: flex;
  align-items: center;
  gap: 14px;
}

.brandIcon {
  width: 48px;
  height: 48px;
  display: flex;
  align-items: center;
  justify-content: center;
  border-radius: 12px;
  background: linear-gradient(135deg, #3b82f6, #6366f1);
  color: #fff;
  font-size: 22px;
  box-shadow: 0 4px 12px rgba(59, 130, 246, 0.3);
}

.brandInfo {
  display: flex;
  flex-direction: column;
  gap: 2px;
}

.brandTitle {
  font-size: 26px;
  font-weight: 800;
  letter-spacing: -0.02em;
}

.brandMeta {
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
  display: inline-flex;
  align-items: center;
  gap: 6px;
  border: 1px solid rgba(15, 23, 42, 0.08);
  background: rgba(255, 255, 255, 0.82);
  color: inherit;
  border-radius: 10px;
  padding: 8px 14px;
  font-size: 13px;
  font-weight: 500;
  cursor: pointer;
  transition: all 0.2s ease;

  &:hover {
    background: rgba(255, 255, 255, 1);
    border-color: rgba(15, 23, 42, 0.15);
    transform: translateY(-1px);
    box-shadow: 0 2px 8px rgba(0, 0, 0, 0.06);
  }
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
  grid-template-columns: 300px 1fr;
  gap: 20px;
  min-height: calc(100vh - 120px);
}

.workspaceSidebar {
  display: flex;
  flex-direction: column;
  gap: 12px;
  min-width: 0;
}

.quickActionsCard,
.sidebarSection {
  padding: 16px;
  border-radius: 12px;
  background: #fff;
  border: 1px solid rgba(0, 0, 0, 0.06);
  box-shadow: 0 2px 12px 0 rgba(0, 0, 0, 0.04);
  transition: box-shadow 0.2s ease;

  &:hover {
    box-shadow: 0 4px 20px 0 rgba(0, 0, 0, 0.08);
  }
}

.sidebarTitle {
  margin: 0 0 12px;
  font-size: 12px;
  font-weight: 700;
  text-transform: uppercase;
  letter-spacing: 0.06em;
  color: rgba(26, 26, 26, 0.6);
}

.sectionLabel {
  margin: 0 0 10px;
  font-size: 12px;
  font-weight: 700;
  text-transform: uppercase;
  letter-spacing: 0.06em;
  color: rgba(26, 26, 26, 0.5);
}

.primaryAction,
.secondaryAction {
  width: 100%;
  display: flex;
  align-items: center;
  gap: 10px;
  border: none;
  border-radius: 8px;
  padding: 12px 14px;
  font-size: 14px;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.2s ease;

  &:hover {
    transform: translateY(-1px);
    box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
  }
}

.actionIcon {
  font-size: 16px;
  font-weight: 700;
  line-height: 1;
}

.primaryAction {
  margin-bottom: 10px;
  background: linear-gradient(135deg, #3b82f6, #2563eb);
  color: #fff;
}

.secondaryAction {
  background: linear-gradient(135deg, #84cc16, #65a30d);
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
  border-radius: 8px;
  padding: 10px 12px;
  font-size: 13px;
  cursor: pointer;
  transition: all 0.2s ease;

  &:hover {
    background: #f8fafc;
    border-color: rgba(64, 158, 255, 0.2);
    transform: translateX(2px);
  }

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
  border-radius: 12px;
  background: #fff;
  border: 1px solid rgba(0, 0, 0, 0.06);
  box-shadow: 0 2px 12px 0 rgba(0, 0, 0, 0.04);
  min-height: 100%;
  padding: 24px;
}

.panelHeader {
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
  gap: 16px;
  margin-bottom: 20px;

  h2 {
    font-size: 22px;
    font-weight: 700;
    margin: 0 0 4px;
    letter-spacing: -0.01em;
  }

  p {
    font-size: 13px;
    color: rgba(26, 26, 26, 0.56);
    margin: 0;
  }
}

.panelHeaderActions {
  display: flex;
  align-items: center;
  gap: 10px;
}

.workspaceTable {
  border-radius: 10px;
  overflow: hidden;
  border: 1px solid rgba(0, 0, 0, 0.06);
}

.tableHead,
.tableRow {
  display: grid;
  grid-template-columns: 1fr minmax(260px, 2fr) 100px;
  align-items: center;
  gap: 16px;
  padding: 12px 16px;
  background: #fff;
}

.tableHead {
  font-size: 12px;
  font-weight: 700;
  text-transform: uppercase;
  letter-spacing: 0.04em;
  color: rgba(26, 26, 26, 0.5);
  border-bottom: 1px solid rgba(0, 0, 0, 0.06);
  background: #fafbfc;
}

.tableRow {
  border-bottom: 1px solid rgba(0, 0, 0, 0.04);
  cursor: pointer;
  transition: all 0.15s ease;

  &:hover {
    background: #f8fafc;
  }

  &:last-child {
    border-bottom: none;
  }
}

.cell {
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.nameCell {
  display: flex;
  align-items: center;
  gap: 10px;
}

.fileIcon {
  width: 32px;
  height: 32px;
  display: flex;
  align-items: center;
  justify-content: center;
  border-radius: 8px;
  background: rgba(64, 158, 255, 0.08);
  color: #409eff;
  font-size: 14px;
  flex-shrink: 0;
}

.fileName {
  font-weight: 500;
  overflow: hidden;
  text-overflow: ellipsis;
}

.pathCell {
  color: rgba(26, 26, 26, 0.56);
  font-size: 13px;
}

.emptyState {
  padding: 64px 24px;
  text-align: center;
  color: rgba(26, 26, 26, 0.48);
  font-size: 14px;
}

.emptyIcon {
  margin-bottom: 12px;

  span {
    font-size: 48px;
    color: rgba(26, 26, 26, 0.12);
  }
}

.templateGrid {
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: 14px;
}

.templateCard {
  border: 1px solid rgba(0, 0, 0, 0.08);
  background: #f8f8f8;
  border-radius: 10px;
  padding: 18px;
  text-align: left;
  cursor: pointer;
  transition: all 0.2s ease;

  &:hover {
    border-color: rgba(64, 158, 255, 0.3);
    background: #fff;
    transform: translateY(-2px);
    box-shadow: 0 4px 12px rgba(0, 0, 0, 0.08);
  }

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
