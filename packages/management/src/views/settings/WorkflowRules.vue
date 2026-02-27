<template>
  <div class="workflow-rules">
    <!-- 页面头部 -->
    <div class="page-header">
      <div class="header-info">
        <h2>工作流自动化</h2>
        <p class="subtitle">配置自动化规则，让系统自动处理重复性工作</p>
      </div>
      <el-button type="primary" :icon="Plus" @click="openCreateDialog">
        创建规则
      </el-button>
    </div>

    <!-- 统计卡片 -->
    <div class="stats-row">
      <div class="stat-card">
        <div class="stat-icon active">
          <el-icon><CircleCheck /></el-icon>
        </div>
        <div class="stat-info">
          <span class="stat-value">{{ activeRulesCount }}</span>
          <span class="stat-label">活跃规则</span>
        </div>
      </div>
      <div class="stat-card">
        <div class="stat-icon executions">
          <el-icon><Timer /></el-icon>
        </div>
        <div class="stat-info">
          <span class="stat-value">{{ todayExecutions }}</span>
          <span class="stat-label">今日执行</span>
        </div>
      </div>
      <div class="stat-card">
        <div class="stat-icon templates">
          <el-icon><Document /></el-icon>
        </div>
        <div class="stat-info">
          <span class="stat-value">{{ templates.length }}</span>
          <span class="stat-label">可用模板</span>
        </div>
      </div>
    </div>

    <!-- 规则列表 -->
    <el-card class="rules-card">
      <template #header>
        <div class="card-header">
          <span>自动化规则</span>
          <div class="header-actions">
            <el-input
              v-model="searchQuery"
              placeholder="搜索规则..."
              :prefix-icon="Search"
              clearable
              style="width: 200px"
            />
          </div>
        </div>
      </template>

      <div class="rules-list" v-if="filteredRules.length > 0">
        <div 
          v-for="rule in filteredRules" 
          :key="rule.id"
          class="rule-item"
          :class="{ disabled: !rule.enabled }"
        >
          <div class="rule-header">
            <el-switch 
              v-model="rule.enabled" 
              @change="toggleRule(rule)"
            />
            <div class="rule-info">
              <h4>{{ rule.name }}</h4>
              <p>{{ rule.description }}</p>
            </div>
            <div class="rule-actions">
              <el-button text :icon="Edit" @click="editRule(rule)">编辑</el-button>
              <el-button text type="danger" v-permission="['settings:manage']" :icon="Delete" @click="deleteRule(rule)">删除</el-button>
            </div>
          </div>
          
          <div class="rule-details">
            <div class="rule-trigger">
              <span class="detail-label">触发条件</span>
              <el-tag size="small" :type="getTriggerType(rule.trigger)">
                {{ getTriggerLabel(rule.trigger) }}
              </el-tag>
            </div>
            <el-icon class="arrow-icon"><Right /></el-icon>
            <div class="rule-action">
              <span class="detail-label">执行动作</span>
              <el-tag size="small" type="success">
                {{ getActionLabel(rule.action) }}
              </el-tag>
            </div>
            <div class="rule-stats">
              <span>执行 {{ rule.executionCount }} 次</span>
              <span v-if="rule.lastExecutedAt">
                · 最近 {{ formatRelativeTime(rule.lastExecutedAt) }}
              </span>
            </div>
          </div>
        </div>
      </div>

      <el-empty v-else description="暂无自动化规则" />
    </el-card>

    <!-- 预设模板 -->
    <el-card class="templates-card">
      <template #header>
        <span>快速开始 - 预设模板</span>
      </template>
      
      <div class="templates-grid">
        <div 
          v-for="template in templates" 
          :key="template.id"
          class="template-card"
          @click="useTemplate(template)"
        >
          <div class="template-icon" :style="{ background: template.color }">
            <el-icon :size="24"><component :is="template.icon" /></el-icon>
          </div>
          <div class="template-info">
            <h4>{{ template.name }}</h4>
            <p>{{ template.description }}</p>
          </div>
          <el-button type="primary" text size="small">使用</el-button>
        </div>
      </div>
    </el-card>

    <!-- 创建/编辑规则对话框 -->
    <el-dialog
      v-model="showRuleDialog"
      :title="editingRule ? '编辑规则' : '创建自动化规则'"
      width="640px"
      destroy-on-close
    >
      <el-form :model="ruleForm" label-width="100px" class="rule-form">
        <el-form-item label="规则名称" required>
          <el-input v-model="ruleForm.name" placeholder="例如：新线索自动分配" />
        </el-form-item>
        
        <el-form-item label="规则描述">
          <el-input 
            v-model="ruleForm.description" 
            type="textarea" 
            :rows="2"
            placeholder="描述这条规则的作用..."
          />
        </el-form-item>

        <el-divider content-position="left">触发条件</el-divider>
        
        <el-form-item label="触发类型" required>
          <el-select v-model="ruleForm.triggerType" style="width: 100%">
            <el-option 
              v-for="trigger in triggerTypes" 
              :key="trigger.value" 
              :label="trigger.label" 
              :value="trigger.value"
            />
          </el-select>
        </el-form-item>

        <el-form-item label="条件筛选" v-if="ruleForm.triggerType">
          <div class="conditions-builder">
            <div 
              v-for="(condition, index) in ruleForm.conditions" 
              :key="index"
              class="condition-row"
            >
              <el-select v-model="condition.field" placeholder="字段" style="width: 120px">
                <el-option label="状态" value="status" />
                <el-option label="来源" value="source" />
                <el-option label="评分" value="score" />
                <el-option label="标签" value="tags" />
              </el-select>
              <el-select v-model="condition.operator" placeholder="条件" style="width: 100px">
                <el-option label="等于" value="equals" />
                <el-option label="不等于" value="not_equals" />
                <el-option label="包含" value="contains" />
                <el-option label="大于" value="greater_than" />
                <el-option label="小于" value="less_than" />
              </el-select>
              <el-input v-model="condition.value" placeholder="值" style="flex: 1" />
              <el-button 
                :icon="Delete" 
                text 
                type="danger"
                @click="removeCondition(index)"
              />
            </div>
            <el-button text type="primary" :icon="Plus" @click="addCondition">
              添加条件
            </el-button>
          </div>
        </el-form-item>

        <el-divider content-position="left">执行动作</el-divider>

        <el-form-item label="动作类型" required>
          <el-select v-model="ruleForm.actionType" style="width: 100%">
            <el-option 
              v-for="action in actionTypes" 
              :key="action.value" 
              :label="action.label" 
              :value="action.value"
            />
          </el-select>
        </el-form-item>

        <el-form-item label="动作配置" v-if="ruleForm.actionType">
          <!-- 自动分配 -->
          <template v-if="ruleForm.actionType === 'auto_assign'">
            <el-select v-model="ruleForm.actionConfig.assignTo" style="width: 100%">
              <el-option label="轮询分配" value="round_robin" />
              <el-option label="负载均衡" value="load_balance" />
              <el-option label="指定人员" value="specific_user" />
            </el-select>
          </template>
          <!-- 发送通知 -->
          <template v-else-if="ruleForm.actionType === 'send_notification'">
            <el-input 
              v-model="ruleForm.actionConfig.message" 
              type="textarea"
              placeholder="通知内容，支持变量：{contactName}, {status}"
            />
          </template>
          <!-- 创建任务 -->
          <template v-else-if="ruleForm.actionType === 'create_task'">
            <el-input 
              v-model="ruleForm.actionConfig.taskTitle" 
              placeholder="任务标题"
              style="margin-bottom: 8px"
            />
            <el-input-number 
              v-model="ruleForm.actionConfig.dueInDays" 
              :min="1" 
              :max="30"
            />
            <span style="margin-left: 8px">天后到期</span>
          </template>
        </el-form-item>

        <el-form-item label="立即启用">
          <el-switch v-model="ruleForm.enabled" />
        </el-form-item>
      </el-form>

      <template #footer>
        <el-button @click="showRuleDialog = false">取消</el-button>
        <el-button type="primary" @click="saveRule" :loading="saving">
          {{ editingRule ? '保存' : '创建' }}
        </el-button>
      </template>
    </el-dialog>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted, markRaw } from 'vue'
