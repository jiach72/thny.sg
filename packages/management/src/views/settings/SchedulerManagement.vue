<template>
  <div class="scheduler-management">
    <h2 class="page-title">定时任务管理</h2>
    
    <!-- 系统状态卡片 -->
    <el-row :gutter="24" class="status-row">
      <el-col :span="12">
        <el-card class="status-card">
          <template #header>
            <div class="card-header">
              <span><el-icon><Clock /></el-icon> 定时任务</span>
              <el-button type="primary" link @click="runAllTasks" :loading="runAllLoading">
                执行所有到期任务
              </el-button>
            </div>
          </template>
          <div class="status-info">
            <el-statistic title="已注册任务" :value="tasks.length" />
            <el-statistic title="已启用" :value="enabledCount" />
            <el-statistic title="今日已执行" :value="executedToday" />
          </div>
        </el-card>
      </el-col>
      <el-col :span="12">
        <el-card class="status-card email-card">
          <template #header>
            <div class="card-header">
              <span><el-icon><Message /></el-icon> 邮件服务</span>
              <el-tag :type="emailStatus.configured ? 'success' : 'warning'" effect="dark">
                {{ emailStatus.configured ? '已配置' : '未配置' }}
              </el-tag>
            </div>
          </template>
          <div class="email-status">
            <div class="provider-info">
              <span class="label">服务提供商：</span>
              <span class="value">{{ getProviderName(emailStatus.provider) }}</span>
            </div>
            <div class="email-actions">
              <el-button @click="testConnection" :loading="testingConnection" size="small">
                测试连接
              </el-button>
              <el-button @click="openTestEmailDialog" size="small">
                发送测试邮件
              </el-button>
              <el-button @click="reinitEmail" :loading="reinitLoading" size="small">
                重新初始化
              </el-button>
            </div>
          </div>
        </el-card>
      </el-col>
    </el-row>

    <!-- 任务列表 -->
    <el-card>
      <template #header>
        <div class="card-header">
          <span>任务列表</span>
          <el-button @click="loadTasks" :loading="loading" link>
            <el-icon><Refresh /></el-icon>
            刷新
          </el-button>
        </div>
      </template>
      
      <el-table :data="tasks" v-loading="loading">
        <el-table-column prop="name" label="任务名称" width="200">
          <template #default="{ row }">
            <div class="task-name">
              <el-icon :class="getTaskIcon(row.name).class"><component :is="getTaskIcon(row.name).icon" /></el-icon>
              <span>{{ getTaskLabel(row.name) }}</span>
            </div>
          </template>
        </el-table-column>
        <el-table-column prop="cronExpression" label="Cron 表达式" width="150">
          <template #default="{ row }">
            <el-tooltip :content="describeCron(row.cronExpression)" placement="top">
              <code class="cron-code">{{ row.cronExpression }}</code>
            </el-tooltip>
          </template>
        </el-table-column>
        <el-table-column label="执行周期" width="180">
          <template #default="{ row }">
            {{ describeCron(row.cronExpression) }}
          </template>
        </el-table-column>
        <el-table-column prop="lastRun" label="上次执行" width="180">
          <template #default="{ row }">
            <span v-if="row.lastRun">{{ formatDateTime(row.lastRun) }}</span>
            <span v-else class="text-muted">未执行</span>
          </template>
        </el-table-column>
        <el-table-column prop="nextRun" label="下次执行" width="180">
          <template #default="{ row }">
            <span v-if="row.enabled && row.nextRun">{{ formatDateTime(row.nextRun) }}</span>
            <span v-else class="text-muted">-</span>
          </template>
        </el-table-column>
        <el-table-column prop="enabled" label="状态" width="100" align="center">
          <template #default="{ row }">
            <el-switch 
              :model-value="row.enabled"
              @change="(val: boolean) => toggleTask(row, val)"
              :loading="row.updating"
            />
          </template>
        </el-table-column>
        <el-table-column label="操作" width="200" fixed="right">
          <template #default="{ row }">
            <el-button 
              type="primary" 
              link 
              @click="triggerTask(row)"
              :loading="row.triggering"
            >
              立即执行
            </el-button>
            <el-button type="warning" link @click="openEditDialog(row)">
              配置
            </el-button>
          </template>
        </el-table-column>
      </el-table>
    </el-card>

    <!-- 执行日志 -->
    <el-card style="margin-top: 24px;">
      <template #header>
        <div class="card-header">
          <span>执行日志</span>
          <el-button @click="clearLogs" type="danger" link size="small">清空日志</el-button>
        </div>
      </template>
      
      <el-timeline v-if="executionLogs.length > 0">
        <el-timeline-item 
          v-for="(log, index) in executionLogs" 
          :key="index"
          :type="log.success ? 'success' : 'danger'"
          :timestamp="formatDateTime(log.timestamp)"
          placement="top"
        >
          <div class="log-item">
            <span class="log-task">{{ getTaskLabel(log.taskName) }}</span>
            <el-tag :type="log.success ? 'success' : 'danger'" size="small">
              {{ log.success ? '成功' : '失败' }}
            </el-tag>
            <span class="log-duration">{{ log.duration }}ms</span>
            <span v-if="log.result" class="log-result">{{ formatResult(log.result) }}</span>
            <span v-if="log.error" class="log-error">{{ log.error }}</span>
          </div>
        </el-timeline-item>
      </el-timeline>
      <el-empty v-else description="暂无执行日志" />
    </el-card>

    <!-- 配置对话框 -->
    <el-dialog v-model="editDialogVisible" title="任务配置" width="500px">
      <el-form :model="editForm" label-width="120px">
        <el-form-item label="任务名称">
          <el-input :model-value="getTaskLabel(editForm.name)" disabled />
        </el-form-item>
        <el-form-item label="Cron 表达式">
          <el-input v-model="editForm.cronExpression" placeholder="如: 0 2 * * *" />
          <div class="form-tip">{{ describeCron(editForm.cronExpression) }}</div>
        </el-form-item>
        <el-form-item label="是否启用">
          <el-switch v-model="editForm.enabled" />
        </el-form-item>
      </el-form>
      <template #footer>
        <el-button @click="editDialogVisible = false">取消</el-button>
        <el-button type="primary" @click="saveTaskConfig" :loading="saveLoading">保存</el-button>
      </template>
    </el-dialog>

    <!-- 测试邮件对话框 -->
    <el-dialog v-model="testEmailDialogVisible" title="发送测试邮件" width="400px">
      <el-form :model="testEmailForm" label-width="80px">
        <el-form-item label="收件邮箱">
          <el-input v-model="testEmailForm.to" placeholder="test@example.com" />
        </el-form-item>
      </el-form>
      <template #footer>
        <el-button @click="testEmailDialogVisible = false">取消</el-button>
        <el-button type="primary" @click="sendTestEmail" :loading="sendingTestEmail">发送</el-button>
      </template>
    </el-dialog>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted } from 'vue'
