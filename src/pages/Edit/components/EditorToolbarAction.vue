<template>
  <component
    :is="tag"
    v-bind="rootAttrs"
    class="editorToolbarAction"
    :class="[
      actionClass,
      {
        active,
        disabled
      }
    ]"
    v-on="keyboardListeners"
    @click="handleClick"
  >
    <span :class="iconClass" aria-hidden="true">
      <slot name="icon"></slot>
    </span>
    <span :class="textClass">
      <slot>{{ label }}</slot>
    </span>
  </component>
</template>

<script>
export default {
  name: 'EditorToolbarAction',
  emits: ['action'],
  props: {
    tag: {
      type: String,
      default: 'button'
    },
    label: {
      type: String,
      required: true
    },
    title: {
      type: String,
      default: ''
    },
    actionClass: {
      type: [String, Array, Object],
      default: ''
    },
    iconClass: {
      type: [String, Array, Object],
      default: ''
    },
    textClass: {
      type: [String, Array, Object],
      default: ''
    },
    disabled: {
      type: Boolean,
      default: false
    },
    active: {
      type: Boolean,
      default: false
    }
  },
  computed: {
    rootAttrs() {
      const attrs = {
        'aria-label': this.label
      }
      if (this.title) {
        attrs.title = this.title
      }
      if (this.tag === 'button') {
        return {
          ...attrs,
          type: 'button',
          disabled: this.disabled
        }
      }
      return {
        ...attrs,
        'aria-disabled': this.disabled ? 'true' : null,
        role: 'button',
        tabindex: this.disabled ? -1 : 0
      }
    },
    keyboardListeners() {
      if (this.tag === 'button') {
        return {}
      }
      return {
        keydown: this.handleKeyboardAction
      }
    }
  },
  methods: {
    handleClick(event) {
      if (this.disabled) {
        event.preventDefault()
        return
      }
      this.$emit('action', event)
    },
    handleKeyboardAction(event) {
      if (!['Enter', ' ', 'Spacebar'].includes(event.key)) {
        return
      }
      event.preventDefault()
      this.handleClick(event)
    }
  }
}
</script>