import { ElMessage, ElMessageBox } from 'element-plus'
import {
  Plus,
  Search,
  Edit,
  Delete,
  Right,
  CircleCheck,
  Timer,
  Document,
  Bell,
  User,
  Tickets,
  Message,
} from '@element-plus/icons-vue'
import dayjs from 'dayjs'
import relativeTime from 'dayjs/plugin/relativeTime'
import 'dayjs/locale/zh-cn'

dayjs.extend(relativeTime)
dayjs.locale('zh-cn')

// 规则类型定义
interface WorkflowRule {
  id: string
  name: string
  description: string
  enabled: boolean
  trigger: string
  action: string
  conditions: RuleCondition[]
  actionConfig: Record<string, any>
  executionCount: number
  lastExecutedAt?: string
}

interface RuleCondition {
  field: string
  operator: string
  value: string
}

interface RuleTemplate {
  id: string
  name: string
  description: string
  icon: typeof Bell
  color: string
  trigger: string
  action: string
  conditions: RuleCondition[]
  actionConfig: Record<string, any>
}

// 状态
const searchQuery = ref('')
const showRuleDialog = ref(false)
const editingRule = ref<WorkflowRule | null>(null)
const saving = ref(false)

// 模拟数据
const rules = ref<WorkflowRule[]>([
  {
    id: '1',
    name: '新线索自动分配',
    description: '当新线索进入时，自动按负载均衡分配给销售人员',
    enabled: true,
    trigger: 'lead_created',
    action: 'auto_assign',
    conditions: [],
    actionConfig: { assignTo: 'load_balance' },
    executionCount: 156,
    lastExecutedAt: new Date(Date.now() - 3600000).toISOString(),
  },
  {
    id: '2',
    name: '高价值线索提醒',
    description: '当线索评分超过80分时，发送通知给管理员',
    enabled: true,
    trigger: 'lead_updated',
    action: 'send_notification',
    conditions: [{ field: 'score', operator: 'greater_than', value: '80' }],
    actionConfig: { message: '高价值线索需要关注：{contactName}' },
    executionCount: 23,
    lastExecutedAt: new Date(Date.now() - 86400000).toISOString(),
  },
  {
    id: '3',
    name: '逾期任务升级',
    description: '任务逾期后自动创建跟进任务并通知负责人',
    enabled: false,
    trigger: 'task_overdue',
    action: 'create_task',
    conditions: [],
    actionConfig: { taskTitle: '跟进逾期任务', dueInDays: 1 },
    executionCount: 8,
  },
])

