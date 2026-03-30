export const isDesktopRuntime = () => {
  return (
    typeof window !== 'undefined' &&
    !!(window.__TAURI_INTERNALS__ || window.__TAURI__)
  )
}
