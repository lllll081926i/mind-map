<template>
  <header class="flowchartToolbarShell">
    <div class="flowchartToolbar">
      <div class="flowchartToolbarGroup isPrimary">
        <EditorToolbarAction
          action-class="flowchartToolbarBtn"
          icon-class="flowchartToolbarIcon"
          :label="labels.returnHome"
          @action="$emit('go-home')"
        >
          <template #icon>
            <svg viewBox="0 0 24 24">
              <path d="M4 10.5 12 4l8 6.5"></path>
              <path d="M6 10v10h12V10"></path>
              <path d="M10 20v-6h4v6"></path>
            </svg>
          </template>
        </EditorToolbarAction>
        <EditorToolbarAction
          action-class="flowchartToolbarBtn"
          icon-class="flowchartToolbarIcon"
          :label="labels.save"
          @action="$emit('save')"
        >
          <template #icon>
            <svg viewBox="0 0 24 24">
              <path d="M5 5h12l2 2v12H5z"></path>
              <path d="M8 5v6h8V5"></path>
              <path d="M9 17h6"></path>
            </svg>
          </template>
        </EditorToolbarAction>
        <EditorToolbarAction
          action-class="flowchartToolbarBtn"
          icon-class="flowchartToolbarIcon"
          :label="labels.saveAs"
          @action="$emit('save-as')"
        >
          <template #icon>
            <svg viewBox="0 0 24 24">
              <path d="M5 5h12l2 2v12H5z"></path>
              <path d="M8 5v6h8V5"></path>
              <path d="M12 14v5"></path>
              <path d="m9.5 16.5 2.5 2.5 2.5-2.5"></path>
            </svg>
          </template>
        </EditorToolbarAction>
        <EditorToolbarAction
          action-class="flowchartToolbarBtn"
          icon-class="flowchartToolbarIcon"
          :label="labels.importMindMapFile"
          @action="$emit('import-mind-map-file')"
        >
          <template #icon>
            <svg viewBox="0 0 24 24">
              <path d="M12 4v11"></path>
              <path d="m7.5 9.5 4.5-4.5 4.5 4.5"></path>
              <path d="M5 19h14"></path>
            </svg>
          </template>
        </EditorToolbarAction>
        <EditorToolbarAction
          action-class="flowchartToolbarBtn"
          icon-class="flowchartToolbarIcon"
          :label="labels.exportCenter"
          @action="$emit('open-export')"
        >
          <template #icon>
            <svg viewBox="0 0 24 24">
              <path d="M12 4v11"></path>
              <path d="m7.5 10.5 4.5 4.5 4.5-4.5"></path>
              <path d="M5 20h14"></path>
            </svg>
          </template>
        </EditorToolbarAction>
      </div>
      <div class="flowchartToolbarGroup isSecondary">
        <EditorToolbarAction
          action-class="flowchartToolbarBtn"
          icon-class="flowchartToolbarIcon"
          :label="labels.convertMindMap"
          @action="$emit('convert-mind-map')"
        >
          <template #icon>
            <svg viewBox="0 0 24 24">
              <circle cx="7" cy="12" r="2"></circle>
              <circle cx="17" cy="7" r="2"></circle>
              <circle cx="17" cy="17" r="2"></circle>
              <path d="M8.8 11.2 15 8.1"></path>
              <path d="m8.8 12.8 6.2 3.1"></path>
            </svg>
          </template>
        </EditorToolbarAction>
        <EditorToolbarAction
          action-class="flowchartToolbarBtn"
          icon-class="flowchartToolbarIcon"
          :label="labels.tidyLayout"
          @action="$emit('tidy-layout')"
        >
          <template #icon>
            <svg viewBox="0 0 24 24">
              <path d="M5 7h14"></path>
              <path d="M8 12h8"></path>
              <path d="M11 17h2"></path>
            </svg>
          </template>
        </EditorToolbarAction>
        <EditorToolbarAction
          action-class="flowchartToolbarBtn"
          icon-class="flowchartToolbarIcon"
          :label="isDark ? labels.lightMode : labels.darkMode"
          @action="$emit('toggle-dark')"
        >
          <template #icon>
            <svg v-if="isDark" viewBox="0 0 24 24">
              <path d="M18 14.5A7.5 7.5 0 0 1 9.5 6a8 8 0 1 0 8.5 8.5Z"></path>
            </svg>
            <svg v-else viewBox="0 0 24 24">
              <circle cx="12" cy="12" r="4"></circle>
              <path d="M12 2v2.5"></path>
              <path d="M12 19.5V22"></path>
              <path d="m4.9 4.9 1.8 1.8"></path>
              <path d="m17.3 17.3 1.8 1.8"></path>
              <path d="M2 12h2.5"></path>
              <path d="M19.5 12H22"></path>
              <path d="m4.9 19.1 1.8-1.8"></path>
              <path d="m17.3 6.7 1.8-1.8"></path>
            </svg>
          </template>
        </EditorToolbarAction>
        <EditorToolbarAction
          action-class="flowchartToolbarBtn"
          icon-class="flowchartToolbarIcon"
          :label="labels.aiGenerate"
          :disabled="isGenerating"
          @action="$emit('generate-ai')"
        >
          <template #icon>
            <svg viewBox="0 0 24 24">
              <path d="M12 4v4"></path>
              <path d="M12 16v4"></path>
              <path d="M4 12h4"></path>
              <path d="M16 12h4"></path>
              <path d="m6.8 6.8 2.8 2.8"></path>
              <path d="m14.4 14.4 2.8 2.8"></path>
              <path d="m17.2 6.8-2.8 2.8"></path>
              <path d="m9.6 14.4-2.8 2.8"></path>
              <circle cx="12" cy="12" r="2.5"></circle>
            </svg>
          </template>
        </EditorToolbarAction>
      </div>
    </div>
  </header>
</template>

<script>
import EditorToolbarAction from './EditorToolbarAction.vue'

export default {
  name: 'FlowchartToolbar',
  components: {
    EditorToolbarAction
  },
  emits: [
    'go-home',
    'save',
    'save-as',
    'import-mind-map-file',
    'open-export',
    'convert-mind-map',
    'tidy-layout',
    'toggle-dark',
    'generate-ai'
  ],
  props: {
    labels: {
      type: Object,
      required: true
    },
    isGenerating: {
      type: Boolean,
      default: false
    },
    isDark: {
      type: Boolean,
      default: false
    }
  }
}
</script>
