import test from 'node:test'
import assert from 'node:assert/strict'
import fs from 'node:fs'
import path from 'node:path'

const editIndexSource = fs.readFileSync(
  path.resolve('src/pages/Edit/Index.vue'),
  'utf8'
)
const homeSource = fs.readFileSync(path.resolve('src/pages/Home/Index.vue'), 'utf8')
const langSource = fs.readFileSync(path.resolve('src/lang/index.js'), 'utf8')
const flowchartDocumentSource = fs.readFileSync(
  path.resolve('src/services/flowchartDocument.js'),
  'utf8'
)
const flowchartEditorPath = path.resolve('src/pages/Edit/components/FlowchartEditor.vue')
const flowchartEditorSource = fs.readFileSync(flowchartEditorPath, 'utf8')
const flowchartCanvasSource = fs.readFileSync(
  path.resolve('src/pages/Edit/components/FlowchartCanvas.vue'),
  'utf8'
)
const flowchartEdgeLayerSource = fs.readFileSync(
  path.resolve('src/pages/Edit/components/FlowchartEdgeLayer.vue'),
  'utf8'
)
const flowchartMinimapSource = fs.readFileSync(
  path.resolve('src/pages/Edit/components/FlowchartMinimap.vue'),
  'utf8'
)
const flowchartNodeLayerSource = fs.readFileSync(
  path.resolve('src/pages/Edit/components/FlowchartNodeLayer.vue'),
  'utf8'
)
const flowchartQuickAddBarSource = fs.readFileSync(
  path.resolve('src/pages/Edit/components/FlowchartQuickAddBar.vue'),
  'utf8'
)
const flowchartSelectionToolbarSource = fs.readFileSync(
  path.resolve('src/pages/Edit/components/FlowchartSelectionToolbar.vue'),
  'utf8'
)
const flowchartEdgeLogicSource = fs.readFileSync(
  path.resolve('src/pages/Edit/components/flowchartEditorConnector.js'),
  'utf8'
)
const flowchartReconnectSource = fs.readFileSync(
  path.resolve('src/pages/Edit/components/flowchartEditorReconnect.js'),
  'utf8'
)
const flowchartDocumentLogicSource = fs.readFileSync(
  path.resolve('src/pages/Edit/components/flowchartEditorDocument.js'),
  'utf8'
)
const flowchartAiLogicSource = fs.readFileSync(
  path.resolve('src/pages/Edit/components/flowchartEditorAi.js'),
  'utf8'
)
const flowchartHistorySource = fs.readFileSync(
  path.resolve('src/pages/Edit/components/flowchartEditorHistory.js'),
  'utf8'
)
const flowchartNodeSource = fs.readFileSync(
  path.resolve('src/pages/Edit/components/flowchartEditorNode.js'),
  'utf8'
)
const flowchartSelectionSource = fs.readFileSync(
  path.resolve('src/pages/Edit/components/flowchartEditorSelection.js'),
  'utf8'
)
const flowchartInlineEditSource = fs.readFileSync(
  path.resolve('src/pages/Edit/components/flowchartEditorInlineEdit.js'),
  'utf8'
)
const flowchartToolbarSource = fs.readFileSync(
  path.resolve('src/pages/Edit/components/FlowchartToolbar.vue'),
  'utf8'
)
const flowchartInspectorSource = fs.readFileSync(
  path.resolve('src/pages/Edit/components/FlowchartInspector.vue'),
  'utf8'
)
const flowchartSharedSource = fs.readFileSync(
  path.resolve('src/pages/Edit/components/flowchartEditorShared.js'),
  'utf8'
)
const flowchartStyleSource = fs.readFileSync(
  path.resolve('src/pages/Edit/components/FlowchartEditor.less'),
  'utf8'
)
const flowchartViewportSource = fs.readFileSync(
  path.resolve('src/pages/Edit/components/flowchartEditorViewport.js'),
  'utf8'
)
const flowchartResizeSource = fs.readFileSync(
  path.resolve('src/pages/Edit/components/flowchartEditorResize.js'),
  'utf8'
)
const flowchartStyleLogicSource = fs.readFileSync(
  path.resolve('src/pages/Edit/components/flowchartEditorStyle.js'),
  'utf8'
)
const flowchartLogicSource = [
  flowchartEditorSource,
  flowchartSharedSource,
  flowchartHistorySource,
  flowchartNodeSource,
  flowchartSelectionSource,
  flowchartInlineEditSource,
  flowchartViewportSource,
  flowchartEdgeLogicSource,
  flowchartReconnectSource,
  flowchartDocumentLogicSource,
  flowchartAiLogicSource,
  flowchartResizeSource,
  flowchartStyleLogicSource
].join('\n')

