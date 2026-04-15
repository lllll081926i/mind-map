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
        @keydown.shift.enter.stop.prevent="jumpToPrevResult()"
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
    <div class="searchTips">
      <div class="resultSummary">
        {{
          total > 0
            ? $t('search.resultsSummary', {
                count: total,
                index: activeResultIndex + 1
              })
            : $t('search.idleHint')
        }}
      </div>
      <p>{{ $t('search.usageHint') }}</p>
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
    <div class="searchActions">
      <el-button size="small" :disabled="total <= 0" @click="jumpToPrevResult()">
        {{ $t('search.prevResult') }}
      </el-button>
      <el-button size="small" :disabled="total <= 0" @click="jumpToNextResult()">
        {{ $t('search.nextResult') }}
      </el-button>
    </div>
    <div
      class="searchResultList"
      :style="{ height: searchResultListHeight + 'px' }"
      v-if="showSearchResultList"
    >
      <div
        class="searchResultItem"
        :class="{ active: activeResultIndex === index }"
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
import { onShowSearch } from '@/services/appEvents'
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
      searchedKeyword: '',
      currentIndex: 0,
      total: 0,
      activeResultIndex: -1,
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
      const keyword = this.searchText.trim()
      if (isUndef(this.searchText) || !keyword || keyword !== this.searchedKeyword) {
        this.currentIndex = 0
        this.total = 0
        this.activeResultIndex = -1
        this.showSearchInfo = false
      }
    }
  },
  created() {
    this.removeShowSearchListener = onShowSearch(this.showSearch)
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
    this.removeShowSearchListener && this.removeShowSearchListener()
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
      this.activeResultIndex = data.currentIndex
      this.showSearchInfo = true
    },

    showSearch() {
      this.show = true
      this.$nextTick(() => {
        this.$refs.searchInputRef?.focus()
      })
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
      const keyword = this.searchText.trim()
      if (!keyword) {
        return
      }
      this.showSearchResultList = true
      if (this.total > 0 && keyword === this.searchedKeyword) {
        this.jumpToNextResult()
        return
      }
      this.searchedKeyword = keyword
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
      this.activeResultIndex = -1
      this.searchedKeyword = ''
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
      if (this.searchResultList.length <= 0) {
        this.activeResultIndex = -1
        return
      }
      if (
        this.activeResultIndex < 0 ||
        this.activeResultIndex >= this.searchResultList.length
      ) {
        this.activeResultIndex = 0
      }
    },

    setSearchResultListHeight() {
      this.searchResultListHeight = window.innerHeight - 267 - 24
    },

    jumpToPrevResult() {
      if (this.searchResultList.length <= 0) {
        return
      }
      const nextIndex =
        this.activeResultIndex <= 0
          ? this.searchResultList.length - 1
          : this.activeResultIndex - 1
      this.activeResultIndex = nextIndex
      this.mindMap.search.jump(nextIndex)
    },

    jumpToNextResult() {
      if (this.searchResultList.length <= 0) {
        this.mindMap.search.search(this.searchText)
        return
      }
      const nextIndex =
        this.activeResultIndex >= this.searchResultList.length - 1
          ? 0
          : this.activeResultIndex + 1
      this.activeResultIndex = nextIndex
      this.mindMap.search.jump(nextIndex)
    },

    onSearchResultItemClick(index) {
      this.activeResultIndex = index
      this.mindMap.search.jump(index)
    }
  }
}
</script>

