<template>
  <header class="flowchartToolbarShell">
    <div class="flowchartToolbar">
      <div class="flowchartToolbarGroup isPrimary">
        <button type="button" class="flowchartToolbarBtn" @click="$emit('go-home')">
          <span class="flowchartToolbarIcon" aria-hidden="true">
            <svg viewBox="0 0 24 24">
              <path d="M4 10.5 12 4l8 6.5"></path>
              <path d="M6 10v10h12V10"></path>
              <path d="M10 20v-6h4v6"></path>
            </svg>
          </span>
          <span>{{ labels.returnHome }}</span>
        </button>
        <button type="button" class="flowchartToolbarBtn" @click="$emit('save')">
          <span class="flowchartToolbarIcon" aria-hidden="true">
            <svg viewBox="0 0 24 24">
              <path d="M5 5h12l2 2v12H5z"></path>
              <path d="M8 5v6h8V5"></path>
              <path d="M9 17h6"></path>
            </svg>
          </span>
          <span>{{ labels.save }}</span>
        </button>
        <button type="button" class="flowchartToolbarBtn" @click="$emit('save-as')">
          <span class="flowchartToolbarIcon" aria-hidden="true">
            <svg viewBox="0 0 24 24">
              <path d="M5 5h12l2 2v12H5z"></path>
              <path d="M8 5v6h8V5"></path>
              <path d="M12 14v5"></path>
              <path d="m9.5 16.5 2.5 2.5 2.5-2.5"></path>
            </svg>
          </span>
          <span>{{ labels.saveAs }}</span>
        </button>
        <button type="button" class="flowchartToolbarBtn" @click="$emit('import-mind-map-file')">
          <span class="flowchartToolbarIcon" aria-hidden="true">
            <svg viewBox="0 0 24 24">
              <path d="M12 4v11"></path>
              <path d="m7.5 9.5 4.5-4.5 4.5 4.5"></path>
              <path d="M5 19h14"></path>
            </svg>
          </span>
          <span>{{ labels.importMindMapFile }}</span>
        </button>
        <button type="button" class="flowchartToolbarBtn" @click="$emit('open-export')">
          <span class="flowchartToolbarIcon" aria-hidden="true">
            <svg viewBox="0 0 24 24">
              <path d="M12 4v11"></path>
              <path d="m7.5 10.5 4.5 4.5 4.5-4.5"></path>
              <path d="M5 20h14"></path>
            </svg>
          </span>
          <span>{{ labels.exportCenter }}</span>
        </button>
      </div>
      <div class="flowchartToolbarGroup isSecondary">
        <button type="button" class="flowchartToolbarBtn" @click="$emit('convert-mind-map')">
          <span class="flowchartToolbarIcon" aria-hidden="true">
            <svg viewBox="0 0 24 24">
              <circle cx="7" cy="12" r="2"></circle>
              <circle cx="17" cy="7" r="2"></circle>
              <circle cx="17" cy="17" r="2"></circle>
              <path d="M8.8 11.2 15 8.1"></path>
              <path d="m8.8 12.8 6.2 3.1"></path>
            </svg>
          </span>
          <span>{{ labels.convertMindMap }}</span>
        </button>
        <button type="button" class="flowchartToolbarBtn" @click="$emit('tidy-layout')">
          <span class="flowchartToolbarIcon" aria-hidden="true">
            <svg viewBox="0 0 24 24">
              <path d="M5 7h14"></path>
              <path d="M8 12h8"></path>
              <path d="M11 17h2"></path>
            </svg>
          </span>
          <span>{{ labels.tidyLayout }}</span>
        </button>
        <button
          type="button"
          class="flowchartToolbarBtn"
          @click="$emit('toggle-dark')"
        >
          <span class="flowchartToolbarIcon" aria-hidden="true">
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
          </span>
          <span>{{ isDark ? labels.lightMode : labels.darkMode }}</span>
        </button>
        <button
          type="button"
          class="flowchartToolbarBtn"
          :disabled="isGenerating"
          @click="$emit('generate-ai')"
        >
          <span class="flowchartToolbarIcon" aria-hidden="true">
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
          </span>
          <span>{{ labels.aiGenerate }}</span>
        </button>
      </div>
    </div>
  </header>
</template>

<script>
export default {
  name: 'FlowchartToolbar',
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
