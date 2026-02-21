<template>
  <div class="workflow-designer">
    <!-- 工具栏 -->
    <div class="designer-toolbar">
      <div class="toolbar-left">
        <el-input
          v-model="workflowName"
          placeholder="工作流名称"
          style="width: 240px"
        />
        <el-select v-model="triggerType" placeholder="触发条件" style="width: 180px">
          <el-option
            v-for="trigger in triggerTypes"
            :key="trigger.value"
            :label="trigger.label"
            :value="trigger.value"
          />
        </el-select>
      </div>
      <div class="toolbar-right">
        <el-button @click="testWorkflow" :icon="VideoPlay">测试运行</el-button>
        <el-button @click="toggleActive" :type="isActive ? 'warning' : 'success'">
          {{ isActive ? '停用' : '启用' }}
        </el-button>
        <el-button type="primary" @click="saveWorkflow" :icon="Check">保存</el-button>
      </div>
    </div>

    <div class="designer-body">
      <!-- 左侧节点面板 -->
      <div class="node-panel">
        <div class="panel-section">
          <div class="panel-title">触发器</div>
          <div
            v-for="trigger in triggerNodes"
            :key="trigger.type"
            class="node-item trigger-node"
            draggable="true"
            @dragstart="onDragStart($event, 'trigger', trigger)"
          >
            <el-icon><component :is="trigger.icon" /></el-icon>
            <span>{{ trigger.label }}</span>
          </div>
        </div>

        <div class="panel-section">
          <div class="panel-title">动作</div>
          <div
            v-for="action in actionNodes"
            :key="action.type"
            class="node-item action-node"
            draggable="true"
            @dragstart="onDragStart($event, 'action', action)"
          >
            <el-icon><component :is="action.icon" /></el-icon>
            <span>{{ action.label }}</span>
          </div>
        </div>

        <div class="panel-section">
          <div class="panel-title">条件</div>
          <div
            class="node-item condition-node"
            draggable="true"
            @dragstart="onDragStart($event, 'condition', { type: 'condition', label: '条件判断' })"
          >
            <el-icon><Switch /></el-icon>
            <span>条件判断</span>
          </div>
        </div>
      </div>

      <!-- 中间画布区域 -->
      <div
        class="flow-canvas"
        @drop="onDrop"
        @dragover.prevent
      >
        <div v-if="nodes.length === 0" class="canvas-placeholder">
          <el-empty description="拖拽左侧节点到此处开始设计工作流" />
        </div>

        <!-- 节点列表（简化版，不依赖 vue-flow） -->
        <div class="flow-nodes">
          <div
            v-for="(node, index) in nodes"
            :key="node.id"
            class="flow-node"
            :class="[`node-type-${node.category}`, { selected: selectedNodeId === node.id }]"
            @click="selectNode(node.id)"
          >
            <div class="node-header">
              <el-icon><component :is="node.icon" /></el-icon>
              <span>{{ node.label }}</span>
              <el-button
                :icon="Close"
                size="small"
                text
                @click.stop="removeNode(node.id)"
              />
            </div>
            <div class="node-body">
              <span class="node-type-tag">{{ node.category === 'trigger' ? '触发器' : node.category === 'action' ? '动作' : '条件' }}</span>
            </div>
            <!-- 连接线 -->
            <div v-if="index < nodes.length - 1" class="connector-line">
              <div class="line"></div>
              <el-icon><ArrowDown /></el-icon>
            </div>
          </div>
        </div>
      </div>

      <!-- 右侧属性面板 -->
      <div class="property-panel" v-if="selectedNode">
        <div class="panel-title">节点属性</div>
        <el-form label-width="80px" label-position="top">
          <el-form-item label="名称">
            <el-input v-model="selectedNode.label" />
          </el-form-item>
          <el-form-item label="类型">
            <el-tag>{{ selectedNode.type }}</el-tag>
          </el-form-item>
          <el-form-item label="描述">
            <el-input v-model="selectedNode.description" type="textarea" :rows="3" />
          </el-form-item>

          <!-- 动作节点特有配置 -->
          <template v-if="selectedNode.category === 'action'">
            <el-form-item label="目标" v-if="selectedNode.type === 'assign_lead'">
              <el-select v-model="selectedNode.config.assignTo" placeholder="分配给">
                <el-option label="轮流分配" value="round_robin" />
                <el-option label="最少负荷" value="least_load" />
                <el-option label="指定人员" value="specific" />
              </el-select>
            </el-form-item>
            <el-form-item label="通知方式" v-if="selectedNode.type === 'send_notification'">
              <el-checkbox-group v-model="selectedNode.config.channels">
                <el-checkbox label="in_app">站内通知</el-checkbox>
                <el-checkbox label="email">邮件</el-checkbox>
              </el-checkbox-group>
            </el-form-item>
          </template>
        </el-form>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed } from 'vue'