import { ElMessage } from 'element-plus'
import { Clock, Message, Refresh, Timer, Bell, DataAnalysis } from '@element-plus/icons-vue'
import schedulerApi, { 
  type ScheduledTask, 
  type EmailStatus 
} from '@/api/schedulerApi'

// 状态
const loading = ref(false)
const tasks = ref<(ScheduledTask & { updating?: boolean; triggering?: boolean })[]>([])
const emailStatus = ref<EmailStatus>({ provider: 'CONSOLE', configured: false })

const runAllLoading = ref(false)
const testingConnection = ref(false)
const reinitLoading = ref(false)
const executedToday = ref(0)

// 执行日志（本地存储）
interface ExecutionLog {
  taskName: string
  success: boolean
  result?: any
  error?: string
  duration: number
  timestamp: string
}
const executionLogs = ref<ExecutionLog[]>([])

// 配置编辑
const editDialogVisible = ref(false)
const saveLoading = ref(false)
const editForm = ref<{ name: string; cronExpression: string; enabled: boolean }>({
  name: '',
  cronExpression: '',
  enabled: true
})

// 测试邮件
const testEmailDialogVisible = ref(false)
const sendingTestEmail = ref(false)
const testEmailForm = ref({ to: '' })

// 计算属性
const enabledCount = computed(() => tasks.value.filter(t => t.enabled).length)

// 加载任务列表
async function loadTasks() {
  loading.value = true
  try {
    tasks.value = await schedulerApi.getTasks()
  } catch (err: any) {
    ElMessage.error(err.message || '加载失败')
  } finally {
    loading.value = false
  }
}

// 加载邮件状态
async function loadEmailStatus() {
  try {
    emailStatus.value = await schedulerApi.getEmailStatus()
  } catch (err) {
    console.error('加载邮件状态失败:', err)
  }
}

// 辅助函数
function getTaskLabel(name: string): string {
  const map: Record<string, string> = {
    BATCH_SCORE_UPDATE: '批量评分更新',
    CHECK_OVERDUE_INVOICES: '逾期发票检查',
    SEND_REMINDER_EMAILS: '发送提醒邮件',
    CLEANUP_OLD_LOGS: '清理旧日志',
    SYNC_EXTERNAL_DATA: '同步外部数据'
  }
  return map[name] || name
}

