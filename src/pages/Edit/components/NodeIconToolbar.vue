<template>
  <Teleport to="body">
    <div
      class="nodeIconToolbar"
      ref="nodeIconToolbar"
      :style="style"
      @click.stop.passive
      v-show="showNodeIconToolbar"
    >
      <div class="iconListBox">
        <div
          class="icon"
          v-for="icon in iconList"
          :key="icon.name"
          v-html="getHtml(icon.icon)"
          :class="{
            selected: nodeIconList.includes(iconType + '_' + icon.name)
          }"
          @click="setIcon(icon.name)"
        ></div>
      </div>
      <div class="btnBox">
        <span class="btn iconfont iconshanchu" @click="deleteIcon"></span>
      </div>
    </div>
  </Teleport>
</template>
  
<script>
import { nodeIconList as _nodeIconList } from 'simple-mind-map/src/svg/icons'
import { mapState } from 'pinia'
import { useAppStore } from '@/stores/app'
import { setActiveSidebar } from '@/stores/runtime'

export default {
  props: {
    mindMap: {
      type: Object
    }
  },
  data() {
    return {
      showNodeIconToolbar: false,
      style: {
        left: 0,
        top: 0
      },
      node: null,
      iconType: '',
      iconName: '',
      nodeIconList: [],
      iconList: [],
      allIconList: [..._nodeIconList],
      iconLoaded: false
    }
  },
  computed: {
    ...mapState(useAppStore, {
      activeSidebar: 'activeSidebar'
    })
  },
  created() {
    this.mindMap.on('node_icon_click', this.show)
    this.mindMap.on('draw_click', this.close)
    this.mindMap.on('svg_mousedown', this.close)
    this.mindMap.on('node_dblclick', this.close)
    this.mindMap.on('node_active', this.onNodeActive)
    this.mindMap.on('scale', this.onScale)
    this.$bus.$on('close_node_icon_toolbar', this.close)
  },
  beforeUnmount() {
    this.mindMap.off('node_icon_click', this.show)
    this.mindMap.off('draw_click', this.close)
    this.mindMap.off('svg_mousedown', this.close)
    this.mindMap.off('node_dblclick', this.close)
    this.mindMap.off('node_active', this.onNodeActive)
    this.mindMap.off('scale', this.onScale)
    this.$bus.$off('close_node_icon_toolbar', this.close)
  },
  methods: {
    async ensureIconListLoaded() {
      if (this.iconLoaded) return
      const { default: icon } = await import('@/config/icon')
      this.allIconList = [..._nodeIconList, ...(icon || [])]
      this.mindMap?.updateConfig?.({
        iconList: [...(icon || [])]
      })
      this.iconLoaded = true
    },

    async show(node, icon = '') {
      await this.ensureIconListLoaded()
      const [iconType = '', iconName = ''] = icon.split('_')
      const iconGroup = this.allIconList.find(item => item.type === iconType)
      this.node = node
      this.iconType = iconType
      this.iconName = iconName
      this.nodeIconList = [...(node.getData('icon') || [])]
      this.iconList = Array.isArray(iconGroup?.list) ? [...iconGroup.list] : []
      if (!this.iconType || this.iconList.length <= 0) {
        this.close()
        return
      }
      this.updatePos()
      this.showNodeIconToolbar = true
      if (this.activeSidebar === 'nodeIconSidebar') {
        setActiveSidebar('')
      }
    },

    close() {
      this.showNodeIconToolbar = false
      this.node = null
      this.iconType = ''
      this.iconName = ''
      this.nodeIconList = []
      this.iconList = []
      this.style.left = 0
      this.style.top = 0
    },

    updatePos() {
      if (!this.node) return
      const rect = this.node.getRect()
      this.style.left = rect.x + 'px'
      this.style.top = rect.y + rect.height + 'px'
    },

    onScale() {
      this.updatePos()
    },

    onNodeActive(...args) {
      const activeNodes = Array.isArray(args[1])
        ? args[1]
        : args[0]
          ? [args[0]]
          : []
      if (this.node && activeNodes.includes(this.node)) {
        return
      }
      this.close()
    },

    deleteIcon() {
      this.setIcon(this.iconName)
      this.close()
    },

    // 获取图标渲染方式
    getHtml(icon) {
      return /^<svg/.test(icon) ? icon : `<img src="${icon}" />`
    },

    // 设置icon
    setIcon(name) {
      if (!this.node || !this.iconType) return
      let key = this.iconType + '_' + name
      let index = this.nodeIconList.findIndex(item => {
        return item === key
      })
      // 删除icon
      if (index !== -1) {
        this.nodeIconList.splice(index, 1)
      } else {
        let typeIndex = this.nodeIconList.findIndex(item => {
          return item.split('_')[0] === this.iconType
        })
        // 替换icon
        if (typeIndex !== -1) {
          this.nodeIconList.splice(typeIndex, 1, key)
          this.iconName = name
        } else {
          // 增加icon
          this.nodeIconList.push(key)
        }
      }
      this.node.setIcon([...this.nodeIconList])
    }
  }
}
</script>
  
<style lang="less" scoped>
.nodeIconToolbar {
    position: fixed;
    z-index: 2000;
    width: 210px;
    max-height: 170px;
    background: #fff;
    border: 1px solid rgba(0, 0, 0, 0.06);
    border-radius: 8px;
    box-shadow: 0 2px 16px 0 rgba(0, 0, 0, 0.06);
    display: flex;
    flex-direction: column;
    overflow: hidden;

    .iconListBox {
        width: 100%;
        height: 180px;
        overflow-y: auto;
        padding: 10px;

        .icon {
            width: 24px;
            height: 24px;
            margin: 5px;
            cursor: pointer;
            position: relative;
            float: left;

            :deep(img) {
                width: 100%;
                height: 100%;
            }

            :deep(svg) {
                width: 100%;
                height: 100%;
            }

            &.selected {
                &::after {
                    content: '';
                    position: absolute;
                    left: -4px;
                    top: -4px;
                    width: 28px;
                    height: 28px;
                    border-radius: 50%;
                    border: 2px solid #409eff;
                }
            }
        }
    }

    .btnBox {
        width: 100%;
        height: 30px;
        display: flex;
        justify-content: center;
        align-items: center;
        border-top: 1px solid #eee;
        flex-shrink: 0;

        .btn {
            cursor: pointer;
            color: rgba(26, 26, 26, 0.8);
        }
    }
}
</style>
  
