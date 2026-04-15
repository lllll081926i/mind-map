<template>
  <Sidebar
    ref="sidebar"
    :title="$t('ai.chatTitle')"
    :force-show="activeSidebar === 'ai'"
  >
    <div class="aiChatBox" :class="{ isDark: isDark }">
      <div class="chatHeader">
        <el-button size="small" @click="clear" :disabled="!hasChatMessages">
          {{ $t('ai.clearRecords') }}
        </el-button>
        <el-button size="small" @click="modifyAiConfig">
          {{ $t('ai.modifyAIConfiguration') }}
        </el-button>
      </div>
      <div class="chatResBox customScrollbar" ref="chatResBoxRef">
        <div class="chatEmptyState" v-if="!hasChatMessages">
          <div class="emptyIcon">
            <span class="icon iconfont iconAIshengcheng"></span>
          </div>
          <p class="emptyTitle">{{ $t('ai.chatEmptyTitle') }}</p>
          <p class="emptyDesc">{{ $t('ai.chatEmptyDescription') }}</p>
          <p class="emptyTip">{{ $t('ai.chatInputPlaceholder') }}</p>
          <el-button size="small" @click="modifyAiConfig">
            {{ $t('ai.modifyAIConfiguration') }}
          </el-button>
        </div>
        <div
          class="chatItem"
          v-for="item in chatList"
          :key="item.id"
          :class="[item.type, item.status]"
        >
          <div class="chatItemInner" v-if="item.type === 'user'">
            <div class="avatar">
              <span class="icon">我</span>
            </div>
            <div class="content">{{ item.content }}</div>
          </div>
          <div class="chatItemInner" v-else-if="item.type === 'ai'">
            <div class="avatar">
              <span class="icon iconfont iconAIshengcheng"></span>
            </div>
            <div class="messageMeta">
              <span class="statusTag" v-if="item.status === 'streaming'">
                {{ $t('ai.generatingStatus') }}
              </span>
              <span class="statusTag warning" v-else-if="item.status === 'stopped'">
                {{ $t('ai.stoppedStatus') }}
              </span>
              <span class="statusTag danger" v-else-if="item.status === 'error'">
                {{ $t('ai.failedStatus') }}
              </span>
            </div>
            <div
              class="content"
              v-if="item.content"
              v-html="item.content"
            ></div>
            <div class="content placeholder" v-else>
              {{ $t('ai.generatingPlaceholder') }}
            </div>
          </div>
        </div>
      </div>
      <div class="chatInputBox">
        <div class="chatStatusBar">
          <span class="statusText" :class="{ danger: !!chatError }">
            {{
              isCreating
                ? $t('ai.generatingStatus')
                : chatError || $t('ai.chatFooterTip')
            }}
          </span>
        </div>
        <textarea
          v-model="chatDraftProxy"
          class="customScrollbar"
          :placeholder="$t('ai.chatInputPlaceholder')"
          :disabled="isCreating"
          @keydown="onKeydown"
        ></textarea>
        <div class="chatActions">
          <el-button
            class="btn"
            size="small"
            @click="send"
            :loading="isCreating"
            :disabled="!canSend"
          >
            {{ $t('ai.send') }}
          </el-button>
          <el-button
            class="stop"
            size="small"
            type="warning"
            @click="stop"
            v-show="isCreating"
          >
            {{ $t('ai.stopGenerating') }}
          </el-button>
        </div>
      </div>
    </div>
  </Sidebar>
</template>

<script>
import Sidebar from './Sidebar.vue'
import { mapState } from 'pinia'
import { useAppStore } from '@/stores/app'
import { useAiStore } from '@/stores/ai'
import { useThemeStore } from '@/stores/theme'
import {
  emitAiChat,
  emitAiChatStop,
  emitShowAiConfigDialog
} from '@/services/appEvents'

let md = null
let sanitizeHtml = null
let rendererLoader = null

const escapeHtml = value => {
  return String(value || '')
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;')
}

const renderPlainText = value => {
  return escapeHtml(value).replace(/\r?\n/g, '<br>')
}

