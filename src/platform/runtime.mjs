export const detectDesktopRuntime = env => {
  if (!env) {
    return false
  }
  if (typeof env.__TAURI_INTERNALS__?.invoke === 'function') {
    return true
  }
  if (typeof env.__TAURI__?.invoke === 'function') {
    return true
  }
  return false
}

export const isDesktopRuntime = () => {
  return typeof window !== 'undefined' && detectDesktopRuntime(window)
}
