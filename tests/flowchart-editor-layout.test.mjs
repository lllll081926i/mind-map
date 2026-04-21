import test from 'node:test'
import assert from 'node:assert/strict'
import fs from 'node:fs'
import path from 'node:path'

const editIndexSource = fs.readFileSync(
  path.resolve('src/pages/Edit/Index.vue'),
  'utf8'
)
const homeSource = fs.readFileSync(path.resolve('src/pages/Home/Index.vue'), 'utf8')
const flowchartEditorPath = path.resolve('src/pages/Edit/components/FlowchartEditor.vue')

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
  const source = fs.readFileSync(flowchartEditorPath, 'utf8')

  assert.match(source, /flowchartToolbar/)
  assert.match(source, /addNodeByType/)
  assert.match(source, /connectSelectedNodes/)
  assert.match(source, /applyTemplate/)
  assert.match(source, /exportAsSvg/)
  assert.match(source, /exportAsPng/)
  assert.match(source, /convertCurrentMindMap/)
  assert.match(source, /importMindMapFile/)
  assert.match(source, /generateWithAi/)
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
  const source = fs.readFileSync(flowchartEditorPath, 'utf8')

  assert.match(source, /async confirmPotentialFlowchartLeave\(/)
  assert.match(source, /await this\.confirmPotentialFlowchartLeave\(\)/)
  assert.match(source, /this\.currentDocument\?\.dirty/)
  assert.match(source, /this\.persistTimer/)
  assert.match(source, /this\.recoveryTimer/)
})

test('流程图编辑器会写入并清理流程图恢复草稿，且不会转换默认空导图', () => {
  const source = fs.readFileSync(flowchartEditorPath, 'utf8')

  assert.match(source, /writeRecoveryDraftForFile/)
  assert.match(source, /clearRecoveryDraftForFile/)
  assert.match(source, /documentMode:\s*'flowchart'/)
  assert.match(source, /noMindMapToConvert/)
  assert.match(source, /const hasConvertibleMindMapData = mindMapData =>/)
  assert.match(source, /const root = mindMapData\?\.root/)
  assert.match(source, /Array\.isArray\(root\.children\)/)
})

