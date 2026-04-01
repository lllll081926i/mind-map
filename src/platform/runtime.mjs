export const detectDesktopRuntime = env => {
  return !!(env && (env.__TAURI_INTERNALS__ || env.__TAURI__))
}

export const isDesktopRuntime = () => {
  return typeof window !== 'undefined' && detectDesktopRuntime(window)
}