const createSanitizer = DOMPurify => html => {
  return DOMPurify.sanitize(html, {
    ALLOWED_TAGS: [
      'p',
      'br',
      'strong',
      'em',
      'u',
      's',
      'code',
      'pre',
      'ul',
      'ol',
      'li',
      'h1',
      'h2',
      'h3',
      'h4',
      'h5',
      'h6',
      'a',
      'blockquote',
      'table',
      'thead',
      'tbody',
      'tr',
      'th',
      'td',
      'span',
      'div',
      'hr'
    ],
    ALLOWED_ATTR: ['href', 'target', 'rel'],
    ALLOW_DATA_ATTR: false,
    ALLOWED_URI_REGEXP: /^(?:https?:|mailto:)/i
  })
}

const ensureRendererReady = async () => {
  if (md && sanitizeHtml) {
    return
  }
  if (!rendererLoader) {
    rendererLoader = Promise.all([import('markdown-it'), import('dompurify')])
      .then(([markdownItModule, domPurifyModule]) => {
        const MarkdownIt = markdownItModule.default || markdownItModule
        const DOMPurify = domPurifyModule.default || domPurifyModule
        md = new MarkdownIt()
        sanitizeHtml = createSanitizer(DOMPurify)
      })
      .catch(error => {
        rendererLoader = null
        throw error
      })
  }
  await rendererLoader
}

export default {
  components: {
    Sidebar
  },
  data() {
    return {
      activeResponseId: 0
    }
  },
  computed: {
    ...mapState(useAiStore, {
      chatList: 'chatList',
      chatStatus: 'chatStatus',
      chatError: 'chatError',
      activeAssistantMessageId: 'activeAssistantMessageId'
    }),
    ...mapState(useThemeStore, {
      isDark: 'isDark'
    }),
    ...mapState(useAppStore, {
      activeSidebar: 'activeSidebar'
    }),
    chatDraftProxy: {
      get() {
        return useAiStore().chatDraft
      },
      set(value) {
        useAiStore().setChatDraft(value)
      }
    },
    hasChatMessages() {
      return this.chatList.length > 0
    },
    isCreating() {
      return this.chatStatus === 'streaming'
    },
    canSend() {
      return !this.isCreating && !!this.chatDraftProxy.trim()
    }
  },
  watch: {
    activeSidebar(value) {
      if (value === 'ai') {
        void this.prepareRenderer()
      }
    }
  },
  created() {
    useAiStore().hydrateChatSession()
  },
  mounted() {
    this.queueScrollToBottom()
    if (this.activeSidebar === 'ai') {
      void this.prepareRenderer()
    }
  },
  methods: {
    getAiStore() {
      return useAiStore()
    },

    queueScrollToBottom() {
      this.$nextTick(() => {
        const box = this.$refs.chatResBoxRef
        if (!box) return
        box.scrollTop = box.scrollHeight
      })
    },

    async prepareRenderer() {
      try {
        await ensureRendererReady()
        this.refreshRenderedMessages()
      } catch (error) {
        console.error('prepareRenderer failed', error)
      }
    },

    refreshRenderedMessages() {
      if (!md || !sanitizeHtml) return
      const aiStore = this.getAiStore()
      this.chatList
        .filter(item => item.type === 'ai')
        .forEach(item => {
          const source = item.rawContent || item.content || ''
          const nextContent = this.renderAiContent(source)
          if (nextContent === item.content) return
          aiStore.updateAssistantMessage({
            id: item.id,
            rawContent: item.rawContent || source,
            content: nextContent,
            status: item.status,
            includeInHistory: item.includeInHistory
          })
        })
    },

    renderAiContent(content) {
      const normalizedContent = String(content || '')
      if (!md || !sanitizeHtml) {
        return renderPlainText(normalizedContent)
      }
      return sanitizeHtml(md.render(normalizedContent))
    },

    onKeydown(e) {
      if (e.keyCode === 13) {
        if (!e.shiftKey) {
          e.preventDefault()
          this.send()
        }
      }
    },

    send() {
      if (this.isCreating) return
      const aiStore = this.getAiStore()
      const text = this.chatDraftProxy.trim()
      if (!text) {
        return
      }
      const historyMsgList = aiStore.getHistoryMessages()
      const assistantId = aiStore.startChatRequest(text)
      const responseId = ++this.activeResponseId
      const messageList = [
        ...historyMsgList,
        {
          role: 'user',
          content: text
        }
      ]
      emitAiChat(
        messageList,
        res => {
          if (responseId !== this.activeResponseId) return
          aiStore.updateAssistantMessage({
            id: assistantId,
            rawContent: res,
            content: this.renderAiContent(res),
            status: 'streaming',
            includeInHistory: !!String(res || '').trim()
          })
          this.queueScrollToBottom()
        },
        content => {
          if (responseId !== this.activeResponseId) return
          aiStore.finishChatRequest({
            id: assistantId,
            rawContent: content,
            content: this.renderAiContent(content)
          })
          this.queueScrollToBottom()
        },
        error => {
          if (responseId !== this.activeResponseId) return
          const message = error?.message || this.$t('ai.generationFailed')
          aiStore.failChatRequest({
            id: assistantId,
            message,
            rawContent: '',
            content: this.renderAiContent(message)
          })
          this.queueScrollToBottom()
          this.$message.error(message)
        }
      )
    },

    stop() {
      this.activeResponseId += 1
      emitAiChatStop()
      this.getAiStore().stopChatRequest({
        id: this.activeAssistantMessageId,
        content: this.renderAiContent(this.$t('ai.chatStoppedTip'))
      })
      this.queueScrollToBottom()
    },

    clear() {
      if (this.isCreating) {
        this.stop()
      }
      this.activeResponseId += 1
      this.getAiStore().clearChatSession()
    },

    modifyAiConfig() {
      emitShowAiConfigDialog()
    }
  }
}
</script>