// 预设模板
const templates = ref<RuleTemplate[]>([
  {
    id: 't1',
    name: '线索自动跟进',
    description: '新线索进入后自动创建首次跟进任务',
    icon: markRaw(User),
    color: 'linear-gradient(135deg, #06b6d4 0%, #0891b2 100%)',
    trigger: 'lead_created',
    action: 'create_task',
    conditions: [],
    actionConfig: { taskTitle: '首次跟进', dueInDays: 1 },
  },
  {
    id: 't2',
    name: '任务完成通知',
    description: '任务完成后自动通知相关人员',
    icon: markRaw(Bell),
    color: 'linear-gradient(135deg, #8b5cf6 0%, #7c3aed 100%)',
    trigger: 'task_completed',
    action: 'send_notification',
    conditions: [],
    actionConfig: { message: '任务已完成：{taskTitle}' },
  },
  {
    id: 't3',
    name: '客户生日提醒',
    description: '客户生日前3天自动创建祝福任务',
    icon: markRaw(Message),
    color: 'linear-gradient(135deg, #f59e0b 0%, #d97706 100%)',
    trigger: 'customer_birthday',
    action: 'create_task',
    conditions: [],
    actionConfig: { taskTitle: '发送生日祝福', dueInDays: 3 },
  },
  {
    id: 't4',
    name: '智能分配',
    description: '基于工作负载自动分配新线索',
    icon: markRaw(Tickets),
    color: 'linear-gradient(135deg, #10b981 0%, #059669 100%)',
    trigger: 'lead_created',
    action: 'auto_assign',
    conditions: [],
    actionConfig: { assignTo: 'load_balance' },
  },
])

// 触发类型选项
const triggerTypes = [
  { value: 'lead_created', label: '新线索创建时' },
  { value: 'lead_updated', label: '线索更新时' },
  { value: 'lead_status_changed', label: '线索状态变更时' },
  { value: 'task_created', label: '新任务创建时' },
  { value: 'task_completed', label: '任务完成时' },
  { value: 'task_overdue', label: '任务逾期时' },
  { value: 'customer_birthday', label: '客户生日前' },
  { value: 'scheduled', label: '定时执行' },
]

// 动作类型选项
const actionTypes = [
  { value: 'auto_assign', label: '自动分配' },
  { value: 'send_notification', label: '发送通知' },
  { value: 'create_task', label: '创建任务' },
  { value: 'update_status', label: '更新状态' },
  { value: 'send_email', label: '发送邮件' },
  { value: 'add_tag', label: '添加标签' },
]