function getTaskIcon(name: string): { icon: any; class: string } {
  const map: Record<string, { icon: any; class: string }> = {
    BATCH_SCORE_UPDATE: { icon: DataAnalysis, class: 'icon-primary' },
    CHECK_OVERDUE_INVOICES: { icon: Bell, class: 'icon-warning' },
    SEND_REMINDER_EMAILS: { icon: Message, class: 'icon-success' },
    CLEANUP_OLD_LOGS: { icon: Timer, class: 'icon-info' },
    SYNC_EXTERNAL_DATA: { icon: Refresh, class: 'icon-primary' }
  }
  return map[name] || { icon: Clock, class: 'icon-info' }
}

function getProviderName(provider: string): string {
  const map: Record<string, string> = {
    SMTP: 'SMTP',
    SENDGRID: 'SendGrid',
    AWS_SES: 'AWS SES',
    CONSOLE: '控制台输出（开发模式）'
  }
  return map[provider] || provider
}

function describeCron(cron: string): string {
  if (!cron) return '无效表达式'
  
  const parts = cron.split(' ')
  if (parts.length !== 5) return cron
  
  const [minute, hour, dayOfMonth, month, dayOfWeek] = parts
  
  // 常见模式
  if (cron === '0 * * * *') return '每小时整点'
  if (cron === '*/5 * * * *') return '每 5 分钟'
  if (cron === '*/15 * * * *') return '每 15 分钟'
  if (cron === '0 0 * * *') return '每天午夜'
  if (cron === '0 2 * * *') return '每天凌晨 2 点'
  if (cron === '0 8 * * *') return '每天早上 8 点'
  if (cron === '0 9 * * 1-5') return '工作日早上 9 点'
  if (cron === '0 0 * * 0') return '每周日午夜'
  if (cron === '0 0 1 * *') return '每月 1 号午夜'
  
  // 简单描述
  if (dayOfMonth === '*' && month === '*' && dayOfWeek === '*') {
    if (minute === '0' && hour !== '*') {
      return `每天 ${hour} 点`
    }
  }
  
  return cron
}

function formatDateTime(dateStr: string): string {
  if (!dateStr) return '-'
  return new Date(dateStr).toLocaleString('zh-CN')
}

function formatResult(result: any): string {
  if (!result) return ''
  if (typeof result === 'object') {
    return JSON.stringify(result)
  }
  return String(result)
}

// 切换任务状态
async function toggleTask(task: ScheduledTask & { updating?: boolean }, enabled: boolean) {
  task.updating = true
  try {
    await schedulerApi.updateTask(task.name, { enabled })
    task.enabled = enabled
    ElMessage.success(enabled ? '任务已启用' : '任务已禁用')
  } catch (err: any) {
    ElMessage.error(err.message || '操作失败')
  } finally {
    task.updating = false
  }
}

// 手动触发任务
async function triggerTask(task: ScheduledTask & { triggering?: boolean }) {
  task.triggering = true
  try {
    const result = await schedulerApi.triggerTask(task.name)
    
    // 添加到日志
    executionLogs.value.unshift({
      taskName: task.name,
      success: result.success,
      result: result.result,
      error: result.error,
      duration: result.duration,
      timestamp: new Date().toISOString()
    })
    
    // 保持日志最多 50 条
    if (executionLogs.value.length > 50) {
      executionLogs.value = executionLogs.value.slice(0, 50)
    }
    
    if (result.success) {
      ElMessage.success(`${getTaskLabel(task.name)} 执行成功`)
      executedToday.value++
    } else {
      ElMessage.error(`${getTaskLabel(task.name)} 执行失败: ${result.error}`)
    }
    
    loadTasks()
  } catch (err: any) {
    ElMessage.error(err.message || '执行失败')
  } finally {
    task.triggering = false
  }
}

// 执行所有到期任务
async function runAllTasks() {
  runAllLoading.value = true
  try {
    const result = await schedulerApi.runAllDueTasks()
    
    if (result.executed > 0) {
      ElMessage.success(`已执行 ${result.executed} 个任务`)
      
      // 添加到日志
      result.results.forEach(r => {
        executionLogs.value.unshift({
          taskName: r.taskName,
          success: r.success,
          result: r.result,
          error: r.error,
          duration: r.duration,
          timestamp: new Date().toISOString()
        })
      })
      
      executedToday.value += result.executed
    } else {
      ElMessage.info('没有到期任务需要执行')
    }
    
    loadTasks()
  } catch (err: any) {
    ElMessage.error(err.message || '执行失败')
  } finally {
    runAllLoading.value = false
  }
}

