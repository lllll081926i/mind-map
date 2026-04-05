import test from 'node:test'
import assert from 'node:assert/strict'
import fs from 'node:fs'
import path from 'node:path'

const tauriConfigSource = fs.readFileSync(
  path.resolve('src-tauri/tauri.conf.json'),
  'utf8'
)
const windowsNsisSource = fs.readFileSync(
  path.resolve('src-tauri/file-association/windows/smm-file-association.nsh'),
  'utf8'
)
const macInfoPlistSource = fs.readFileSync(
  path.resolve('src-tauri/file-association/macos/Info.plist'),
  'utf8'
)
const linuxDesktopSource = fs.readFileSync(
  path.resolve('src-tauri/file-association/linux/mindmap-smm.desktop'),
  'utf8'
)

test('Windows 文件关联同时注册图标、Open With 和 Default Programs 能力', () => {
  assert.match(
    windowsNsisSource,
    /\$INSTDIR\\file-association\\icons\\smm-document\.ico,0/
  )
  assert.match(windowsNsisSource, /OpenWithProgids/)
  assert.match(windowsNsisSource, /Applications\\MindMap\.exe/)
  assert.match(windowsNsisSource, /Software\\MindMap\\Capabilities/)
  assert.match(windowsNsisSource, /Software\\RegisteredApplications/)
  assert.match(windowsNsisSource, /Content Type/)
  assert.match(windowsNsisSource, /PerceivedType/)
})

test('Linux 打包资源包含桌面入口与 MIME 绑定文件', () => {
  assert.match(tauriConfigSource, /mindmap-smm\.desktop/)
  assert.match(tauriConfigSource, /application-x-mindmap-smm\.xml/)
  assert.match(linuxDesktopSource, /MimeType=application\/x-mindmap-smm;/)
  assert.match(linuxDesktopSource, /Exec=.*%F/)
})

test('macOS 文档类型声明仍然绑定 .smm 与专属 icns 图标', () => {
  assert.match(macInfoPlistSource, /<string>smm<\/string>/)
  assert.match(macInfoPlistSource, /<string>smm-document\.icns<\/string>/)
  assert.match(macInfoPlistSource, /<string>com\.mindmap\.document\.smm<\/string>/)
})