<style lang="less" scoped>
.searchContainer {
  background-color: rgba(255, 255, 255, 0.96);
  padding: 14px;
  width: 312px;
  border-radius: 16px;
  border: 1px solid rgba(15, 23, 42, 0.08);
  box-shadow: 0 20px 44px rgba(15, 23, 42, 0.12);
  position: fixed;
  top: 92px;
  right: -320px;
  transition:
    right 0.24s ease,
    opacity 0.24s ease,
    transform 0.24s ease;
  z-index: 1200;
  backdrop-filter: blur(16px);
  color: rgba(15, 23, 42, 0.9);

  &.isDark {
    background-color: rgba(24, 28, 34, 0.96);
    color: rgba(255, 255, 255, 0.96);
    border-color: rgba(255, 255, 255, 0.08);
    box-shadow: 0 22px 48px rgba(0, 0, 0, 0.32);

    .closeBtnBox {
      color: rgba(255, 255, 255, 0.92);
      background-color: rgba(255, 255, 255, 0.06);
      border-color: rgba(255, 255, 255, 0.08);
    }

    .searchInputBox {
      .searchInfo {
        color: rgba(255, 255, 255, 0.92);
      }
    }

    .searchTips {
      .resultSummary,
      p {
        color: rgba(255, 255, 255, 0.92);
      }
    }

    :deep(.el-input__wrapper) {
      background-color: rgba(255, 255, 255, 0.04);
      box-shadow: 0 0 0 1px rgba(255, 255, 255, 0.08) inset;
    }

    :deep(.el-input__inner),
    :deep(.el-input__inner::placeholder) {
      color: rgba(255, 255, 255, 0.96);
    }

    :deep(.el-input-group__append) {
      background-color: rgba(255, 255, 255, 0.06);
      color: rgba(255, 255, 255, 0.96);
      box-shadow: 0 0 0 1px rgba(255, 255, 255, 0.08) inset;
    }

    :deep(.el-button) {
      background-color: rgba(255, 255, 255, 0.06);
      border-color: rgba(255, 255, 255, 0.08);
      color: rgba(255, 255, 255, 0.96);
    }

    :deep(.el-button:hover),
    :deep(.el-button:focus) {
      background-color: rgba(255, 255, 255, 0.1);
      border-color: rgba(255, 255, 255, 0.14);
      color: #fff;
    }

    :deep(.el-button.is-disabled) {
      background-color: rgba(255, 255, 255, 0.04);
      border-color: rgba(255, 255, 255, 0.08);
      color: rgba(255, 255, 255, 0.42);
    }

    .searchResultList {
      background-color: rgba(24, 28, 34, 0.98);
      border-color: rgba(255, 255, 255, 0.08);

      .searchResultItem {
        color: rgba(255, 255, 255, 0.96);

        &::before {
          background-color: rgba(255, 255, 255, 0.88);
        }

        &.active {
          background-color: hsla(0, 0%, 100%, 0.12);
        }

        &:hover {
          background-color: hsla(0, 0%, 100%, 0.08);
        }
      }

      .empty {
        .text {
          color: rgba(255, 255, 255, 0.92);
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

  .searchTips {
    margin-top: 10px;

    .resultSummary {
      font-size: 12px;
      font-weight: 600;
      color: rgba(15, 23, 42, 0.8);
      margin-bottom: 4px;
    }

    p {
      font-size: 12px;
      line-height: 1.5;
      color: rgba(15, 23, 42, 0.62);
    }
  }

  .searchActions {
    display: flex;
    justify-content: flex-end;
    gap: 8px;
    margin-top: 12px;
  }

  .closeBtnBox {
    position: absolute;
    right: 14px;
    top: 14px;
    width: 28px;
    height: 28px;
    background-color: transparent;
    border: 1px solid rgba(15, 23, 42, 0.08);
    border-radius: 8px;
    display: flex;
    justify-content: center;
    align-items: center;
    cursor: pointer;
    box-shadow: none;
    z-index: 2;
    padding: 0;
    color: rgba(15, 23, 42, 0.78);
    transition:
      background-color 0.2s ease,
      border-color 0.2s ease,
      color 0.2s ease;

    &:hover {
      background-color: rgba(15, 23, 42, 0.06);
      border-color: rgba(15, 23, 42, 0.1);
      color: rgba(15, 23, 42, 0.96);
    }

    .closeBtn {
      font-size: 12px;
      line-height: 1;
    }
  }

  .searchInputBox {
    position: relative;
    padding-right: 40px;

    :deep(.el-input__wrapper) {
      min-height: 40px;
      border-radius: 10px;
      box-shadow: 0 0 0 1px rgba(15, 23, 42, 0.08) inset;
    }

    :deep(.el-input__inner),
    :deep(.el-input__inner::placeholder),
    :deep(.el-input__icon) {
      color: inherit;
    }

    .searchInfo {
      position: absolute;
      right: 82px;
      top: 50%;
      transform: translateY(-50%);
      color: rgba(15, 23, 42, 0.64);
      font-size: 12px;
      font-weight: 600;
    }
  }

  .searchResultList {
    position: absolute;
    left: 0;
    top: 100%;
    width: 100%;
    background-color: #fff;
    border: 1px solid rgba(15, 23, 42, 0.08);
    box-shadow: 0 20px 44px rgba(15, 23, 42, 0.12);
    border-radius: 12px;
    margin-top: 8px;
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

      &.active {
        background-color: rgba(64, 158, 255, 0.12);
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
