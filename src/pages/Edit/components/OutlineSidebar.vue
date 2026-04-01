<template>
  <Sidebar
    ref="sidebar"
    :title="$t('outline.title')"
    :force-show="activeSidebar === 'outline'"
  >
    <div class="btnList">
      <el-tooltip
        class="item"
        effect="dark"
        :content="$t('outline.print')"
        placement="top"
      >
        <div class="btn" @click="onPrint">
          <span class="icon iconfont iconprinting"></span>
        </div>
      </el-tooltip>
      <el-tooltip
        class="item"
        effect="dark"
        :content="$t('outline.fullscreen')"
        placement="top"
      >
        <div
          class="btn"
          :class="{ isDark: isDark }"
          @click="onChangeToOutlineEdit"
        >
          <span class="icon iconfont iconquanping1"></span>
        </div>
      </el-tooltip>
    </div>
    <Outline
      :mindMap="mindMap"
      @scrollTo="onScrollTo"
      ref="outlineRef"
    ></Outline>
  </Sidebar>
</template>

<script>
import Sidebar from './Sidebar.vue'
import { mapState } from 'pinia'
import Outline from './Outline.vue'
import { printOutline } from '@/utils'
import { useAppStore } from '@/stores/app'
import { useThemeStore } from '@/stores/theme'
import { setActiveSidebar, setIsOutlineEdit } from '@/stores/runtime'

// 大纲侧边栏
export default {
  components: {
    Sidebar,
    Outline
  },
  props: {
    mindMap: {
      type: Object
    }
  },
  computed: {
    ...mapState(useThemeStore, {
      isDark: 'isDark'
    }),
    ...mapState(useAppStore, {
      activeSidebar: 'activeSidebar'
    })
  },
  methods: {
    onChangeToOutlineEdit() {
      setActiveSidebar('')
      setIsOutlineEdit(true)
    },

    onScrollTo(y) {
      let container = this.$refs.sidebar.getEl()
      let height = container.offsetHeight
      let top = container.scrollTop
      if (y > top + height) {
        container.scrollTo(0, y - height / 2)
      }
    },

    // 打印
    onPrint() {
      printOutline(this.$refs.outlineRef.$el)
    }
  }
}
</script>

<style lang="less" scoped>
.btnList {
  position: absolute;
  right: 50px;
  top: 12px;
  display: flex;
  align-items: center;

  .btn {
    cursor: pointer;
    margin-left: 12px;

    &.isDark {
      color: #fff;
    }
  }
}
</style>