// 表单
const defaultRuleForm = () => ({
  name: '',
  description: '',
  triggerType: '',
  conditions: [] as RuleCondition[],
  actionType: '',
  actionConfig: {} as Record<string, any>,
  enabled: true,
})

const ruleForm = ref(defaultRuleForm())

// 计算属性
const activeRulesCount = computed(() => rules.value.filter(r => r.enabled).length)

const todayExecutions = computed(() => {
  // 模拟今日执行次数
  return rules.value.reduce((sum, r) => sum + Math.floor(r.executionCount / 7), 0)
})

const filteredRules = computed(() => {
  if (!searchQuery.value) return rules.value
  const q = searchQuery.value.toLowerCase()
  return rules.value.filter(
    r => r.name.toLowerCase().includes(q) || r.description.toLowerCase().includes(q)
  )
})

// 方法
function getTriggerType(trigger: string) {
  const typeMap: Record<string, 'primary' | 'success' | 'warning' | 'info'> = {
    lead_created: 'primary',
    lead_updated: 'info',
    task_completed: 'success',
    task_overdue: 'warning',
  }
  return typeMap[trigger] || 'info'
}

function getTriggerLabel(trigger: string) {
  return triggerTypes.find(t => t.value === trigger)?.label || trigger
}

function getActionLabel(action: string) {
  return actionTypes.find(a => a.value === action)?.label || action
}

function formatRelativeTime(dateStr: string) {
  return dayjs(dateStr).fromNow()
}

function openCreateDialog() {
  editingRule.value = null
  ruleForm.value = defaultRuleForm()
  showRuleDialog.value = true
}

function editRule(rule: WorkflowRule) {
  editingRule.value = rule
  ruleForm.value = {
    name: rule.name,
    description: rule.description,
    triggerType: rule.trigger,
    conditions: [...rule.conditions],
    actionType: rule.action,
    actionConfig: { ...rule.actionConfig },
    enabled: rule.enabled,
  }
  showRuleDialog.value = true
}

async function deleteRule(rule: WorkflowRule) {
  try {
    await ElMessageBox.confirm(`确定要删除规则 "${rule.name}" 吗？`, '删除确认', { type: 'warning' })
    const index = rules.value.findIndex(r => r.id === rule.id)
    if (index > -1) {
      rules.value.splice(index, 1)
      ElMessage.success('规则已删除')
    }
  } catch {
    // 用户取消
  }
}

function toggleRule(rule: WorkflowRule) {
  ElMessage.success(rule.enabled ? '规则已启用' : '规则已禁用')
}

function addCondition() {
  ruleForm.value.conditions.push({ field: '', operator: '', value: '' })
}

function removeCondition(index: number) {
  ruleForm.value.conditions.splice(index, 1)
}

async function saveRule() {
  if (!ruleForm.value.name || !ruleForm.value.triggerType || !ruleForm.value.actionType) {
    ElMessage.warning('请填写必填项')
    return
  }

  saving.value = true
  try {
    // 模拟保存
    await new Promise(resolve => setTimeout(resolve, 500))

    if (editingRule.value) {
      // 更新
      Object.assign(editingRule.value, {
        name: ruleForm.value.name,
        description: ruleForm.value.description,
        trigger: ruleForm.value.triggerType,
        action: ruleForm.value.actionType,
        conditions: ruleForm.value.conditions,
        actionConfig: ruleForm.value.actionConfig,
        enabled: ruleForm.value.enabled,
      })
      ElMessage.success('规则已更新')
    } else {
      // 创建
      rules.value.unshift({
        id: Date.now().toString(),
        name: ruleForm.value.name,
        description: ruleForm.value.description,
        enabled: ruleForm.value.enabled,
        trigger: ruleForm.value.triggerType,
        action: ruleForm.value.actionType,
        conditions: ruleForm.value.conditions,
        actionConfig: ruleForm.value.actionConfig,
        executionCount: 0,
      })
      ElMessage.success('规则已创建')
    }

    showRuleDialog.value = false
  } finally {
    saving.value = false
  }
}

function useTemplate(template: RuleTemplate) {
  editingRule.value = null
  ruleForm.value = {
    name: template.name,
    description: template.description,
    triggerType: template.trigger,
    conditions: [...template.conditions],
    actionType: template.action,
    actionConfig: { ...template.actionConfig },
    enabled: true,
  }
  showRuleDialog.value = true
}

onMounted(() => {
  // 模拟加载数据
})
</script>

<style scoped>
.workflow-rules {
  max-width: 1200px;
}