import { ElMessage, ElMessageBox } from 'element-plus'
import {
  Plus, Refresh, Clock, Timer,
  User, DocumentAdd, Bell, Message, Edit, Link,
  Switch, Close, Check, VideoPlay, ArrowDown,
} from '@element-plus/icons-vue'
import { saveWorkflowDefinition, testWorkflowDefinition } from '@/api/workflowApi'

interface FlowNode {
  id: string
  type: string
  category: 'trigger' | 'action' | 'condition'
  label: string
  icon: string
  description: string
  config: Record<string, unknown>
}

const workflowName = ref('')
const triggerType = ref('')
const isActive = ref(false)
const nodes = ref<FlowNode[]>([])
const selectedNodeId = ref<string | null>(null)
let nodeIdCounter = 0

const triggerTypes = [
  { value: 'LEAD_CREATED', label: '线索创建时' },
  { value: 'LEAD_STATUS_CHANGED', label: '线索状态变更时' },
  { value: 'TASK_DUE', label: '任务到期时' },
  { value: 'SCHEDULED', label: '定时触发' },
]

const triggerNodes = [
  { type: 'lead_created', label: '线索创建', icon: Plus },
  { type: 'lead_status_changed', label: '线索状态变更', icon: Refresh },
  { type: 'task_due', label: '任务到期', icon: Clock },
  { type: 'scheduled', label: '定时触发', icon: Timer },
]

const actionNodes = [
  { type: 'assign_lead', label: '分配线索', icon: User },
  { type: 'create_task', label: '创建任务', icon: DocumentAdd },
  { type: 'send_notification', label: '发送通知', icon: Bell },
  { type: 'send_email', label: '发送邮件', icon: Message },
  { type: 'update_field', label: '更新字段', icon: Edit },
  { type: 'webhook', label: '调用 Webhook', icon: Link },
]

const selectedNode = computed(() => {
  if (!selectedNodeId.value) return null
  return nodes.value.find((n) => n.id === selectedNodeId.value) || null
})

function onDragStart(event: DragEvent, category: string, node: { type: string; label: string; icon?: unknown }) {
  event.dataTransfer?.setData('application/json', JSON.stringify({
    type: node.type,
    label: node.label,
    category,
  }))
}

function onDrop(event: DragEvent) {
  const data = event.dataTransfer?.getData('application/json')
  if (!data) return

  const { type, label, category } = JSON.parse(data)

  // 触发器只能有一个
  if (category === 'trigger' && nodes.value.some((n) => n.category === 'trigger')) {
    ElMessage.warning('工作流只能有一个触发器')
    return
  }

  const newNode: FlowNode = {
    id: `node_${++nodeIdCounter}`,
    type,
    category,
    label,
    icon: getIconName(type, category),
    description: '',
    config: {},
  }

  // 触发器始终在第一位
  if (category === 'trigger') {
    nodes.value.unshift(newNode)
  } else {
    nodes.value.push(newNode)
  }
}

function getIconName(type: string, category: string): string {
  if (category === 'condition') return 'Switch'
  const all = [...triggerNodes, ...actionNodes]
  return all.find((n) => n.type === type)?.icon?.name || 'Setting'
}

function selectNode(id: string) {
  selectedNodeId.value = selectedNodeId.value === id ? null : id
}

function removeNode(id: string) {
  nodes.value = nodes.value.filter((n) => n.id !== id)
  if (selectedNodeId.value === id) selectedNodeId.value = null
}

async function saveWorkflow() {
  if (!workflowName.value) {
    ElMessage.warning('请输入工作流名称')
    return
  }
  if (!triggerType.value) {
    ElMessage.warning('请选择触发条件')
    return
  }
  if (nodes.value.length === 0) {
    ElMessage.warning('请至少添加一个节点')
    return
  }

  try {
    await saveWorkflowDefinition({
      name: workflowName.value,
      triggerType: triggerType.value,
      isActive: isActive.value,
      nodes: nodes.value,
      edges: []
    })
    ElMessage.success('工作流保存成功')
  } catch (error: any) {
    ElMessage.error(error.message || '工作流保存失败')
  }
}

