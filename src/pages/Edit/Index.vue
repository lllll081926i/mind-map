<template>
  <div
    class="container"
    :class="{ isDark: isDark, activeSidebar: activeSidebar }"
  >
    <template v-if="show">
      <Toolbar v-if="!isZenMode"></Toolbar>
      <Edit></Edit>
      <ExportDialog v-if="isExportRoute"></ExportDialog>
    </template>
  </div>
</template>

<script>
import { defineAsyncComponent } from 'vue'
import { mapState } from 'pinia'
import { useAppStore } from '@/stores/app'
import { useSettingsStore } from '@/stores/settings'
import { useThemeStore } from '@/stores/theme'

const Toolbar = defineAsyncComponent(() => import('./components/Toolbar.vue'))
const Edit = defineAsyncComponent(() => import('./components/Edit.vue'))
const ExportDialog = defineAsyncComponent(() => import('../Export/Index.vue'))

export default {
  components: {
    Toolbar,
    Edit,
    ExportDialog
  },
  data() {
    return {
      show: false
    }
  },
  computed: {
    ...mapState(useSettingsStore, {
      localConfig: 'localConfig'
    }),
    ...mapState(useThemeStore, {
      isDark: 'isDark'
    }),
    ...mapState(useAppStore, {
      activeSidebar: 'activeSidebar'
    }),
    isZenMode() {
      return this.localConfig.isZenMode
    },
    isExportRoute() {
      return this.$route.path === '/export'
    }
  },
  watch: {
    isDark() {
      this.setBodyDark()
    }
  },
  created() {
    this.show = true
    this.setBodyDark()
  },
  methods: {
    setBodyDark() {
      this.isDark
        ? document.body.classList.add('isDark')
        : document.body.classList.remove('isDark')
    }
  }
}
</script>

<style lang="less">
.container {
}

body {
  .el-select__wrapper {
    background-color: #fff;
    color: rgba(26, 26, 26, 0.9);
    box-shadow: 0 0 0 1px #dcdfe6 inset;
  }

  .el-select__selection,
  .el-select__selected-item,
  .el-select__placeholder,
  .el-select__input,
  .el-select__caret,
  .el-select__prefix,
  .el-select__suffix,
  .el-select-dropdown__item {
    color: rgba(26, 26, 26, 0.9);
  }

  .el-select__placeholder.is-transparent {
    color: #909399;
  }

  .el-select-dropdown__item.is-hovering,
  .el-select-dropdown__item.hover,
  .el-select-dropdown__item:hover {
    background-color: #f5f7fa;
  }

  .el-select-dropdown__item.is-selected,
  .el-select-dropdown__item.selected {
    color: #409eff;
    font-weight: 600;
  }

  .el-select__popper.el-popper {
    background-color: #fff;
    border-color: #dcdfe6;
  }

  .el-color-picker__trigger {
    background-color: #fff;
    border-color: #dcdfe6;
  }

  .el-color-picker__color {
    border-color: rgba(26, 26, 26, 0.18);
  }

  .el-select-dropdown,
  .el-popper {
    z-index: 2000 !important;
  }

  &.isDark {
    /* el-button */
    .el-button {
      background-color: #363b3f;
      color: hsla(0, 0%, 100%, 0.9);
      border-color: hsla(0, 0%, 100%, 0.1);
    }

    /* el-input */
    .el-input__inner {
      background-color: #363b3f;
      border-color: hsla(0, 0%, 100%, 0.1);
      color: hsla(0, 0%, 100%, 0.9);
    }

    .el-input.is-disabled .el-input__inner {
      background-color: #363b3f;
      border-color: hsla(0, 0%, 100%, 0.1);
      color: hsla(0, 0%, 100%, 0.3);
    }

    .el-input-group__append,
    .el-input-group__prepend {
      background-color: #363b3f;
      border-color: hsla(0, 0%, 100%, 0.1);
    }

    .el-input-group__append button.el-button {
      color: hsla(0, 0%, 100%, 0.9);
    }

    /* el-select */
    .el-select__wrapper {
      background-color: #36393d;
      color: hsla(0, 0%, 100%, 0.9);
      box-shadow: 0 0 0 1px hsla(0, 0%, 100%, 0.1) inset;
    }

    .el-select__selection,
    .el-select__selected-item,
    .el-select__placeholder,
    .el-select__input,
    .el-select__caret,
    .el-select__prefix,
    .el-select__suffix {
      color: hsla(0, 0%, 100%, 0.9);
    }

    .el-select__placeholder.is-transparent {
      color: hsla(0, 0%, 100%, 0.45);
    }

    .el-select__popper.el-popper,
    .el-select-dropdown {
      background-color: #36393d;
      border-color: hsla(0, 0%, 100%, 0.1);

      .el-select-dropdown__item {
        color: hsla(0, 0%, 100%, 0.78);
      }

      .el-select-dropdown__item.is-selected,
      .el-select-dropdown__item.selected {
        color: #409eff;
      }

      .el-select-dropdown__item.is-hovering,
      .el-select-dropdown__item.hover,
      .el-select-dropdown__item:hover {
        background-color: hsla(0, 0%, 100%, 0.05);
      }
    }

    .el-select .el-input.is-disabled .el-input__inner:hover {
      border-color: hsla(0, 0%, 100%, 0.1);
    }

    .el-color-picker__trigger {
      background-color: #36393d;
      border-color: hsla(0, 0%, 100%, 0.12);
    }

    .el-color-picker__color {
      border-color: hsla(0, 0%, 100%, 0.2);
    }

    .el-color-picker .el-color-picker__empty {
      color: hsla(0, 0%, 100%, 0.72);
    }

    /* el-popper*/
    .el-popper {
      background-color: #36393d;
      border-color: hsla(0, 0%, 100%, 0.1);
    }

    .el-popper[x-placement^='bottom'] .popper__arrow {
      background-color: #36393d;
    }

    .el-popper[x-placement^='bottom'] .popper__arrow::after {
      border-bottom-color: #36393d;
    }

    .el-popper[x-placement^='top'] .popper__arrow {
      background-color: #36393d;
    }

    .el-popper[x-placement^='top'] .popper__arrow::after {
      border-top-color: #36393d;
    }

    /* el-tabs */
    .el-tabs__item {
      color: hsla(0, 0%, 100%, 0.6);

      &:hover,
      &.is-active {
        color: #409eff;
      }
    }

    .el-tabs__nav-wrap::after {
      background-color: hsla(0, 0%, 100%, 0.6);
    }

    /* el-slider */
    .el-slider__runway {
      background-color: hsla(0, 0%, 100%, 0.6);
    }

    /* el-radio-group */
    .el-radio-group {
      .el-radio-button__inner {
        background-color: #36393d;
        color: hsla(0, 0%, 100%, 0.6);
      }

      .el-radio-button__orig-radio:checked + .el-radio-button__inner {
        color: #fff;
        background-color: #409eff;
      }
    }

    /* el-dialog */
    .el-dialog {
      background-color: #262a2e;

      .el-dialog__header {
        border-bottom: 1px solid hsla(0, 0%, 100%, 0.1);
      }

      .el-dialog__title {
        color: hsla(0, 0%, 100%, 0.9);
      }

      .el-dialog__body {
        background-color: #262a2e;
      }

      .el-dialog__footer {
        border-top: 1px solid hsla(0, 0%, 100%, 0.1);
      }
    }

    /* el-upload */
    .el-upload__tip {
      color: #999;
    }

    /* 富文本编辑器 */
    .toastui-editor-main-container {
      background-color: #fff;
    }
  }
}
</style>
