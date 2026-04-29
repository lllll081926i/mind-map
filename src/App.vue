<template>
  <div id="app" :class="{ isDark: isDark }">
    <div v-if="renderErrorMessage" class="appErrorBoundary">
      <div class="appErrorCard">
        <div class="appErrorTitle">应用出现异常</div>
        <div class="appErrorMessage">{{ renderErrorMessage }}</div>
        <button type="button" class="appErrorAction" @click="reloadApp">
          重新加载
        </button>
      </div>
    </div>
    <router-view v-else></router-view>
  </div>
</template>

<script>
import { mapState } from 'pinia'
import { useThemeStore } from '@/stores/theme'

export default {
  name: 'App',
  data() {
    return {
      renderErrorMessage: ''
    }
  },
  computed: {
    ...mapState(useThemeStore, {
      isDark: 'isDark'
    })
  },
  watch: {
    isDark: {
      immediate: true,
      handler(value) {
        if (typeof document === 'undefined') return
        document.documentElement.classList.toggle('app-dark-theme', !!value)
        document.body.classList.toggle('app-dark-theme', !!value)
      }
    }
  },
  errorCaptured(error) {
    this.renderErrorMessage =
      error?.message || '界面渲染失败，请重新加载应用。'
    return false
  },
  methods: {
    reloadApp() {
      if (typeof window !== 'undefined' && typeof window.location?.reload === 'function') {
        window.location.reload()
      }
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

.appErrorBoundary,
.appErrorCard,
.appErrorTitle,
.appErrorMessage,
.appErrorAction {
  transition:
    background-color 0.2s ease,
    border-color 0.2s ease,
    color 0.2s ease,
    box-shadow 0.2s ease;
}

.appErrorBoundary {
  min-height: 100vh;
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 24px;
  background: #f8fafc;
}

.appErrorCard {
  width: min(460px, 100%);
  padding: 24px;
  border-radius: 12px;
  border: 1px solid rgba(15, 23, 42, 0.08);
  background: #fff;
  box-shadow: 0 16px 40px rgba(15, 23, 42, 0.1);
}

.appErrorTitle {
  font-size: 18px;
  font-weight: 600;
  color: #0f172a;
}

.appErrorMessage {
  margin-top: 10px;
  line-height: 1.6;
  color: rgba(15, 23, 42, 0.68);
  word-break: break-word;
}

.appErrorAction {
  margin-top: 18px;
  min-width: 112px;
  height: 36px;
  padding: 0 16px;
  border: none;
  border-radius: 8px;
  background: #409eff;
  color: #fff;
  cursor: pointer;
}

#app.isDark {
  color: #e5e7eb;

  .appErrorBoundary {
    background:
      radial-gradient(circle at top left, rgba(96, 165, 250, 0.12), transparent 30%),
      #0f141b;
  }

  .appErrorCard {
    border-color: rgba(255, 255, 255, 0.08);
    background: rgba(20, 25, 33, 0.96);
    box-shadow: 0 24px 56px rgba(0, 0, 0, 0.36);
  }

  .appErrorTitle {
    color: #f8fafc;
  }

  .appErrorMessage {
    color: rgba(226, 232, 240, 0.72);
  }

  .appErrorAction {
    background: #60a5fa;
    color: #08111f;
  }
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

.el-dialog {
  border-radius: 10px;
}
</style>