async function testWorkflow() {
  if (!triggerType.value) {
    ElMessage.warning('测试前需先选择触发条件')
    return
  }

  try {
    const res = await testWorkflowDefinition({
      name: workflowName.value || '未命名测试',
      triggerType: triggerType.value,
      nodes: nodes.value
    })
    
    // 由于后端配置了 logs，我们使用 msgbox 予以展示
    const formattedLogs = Array.isArray(res.logs) ? res.logs.join('\n') : '模拟执行完毕'
    ElMessageBox.alert(
      `<div style="white-space: pre-wrap; font-family: monospace;">${formattedLogs}</div>`,
      '测试运行控制台',
      { type: 'success', dangerouslyUseHTMLString: true }
    )
  } catch (error: any) {
    ElMessage.error(error.message || '运行测试失败')
  }
}

function toggleActive() {
  isActive.value = !isActive.value
  ElMessage.success(isActive.value ? '工作流已启用' : '工作流已停用')
}
</script>

<style scoped>
.workflow-designer {
  height: calc(100vh - 120px);
  display: flex;
  flex-direction: column;
}

.designer-toolbar {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 12px 20px;
  border-bottom: 1px solid #e4e7ed;
  background: #fff;
}

.toolbar-left, .toolbar-right {
  display: flex;
  gap: 12px;
  align-items: center;
}

.designer-body {
  flex: 1;
  display: flex;
  overflow: hidden;
}

/* 左侧节点面板 */
.node-panel {
  width: 200px;
  border-right: 1px solid #e4e7ed;
  background: #fafafa;
  padding: 16px;
  overflow-y: auto;
}

.panel-section {
  margin-bottom: 20px;
}

.panel-title {
  font-size: 13px;
  font-weight: 600;
  color: #606266;
  margin-bottom: 10px;
  text-transform: uppercase;
  letter-spacing: 1px;
}

.node-item {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 8px 12px;
  border-radius: 6px;
  cursor: grab;
  margin-bottom: 6px;
  font-size: 13px;
  transition: all 0.2s;
  border: 1px solid transparent;
}

.node-item:hover {
  transform: translateX(4px);
}

.trigger-node { background: #ecf5ff; color: #409EFF; border-color: #b3d8ff; }
.trigger-node:hover { background: #d9ecff; }
.action-node { background: #f0f9eb; color: #67C23A; border-color: #c2e7b0; }
.action-node:hover { background: #e1f3d8; }
.condition-node { background: #fdf6ec; color: #E6A23C; border-color: #f5dab1; }
.condition-node:hover { background: #faecd8; }

/* 中间画布 */
.flow-canvas {
  flex: 1;
  background: #f5f7fa;
  overflow-y: auto;
  padding: 40px;
  position: relative;
}

.canvas-placeholder {
  display: flex;
  align-items: center;
  justify-content: center;
  height: 100%;
}

.flow-nodes {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 0;
}

.flow-node {
  width: 280px;
  background: #fff;
  border: 2px solid #e4e7ed;
  border-radius: 8px;
  cursor: pointer;
  transition: all 0.2s;
  position: relative;
}

.flow-node:hover { border-color: #409EFF; box-shadow: 0 2px 8px rgba(64, 158, 255, 0.15); }
.flow-node.selected { border-color: #409EFF; box-shadow: 0 4px 12px rgba(64, 158, 255, 0.25); }

.node-type-trigger { border-left: 4px solid #409EFF; }
.node-type-action { border-left: 4px solid #67C23A; }
.node-type-condition { border-left: 4px solid #E6A23C; }

.node-header {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 10px 12px;
  border-bottom: 1px solid #f0f0f0;
  font-weight: 500;
}

.node-header span { flex: 1; }

.node-body {
  padding: 8px 12px;
}

.node-type-tag {
  font-size: 11px;
  color: #909399;
}

.connector-line {
  display: flex;
  flex-direction: column;
  align-items: center;
  padding: 6px 0;
  color: #c0c4cc;
}

.connector-line .line {
  width: 2px;
  height: 16px;
  background: #dcdfe6;
}

/* 右侧属性面板 */
.property-panel {
  width: 280px;
  border-left: 1px solid #e4e7ed;
  background: #fff;
  padding: 16px;
  overflow-y: auto;
}
</style>
