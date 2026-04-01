<template>
  <div class="searchContainer" :class="{ isDark: isDark, show: show }">
    <button
      class="closeBtnBox"
      type="button"
      :title="$t('search.cancel')"
      @click="close"
    >
      <span class="closeBtn iconfont iconguanbi"></span>
    </button>
    <div class="searchInputBox">
      <el-input
        ref="searchInputRef"
        :placeholder="$t('search.searchPlaceholder')"
        size="small"
        v-model="searchText"
        @keyup.enter.stop="onSearchNext"
        @keyup.esc.stop="close"
        @keydown.stop
        @focus="onFocus"
        @blur="onBlur"
      >
        <template #prefix>
          <i class="el-input__icon iconfont iconsousuo"></i>
        </template>
        <template #append v-if="!isUndef(searchText)">
          <el-button size="small" @click="showReplaceInput = true">{{
            $t('search.replace')
          }}</el-button>
        </template>
      </el-input>
      <div class="searchInfo" v-if="showSearchInfo && !isUndef(searchText)">
        {{ currentIndex }} / {{ total }}
      </div>
    </div>
    <el-input
      v-if="showReplaceInput"
      ref="replaceInputRef"
      :placeholder="$t('search.replacePlaceholder')"
      size="small"
      v-model="replaceText"
      style="margin: 12px 0;"
      @keyup.esc.stop="close"
      @keydown.stop
      @focus="onFocus"
      @blur="onBlur"
    >
      <template #prefix>
        <i class="el-input__icon iconfont iconbianji1"></i>
      </template>
      <template #append>
        <el-button size="small" @click="hideReplaceInput">{{
          $t('search.cancel')
        }}</el-button>
      </template>
    </el-input>
    <div class="btnList" v-if="showReplaceInput">
      <el-button size="small" :disabled="isReadonly" @click="replace">{{
        $t('search.replace')
      }}</el-button>
      <el-button size="small" :disabled="isReadonly" @click="replaceAll">{{
        $t('search.replaceAll')
      }}</el-button>
    </div>
    <div
      class="searchResultList"
      :style="{ height: searchResultListHeight + 'px' }"
      v-if="showSearchResultList"
    >
      <div
        class="searchResultItem"
        v-for="(item, index) in searchResultList"
        :key="item.id"
        :title="item.name"
        v-html="item.text"
        @click.stop="onSearchResultItemClick(index)"
      ></div>
      <div class="empty" v-if="searchResultList.length <= 0">
        <span class="iconfont iconwushuju"></span>
        <span class="text">{{ $t('search.noResult') }}</span>
      </div>
    </div>
  </div>
</template>

<script>
import { mapState } from 'pinia'
import { isUndef, getTextFromHtml } from 'simple-mind-map/src/utils/index'
import { useAppStore } from '@/stores/app'
import { useThemeStore } from '@/stores/theme'