.page-header {
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
  margin-bottom: 24px;
}

.header-info h2 {
  margin: 0 0 8px;
  font-size: 24px;
  font-weight: 700;
  color: var(--color-text, #1e293b);
}

.subtitle {
  margin: 0;
  color: var(--color-text-muted, #64748b);
  font-size: 14px;
}

/* 统计卡片 */
.stats-row {
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: 16px;
  margin-bottom: 24px;
}

.stat-card {
  display: flex;
  align-items: center;
  gap: 16px;
  padding: 20px;
  background: var(--color-surface, #fff);
  border: 1px solid var(--color-border, #e2e8f0);
  border-radius: 12px;
}

.stat-icon {
  width: 48px;
  height: 48px;
  display: flex;
  align-items: center;
  justify-content: center;
  border-radius: 12px;
  font-size: 24px;
  color: white;
}

.stat-icon.active { background: linear-gradient(135deg, #10b981 0%, #059669 100%); }
.stat-icon.executions { background: linear-gradient(135deg, #06b6d4 0%, #0891b2 100%); }
.stat-icon.templates { background: linear-gradient(135deg, #8b5cf6 0%, #7c3aed 100%); }

.stat-info {
  display: flex;
  flex-direction: column;
}

.stat-value {
  font-size: 28px;
  font-weight: 700;
  color: var(--color-text, #1e293b);
  line-height: 1.2;
}

.stat-label {
  font-size: 13px;
  color: var(--color-text-muted, #64748b);
}

/* 规则卡片 */
.rules-card {
  margin-bottom: 24px;
}

.card-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.rules-list {
  display: flex;
  flex-direction: column;
  gap: 16px;
}

.rule-item {
  padding: 16px;
  background: var(--color-background, #f8fafc);
  border-radius: 12px;
  transition: all 0.2s ease;
}

.rule-item:hover {
  background: var(--color-surface-hover, #f1f5f9);
}

.rule-item.disabled {
  opacity: 0.6;
}

.rule-header {
  display: flex;
  align-items: flex-start;
  gap: 16px;
  margin-bottom: 12px;
}

.rule-info {
  flex: 1;
}

.rule-info h4 {
  margin: 0 0 4px;
  font-size: 15px;
  font-weight: 600;
  color: var(--color-text, #1e293b);
}

.rule-info p {
  margin: 0;
  font-size: 13px;
  color: var(--color-text-muted, #64748b);
}

.rule-actions {
  display: flex;
  gap: 4px;
}

.rule-details {
  display: flex;
  align-items: center;
  gap: 16px;
  padding-top: 12px;
  border-top: 1px solid var(--color-border, #e2e8f0);
}

.rule-trigger,
.rule-action {
  display: flex;
  flex-direction: column;
  gap: 4px;
}

.detail-label {
  font-size: 11px;
  color: var(--color-text-muted, #94a3b8);
  text-transform: uppercase;
}

.arrow-icon {
  color: var(--color-text-muted, #94a3b8);
}

.rule-stats {
  margin-left: auto;
  font-size: 12px;
  color: var(--color-text-muted, #94a3b8);
}

/* 模板卡片 */
.templates-grid {
  display: grid;
  grid-template-columns: repeat(2, 1fr);
  gap: 16px;
}

.template-card {
  display: flex;
  align-items: center;
  gap: 16px;
  padding: 16px;
  background: var(--color-background, #f8fafc);
  border-radius: 12px;
  cursor: pointer;
  transition: all 0.2s ease;
  border: 1px solid transparent;
}

.template-card:hover {
  background: var(--color-surface, #fff);
  border-color: var(--color-primary, #0891b2);
  transform: translateY(-2px);
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.08);
}

.template-icon {
  width: 48px;
  height: 48px;
  display: flex;
  align-items: center;
  justify-content: center;
  border-radius: 12px;
  color: white;
  flex-shrink: 0;
}

.template-info {
  flex: 1;
}

.template-info h4 {
  margin: 0 0 4px;
  font-size: 14px;
  font-weight: 600;
  color: var(--color-text, #1e293b);
}

.template-info p {
  margin: 0;
  font-size: 12px;
  color: var(--color-text-muted, #64748b);
}

/* 规则表单 */
.rule-form {
  padding: 8px 0;
}

.conditions-builder {
  width: 100%;
}

.condition-row {
  display: flex;
  gap: 8px;
  margin-bottom: 8px;
  align-items: center;
}
</style>
