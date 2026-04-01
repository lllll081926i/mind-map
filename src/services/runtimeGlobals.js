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
  try {
    return currentDataGetter()
  } catch (error) {
    console.error('getCurrentData failed', error)
    return null
  }
}
