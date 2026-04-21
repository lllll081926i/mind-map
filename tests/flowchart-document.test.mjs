import test from 'node:test'
import assert from 'node:assert/strict'
import fs from 'node:fs'
import path from 'node:path'

const flowchartDocumentPath = path.resolve('src/services/flowchartDocument.js')

const loadFlowchartDocumentModule = async () => {
  const source = fs
    .readFileSync(flowchartDocumentPath, 'utf8')
    .replace(
      "import { parseExternalJsonSafely } from '@/utils/json'",
      `const parseExternalJsonSafely = value => {
        try {
          return JSON.parse(String(value || ''))
        } catch (_error) {
          return null
        }
      }`
    )
  return import(
    `data:text/javascript;base64,${Buffer.from(source, 'utf8').toString('base64')}`
  )
}

test('流程图文档服务存在并暴露核心能力', () => {
  assert.equal(fs.existsSync(flowchartDocumentPath), true)
  const source = fs.readFileSync(flowchartDocumentPath, 'utf8')

  assert.match(source, /export\s+const\s+FLOWCHART_DOCUMENT_MODE/)
  assert.match(source, /export\s+const\s+createDefaultFlowchartData/)
  assert.match(source, /export\s+const\s+createFlowchartDocumentContent/)
  assert.match(source, /export\s+const\s+parseStoredDocumentContent/)
  assert.match(source, /export\s+const\s+serializeStoredDocumentContent/)
  assert.match(source, /export\s+const\s+convertMindMapToFlowchart/)
  assert.match(source, /export\s+const\s+normalizeFlowchartAiResult/)
})

test('流程图文档模型包含节点、连线、视口和模板字段', () => {
  const source = fs.readFileSync(flowchartDocumentPath, 'utf8')

  assert.match(source, /templateId/)
  assert.match(source, /viewport/)
  assert.match(source, /nodes/)
  assert.match(source, /edges/)
  assert.match(source, /type:\s*'start'/)
  assert.match(source, /type:\s*'process'/)
  assert.match(source, /type:\s*'decision'/)
  assert.match(source, /type:\s*'input'/)
  assert.match(source, /type:\s*'end'/)
})

test('思维导图文档解析与序列化会保留 config 字段', () => {
  const source = fs.readFileSync(flowchartDocumentPath, 'utf8')

  assert.match(source, /config:\s*parsed\.config/)
  assert.match(source, /mindMapConfig:\s*parsed\.config/)
  assert.match(source, /mindMapConfig \|\| config \? \{ config: mindMapConfig \|\| config \} : \{\}/)
})

test('流程图规范化会修复外部数据里的重复节点和连线 ID', async () => {
  const { normalizeFlowchartAiResult } = await loadFlowchartDocumentModule()
  const normalized = normalizeFlowchartAiResult({
    title: '重复 ID 流程',
    nodes: [
      { id: 'same', type: 'start', text: '开始', x: 0, y: 0 },
      { id: 'same', type: 'process', text: '处理', x: 0, y: 120 }
    ],
    edges: [
      { id: 'edge', source: 'same', target: 'same' },
      { id: 'edge', source: 'same', target: 'same' }
    ]
  })

  const nodeIds = normalized.flowchartData.nodes.map(node => node.id)
  const edgeIds = normalized.flowchartData.edges.map(edge => edge.id)

  assert.equal(new Set(nodeIds).size, nodeIds.length)
  assert.equal(new Set(edgeIds).size, edgeIds.length)
})

test('思维导图转流程图会修复重复 uid 并保持连线指向真实节点', async () => {
  const { convertMindMapToFlowchart } = await loadFlowchartDocumentModule()
  const converted = convertMindMapToFlowchart({
    root: {
      data: {
        uid: 'same',
        text: '父节点'
      },
      children: [
        {
          data: {
            uid: 'same',
            text: '子节点'
          },
          children: []
        }
      ]
    }
  })

  const nodeIds = converted.flowchartData.nodes.map(node => node.id)
  const [edge] = converted.flowchartData.edges

  assert.equal(new Set(nodeIds).size, nodeIds.length)
  assert.equal(nodeIds.includes(edge.source), true)
  assert.equal(nodeIds.includes(edge.target), true)
  assert.notEqual(edge.source, edge.target)
})
