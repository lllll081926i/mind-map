declare module '*.vue' {
  const component: any
  export default component
}

declare module '*.svg' {
  const src: string
  export default src
}

declare module '*.png' {
  const src: string
  export default src
}

declare module '*.jpg' {
  const src: string
  export default src
}

declare module '*.jpeg' {
  const src: string
  export default src
}

declare module '*.webp' {
  const src: string
  export default src
}

declare module '*.gif' {
  const src: string
  export default src
}

declare module 'simple-mind-map-plugin-themes/themeList' {
  const themeList: Array<any>
  export default themeList
}

declare module 'simple-mind-map-plugin-themes/themeImgMap' {
  const themeImgMap: Record<string, string>
  export default themeImgMap
}
