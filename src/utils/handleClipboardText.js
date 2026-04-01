import { imgToDataUrl } from 'simple-mind-map/src/utils/index'
import { parseExternalJsonSafely } from '@/utils'

// 处理知犀
const handleZHIXI = async data => {
  try {
    try {
      if (!Array.isArray(data)) {
        data = String(data).replace('￿﻿', '')
        data = parseExternalJsonSafely(data)
      }
    } catch (error) {
      console.error('handleZHIXI parse failed', error)
    }
    if (!Array.isArray(data)) {
      data = []
    }
    const newNodeList = []
    const waitLoadImageList = []
    const walk = (list, newList) => {
      list.forEach(item => {
        let newRoot = {}
        newList.push(newRoot)
        newRoot.data = {
          text: item.data.text,
          hyperlink: item.data.hyperlink,
          hyperlinkTitle: item.data.hyperlinkTitle,
          note: item.data.note
        }
        // 图片
        if (item.data.image) {
          let resolve = null
          let promise = new Promise(_resolve => {
            resolve = _resolve
          })
          waitLoadImageList.push(promise)
          imgToDataUrl(item.data.image)
            .then(url => {
              newRoot.data.image = url
              newRoot.data.imageSize = item.data.imageSize
            })
            .catch(() => {})
            .finally(() => {
              resolve()
            })
        }
        // 子节点
        newRoot.children = []
        if (item.children && item.children.length > 0) {
          const children = []
          item.children.forEach(item2 => {
            // 概要
            if (item2.data.type === 'generalize') {
              newRoot.data.generalization = [
                {
                  text: item2.data.text
                }
              ]
            } else {
              children.push(item2)
            }
          })
          walk(children, newRoot.children)
        }
      })
    }
    walk(data, newNodeList)
    await Promise.all(waitLoadImageList)
    return {
      simpleMindMap: true,
      data: newNodeList
    }
  } catch (error) {
    console.error('handleZHIXI failed', error)
    return ''
  }
}

const handleClipboardText = async text => {
  // 知犀数据格式1
  const parsedData = (() => {
    try {
      return parseExternalJsonSafely(text)
    } catch (error) {
      console.error('handleClipboardText parse failed', error)
      return undefined
    }
  })()
  if (parsedData?.__c_zx_v !== undefined) {
    const res = await handleZHIXI(parsedData.children)
    return res
  }
  // 知犀数据格式2
  if (text.includes('￿﻿')) {
    const res = await handleZHIXI(text)
    return res
  }
  return ''
}

export default handleClipboardText