test('编辑页支持按文档模式切换到流程图编辑器', () => {
  assert.match(editIndexSource, /FlowchartEditor/)
  assert.match(editIndexSource, /documentMode/)
  assert.match(editIndexSource, /isFlowchartDocument/)
})

test('首页存在新建流程图入口', () => {
  assert.equal(/createFlowchart/.test(homeSource), true)
  assert.equal(/createBlankFlowchartProject/.test(homeSource), true)
})

test('流程图编辑器存在并包含核心工具入口', () => {
  assert.equal(fs.existsSync(flowchartEditorPath), true)
  const source = flowchartLogicSource

  assert.match(flowchartEditorSource, /FlowchartToolbar/)
  assert.match(flowchartEditorSource, /FlowchartCanvas/)
  assert.match(flowchartEditorSource, /import '\.\/FlowchartEditor\.less'/)
  assert.match(flowchartLogicSource, /addNodeByType/)
  assert.match(flowchartEditorSource, /@canvas-double-click="addNodeAtCanvasPoint"/)
  assert.match(flowchartLogicSource, /beginConnectorDrag\(/)
  assert.match(flowchartLogicSource, /insertNodeOnEdge\(/)
  assert.match(source, /applyTemplate/)
  assert.match(source, /openExportCenter/)
  assert.match(source, /\$router\.push\('\/export'\)/)
  assert.doesNotMatch(flowchartEditorSource, /exportAsSvg/)
  assert.doesNotMatch(flowchartEditorSource, /exportAsPng/)
  assert.match(source, /convertCurrentMindMap/)
  assert.match(source, /importMindMapFile/)
  assert.match(source, /generateWithAi/)
})

test('流程图新增图标化快速加节点条和轻量选区工具条，并继续拆分组件职责', () => {
  assert.match(flowchartEditorSource, /FlowchartQuickAddBar/)
  assert.match(flowchartEditorSource, /FlowchartSelectionToolbar/)
  assert.match(flowchartQuickAddBarSource, /v-for="typeItem in nodeTypes"/)
  assert.match(flowchartQuickAddBarSource, /add-node/)
  assert.match(flowchartSelectionToolbarSource, /selectedNodeCount/)
  assert.match(flowchartSelectionToolbarSource, /bring-front/)
  assert.match(flowchartSelectionToolbarSource, /send-back/)
  assert.match(flowchartSelectionToolbarSource, /distribute-horizontal/)
  assert.match(flowchartSelectionToolbarSource, /distribute-vertical/)
  assert.match(flowchartStyleSource, /\.flowchartQuickAddBar/)
  assert.match(flowchartStyleSource, /\.flowchartSelectionToolbar/)
})

test('流程图顶栏使用压缩标签和极简线条图标，不再堆长文案', () => {
  assert.match(flowchartEditorSource, /flowchartToolbarText\(\)/)
  assert.match(flowchartToolbarSource, /flowchartToolbarIcon/)
  assert.match(flowchartToolbarSource, /<svg viewBox="0 0 24 24">/)
  assert.match(flowchartStyleSource, /\.flowchartToolbarIcon/)
  assert.match(flowchartStyleSource, /flex-direction:\s*column/)
  assert.match(flowchartStyleSource, /stroke:\s*#111827/)
  assert.match(langSource, /"returnHomeShort": "首页"/)
  assert.match(langSource, /"saveAsShort": "另存"/)
  assert.match(langSource, /"importMindMapFileShort": "导入"/)
  assert.match(langSource, /"convertMindMapShort": "转流程"/)
  assert.match(langSource, /"templatePanelTitle": "模版"/)
})

test('流程图编辑器进入页面前会等待桌面文档状态加载完成，避免恢复时读到默认流程图', () => {
  const source = fs.readFileSync(flowchartEditorPath, 'utf8')

  assert.match(source, /ensureBootstrapDocumentState/)
  assert.match(source, /async mounted\(\)/)
  assert.match(source, /await ensureBootstrapDocumentState\(\)/)
  assert.match(source, /await ensureBootstrapDocumentState\(\)[\s\S]*?this\.loadFlowchartState\(\)/)
  assert.doesNotMatch(source, /created\(\) \{[\s\S]*?this\.loadFlowchartState\(\)/)
})

test('流程图返回首页前会处理未保存风险，不直接跳转丢失待保存修改', () => {
  const source = flowchartLogicSource

  assert.match(source, /async confirmPotentialFlowchartLeave\(/)
  assert.match(source, /await this\.confirmPotentialFlowchartLeave\(\)/)
  assert.match(source, /this\.currentDocument\?\.dirty/)
  assert.match(source, /this\.persistTimer/)
  assert.match(source, /this\.recoveryTimer/)
})

test('流程图模式会按每分钟一次的节奏自动保存，并在手动保存时清理旧定时器', () => {
  assert.match(flowchartLogicSource, /FLOWCHART_AUTO_SAVE_INTERVAL = 60 \* 1000/)
  assert.match(flowchartLogicSource, /window\.setTimeout\([\s\S]*FLOWCHART_AUTO_SAVE_INTERVAL\)/)
  assert.match(
    flowchartLogicSource,
    /async saveCurrentFile\(\{ silent = false \} = \{\}\) \{[\s\S]*?if \(this\.persistTimer\) \{[\s\S]*?clearTimeout\(this\.persistTimer\)[\s\S]*?this\.persistTimer = 0/
  )
})

test('流程图编辑器会写入并清理流程图恢复草稿，且不会转换默认空导图', () => {
  const source = flowchartLogicSource

  assert.match(source, /writeRecoveryDraftForFile/)
  assert.match(source, /clearRecoveryDraftForFile/)
  assert.match(source, /documentMode:\s*'flowchart'/)
  assert.match(source, /noMindMapToConvert/)
  assert.match(flowchartLogicSource, /const hasConvertibleMindMapData = mindMapData =>/)
  assert.match(flowchartLogicSource, /const root = mindMapData\?\.root/)
  assert.match(flowchartLogicSource, /Array\.isArray\(root\.children\)/)
})

test('流程图编辑器提供显式导入思维导图文件入口，并优先读取恢复草稿', () => {
  const source = flowchartLogicSource

  assert.match(source, /\$t\('flowchart\.importMindMapFile'\)/)
  assert.match(source, /async importMindMapFile\(/)
  assert.match(source, /platform\.openMindMapFile\(/)
  assert.match(source, /resolveFileContentWithRecovery\(/)
  assert.match(source, /parseStoredDocumentContent\(/)
  assert.match(source, /importMindMapFileInvalid/)
})

test('流程图另存为会同时写出流程图配置', () => {
  const source = flowchartLogicSource

  assert.match(source, /config:\s*cloneJson\(this\.flowchartConfig\)/)
  assert.match(source, /createWorkspaceFlowchartFile\(\{[\s\S]*config:\s*cloneJson\(this\.flowchartConfig\)/)
  assert.match(source, /const previousFileRef = this\.currentDocument/)
  assert.match(source, /clearRecoveryDraftForFile\(previousFileRef\)/)
})

test('流程图保存链路会规范化文件错误并给出用户反馈，而不是把异常直接抛给界面', () => {
  const source = flowchartLogicSource

  assert.match(source, /createDesktopFsError\(/)
  assert.match(source, /saveCurrentFile\(\{ silent = false \} = \{\}\) \{[\s\S]*?catch \(error\)/)
  assert.match(source, /this\.\$message\.error\(/)
  assert.match(source, /saveAsFile\(\{ silent = false \} = \{\}\) \{[\s\S]*?catch \(error\)/)
})

test('流程图导出会保留判断和输入节点的真实形状，而不是统一退化成矩形', () => {
  const source = flowchartDocumentSource

  assert.match(source, /node\.type === 'decision'/)
  assert.match(source, /<polygon/)
  assert.match(source, /node\.type === 'input'/)
})

test('流程图导出会按节点完整边界计算 viewBox，避免负坐标节点被裁切', () => {
  const source = flowchartDocumentSource

  assert.match(source, /getFlowchartExportBounds\(/)
  assert.match(source, /minX:\s*Math\.min/)
  assert.match(source, /viewBox="\$\{bounds\.x\} \$\{bounds\.y\} \$\{bounds\.width\} \$\{bounds\.height\}"/)
})

test('流程图顶栏只保留一个导出入口，并复用独立导出页', () => {
  assert.match(flowchartToolbarSource, /open-export/)
  assert.match(flowchartToolbarSource, /labels\.exportCenter/)
  assert.doesNotMatch(flowchartToolbarSource, /export-svg/)
  assert.doesNotMatch(flowchartToolbarSource, /export-png/)
  assert.match(editIndexSource, /<FlowchartEditor><\/FlowchartEditor>[\s\S]*?<ExportDialog v-if="isExportRoute"><\/ExportDialog>/)
})

test('流程图编辑页不再在节点块顶部显示类型文字，并使用可扩展的主题变量', () => {
  const source = fs.readFileSync(flowchartEditorPath, 'utf8')

  assert.doesNotMatch(source, /class="nodeType"/)
  assert.match(flowchartStyleSource, /--flowchart-panel-bg/)
  assert.match(flowchartStyleSource, /var\(--flowchart-panel-bg\)/)
  assert.match(flowchartStyleSource, /--flowchart-dock-bg/)
  assert.match(source, /isInspectorOpen:\s*false/)
  assert.match(flowchartLogicSource, /toggleInspector\(\)/)
  assert.match(flowchartLogicSource, /closeInspector\(\)/)
  assert.match(source, /FlowchartInspector/)
  assert.doesNotMatch(flowchartInspectorSource, /toggle-panel/)
  assert.doesNotMatch(flowchartInspectorSource, /activePanel/)
  assert.match(flowchartInspectorSource, /toggle-inspector/)
  assert.match(flowchartInspectorSource, /close-inspector/)
  assert.match(flowchartInspectorSource, /apply-template/)
  assert.match(flowchartInspectorSource, /isOpen/)
  assert.match(flowchartInspectorSource, /class="flowchartDockRail" :class="\{ isOpen \}"/)
  assert.match(flowchartInspectorSource, /labels\.templatePanelTitle/)
  assert.match(flowchartInspectorSource, /<rect x="4\.5" y="5" width="7" height="14" rx="2"><\/rect>/)
  assert.doesNotMatch(flowchartInspectorSource, /flowchartDockText">\{\{ labels\.inspectorTitle \}\}/)
})

test('流程图模版侧边栏展开方式与思维导图侧栏一致，面板打开时入口让出面板宽度', () => {
  assert.match(flowchartStyleSource, /\.flowchartDockRail \{[\s\S]*?right:\s*0;[\s\S]*?width:\s*60px;[\s\S]*?transition:\s*right 0\.28s/)
  assert.match(flowchartStyleSource, /\.flowchartDockRail\.isOpen \{[\s\S]*?right:\s*320px;/)
  assert.match(flowchartStyleSource, /\.flowchartFloatingPanel \{[\s\S]*?right:\s*0;[\s\S]*?bottom:\s*92px;[\s\S]*?width:\s*320px;/)
  assert.match(flowchartStyleSource, /\.flowchartDockTrigger \{[\s\S]*?border-radius:\s*8px 0 0 8px;/)
})

test('流程图顶部模板入口已迁到右侧模板侧边栏，顶栏不再堆放模板按钮', () => {
  assert.doesNotMatch(flowchartToolbarSource, /templateApproval/)
  assert.doesNotMatch(flowchartToolbarSource, /templateTroubleshooting/)
  assert.doesNotMatch(flowchartToolbarSource, /apply-template/)
  assert.match(flowchartEditorSource, /:templates="flowchartTemplates"/)
  assert.match(flowchartInspectorSource, /flowchartTemplateGrid/)
  assert.match(flowchartInspectorSource, /v-for="templateItem in templates"/)
  assert.match(flowchartInspectorSource, /flowchartTemplatePreview/)
  assert.match(flowchartInspectorSource, /getTemplatePreviewViewBox/)
  assert.match(flowchartInspectorSource, /@click="\$emit\('apply-template', templateItem\.id\)"/)
})

test('流程图选择与批量操作不会强制打开属性面板，保持精修区默认关闭', () => {
  const source = fs.readFileSync(flowchartEditorPath, 'utf8')

  assert.doesNotMatch(source, /stopAreaSelection\(\) \{[\s\S]{0,240}?this\.isInspectorOpen = true/)
  assert.doesNotMatch(source, /selectNode\(nodeId, event\) \{[\s\S]{0,360}?this\.isInspectorOpen = true/)
  assert.doesNotMatch(source, /selectEdge\(edgeId\) \{[\s\S]{0,280}?this\.isInspectorOpen = true/)
  assert.doesNotMatch(source, /pasteCopiedNodes\(\) \{[\s\S]{0,520}?this\.isInspectorOpen = true/)
  assert.doesNotMatch(source, /selectAllNodes\(\) \{[\s\S]{0,180}?this\.isInspectorOpen = true/)
  assert.doesNotMatch(source, /duplicateSelectedNodes\(\) \{[\s\S]{0,720}?this\.isInspectorOpen = true/)
  assert.doesNotMatch(source, /cloneAndConnectSelectedNode\(direction\) \{[\s\S]{0,720}?this\.isInspectorOpen = true/)
})

test('流程图编辑页支持独立的画布视口能力，而不是固定死板画布', () => {
  const source = flowchartLogicSource

  assert.match(source, /flowchartViewportToolbar/)
  assert.match(source, /canvasWorldStyle\(\)/)
  assert.match(source, /syncCanvasViewportSize\(\)/)
  assert.match(source, /centerViewportAt\(/)
  assert.match(source, /startCanvasPan\(/)
  assert.match(source, /onCanvasPan\(/)
  assert.match(source, /zoomIn\(/)
  assert.match(source, /zoomOut\(/)
  assert.match(source, /fitCanvasToView\(/)
  assert.match(source, /viewportZoomLabel/)
})

test('流程图拖拽保留自动对齐，但默认不再启用网格吸附', () => {
  const source = flowchartLogicSource

  assert.match(source, /snapPositionToGrid\(/)
  assert.match(flowchartEditorSource, /snapToGrid:\s*false/)
  assert.match(flowchartHistorySource, /snapToGrid:\s*false/)
  assert.match(source, /return position/)
  assert.match(source, /this\.flowchartConfig\.gridSize/)
  assert.match(source, /currentNode\.x = snappedPosition\.x/)
  assert.match(source, /currentNode\.y = snappedPosition\.y/)
})

test('流程图小地图支持挂载与拖拽跳转视口，而不是只做静态缩略图', () => {
  assert.match(flowchartEditorSource, /<FlowchartMinimap/)
  assert.match(flowchartMinimapSource, /name:\s*'FlowchartMinimap'/)
  assert.match(flowchartMinimapSource, /@mousedown\.prevent="startMinimapDrag"/)
  assert.match(flowchartMinimapSource, /startMinimapDrag\(/)
  assert.match(flowchartMinimapSource, /onMinimapDrag\(/)
  assert.match(flowchartMinimapSource, /stopMinimapDrag\(/)
  assert.match(flowchartMinimapSource, /\$emit\('jump-to-point'/)
})

test('流程图支持在空白画布双击快速加节点，并优先落到点击位置或当前视口中心', () => {
  assert.match(flowchartCanvasSource, /@dblclick="\$emit\('canvas-double-click', \$event\)"/)
  assert.match(flowchartCanvasSource, /'canvas-double-click'/)
  assert.match(flowchartLogicSource, /addNodeAtCanvasPoint\(event\)/)
  assert.match(flowchartLogicSource, /const worldPoint = this\.getWorldPointFromEvent\(event\)/)
  assert.match(flowchartLogicSource, /getViewportCenterWorldPoint\(/)
  assert.match(flowchartLogicSource, /getNodePlacementPoint\(/)
  assert.match(flowchartLogicSource, /this\.selectedNodeIds\.length === 1/)
})

test('流程图编辑器提供多选节点的基础对齐能力', () => {
  const source = flowchartLogicSource

  assert.match(source, /alignSelectedNodesLeft\(/)
  assert.match(source, /distributeSelectedNodesHorizontally\(/)
  assert.match(source, /distributeSelectedNodesVertically\(/)
  assert.match(source, /bringSelectedNodesToFront\(/)
  assert.match(source, /sendSelectedNodesToBack\(/)
  assert.doesNotMatch(flowchartInspectorSource, /flowchart\.alignLeft/)
  assert.doesNotMatch(flowchartInspectorSource, /flowchart\.distributeHorizontal/)
  assert.doesNotMatch(flowchartInspectorSource, /flowchart\.distributeVertical/)
})

test('流程图编辑器支持复制粘贴节点并保留选中节点之间的连线', () => {
  const source = flowchartLogicSource

  assert.match(source, /copySelectedNodes\(/)
  assert.match(source, /pasteCopiedNodes\(/)
  assert.match(source, /flowchartClipboard/)
  assert.match(source, /sourceIdMap/)
  assert.match(source, /copiedEdges/)
  assert.doesNotMatch(flowchartInspectorSource, /flowchart\.copy/)
  assert.doesNotMatch(flowchartInspectorSource, /flowchart\.paste/)
})

test('流程图编辑器提供键盘快捷操作，覆盖复制粘贴和删除选择', () => {
  const source = flowchartLogicSource

  assert.match(source, /handleGlobalKeydown\(/)
  assert.match(source, /window\.addEventListener\('keydown', this\.handleGlobalKeydown\)/)
  assert.match(source, /window\.removeEventListener\('keydown', this\.handleGlobalKeydown\)/)
  assert.match(source, /event\.key\.toLowerCase\(\) === 'c'/)
  assert.match(source, /event\.key\.toLowerCase\(\) === 'v'/)
  assert.match(source, /event\.key === 'Delete'/)
})

test('流程图拖拽节点时提供轻量对齐吸附与辅助线', () => {
  const source = fs.readFileSync(flowchartEditorPath, 'utf8')

  assert.match(source, /alignmentGuides/)
  assert.match(source, /computeAlignmentSnap\(/)
  assert.match(flowchartStyleSource, /flowchartGuideLine/)
  assert.match(source, /clearAlignmentGuides\(/)
  assert.match(source, /FLOWCHART_ALIGNMENT_THRESHOLD/)
})

test('流程图节点拖拽和画布平移按帧合并更新，避免高频 mousemove 直接写状态', () => {
  assert.match(flowchartNodeSource, /window\.requestAnimationFrame\(/)
  assert.match(flowchartNodeSource, /flushNodeDragFrame\(/)
  assert.match(flowchartNodeSource, /applyNodeDrag\(/)
  assert.match(flowchartNodeSource, /pendingDragPoint/)
  assert.match(flowchartViewportSource, /window\.requestAnimationFrame\(/)
  assert.match(flowchartViewportSource, /flushCanvasPanFrame\(/)
  assert.match(flowchartViewportSource, /applyCanvasPan\(/)
  assert.match(flowchartViewportSource, /pendingCanvasPanPoint/)
})

test('流程图连线标签增加底板，避免文字被连线穿过', () => {
  assert.match(flowchartEdgeLayerSource, /edgeLabelBackdrop/)
  assert.match(flowchartEdgeLayerSource, /<rect/)
  assert.match(flowchartEdgeLayerSource, /getEdgeLabelWidth\(/)
  assert.match(flowchartEdgeLayerSource, /dominant-baseline="middle"/)
  assert.match(flowchartStyleSource, /\.flowchartEditor \.edgeLabelBackdrop/)
})

test('流程图边布局与节点查询使用索引映射，减少重复 find 开销', () => {
  assert.match(flowchartEditorSource, /flowchartNodeLookup\(\)/)
  assert.match(flowchartEditorSource, /new Map\(this\.flowchartData\.nodes\.map/)
  assert.match(flowchartEditorSource, /this\.flowchartNodeLookup\.get\(edge\.source\)/)
  assert.match(flowchartEditorSource, /this\.flowchartNodeLookup\.get\(edge\.target\)/)
  assert.match(flowchartEdgeLogicSource, /this\.flowchartNodeLookup\?\.get\(nodeId\)/)
  assert.doesNotMatch(
    flowchartEditorSource,
    /edgesWithLayout\(\)\s*\{[\s\S]*?this\.flowchartData\.nodes\.find\(node => node\.id === edge\.source\)/
  )
})

test('流程图多选手势不会在 mousedown 阶段覆盖已选节点', () => {
  const source = flowchartLogicSource

  assert.match(source, /const isAppendSelectionDrag = !!\(event\.shiftKey \|\| event\.ctrlKey \|\| event\.metaKey\)/)
  assert.match(source, /if \(isAppendSelectionDrag && !this\.selectedNodeIds\.includes\(node\.id\)\) \{[\s\S]*?return[\s\S]*?\}/)
})

test('流程图单击节点不会被当作拖拽变更写入历史和文件', () => {
  const source = flowchartLogicSource

  assert.match(source, /moved:\s*false/)
  assert.match(source, /this\.dragState\.moved =/)
  assert.match(source, /const shouldPersist = this\.dragState\.moved/)
  assert.match(source, /if \(shouldPersist\) \{[\s\S]*?persistFlowchartState\(\)/)
})

test('流程图编辑器提供撤销重做历史，不把历史写入文档结构', () => {
  const source = flowchartLogicSource

  assert.match(source, /FLOWCHART_HISTORY_LIMIT/)
  assert.match(flowchartEditorSource, /flowchartHistory:\s*\{/)
  assert.match(source, /flowchartHistory:\s*\{/)
  assert.match(source, /createFlowchartHistorySnapshot\(/)
  assert.match(source, /commitFlowchartHistorySnapshot\(/)
  assert.match(source, /restoreFlowchartHistorySnapshot\(/)
  assert.match(source, /undoFlowchartChange\(/)
  assert.match(source, /redoFlowchartChange\(/)
  assert.match(source, /recordHistory = true/)
  assert.doesNotMatch(source, /flowchartHistory[\s\S]{0,120}serializeStoredDocumentContent/)
})

test('流程图编辑器补充全选、复制一份与方向键移动快捷操作', () => {
  const source = flowchartLogicSource

  assert.match(source, /selectAllNodes\(/)
  assert.match(source, /duplicateSelectedNodes\(/)
  assert.match(source, /nudgeSelectedNodes\(/)
  assert.match(source, /getKeyboardNudgeStep\(/)
  assert.match(source, /event\.key\.toLowerCase\(\) === 'a'/)
  assert.match(source, /event\.key\.toLowerCase\(\) === 'd'/)
  assert.match(source, /event\.key\.toLowerCase\(\) === 'z'/)
  assert.match(source, /event\.key\.toLowerCase\(\) === 'y'/)
  assert.match(source, /event\.key\.startsWith\('Arrow'\)/)
  assert.match(source, /\$t\('flowchart\.duplicateSuccess'\)/)
})

test('流程图编辑器支持画布框选和方向键快速复制并连接节点', () => {
  const source = flowchartLogicSource

  assert.match(source, /flowchartSelectionBox/)
  assert.match(source, /selectionState:\s*null/)
  assert.match(source, /startAreaSelection\(/)
  assert.match(source, /onAreaSelection\(/)
  assert.match(source, /stopAreaSelection\(/)
  assert.match(source, /getSelectionBoxStyle\(/)
  assert.match(source, /findNodesInSelectionBox\(/)
  assert.match(source, /cloneAndConnectSelectedNode\(/)
  assert.match(source, /event\.altKey && event\.shiftKey && event\.key\.startsWith\('Arrow'\)/)
  assert.match(source, /\$t\('flowchart\.quickConnectSuccess'\)/)
})

test('流程图连接逻辑会复用已有连线，避免生成重复脏边', () => {
  const source = flowchartLogicSource

  assert.match(source, /const existingEdge = this\.flowchartData\.edges\.find/)
  assert.match(source, /if \(existingEdge\) \{\s*return existingEdge/)
  assert.match(source, /ensureFlowchartEdge\(sourceNode\.id,\s*targetNode\.id\)/)
})

test('流程图属性面板支持直接修改节点类型并按类型调整尺寸', () => {
  const source = flowchartLogicSource

  assert.match(flowchartInspectorSource, /labels\.nodeType/)
  assert.match(flowchartInspectorSource, /v-for="typeItem in flowchartNodeTypes"/)
  assert.match(flowchartInspectorSource, /update-selected-node-type/)
  assert.match(source, /updateSelectedNodeType\(/)
  assert.match(source, /getDefaultNodeSizeByType\(/)
  assert.match(source, /currentCenterX/)
  assert.match(source, /currentCenterY/)
})

test('流程图全局快捷键不会拦截属性面板下拉框输入', () => {
  const source = flowchartLogicSource

  assert.match(source, /tagName === 'select'/)
  assert.match(source, /event\.key === 'Escape'/)
  assert.match(source, /this\.closeInspector\(\)/)
  assert.match(source, /this\.clearSelection\(\)/)
})

test('流程图编辑器提供空画布起步动作，并移除显式快捷键帮助入口', () => {
  const source = fs.readFileSync(flowchartEditorPath, 'utf8')

  assert.match(flowchartCanvasSource, /canvasEmptyActions/)
  assert.match(flowchartCanvasSource, /apply-template', 'approval'/)
  assert.match(flowchartCanvasSource, /generate-ai/)
  assert.doesNotMatch(source, /activePanel/)
  assert.doesNotMatch(source, /event\.key === '\?'/)
})

test('流程图白板模式提供连接手柄、连线中点工具条与行内编辑状态', () => {
  const source = flowchartLogicSource

  assert.match(source, /connectorPreview:\s*null/)
  assert.match(source, /connectorDragState:\s*null/)
  assert.match(source, /edgeToolbarState:\s*null/)
  assert.match(source, /inlineTextEditorState:\s*null/)
  assert.match(source, /beginConnectorDrag\(/)
  assert.match(source, /updateConnectorDrag\(/)
  assert.match(source, /commitConnectorDrag\(/)
  assert.match(source, /insertNodeOnEdge\(/)
  assert.match(source, /openInlineTextEditor\(/)
  assert.match(source, /delete:\s*this\.\$t\('flowchart\.delete'\)/)
  assert.match(flowchartEdgeLayerSource, /flowchartEdgeToolbar/)
  assert.match(flowchartNodeLayerSource, /flowchartConnectorHandle/)
})

test('流程图支持拖拽重连已有连线端点，并把逻辑拆到独立重连模块', () => {
  assert.match(flowchartEditorSource, /flowchartReconnectMethods/)
  assert.match(flowchartEditorSource, /edgeReconnectState:\s*null/)
  assert.match(flowchartReconnectSource, /startEdgeReconnect\(/)
  assert.match(flowchartReconnectSource, /beginEdgeReconnect\(/)
  assert.match(flowchartReconnectSource, /updateEdgeReconnect\(/)
  assert.match(flowchartReconnectSource, /commitEdgeReconnect\(/)
  assert.match(flowchartReconnectSource, /cancelEdgeReconnect\(/)
  assert.match(flowchartReconnectSource, /removeEdgeReconnectListeners\(/)
  assert.match(flowchartReconnectSource, /reconnectDuplicate/)
  assert.match(flowchartEdgeLayerSource, /start-edge-reconnect/)
  assert.match(flowchartEdgeLayerSource, /flowchartEdgeReconnectHandle/)
  assert.match(flowchartEdgeLayerSource, /edge\.sourcePoint\.x/)
  assert.match(flowchartEdgeLayerSource, /edge\.targetPoint\.x/)
  assert.match(flowchartStyleSource, /\.flowchartEdgeReconnectHandle/)
})

test('流程图支持节点缩放和样式预设编辑，并把逻辑拆到独立模块', () => {
  assert.match(flowchartEditorSource, /flowchartResizeMethods/)
  assert.match(flowchartEditorSource, /flowchartStyleMethods/)
  assert.match(flowchartResizeSource, /showResizeHandlesForNode\(/)
  assert.match(flowchartResizeSource, /startNodeResize\(/)
  assert.match(flowchartResizeSource, /onNodeResize\(/)
  assert.match(flowchartResizeSource, /stopNodeResize\(/)
  assert.match(flowchartResizeSource, /MIN_NODE_WIDTH/)
  assert.match(flowchartStyleLogicSource, /updateSelectedNodeStyle\(/)
  assert.match(flowchartStyleLogicSource, /applySelectedNodePreset\(/)
  assert.match(flowchartStyleLogicSource, /updateSelectedEdgeStyle\(/)
  assert.match(flowchartStyleLogicSource, /applySelectedEdgePreset\(/)
  assert.match(flowchartNodeLayerSource, /flowchartResizeHandle/)
  assert.match(flowchartInspectorSource, /nodeStylePresets/)
  assert.match(flowchartInspectorSource, /edgeStylePresets/)
  assert.match(flowchartInspectorSource, /update-selected-node-style/)
  assert.match(flowchartInspectorSource, /update-selected-edge-style/)
})

test('流程图连线层支持箭头和折线路径样式，而不是只渲染直线', () => {
  assert.match(flowchartDocumentSource, /getFlowchartEdgeLayout/)
  assert.match(flowchartDocumentSource, /pathType/)
  assert.match(flowchartDocumentSource, /orthogonal/)
  assert.match(flowchartDocumentSource, /straight/)
  assert.match(flowchartEdgeLayerSource, /marker-end/)
  assert.match(flowchartEdgeLayerSource, /<marker/)
  assert.match(flowchartEdgeLayerSource, /getEdgeStroke\(/)
})

test('流程图空选择删除不会误报成功或写入历史', () => {
  const source = flowchartLogicSource

  assert.match(source, /if \(!this\.selectedEdgeId && !this\.selectedNodeIds\.length\) \{/)
  assert.match(source, /\$message\.warning\(this\.\$t\('flowchart\.selectionEmpty'\)\)/)
})

test('流程图空画布适应视图会继承调用方的持久化策略', () => {
  const source = flowchartLogicSource

  assert.match(source, /resetViewport\(\{ persist = true \} = \{\}\)/)
  assert.match(source, /this\.resetViewport\(\{\s*persist\s*\}\)/)
})

test('流程图套用模板只提交一次最终视图状态，避免撤销历史被视口拆成两步', () => {
  const source = flowchartLogicSource

  assert.match(source, /applyTemplate\(templateId = 'blank'\) \{[\s\S]*?fitCanvasToView\(\{\s*persist:\s*false\s*\}\)/)
  assert.match(source, /applyTemplate\(templateId = 'blank'\) \{[\s\S]*?persistFlowchartState\(\)/)
  assert.doesNotMatch(source, /applyTemplate\(templateId = 'blank'\) \{[\s\S]*?\$nextTick\(\(\) => \{\s*this\.fitCanvasToView\(\)\s*\}\)[\s\S]*?persistFlowchartState\(\)/)
})

test('流程图生成或导入后会适配视口并只提交最终状态', () => {
  const source = flowchartLogicSource

  assert.match(source, /applyGeneratedFlowchart\(result\) \{[\s\S]*?\$nextTick\(\(\) => \{[\s\S]*?fitCanvasToView\(\{\s*persist:\s*false\s*\}\)/)
  assert.match(source, /applyGeneratedFlowchart\(result\) \{[\s\S]*?\$nextTick\(\(\) => \{[\s\S]*?persistFlowchartState\(\)/)
})
