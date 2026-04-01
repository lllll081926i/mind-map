<template>
  <Sidebar ref="sidebar" :title="$t('baseStyle.associativeLineStyle')">
    <div class="sidebarContent" :class="{ isDark: isDark }">
      <div class="title noTop">{{ $t('baseStyle.associativeLine') }}</div>
      <div class="row">
        <div class="rowItem">
          <span class="name">{{ $t('baseStyle.associativeLineColor') }}</span>
          <el-popover placement="bottom" trigger="click">
            <template #reference>
              <span
                class="block"
                :style="{ backgroundColor: style.associativeLineColor }"
              ></span>
            </template>
            <Color
              :color="style.associativeLineColor"
              @change="
                color => {
                  update('associativeLineColor', color)
                }
              "
            ></Color>
          </el-popover>
        </div>
        <div class="rowItem">
          <span class="name">{{ $t('baseStyle.associativeLineWidth') }}</span>
          <el-select
            size="small"
            style="width: 80px"
            v-model="style.associativeLineWidth"
            placeholder=""
            @change="
              value => {
                update('associativeLineWidth', value)
              }
            "
          >
            <el-option
              v-for="item in lineWidthList"
              :key="item"
              :label="item"
              :value="item"
            >
              <span
                v-if="item > 0"
                class="borderLine"
                :class="{ isDark: isDark }"
                :style="{ height: item + 'px' }"
              ></span>
            </el-option>
          </el-select>
        </div>
      </div>
      <div class="row">
        <div class="rowItem">
          <span class="name">{{
            $t('baseStyle.associativeLineActiveColor')
          }}</span>
          <el-popover placement="bottom" trigger="click">
            <template #reference>
              <span
                class="block"
                :style="{ backgroundColor: style.associativeLineActiveColor }"
              ></span>
            </template>
            <Color
              :color="style.associativeLineActiveColor"
              @change="
                color => {
                  update('associativeLineActiveColor', color)
                }
              "
            ></Color>
          </el-popover>
        </div>
        <div class="rowItem">
          <span class="name">{{
            $t('baseStyle.associativeLineActiveWidth')
          }}</span>
          <el-select
            size="small"
            style="width: 80px"
            v-model="style.associativeLineActiveWidth"
            placeholder=""
            @change="
              value => {
                update('associativeLineActiveWidth', value)
              }
            "
          >
            <el-option
              v-for="item in lineWidthList"
              :key="item"
              :label="item"
              :value="item"
            >
              <span
                v-if="item > 0"
                class="borderLine"
                :class="{ isDark: isDark }"
                :style="{ height: item + 'px' }"
              ></span>
            </el-option>
          </el-select>
        </div>
      </div>
      <div class="row">
        <div class="rowItem">
          <span class="name">{{ $t('style.style') }}</span>
          <el-select
            size="small"
            style="width: 80px"
            v-model="style.associativeLineDasharray"
            placeholder=""
            @change="
              value => {
                update('associativeLineDasharray', value)
              }
            "
          >
            <el-option
              v-for="item in borderDasharrayList"
              :key="item.value"
              :label="item.name"
              :value="item.value"
            >
              <svg width="120" height="34">
                <line
                  x1="10"
                  y1="17"
                  x2="110"
                  y2="17"
                  stroke-width="2"
                  :stroke="
                    style.associativeLineDasharray === item.value
                      ? '#409eff'
                      : isDark
                        ? '#fff'
                        : '#000'
                  "
                  :stroke-dasharray="item.value"
                ></line>
              </svg>
            </el-option>
          </el-select>
        </div>
      </div>
      <!-- 关联线文字 -->
      <div class="title noTop">{{ $t('baseStyle.associativeLineText') }}</div>
      <div class="row">
        <div class="rowItem">
          <span class="name">{{ $t('baseStyle.fontFamily') }}</span>
          <el-select
            size="small"
            v-model="style.associativeLineTextFontFamily"
            placeholder=""
            @change="update('associativeLineTextFontFamily', $event)"
          >
            <el-option
              v-for="item in fontFamilyList"
              :key="item.value"
              :label="item.name"
              :value="item.value"
              :style="{ fontFamily: item.value }"
              >{{ item.name }}</el-option
            >
          </el-select>
        </div>
      </div>
      <div class="row">
        <div class="rowItem">
          <span class="name">{{ $t('baseStyle.color') }}</span>
          <el-popover placement="bottom" trigger="click">
            <template #reference>
              <span
                class="block"
                :style="{ backgroundColor: style.associativeLineTextColor }"
              ></span>
            </template>
            <Color
              :color="style.associativeLineTextColor"
              @change="
                color => {
                  update('associativeLineTextColor', color)
                }
              "
            ></Color>
          </el-popover>
        </div>
        <div class="rowItem">
          <span class="name">{{ $t('baseStyle.fontSize') }}</span>
          <el-select
            size="small"
            style="width: 80px"
            v-model="style.associativeLineTextFontSize"
            placeholder=""
            @change="update('associativeLineTextFontSize', $event)"
          >
            <el-option
              v-for="item in fontSizeList"
              :key="item"
              :label="item"
              :value="item"
              >{{ item }}</el-option
            >
          </el-select>
        </div>
      </div>
    </div>
  </Sidebar>
