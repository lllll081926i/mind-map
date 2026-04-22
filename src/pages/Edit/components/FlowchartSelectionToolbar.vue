<template>
  <div v-if="selectedNodeCount" class="flowchartSelectionToolbar">
    <button
      v-if="selectedNodeCount > 1"
      type="button"
      class="flowchartSelectionTool"
      :aria-label="labels.alignLeft"
      :title="labels.alignLeft"
      @click="$emit('align-left')"
    >
      <svg viewBox="0 0 24 24" aria-hidden="true">
        <path d="M6 4v16"></path>
        <path d="M10 7h8"></path>
        <path d="M10 12h5"></path>
        <path d="M10 17h8"></path>
      </svg>
    </button>
    <button
      v-if="selectedNodeCount > 2"
      type="button"
      class="flowchartSelectionTool"
      :aria-label="labels.distributeHorizontal"
      :title="labels.distributeHorizontal"
      @click="$emit('distribute-horizontal')"
    >
      <svg viewBox="0 0 24 24" aria-hidden="true">
        <path d="M4 6v12"></path>
        <path d="M20 6v12"></path>
        <path d="M8 12h8"></path>
        <path d="M9 8v8"></path>
        <path d="M15 8v8"></path>
      </svg>
    </button>
    <button
      v-if="selectedNodeCount > 2"
      type="button"
      class="flowchartSelectionTool"
      :aria-label="labels.distributeVertical"
      :title="labels.distributeVertical"
      @click="$emit('distribute-vertical')"
    >
      <svg viewBox="0 0 24 24" aria-hidden="true">
        <path d="M6 4h12"></path>
        <path d="M6 20h12"></path>
        <path d="M12 8v8"></path>
        <path d="M8 9h8"></path>
        <path d="M8 15h8"></path>
      </svg>
    </button>
    <button
      type="button"
      class="flowchartSelectionTool"
      :aria-label="labels.arrangeFront"
      :title="labels.arrangeFront"
      @click="$emit('bring-front')"
    >
      <svg viewBox="0 0 24 24" aria-hidden="true">
        <path d="M8 8h9v9H8z"></path>
        <path d="M5 5h9"></path>
        <path d="M5 5v9"></path>
      </svg>
    </button>
    <button
      type="button"
      class="flowchartSelectionTool"
      :aria-label="labels.arrangeBack"
      :title="labels.arrangeBack"
      @click="$emit('send-back')"
    >
      <svg viewBox="0 0 24 24" aria-hidden="true">
        <path d="M7 7h9v9H7z"></path>
        <path d="M10 10h9v9h-9z"></path>
      </svg>
    </button>
    <button
      type="button"
      class="flowchartSelectionTool"
      :aria-label="labels.duplicate"
      :title="labels.duplicate"
      @click="$emit('duplicate')"
    >
      <svg viewBox="0 0 24 24" aria-hidden="true">
        <path d="M8 8h9v9H8z"></path>
        <path d="M5 5h9v3"></path>
        <path d="M5 5v9h3"></path>
      </svg>
    </button>
    <button
      type="button"
      class="flowchartSelectionTool"
      :aria-label="labels.delete"
      :title="labels.delete"
      @click="$emit('delete')"
    >
      <svg viewBox="0 0 24 24" aria-hidden="true">
        <path d="M6 7h12"></path>
        <path d="M9 7V5h6v2"></path>
        <path d="M9 10v8"></path>
        <path d="M15 10v8"></path>
        <path d="M8 7l1 13h6l1-13"></path>
      </svg>
    </button>
  </div>
</template>

<script>
export default {
  name: 'FlowchartSelectionToolbar',
  emits: [
    'align-left',
    'distribute-horizontal',
    'distribute-vertical',
    'bring-front',
    'send-back',
    'duplicate',
    'delete'
  ],
  props: {
    selectedNodeCount: {
      type: Number,
      default: 0
    },
    labels: {
      type: Object,
      required: true
    }
  }
}
</script>