test('流程图编辑器提供显式导入思维导图文件入口，并优先读取恢复草稿', () => {
  const source = fs.readFileSync(flowchartEditorPath, 'utf8')

  assert.match(source, /\$t\('flowchart\.importMindMapFile'\)/)
  assert.match(source, /async importMindMapFile\(/)
  assert.match(source, /platform\.openMindMapFile\(/)
  assert.match(source, /resolveFileContentWithRecovery\(/)
  assert.match(source, /parseStoredDocumentContent\(/)
  assert.match(source, /importMindMapFileInvalid/)
})

test('流程图另存为会同时写出流程图配置', () => {
  const source = fs.readFileSync(flowchartEditorPath, 'utf8')

  assert.match(source, /config:\s*cloneJson\(this\.flowchartConfig\)/)
  assert.match(source, /createWorkspaceFlowchartFile\(\{[\s\S]*config:\s*cloneJson\(this\.flowchartConfig\)/)
  assert.match(source, /const previousFileRef = this\.currentDocument/)
  assert.match(source, /clearRecoveryDraftForFile\(previousFileRef\)/)
})

test('流程图保存链路会规范化文件错误并给出用户反馈，而不是把异常直接抛给界面', () => {
  const source = fs.readFileSync(flowchartEditorPath, 'utf8')

  assert.match(source, /createDesktopFsError\(/)
  assert.match(source, /saveCurrentFile\(\{ silent = false \} = \{\}\) \{[\s\S]*?catch \(error\)/)
  assert.match(source, /this\.\$message\.error\(/)
  assert.match(source, /saveAsFile\(\{ silent = false \} = \{\}\) \{[\s\S]*?catch \(error\)/)
})

test('流程图导出会保留判断和输入节点的真实形状，而不是统一退化成矩形', () => {
  const source = fs.readFileSync(flowchartEditorPath, 'utf8')

  assert.match(source, /node\.type === 'decision'/)
  assert.match(source, /<polygon/)
  assert.match(source, /node\.type === 'input'/)
})

test('流程图导出会按节点完整边界计算 viewBox，避免负坐标节点被裁切', () => {
  const source = fs.readFileSync(flowchartEditorPath, 'utf8')

  assert.match(source, /getFlowchartExportBounds\(/)
  assert.match(source, /minX:\s*Math\.min/)
  assert.match(source, /viewBox="\$\{bounds\.x\} \$\{bounds\.y\} \$\{bounds\.width\} \$\{bounds\.height\}"/)
})

test('流程图编辑页不再在节点块顶部显示类型文字，并使用可扩展的主题变量', () => {
  const source = fs.readFileSync(flowchartEditorPath, 'utf8')

  assert.doesNotMatch(source, /class="nodeType"/)
  assert.match(source, /--flowchart-panel-bg/)
  assert.match(source, /var\(--flowchart-panel-bg\)/)
  assert.match(source, /--flowchart-dock-bg/)
  assert.match(source, /activePanel/)
  assert.match(source, /togglePanel\('palette'\)/)
  assert.match(source, /togglePanel\(panel\)/)
})

test('流程图编辑页支持独立的画布视口能力，而不是固定死板画布', () => {
  const source = fs.readFileSync(flowchartEditorPath, 'utf8')

  assert.match(source, /flowchartViewportToolbar/)
  assert.match(source, /canvasWorldStyle\(\)/)
  assert.match(source, /startCanvasPan\(/)
  assert.match(source, /onCanvasPan\(/)
  assert.match(source, /zoomIn\(/)
  assert.match(source, /zoomOut\(/)
  assert.match(source, /fitCanvasToView\(/)
  assert.match(source, /viewportZoomLabel/)
})

test('流程图拖拽节点时会应用网格吸附配置', () => {
  const source = fs.readFileSync(flowchartEditorPath, 'utf8')

  assert.match(source, /snapPositionToGrid\(/)
  assert.match(source, /this\.flowchartConfig\.snapToGrid/)
  assert.match(source, /this\.flowchartConfig\.gridSize/)
  assert.match(source, /currentNode\.x = snappedPosition\.x/)
  assert.match(source, /currentNode\.y = snappedPosition\.y/)
})

test('流程图编辑器提供多选节点的基础对齐能力', () => {
  const source = fs.readFileSync(flowchartEditorPath, 'utf8')

  assert.match(source, /alignSelectedNodesLeft\(/)
  assert.match(source, /distributeSelectedNodesHorizontally\(/)
  assert.match(source, /distributeSelectedNodesVertically\(/)
  assert.match(source, /\$t\('flowchart\.alignLeft'\)/)
  assert.match(source, /\$t\('flowchart\.distributeHorizontal'\)/)
  assert.match(source, /\$t\('flowchart\.distributeVertical'\)/)
})

test('流程图编辑器支持复制粘贴节点并保留选中节点之间的连线', () => {
  const source = fs.readFileSync(flowchartEditorPath, 'utf8')

  assert.match(source, /copySelectedNodes\(/)
  assert.match(source, /pasteCopiedNodes\(/)
  assert.match(source, /flowchartClipboard/)
  assert.match(source, /sourceIdMap/)
  assert.match(source, /copiedEdges/)
  assert.match(source, /\$t\('flowchart\.copy'\)/)
  assert.match(source, /\$t\('flowchart\.paste'\)/)
})

test('流程图编辑器提供键盘快捷操作，覆盖复制粘贴和删除选择', () => {
  const source = fs.readFileSync(flowchartEditorPath, 'utf8')

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
  assert.match(source, /flowchartGuideLine/)
  assert.match(source, /clearAlignmentGuides\(/)
  assert.match(source, /FLOWCHART_ALIGNMENT_THRESHOLD/)
})

test('流程图多选手势不会在 mousedown 阶段覆盖已选节点', () => {
  const source = fs.readFileSync(flowchartEditorPath, 'utf8')

  assert.match(source, /const isAppendSelectionDrag = !!\(event\.shiftKey \|\| event\.ctrlKey \|\| event\.metaKey\)/)
  assert.match(source, /if \(isAppendSelectionDrag && !this\.selectedNodeIds\.includes\(node\.id\)\) \{[\s\S]*?return[\s\S]*?\}/)
})

test('流程图单击节点不会被当作拖拽变更写入历史和文件', () => {
  const source = fs.readFileSync(flowchartEditorPath, 'utf8')

  assert.match(source, /moved:\s*false/)
  assert.match(source, /this\.dragState\.moved =/)
  assert.match(source, /const shouldPersist = this\.dragState\.moved/)
  assert.match(source, /if \(shouldPersist\) \{[\s\S]*?persistFlowchartState\(\)/)
})

test('流程图编辑器提供撤销重做历史，不把历史写入文档结构', () => {
  const source = fs.readFileSync(flowchartEditorPath, 'utf8')

  assert.match(source, /FLOWCHART_HISTORY_LIMIT/)
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
  const source = fs.readFileSync(flowchartEditorPath, 'utf8')

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
  const source = fs.readFileSync(flowchartEditorPath, 'utf8')

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

test('流程图重复连接已连节点时会选中现有连线而不是最后一条无关连线', () => {
  const source = fs.readFileSync(flowchartEditorPath, 'utf8')

  assert.match(source, /const existingEdge = this\.flowchartData\.edges\.find/)
  assert.match(source, /const targetEdge = existingEdge \|\| \{/)
  assert.match(source, /this\.selectedEdgeId = targetEdge\.id/)
})

test('流程图属性面板支持直接修改节点类型并按类型调整尺寸', () => {
  const source = fs.readFileSync(flowchartEditorPath, 'utf8')

  assert.match(source, /\$t\('flowchart\.nodeType'\)/)
  assert.match(source, /v-for="typeItem in flowchartNodeTypes"/)
  assert.match(source, /updateSelectedNodeType\(/)
  assert.match(source, /getDefaultNodeSizeByType\(/)
})

test('流程图全局快捷键不会拦截属性面板下拉框输入', () => {
  const source = fs.readFileSync(flowchartEditorPath, 'utf8')

  assert.match(source, /tagName === 'select'/)
})

test('流程图编辑器提供空画布起步动作，并移除显式快捷键帮助入口', () => {
  const source = fs.readFileSync(flowchartEditorPath, 'utf8')

  assert.match(source, /canvasEmptyActions/)
  assert.match(source, /applyTemplate\('approval'\)/)
  assert.doesNotMatch(source, /activePanel === 'shortcuts'/)
  assert.match(source, /event\.key === '\?'/)
})

test('流程图空选择删除不会误报成功或写入历史', () => {
  const source = fs.readFileSync(flowchartEditorPath, 'utf8')

  assert.match(source, /if \(!this\.selectedEdgeId && !this\.selectedNodeIds\.length\) \{/)
  assert.match(source, /\$message\.warning\(this\.\$t\('flowchart\.selectionEmpty'\)\)/)
})

test('流程图空画布适应视图会继承调用方的持久化策略', () => {
  const source = fs.readFileSync(flowchartEditorPath, 'utf8')

  assert.match(source, /resetViewport\(\{ persist = true \} = \{\}\)/)
  assert.match(source, /this\.resetViewport\(\{\s*persist\s*\}\)/)
})

test('流程图套用模板只提交一次最终视图状态，避免撤销历史被视口拆成两步', () => {
  const source = fs.readFileSync(flowchartEditorPath, 'utf8')

  assert.match(source, /applyTemplate\(templateId = 'blank'\) \{[\s\S]*?fitCanvasToView\(\{\s*persist:\s*false\s*\}\)/)
  assert.match(source, /applyTemplate\(templateId = 'blank'\) \{[\s\S]*?persistFlowchartState\(\)/)
  assert.doesNotMatch(source, /applyTemplate\(templateId = 'blank'\) \{[\s\S]*?\$nextTick\(\(\) => \{\s*this\.fitCanvasToView\(\)\s*\}\)[\s\S]*?persistFlowchartState\(\)/)
})