</template>

<script>
import Sidebar from './Sidebar.vue'
import Color from './Color.vue'
import {
  lineWidthList,
  fontFamilyList,
  fontSizeList,
  borderDasharrayList
} from '@/config'
import { mapState } from 'pinia'
import { useAppStore } from '@/stores/app'
import { useThemeStore } from '@/stores/theme'
import { setActiveSidebar } from '@/stores/runtime'

const defaultStyle = {
  associativeLineColor: '',
  associativeLineWidth: 0,
  associativeLineActiveWidth: 0,
  associativeLineDasharray: '',
  associativeLineActiveColor: '',
  associativeLineTextFontSize: 0,
  associativeLineTextColor: '',
  associativeLineTextFontFamily: ''
}

export default {
  components: {
    Sidebar,
    Color
  },
  props: {
    mindMap: {
      type: Object
    }
  },
  data() {
    return {
      lineWidthList,
      fontSizeList,
      activeLineNode: null,
      activeLineToNode: null,
      style: {
        ...defaultStyle
      }
    }
  },
  computed: {
    ...mapState(useAppStore, {
      activeSidebar: 'activeSidebar'
    }),
    ...mapState(useThemeStore, {
      isDark: 'isDark'
    }),

    hasActiveLine() {
      return !!this.activeLineNode && !!this.activeLineToNode
    },

    fontFamilyList() {
      return fontFamilyList[this.$i18n.locale] || fontFamilyList.zh
    },

    borderDasharrayList() {
      return borderDasharrayList[this.$i18n.locale] || borderDasharrayList.zh
    }
  },
  watch: {
    activeSidebar: {
      immediate: true,
      handler(val) {
        this.$nextTick(() => {
          if (this.$refs.sidebar) {
            this.$refs.sidebar.show = val === 'associativeLineStyle'
          }
        })
      }
    }
  },
  created() {
    this.mindMap.on('associative_line_click', this.onAssociativeLineClick)
    this.mindMap.on(
      'associative_line_deactivate',
      this.associativeLineDeactivate
    )
  },
  mounted() {
    if (this.activeSidebar === 'associativeLineStyle' && this.$refs.sidebar) {
      this.$refs.sidebar.show = true
    }
  },
  beforeUnmount() {
    this.mindMap.off('associative_line_click', this.onAssociativeLineClick)
    this.mindMap.off(
      'associative_line_deactivate',
      this.associativeLineDeactivate
    )
  },
  methods: {
    onAssociativeLineClick(a, b, node, toNode) {
      this.activeLineNode = node
      this.activeLineToNode = toNode
      const styleConfig = this.mindMap.associativeLine.getStyleConfig(
        node,
        toNode
      )
      Object.keys(this.style).forEach(item => {
        this.style[item] = styleConfig[item]
      })
      setActiveSidebar('associativeLineStyle')
    },

    associativeLineDeactivate() {
      if (this.activeSidebar === 'associativeLineStyle') {
        setActiveSidebar('')
      }
      this.activeLineNode = null
      this.activeLineToNode = null
      this.style = {
        ...defaultStyle
      }
    },

    update(prop, value) {
      if (!this.hasActiveLine) {
        return
      }
      this.style[prop] = value
      const associativeLineStyle =
        this.activeLineNode.getData('associativeLineStyle') || {}
      const toNodeUid = this.activeLineToNode.getData('uid')
      const lineStyle = associativeLineStyle[toNodeUid] || {}
      this.activeLineNode.setData({
        associativeLineStyle: {
          ...associativeLineStyle,
          [toNodeUid]: {
            ...lineStyle,
            ...this.style
          }
        }
      })
      this.mindMap.associativeLine.updateActiveLineStyle()
    }
  }
}
</script>

<style lang="less" scoped>
.sidebarContent {
  padding: 20px;
  padding-top: 10px;

  &.isDark {
    .title {
      color: #fff;
    }

    .row {
      .rowItem {
        .name {
          color: hsla(0, 0%, 100%, 0.6);
        }
      }
    }
  }

  .title {
    font-size: 16px;
    font-family:
      PingFangSC-Medium,
      PingFang SC;
    font-weight: 500;
    color: rgba(26, 26, 26, 0.9);
    margin-bottom: 10px;
    margin-top: 20px;

    &.noTop {
      margin-top: 0;
    }
  }

  .row {
    display: flex;
    justify-content: space-between;
    margin-bottom: 10px;

    .rowItem {
      display: flex;
      align-items: center;
      margin-bottom: 5px;

      .name {
        font-size: 12px;
        margin-right: 10px;
        white-space: nowrap;
      }

      .block {
        display: inline-block;
        width: 30px;
        height: 30px;
        border: 1px solid #dcdfe6;
        border-radius: 4px;
        cursor: pointer;
      }
    }
  }
}

.borderLine {
  display: inline-block;
  width: 100%;
  background-color: #000;

  &.isDark {
    background-color: #fff;
  }
}
</style>
<style lang="less">
.el-select-dropdown__item.selected {
  .borderLine {
    background-color: #409eff;
  }
}
</style>
