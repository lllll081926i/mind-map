let currentDataGetter = null

export const setCurrentDataGetter = getter => {
  currentDataGetter = typeof getter === 'function' ? getter : null
}

export const clearCurrentDataGetter = () => {
  currentDataGetter = null
}

export const getCurrentData = () => {
  if (typeof currentDataGetter !== 'function') {
    return null
  }
  return currentDataGetter()
}
