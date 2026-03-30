<template>
  <el-dialog
    class="nodeHyperlinkDialog"
    :class="{ isDark: isDark }"
    :title="$t('nodeHyperlink.title')"
    v-model="dialogVisible"
    :width="isMobile ? '90%' : '50%'"
    :top="isMobile ? '20px' : '15vh'"
  >
    <div class="item">
      <span class="name">{{ $t('nodeHyperlink.link') }}</span>
      <el-input
        v-model="link"
        size="mini"
        placeholder="http://xxxx.com/"
        @keyup.stop
        @keydown.stop
        @blur="handleUrl()"
      >
        <template #prepend>
          <el-select v-model="protocol" style="width: 80px;">
            <el-option label="https" value="https"></el-option>
            <el-option label="http" value="http"></el-option>
            <el-option label="无" value="none"></el-option>
          </el-select>
        </template>
      </el-input>
    </div>
    <div class="item">
      <span class="name">{{ $t('nodeHyperlink.name') }}</span>
      <el-input
        v-model="linkTitle"
        size="mini"
        @keyup.stop
        @keydown.stop
      ></el-input>
    </div>
    <template #footer>
      <span class="dialog-footer">
        <el-button @click="cancel">{{ $t('dialog.cancel') }}</el-button>
        <el-button type="primary" @click="confirm">{{
          $t('dialog.confirm')
        }}</el-button>
      </span>
    </template>
  </el-dialog>
</template>

<script>
import { isMobile } from 'simple-mind-map/src/utils/index'
import { mapState } from 'vuex'
import { onShowNodeLink } from '@/services/appEvents'

// 节点超链接内容设置
export default {
  data() {
    return {
      dialogVisible: false,
      link: '',
      linkTitle: '',
      activeNodes: [],
      protocol: 'https',
      isMobile: isMobile()
    }
  },
  computed: {
    ...mapState({
      isDark: state => state.localConfig.isDark
    })
  },
  created() {
    this.$bus.$on('node_active', this.handleNodeActive)
    this.removeShowNodeLinkListener = onShowNodeLink(this.handleShowNodeLink)
  },
  beforeUnmount() {
    this.$bus.$off('node_active', this.handleNodeActive)
    this.removeShowNodeLinkListener && this.removeShowNodeLinkListener()
  },
  methods: {
    syncLinkInfoFromActiveNodes() {
      if (this.activeNodes.length > 0) {
        let firstNode = this.activeNodes[0]
        this.link = firstNode.getData('hyperlink') || ''
        this.handleUrl(true)
        this.linkTitle = firstNode.getData('hyperlinkTitle') || ''
        return
      }
      this.link = ''
      this.linkTitle = ''
      this.protocol = 'https'
    },

    handleNodeActive(...args) {
      this.activeNodes = [...(args[1] || [])]
      this.syncLinkInfoFromActiveNodes()
    },

    removeProtocol(url) {
      return url.replace(/^https?:\/\//, '')
    },

    handleUrl(setProtocolNoneIfNotExist) {
      const res = this.link.match(/^(https?):\/\//)
      if (res && res[1]) {
        this.protocol = res[1]
      } else if (!this.link) {
        this.protocol = 'https'
      } else if (setProtocolNoneIfNotExist) {
        this.protocol = 'none'
      }
      this.link = this.removeProtocol(this.link)
    },

    handleShowNodeLink(payload = {}) {
      if (Array.isArray(payload.activeNodes)) {
        this.activeNodes = [...payload.activeNodes]
      }
      this.syncLinkInfoFromActiveNodes()
      this.dialogVisible = true
    },

    cancel() {
      this.dialogVisible = false
    },

    confirm() {
      this.activeNodes.forEach(node => {
        node.setHyperlink(
          (this.protocol === 'none' ? '' : this.protocol + '://') + this.link,
          this.linkTitle
        )
      })
      this.cancel()
    }
  }
}
</script>

<style lang="less" scoped>
.nodeHyperlinkDialog {
  &.isDark {
    .name {
      color: hsla(0, 0%, 100%, 0.85);
    }
  }

  .item {
    display: flex;
    align-items: center;
    margin-bottom: 10px;

    .name {
      display: block;
      width: 50px;
    }
  }
}
</style>
