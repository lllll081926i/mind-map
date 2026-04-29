<template>
  <div class="flowchartQuickAddBar">
    <button
      v-for="typeItem in nodeTypes"
      :key="typeItem.type"
      type="button"
      class="flowchartQuickAddBtn"
      :aria-label="getTypeLabel(typeItem)"
      :title="getTypeLabel(typeItem)"
      @click="
        $emit('add-node', {
          type: typeItem.type,
          autoConnect: true,
          startInlineEdit: false,
          origin: 'quick-add'
        })
      "
    >
      <svg viewBox="0 0 24 24" aria-hidden="true">
        <path v-if="typeItem.type === 'start'" d="M8 6h8a6 6 0 0 1 0 12H8A6 6 0 0 1 8 6z"></path>
        <path v-else-if="typeItem.type === 'decision'" d="M12 4 20 12 12 20 4 12z"></path>
        <path v-else-if="typeItem.type === 'input'" d="M7 6h13l-3 12H4z"></path>
        <path v-else-if="typeItem.type === 'end'" d="M8 6h8a6 6 0 0 1 0 12H8A6 6 0 0 1 8 6z"></path>
        <path v-else d="M5 7h14v10H5z"></path>
      </svg>
    </button>
  </div>
</template>

<script>
export default {
  name: 'FlowchartQuickAddBar',
  emits: ['add-node'],
  props: {
    nodeTypes: {
      type: Array,
      required: true
    },
    labels: {
      type: Object,
      required: true
    }
  },
  methods: {
    getTypeLabel(typeItem) {
      const keyMap = {
        start: 'addStart',
        process: 'addProcess',
        decision: 'addDecision',
        input: 'addInput',
        end: 'addEnd'
      }
      return this.labels[keyMap[typeItem.type]] || typeItem.label
    }
  }
}
</script>