<style lang="less" scoped>
.aiChatBox {
  width: 100%;
  height: 100%;
  overflow: hidden;
  display: flex;
  flex-direction: column;

  &.isDark {
    .chatHeader,
    .chatInputBox {
      border-color: hsla(0, 0%, 100%, 0.1);
    }

    .chatHeader {
      :deep(.el-button) {
        background-color: #2f3539;
        border-color: rgba(255, 255, 255, 0.12);
        color: hsla(0, 0%, 100%, 0.85);
      }

      :deep(.el-button:hover),
      :deep(.el-button:focus) {
        background-color: #3a4146;
        border-color: rgba(255, 255, 255, 0.2);
        color: #fff;
      }
    }

    .chatResBox {
      .chatEmptyState {
        background-color: rgba(255, 255, 255, 0.02);
        border-color: rgba(255, 255, 255, 0.08);
      }

      .chatItem {
        background-color: rgba(255, 255, 255, 0.02);

        .chatItemInner {
          .avatar {
            background-color: #262a2e;
          }

          :deep(.content) {
            color: hsla(0, 0%, 100%, 0.88);

            code,
            pre {
              background-color: rgba(255, 255, 255, 0.08);
            }
          }
        }
      }
    }

    .chatInputBox {
      textarea {
        background-color: #1f2327;
        color: hsla(0, 0%, 100%, 0.9);
      }

      textarea::placeholder {
        color: hsla(0, 0%, 100%, 0.45);
      }

      .statusText {
        color: hsla(0, 0%, 100%, 0.68);
      }
    }
  }

  .chatHeader {
    height: 50px;
    border-bottom: 1px solid #e8e8e8;
    display: flex;
    align-items: center;
    padding: 0 12px;
  }

  .chatResBox {
    width: 100%;
    height: 100%;
    padding: 0 12px;
    margin: 12px 0;
    overflow-y: auto;
    overflow-x: hidden;

    .chatEmptyState {
      min-height: 180px;
      border: 1px solid #e8e8e8;
      border-radius: 10px;
      padding: 20px 18px;
      display: flex;
      flex-direction: column;
      align-items: flex-start;
      justify-content: center;
      gap: 10px;

      .emptyIcon {
        width: 44px;
        height: 44px;
        border-radius: 12px;
        display: flex;
        align-items: center;
        justify-content: center;
        background: rgba(64, 158, 255, 0.1);
        color: #409eff;
        font-size: 20px;
      }

      .emptyTitle {
        margin: 0;
        color: #1f2329;
        font-size: 15px;
        font-weight: 600;
      }

      .emptyDesc,
      .emptyTip {
        margin: 0;
        font-size: 13px;
        line-height: 1.6;
        color: #637381;
      }
    }

    .chatItem {
      margin-bottom: 20px;
      border: 1px solid;
      position: relative;
      border-radius: 10px;

      &:last-of-type {
        margin-bottom: 0;
      }

      &.ai {
        border-color: #409eff;

        .chatItemInner {
          .avatar {
            border-color: #409eff;
            left: -12px;
            top: -12px;

            .icon {
              color: #409eff;
            }
          }
        }

        &.streaming {
          border-style: dashed;
        }

        &.error {
          border-color: #e45656;
        }

        &.stopped {
          border-color: #e6a23c;
        }
      }

      &.user {
        border-color: #f56c6c;

        .chatItemInner {
          .avatar {
            border-color: #f56c6c;
            right: -12px;
            top: -12px;

            .icon {
              color: #f56c6c;
            }
          }
        }
      }

      .chatItemInner {
        width: 100%;
        padding: 12px;

        .messageMeta {
          display: flex;
          justify-content: flex-end;
          margin-bottom: 8px;
        }

        .statusTag {
          display: inline-flex;
          align-items: center;
          padding: 2px 8px;
          border-radius: 999px;
          background-color: rgba(64, 158, 255, 0.12);
          color: #409eff;
          font-size: 12px;

          &.warning {
            background-color: rgba(230, 162, 60, 0.12);
            color: #e6a23c;
          }

          &.danger {
            background-color: rgba(228, 86, 86, 0.12);
            color: #e45656;
          }
        }

        .avatar {
          width: 30px;
          height: 30px;
          border: 1px solid;
          border-radius: 50%;
          display: flex;
          align-items: center;
          justify-content: center;
          flex-shrink: 0;
          position: absolute;
          background-color: #fff;

          .icon {
            font-size: 18px;
            font-weight: bold;
          }
        }

        :deep(.content) {
          width: 100%;
          overflow: hidden;
          color: #3f4a54;
          font-size: 14px;
          line-height: 1.5;

          &.placeholder {
            color: #7c8a98;
          }

          p {
            margin-bottom: 12px;

            &:last-of-type {
              margin-bottom: 0;
            }
          }

          h1,
          h2,
          h3,
          h4,
          h5,
          h6 {
            margin-top: 24px;
            margin-bottom: 16px;
          }

          code {
            padding: 0.2em 0.4em;
            margin: 0;
            font-size: 85%;
            white-space: break-spaces;
            background-color: rgba(175, 184, 193, 0.2);
            border-radius: 6px;
            font-family:
              ui-monospace,
              SFMono-Regular,
              SF Mono,
              Menlo,
              Consolas,
              Liberation Mono,
              monospace;
          }

          pre {
            padding: 12px;
            background-color: rgba(175, 184, 193, 0.2);

            code {
              background-color: transparent;
              padding: 0;
              overflow: hidden;
            }
          }
        }
      }
    }
  }

  .chatInputBox {
    flex-shrink: 0;
    width: 100%;
    min-height: 176px;
    border-top: 1px solid #e8e8e8;
    padding: 10px 12px 12px;
    display: flex;
    flex-direction: column;
    gap: 10px;

    .chatStatusBar {
      display: flex;
      align-items: center;
      justify-content: space-between;
      min-height: 20px;
    }

    .statusText {
      font-size: 12px;
      line-height: 1.5;
      color: #7c8a98;

      &.danger {
        color: #e45656;
      }
    }

    textarea {
      width: 100%;
      min-height: 96px;
      flex: 1;
      outline: none;
      padding: 12px;
      border: 1px solid rgba(15, 23, 42, 0.08);
      border-radius: 8px;
      resize: none;
    }

    .chatActions {
      display: flex;
      justify-content: flex-end;
      align-items: center;
      gap: 8px;
    }

    .btn,
    .stop {
      position: static;
    }
  }
}
</style>