// 搜索替换
export default {
  props: {
    mindMap: {
      type: Object
    }
  },
  data() {
    return {
      show: false,
      searchText: '',
      replaceText: '',
      showReplaceInput: false,
      currentIndex: 0,
      total: 0,
      showSearchInfo: false,
      searchResultListHeight: 0,
      searchResultList: [],
      showSearchResultList: false
    }
  },
  computed: {
    ...mapState(useAppStore, {
      isReadonly: 'isReadonly'
    }),
    ...mapState(useThemeStore, {
      isDark: 'isDark'
    })
  },
  watch: {
    searchText() {
      if (isUndef(this.searchText)) {
        this.currentIndex = 0
        this.total = 0
        this.showSearchInfo = false
      }
    }
  },
  created() {
    this.$bus.$on('show_search', this.showSearch)
    this.mindMap.on('search_info_change', this.handleSearchInfoChange)
    this.mindMap.on('node_click', this.blur)
    this.mindMap.on('draw_click', this.blur)
    this.mindMap.on('expand_btn_click', this.blur)
    this.mindMap.on(
      'search_match_node_list_change',
      this.onSearchMatchNodeListChange
    )
    this.mindMap.keyCommand.addShortcut('Control+f', this.showSearch)
    window.addEventListener('resize', this.setSearchResultListHeight)
    this.$bus.$on('setData', this.close)
  },
  mounted() {
    this.setSearchResultListHeight()
  },
  beforeUnmount() {
    this.$bus.$off('show_search', this.showSearch)
    this.mindMap.off('search_info_change', this.handleSearchInfoChange)
    this.mindMap.off('node_click', this.blur)
    this.mindMap.off('draw_click', this.blur)
    this.mindMap.off('expand_btn_click', this.blur)
    this.mindMap.off(
      'search_match_node_list_change',
      this.onSearchMatchNodeListChange
    )
    this.mindMap.keyCommand.removeShortcut('Control+f', this.showSearch)
    window.removeEventListener('resize', this.setSearchResultListHeight)
    this.$bus.$off('setData', this.close)
  },
  methods: {
    isUndef,

    escapeRegExp(text) {
      return text.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')
    },

    escapeHtml(text) {
      return text
        .replace(/&/g, '&amp;')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;')
        .replace(/"/g, '&quot;')
        .replace(/'/g, '&#39;')
    },

    highlightText(text, keyword) {
      if (!keyword) return this.escapeHtml(text)
      const reg = new RegExp(this.escapeRegExp(keyword), 'g')
      let result = ''
      let lastIndex = 0
      let match = reg.exec(text)
      while (match) {
        result += this.escapeHtml(text.slice(lastIndex, match.index))
        result += `<span class="match">${this.escapeHtml(match[0])}</span>`
        lastIndex = match.index + match[0].length
        match = reg.exec(text)
      }
      result += this.escapeHtml(text.slice(lastIndex))
      return result
    },

    handleSearchInfoChange(data) {
      this.currentIndex = data.currentIndex + 1
      this.total = data.total
      this.showSearchInfo = true
    },

    showSearch() {
      this.$bus.$emit('closeSideBar')
      this.show = true
      this.$refs.searchInputRef.focus()
    },

    hideReplaceInput() {
      this.showReplaceInput = false
      this.replaceText = ''
    },

    // 输入框聚焦时，禁止思维导图节点响应按键事件自动进入文本编辑
    onFocus() {
      this.mindMap.updateConfig({
        enableAutoEnterTextEditWhenKeydown: false
      })
    },

    // 输入框失焦时恢复
    onBlur() {
      this.mindMap.updateConfig({
        enableAutoEnterTextEditWhenKeydown: true
      })
    },

    // 画布，节点点击时让输入框失焦
    blur() {
      if (this.$refs.searchInputRef) {
        this.$refs.searchInputRef.blur()
      }
      if (this.$refs.replaceInputRef) {
        this.$refs.replaceInputRef.blur()
      }
    },

    onSearchNext() {
      this.showSearchResultList = true
      this.mindMap.search.search(this.searchText)
    },

    replace() {
      this.mindMap.search.replace(this.replaceText, true)
    },

    replaceAll() {
      this.mindMap.search.replaceAll(this.replaceText)
    },

    close() {
      this.show = false
      this.showSearchResultList = false
      this.showSearchInfo = false
      this.total = 0
      this.currentIndex = 0
      this.searchText = ''
      this.hideReplaceInput()
      this.mindMap.search.endSearch()
    },

    onSearchMatchNodeListChange(list) {
      const keyword = this.searchText.trim()
      this.searchResultList = list.map(item => {
        const data = item.data || item.nodeData.data
        let name = data.text
        const id = data.uid
        if (data.richText) {
          name = getTextFromHtml(name)
        }
        return {
          data: item,
          id,
          text: this.highlightText(name, keyword),
          name
        }
      })
    },

    setSearchResultListHeight() {
      this.searchResultListHeight = window.innerHeight - 267 - 24
    },

    onSearchResultItemClick(index) {
      this.mindMap.search.jump(index)
    }
  }
}
</script>

<style lang="less" scoped>
.searchContainer {
  background-color: #fff;
  padding: 16px;
  width: 296px;
  border-radius: 12px;
  box-shadow: 0 4px 16px 0 rgba(0, 0, 0, 0.1);
  position: fixed;
  top: 110px;
  right: -296px;
  transition: all 0.3s;
  z-index: 1200;

  &.isDark {
    background-color: #363b3f;
    color: hsla(0, 0%, 100%, 0.85);

    .closeBtnBox {
      color: hsla(0, 0%, 100%, 0.85);
      background-color: #2b3034;
      border-color: rgba(255, 255, 255, 0.12);
    }

    .searchInputBox {
      .searchInfo {
        color: hsla(0, 0%, 100%, 0.6);
      }
    }

    :deep(.el-input__wrapper) {
      background-color: #2b3034;
      box-shadow: 0 0 0 1px rgba(255, 255, 255, 0.12) inset;
    }

    :deep(.el-input__inner),
    :deep(.el-input__inner::placeholder) {
      color: hsla(0, 0%, 100%, 0.85);
    }

    :deep(.el-input-group__append) {
      background-color: #2f3539;
      color: hsla(0, 0%, 100%, 0.78);
      box-shadow: 0 0 0 1px rgba(255, 255, 255, 0.12) inset;
    }

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

    :deep(.el-button.is-disabled) {
      background-color: #2b3034;
      border-color: rgba(255, 255, 255, 0.08);
      color: hsla(0, 0%, 100%, 0.35);
    }

    .searchResultList {
      background-color: #363b3f;

      .searchResultItem {
        color: hsla(0, 0%, 100%, 0.85);

        &::before {
          background-color: hsla(0, 0%, 100%, 0.5);
        }

        &:hover {
          background-color: hsla(0, 0%, 100%, 0.08);
        }
      }

      .empty {
        .text {
          color: hsla(0, 0%, 100%, 0.6);
        }
      }
    }
  }

  &.show {
    right: 20px;
  }

  .btnList {
    display: flex;
    justify-content: flex-end;
    gap: 8px;
  }

  .closeBtnBox {
    position: absolute;
    right: -5px;
    top: -5px;
    width: 20px;
    height: 20px;
    background-color: #fff;
    border: 1px solid rgba(0, 0, 0, 0.08);
    border-radius: 50%;
    display: flex;
    justify-content: center;
    align-items: center;
    cursor: pointer;
    box-shadow: 0 4px 16px 0 rgba(0, 0, 0, 0.1);
    z-index: 2;
    padding: 0;

    .closeBtn {
      font-size: 12px;
      line-height: 1;
    }
  }

  .searchInputBox {
    position: relative;

    .searchInfo {
      position: absolute;
      right: 70px;
      top: 50%;
      transform: translateY(-50%);
      color: #909090;
      font-size: 14px;
    }
  }

  .searchResultList {
    position: absolute;
    left: 0;
    top: 100%;
    width: 100%;
    background-color: #fff;
    box-shadow: 0 4px 16px 0 rgba(0, 0, 0, 0.1);
    border-radius: 12px;
    margin-top: 5px;
    overflow-y: auto;
    padding: 12px 0;

    .searchResultItem {
      height: 30px;
      line-height: 30px;
      white-space: nowrap;
      overflow: hidden;
      text-overflow: ellipsis;
      padding: 0 12px;
      font-size: 14px;
      cursor: pointer;
      position: relative;
      padding-left: 22px;

      &::before {
        content: '';
        position: absolute;
        left: 10px;
        top: 50%;
        transform: translateY(-50%);
        width: 5px;
        height: 5px;
        background-color: #606266;
        border-radius: 50%;
      }

      &:hover {
        background-color: #f2f4f7;
      }

      :deep(.match) {
        color: #409eff;
        font-weight: bold;
      }
    }

    .empty {
      width: 100%;
      height: 100%;
      display: flex;
      flex-direction: column;
      align-items: center;
      justify-content: center;

      .iconfont {
        font-size: 50px;
        margin-bottom: 20px;
      }

      .text {
        font-size: 14px;
        color: rgba(26, 26, 26, 0.8);
      }
    }
  }
}
</style>
