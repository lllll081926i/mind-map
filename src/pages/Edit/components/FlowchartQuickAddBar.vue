<template>
  <div class="flowchartQuickAddBar">
    <label
      class="flowchartQuickShapeSearch"
      :title="labels.shapeSearchPlaceholder"
    >
      <svg viewBox="0 0 24 24" aria-hidden="true">
        <circle cx="11" cy="11" r="6"></circle>
        <path d="m16 16 4 4"></path>
      </svg>
      <input
        v-model="shapeQuery"
        type="search"
        :placeholder="labels.shapeSearchPlaceholder"
        @keydown.enter.prevent="addFirstMatchedNode"
        @keydown.esc="clearShapeSearch"
      />
    </label>
    <button
      v-for="typeItem in filteredNodeTypes"
      :key="typeItem.type"
      type="button"
      class="flowchartQuickAddBtn"
      :aria-label="getTypeLabel(typeItem)"
      :title="getTypeLabel(typeItem)"
      @click="addNode(typeItem)"
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
  data() {
    return {
      shapeQuery: ''
    }
  },
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
  computed: {
    filteredNodeTypes() {
      const query = String(this.shapeQuery || '').trim().toLowerCase()
      if (!query) {
        return this.nodeTypes
      }
      return this.nodeTypes.filter(typeItem => {
        return (
          String(typeItem.type || '').toLowerCase().includes(query) ||
          String(typeItem.label || '').toLowerCase().includes(query) ||
          this.getTypeLabel(typeItem).toLowerCase().includes(query)
        )
      })
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
    },
    createAddNodePayload(typeItem) {
      return {
        type: typeItem.type,
        autoConnect: true,
        startInlineEdit: false,
        origin: 'quick-add'
      }
    },
    addNode(typeItem) {
      this.$emit('add-node', this.createAddNodePayload(typeItem))
    },
    addFirstMatchedNode() {
      const [typeItem] = this.filteredNodeTypes
      if (typeItem) {
        this.addNode(typeItem)
      }
    },
    clearShapeSearch() {
      this.shapeQuery = ''
    }
  }
}
</script>
