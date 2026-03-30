<template>
  <div id="app">
    <router-view></router-view>
  </div>
</template>

<script>
export default {
  name: 'App',
  mounted() {
    window.addEventListener('keydown', this.handleGlobalTabKeydown, true)
  },
  beforeDestroy() {
    window.removeEventListener('keydown', this.handleGlobalTabKeydown, true)
  },
  methods: {
    isEditableTarget(target) {
      if (!(target instanceof HTMLElement)) return false
      return !!target.closest(
        'input, textarea, [contenteditable="true"], [contenteditable="plaintext-only"]'
      )
    },

    handleGlobalTabKeydown(event) {
      if (event.key !== 'Tab') return
      if (this.isEditableTarget(event.target)) return
      event.preventDefault()
    }
  }
}
</script>

<style lang="less">
* {
  margin: 0;
  padding: 0;
  box-sizing: border-box;
}
#app {
  font-family: Avenir, Helvetica, Arial, sans-serif;
  color: #2c3e50;
}

.customScrollbar {
  &::-webkit-scrollbar {
    width: 7px;
    height: 7px;
  }

  &::-webkit-scrollbar-thumb {
    border-radius: 7px;
    background-color: rgba(0, 0, 0, 0.3);
    cursor: pointer;
  }

  &::-webkit-scrollbar-track {
    box-shadow: none;
    background: transparent;
    display: none;
  }
}

.el-dialog{
  border-radius: 10px;
}

body,
body * {
  user-select: none;
  -webkit-user-select: none;
}

input,
textarea,
[contenteditable='true'],
[contenteditable='true'] *,
[contenteditable='plaintext-only'],
[contenteditable='plaintext-only'] *,
.toastui-editor-contents,
.toastui-editor-contents *,
.toastui-editor-md-container,
.toastui-editor-md-container *,
.toastui-editor-ww-container,
.toastui-editor-ww-container * {
  user-select: text;
  -webkit-user-select: text;
}
</style>