// 配置对话框
function openEditDialog(task: ScheduledTask) {
  editForm.value = {
    name: task.name,
    cronExpression: task.cronExpression,
    enabled: task.enabled
  }
  editDialogVisible.value = true
}

async function saveTaskConfig() {
  saveLoading.value = true
  try {
    await schedulerApi.updateTask(editForm.value.name, {
      cronExpression: editForm.value.cronExpression,
      enabled: editForm.value.enabled
    })
    ElMessage.success('配置已保存')
    editDialogVisible.value = false
    loadTasks()
  } catch (err: any) {
    ElMessage.error(err.message || '保存失败')
  } finally {
    saveLoading.value = false
  }
}

// 邮件服务操作
async function testConnection() {
  testingConnection.value = true
  try {
    const result = await schedulerApi.testEmailConnection()
    if (result.success) {
      ElMessage.success(result.message || '连接成功')
    } else {
      ElMessage.error(result.message || '连接失败')
    }
  } catch (err: any) {
    ElMessage.error(err.message || '测试失败')
  } finally {
    testingConnection.value = false
  }
}

function openTestEmailDialog() {
  testEmailForm.value.to = ''
  testEmailDialogVisible.value = true
}

async function sendTestEmail() {
  if (!testEmailForm.value.to) {
    ElMessage.warning('请输入收件邮箱')
    return
  }
  
  sendingTestEmail.value = true
  try {
    const result = await schedulerApi.sendTestEmail(testEmailForm.value.to)
    if (result.success) {
      ElMessage.success('测试邮件已发送')
      testEmailDialogVisible.value = false
    } else {
      ElMessage.error(result.error || '发送失败')
    }
  } catch (err: any) {
    ElMessage.error(err.message || '发送失败')
  } finally {
    sendingTestEmail.value = false
  }
}

async function reinitEmail() {
  reinitLoading.value = true
  try {
    const result = await schedulerApi.reinitializeEmail()
    if (result.success) {
      ElMessage.success(result.message)
      emailStatus.value = result.status
    } else {
      ElMessage.error(result.message || '初始化失败')
    }
  } catch (err: any) {
    ElMessage.error(err.message || '初始化失败')
  } finally {
    reinitLoading.value = false
  }
}

// 清空日志
function clearLogs() {
  executionLogs.value = []
  ElMessage.success('日志已清空')
}

onMounted(() => {
  loadTasks()
  loadEmailStatus()
  
  // 从 localStorage 加载日志
  const saved = localStorage.getItem('scheduler_logs')
  if (saved) {
    try {
      executionLogs.value = JSON.parse(saved)
    } catch (e) {
      // ignore
    }
  }
})

// 保存日志到 localStorage
import { watch } from 'vue'
watch(executionLogs, (logs) => {
  localStorage.setItem('scheduler_logs', JSON.stringify(logs))
}, { deep: true })
</script>

<style scoped>
.scheduler-management {
  max-width: 1400px;
}

.page-title {
  font-size: 24px;
  font-weight: 600;
  color: #333;
  margin: 0 0 24px;
}

.status-row {
  margin-bottom: 24px;
}

.status-card {
  height: 100%;
}

.card-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.card-header span {
  display: flex;
  align-items: center;
  gap: 8px;
  font-weight: 600;
}

.status-info {
  display: flex;
  justify-content: space-around;
}

.email-status {
  padding: 12px 0;
}

.provider-info {
  margin-bottom: 16px;
}

.provider-info .label {
  color: #666;
}

.provider-info .value {
  font-weight: 500;
  color: #333;
}

.email-actions {
  display: flex;
  gap: 8px;
  flex-wrap: wrap;
}

.task-name {
  display: flex;
  align-items: center;
  gap: 8px;
}

.icon-primary { color: #409eff; }
.icon-success { color: #67c23a; }
.icon-warning { color: #e6a23c; }
.icon-info { color: #909399; }

.cron-code {
  background: #f5f7fa;
  padding: 4px 8px;
  border-radius: 4px;
  font-family: monospace;
  font-size: 13px;
}

.text-muted {
  color: #999;
}

.form-tip {
  font-size: 12px;
  color: #999;
  margin-top: 4px;
}

.log-item {
  display: flex;
  align-items: center;
  gap: 12px;
  flex-wrap: wrap;
}

.log-task {
  font-weight: 500;
}

.log-duration {
  color: #999;
  font-size: 12px;
}

.log-result {
  color: #67c23a;
  font-size: 12px;
}

.log-error {
  color: #f56c6c;
  font-size: 12px;
}
</style>
