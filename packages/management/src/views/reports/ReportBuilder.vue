<template>
  <div class="report-builder">
    <!-- 页面头部 -->
    <div class="page-header">
      <div class="header-info">
        <h2>报表中心</h2>
        <p class="subtitle">创建自定义报表，分析业务数据</p>
      </div>
      <el-button type="primary" :icon="Plus" @click="openCreateDialog">
        创建报表
      </el-button>
    </div>

    <!-- 快速统计 -->
    <div class="quick-stats">
      <div 
        v-for="stat in quickStats" 
        :key="stat.key"
        class="stat-card"
        @click="setTimeRange(stat.key)"
      >
        <div class="stat-header">
          <span class="stat-label">{{ stat.label }}</span>
          <el-tag size="small" :type="stat.trend > 0 ? 'success' : 'danger'" v-if="stat.trend !== 0">
            {{ stat.trend > 0 ? '+' : '' }}{{ stat.trend }}%
          </el-tag>
        </div>
        <div class="stat-value">{{ stat.value }}</div>
        <div class="stat-compare">较上期</div>
      </div>
    </div>

    <!-- 报表列表 -->
    <div class="reports-section">
      <el-tabs v-model="activeTab" class="reports-tabs">
        <el-tab-pane label="我的报表" name="my">
          <div class="reports-grid" v-if="myReports.length > 0">
            <div 
              v-for="report in myReports" 
              :key="report.id"
              class="report-card"
              @click="viewReport(report)"
            >
              <div class="report-chart-preview" :style="{ background: report.color }">
                <el-icon :size="32"><component :is="getChartIcon(report.chartType)" /></el-icon>
              </div>
              <div class="report-info">
                <h4>{{ report.name }}</h4>
                <p>{{ report.description }}</p>
                <div class="report-meta">
                  <span>更新于 {{ formatTime(report.updatedAt) }}</span>
                </div>
              </div>
              <div class="report-actions">
                <el-button text :icon="Download" @click.stop="exportReport(report)">导出</el-button>
                <el-button text :icon="Edit" @click.stop="editReport(report)">编辑</el-button>
                <el-button text type="danger" v-permission="['reports:manage']" :icon="Delete" @click.stop="deleteReport(report)">删除</el-button>
              </div>
            </div>
          </div>
          <el-empty v-else description="暂无自定义报表" />
        </el-tab-pane>
        
        <el-tab-pane label="报表模板" name="templates">
          <div class="templates-grid">
            <div 
              v-for="template in reportTemplates" 
              :key="template.id"
              class="template-card"
              @click="useTemplate(template)"
            >
              <div class="template-icon" :style="{ background: template.color }">
                <el-icon :size="24"><component :is="getChartIcon(template.chartType)" /></el-icon>
              </div>
              <div class="template-info">
                <h4>{{ template.name }}</h4>
                <p>{{ template.description }}</p>
              </div>
              <el-button type="primary" text size="small">使用</el-button>
            </div>
          </div>
        </el-tab-pane>
      </el-tabs>
    </div>

    <!-- 创建/编辑报表对话框 -->
    <el-dialog
      v-model="showReportDialog"
      :title="editingReport ? '编辑报表' : '创建报表'"
      width="720px"
      destroy-on-close
    >
      <el-form :model="reportForm" label-width="100px" class="report-form">
        <el-row :gutter="20">
          <el-col :span="12">
            <el-form-item label="报表名称" required>
              <el-input v-model="reportForm.name" placeholder="例如：月度销售报表" />
            </el-form-item>
          </el-col>
          <el-col :span="12">
            <el-form-item label="图表类型" required>
              <el-select v-model="reportForm.chartType" style="width: 100%">
                <el-option 
                  v-for="type in chartTypes" 
                  :key="type.value" 
                  :label="type.label" 
                  :value="type.value"
                >
                  <div style="display: flex; align-items: center; gap: 8px;">
                    <el-icon><component :is="type.icon" /></el-icon>
                    <span>{{ type.label }}</span>
                  </div>
                </el-option>
              </el-select>
            </el-form-item>
          </el-col>
        </el-row>

        <el-form-item label="报表描述">
          <el-input 
            v-model="reportForm.description" 
            type="textarea" 
            :rows="2"
            placeholder="描述这份报表的用途..."
          />
        </el-form-item>

        <el-divider content-position="left">数据配置</el-divider>

        <el-row :gutter="20">
          <el-col :span="12">
            <el-form-item label="数据源" required>
              <el-select v-model="reportForm.dataSource" style="width: 100%">
                <el-option label="线索数据" value="leads" />
                <el-option label="任务数据" value="tasks" />
                <el-option label="项目数据" value="projects" />
                <el-option label="客户数据" value="customers" />
                <el-option label="销售数据" value="sales" />
              </el-select>
            </el-form-item>
          </el-col>
          <el-col :span="12">
            <el-form-item label="时间范围" required>
              <el-select v-model="reportForm.timeRange" style="width: 100%">
                <el-option label="今日" value="today" />
                <el-option label="本周" value="this_week" />
                <el-option label="本月" value="this_month" />
                <el-option label="本季度" value="this_quarter" />
                <el-option label="今年" value="this_year" />
                <el-option label="自定义" value="custom" />
              </el-select>
            </el-form-item>
          </el-col>
        </el-row>

        <el-row :gutter="20">
          <el-col :span="12">
            <el-form-item label="分组维度">
              <el-select v-model="reportForm.groupBy" style="width: 100%">
                <el-option label="按日期" value="date" />
                <el-option label="按状态" value="status" />
                <el-option label="按来源" value="source" />
                <el-option label="按负责人" value="assignee" />
                <el-option label="按服务类型" value="service_type" />
              </el-select>
            </el-form-item>
          </el-col>
          <el-col :span="12">
            <el-form-item label="统计指标">
              <el-select v-model="reportForm.metric" style="width: 100%">
                <el-option label="数量" value="count" />
                <el-option label="金额" value="amount" />
                <el-option label="转化率" value="conversion_rate" />
                <el-option label="平均值" value="average" />
              </el-select>
            </el-form-item>
          </el-col>
        </el-row>

        <el-divider content-position="left">导出设置</el-divider>

        <el-form-item label="定时发送">
          <el-switch v-model="reportForm.scheduled" />
          <span style="margin-left: 12px; color: var(--color-text-muted)">
            定时将报表发送到指定邮箱
          </span>
        </el-form-item>

        <el-row :gutter="20" v-if="reportForm.scheduled">
          <el-col :span="12">
            <el-form-item label="发送频率">
              <el-select v-model="reportForm.scheduleFrequency" style="width: 100%">
                <el-option label="每天" value="daily" />
                <el-option label="每周" value="weekly" />
                <el-option label="每月" value="monthly" />
              </el-select>
            </el-form-item>
          </el-col>
          <el-col :span="12">
            <el-form-item label="接收邮箱">
              <el-input v-model="reportForm.scheduleEmail" placeholder="example@company.com" />
            </el-form-item>
          </el-col>
        </el-row>
      </el-form>

      <template #footer>
        <el-button @click="showReportDialog = false">取消</el-button>
        <el-button type="primary" @click="saveReport" :loading="saving">
          {{ editingReport ? '保存' : '创建' }}
        </el-button>
      </template>
    </el-dialog>
  </div>
</template>

<script setup lang="ts">
import { ref, markRaw } from 'vue'
import { ElMessage, ElMessageBox } from 'element-plus'
import {
  Plus,
  Edit,
  Delete,
  Download,
  TrendCharts,
  PieChart,
  Histogram,
  DataLine,
  Grid,
} from '@element-plus/icons-vue'
import dayjs from 'dayjs'
import relativeTime from 'dayjs/plugin/relativeTime'
import 'dayjs/locale/zh-cn'

dayjs.extend(relativeTime)
dayjs.locale('zh-cn')

// 类型定义
interface Report {
  id: string
  name: string
  description: string
  chartType: string
  dataSource: string
  timeRange: string
  groupBy: string
  metric: string
  color: string
  scheduled: boolean
  scheduleFrequency?: string
  scheduleEmail?: string
  updatedAt: string
}

interface ReportTemplate {
  id: string
  name: string
  description: string
  chartType: string
  dataSource: string
  timeRange: string
  groupBy: string
  metric: string
  color: string
}

// 状态
const activeTab = ref('my')
const showReportDialog = ref(false)
const editingReport = ref<Report | null>(null)
const saving = ref(false)

// 快速统计数据
const quickStats = ref([
  { key: 'leads', label: '本月新线索', value: 128, trend: 12 },
  { key: 'conversion', label: '转化率', value: '23.5%', trend: 3.2 },
  { key: 'tasks', label: '完成任务', value: 86, trend: -5 },
  { key: 'revenue', label: '预估营收', value: 'S$45.6K', trend: 8 },
])

// 我的报表
const myReports = ref<Report[]>([
  {
    id: '1',
    name: '月度线索分析',
    description: '按来源渠道统计每月新增线索数量',
    chartType: 'bar',
    dataSource: 'leads',
    timeRange: 'this_month',
    groupBy: 'source',
    metric: 'count',
    color: 'linear-gradient(135deg, #06b6d4 0%, #0891b2 100%)',
    scheduled: true,
    scheduleFrequency: 'monthly',
    scheduleEmail: 'team@company.com',
    updatedAt: new Date(Date.now() - 3600000).toISOString(),
  },
  {
    id: '2',
    name: '销售漏斗',
    description: '各阶段线索转化情况',
    chartType: 'funnel',
    dataSource: 'leads',
    timeRange: 'this_quarter',
    groupBy: 'status',
    metric: 'count',
    color: 'linear-gradient(135deg, #8b5cf6 0%, #7c3aed 100%)',
    scheduled: false,
    updatedAt: new Date(Date.now() - 86400000).toISOString(),
  },
])

// 报表模板
const reportTemplates = ref<ReportTemplate[]>([
  {
    id: 't1',
    name: '线索来源分析',
    description: '按渠道分析线索来源分布',
    chartType: 'pie',
    dataSource: 'leads',
    timeRange: 'this_month',
    groupBy: 'source',
    metric: 'count',
    color: 'linear-gradient(135deg, #f59e0b 0%, #d97706 100%)',
  },
  {
    id: 't2',
    name: '团队业绩排行',
    description: '按负责人统计线索转化数量',
    chartType: 'bar',
    dataSource: 'leads',
    timeRange: 'this_month',
    groupBy: 'assignee',
    metric: 'count',
    color: 'linear-gradient(135deg, #10b981 0%, #059669 100%)',
  },
  {
    id: 't3',
    name: '任务完成趋势',
    description: '按日期统计任务完成情况',
    chartType: 'line',
    dataSource: 'tasks',
    timeRange: 'this_week',
    groupBy: 'date',
    metric: 'count',
    color: 'linear-gradient(135deg, #ec4899 0%, #db2777 100%)',
  },
  {
    id: 't4',
    name: '服务类型分布',
    description: '按服务类型统计项目数量',
    chartType: 'pie',
    dataSource: 'projects',
    timeRange: 'this_year',
    groupBy: 'service_type',
    metric: 'count',
    color: 'linear-gradient(135deg, #64748b 0%, #475569 100%)',
  },
])

// 图表类型选项
const chartTypes = [
  { value: 'line', label: '折线图', icon: markRaw(DataLine) },
  { value: 'bar', label: '柱状图', icon: markRaw(Histogram) },
  { value: 'pie', label: '饼图', icon: markRaw(PieChart) },
  { value: 'funnel', label: '漏斗图', icon: markRaw(TrendCharts) },
  { value: 'table', label: '数据表格', icon: markRaw(Grid) },
]

// 表单默认值
const defaultReportForm = () => ({
  name: '',
  description: '',
  chartType: 'bar',
  dataSource: 'leads',
  timeRange: 'this_month',
  groupBy: 'date',
  metric: 'count',
  scheduled: false,
  scheduleFrequency: 'weekly',
  scheduleEmail: '',
})

const reportForm = ref(defaultReportForm())

// 方法
function getChartIcon(chartType: string) {
  const type = chartTypes.find(t => t.value === chartType)
  return type?.icon || TrendCharts
}

function formatTime(dateStr: string) {
  return dayjs(dateStr).fromNow()
}

function setTimeRange(key: string) {
  ElMessage.info(`查看 ${key} 详细数据`)
}

function openCreateDialog() {
  editingReport.value = null
  reportForm.value = defaultReportForm()
  showReportDialog.value = true
}

function viewReport(report: Report) {
  ElMessage.info(`查看报表：${report.name}`)
}

function editReport(report: Report) {
  editingReport.value = report
  reportForm.value = {
    name: report.name,
    description: report.description,
    chartType: report.chartType,
    dataSource: report.dataSource,
    timeRange: report.timeRange,
    groupBy: report.groupBy,
    metric: report.metric,
    scheduled: report.scheduled,
    scheduleFrequency: report.scheduleFrequency || 'weekly',
    scheduleEmail: report.scheduleEmail || '',
  }
  showReportDialog.value = true
}

async function deleteReport(report: Report) {
  try {
    await ElMessageBox.confirm(`确定要删除报表 "${report.name}" 吗？`, '删除确认', { type: 'warning' })
    const index = myReports.value.findIndex(r => r.id === report.id)
    if (index > -1) {
      myReports.value.splice(index, 1)
      ElMessage.success('报表已删除')
    }
  } catch {
    // 用户取消
  }
}

function exportReport(report: Report) {
  ElMessage.success(`正在导出报表：${report.name}`)
}

function useTemplate(template: ReportTemplate) {
  editingReport.value = null
  reportForm.value = {
    name: template.name,
    description: template.description,
    chartType: template.chartType,
    dataSource: template.dataSource,
    timeRange: template.timeRange,
    groupBy: template.groupBy,
    metric: template.metric,
    scheduled: false,
    scheduleFrequency: 'weekly',
    scheduleEmail: '',
  }
  showReportDialog.value = true
}

async function saveReport() {
  if (!reportForm.value.name) {
    ElMessage.warning('请输入报表名称')
    return
  }

  saving.value = true
  try {
    await new Promise(resolve => setTimeout(resolve, 500))

    const colors = [
      'linear-gradient(135deg, #06b6d4 0%, #0891b2 100%)',
      'linear-gradient(135deg, #8b5cf6 0%, #7c3aed 100%)',
      'linear-gradient(135deg, #f59e0b 0%, #d97706 100%)',
      'linear-gradient(135deg, #10b981 0%, #059669 100%)',
    ]

    if (editingReport.value) {
      Object.assign(editingReport.value, {
        name: reportForm.value.name,
        description: reportForm.value.description,
        chartType: reportForm.value.chartType,
        dataSource: reportForm.value.dataSource,
        timeRange: reportForm.value.timeRange,
        groupBy: reportForm.value.groupBy,
        metric: reportForm.value.metric,
        scheduled: reportForm.value.scheduled,
        scheduleFrequency: reportForm.value.scheduleFrequency,
        scheduleEmail: reportForm.value.scheduleEmail,
        updatedAt: new Date().toISOString(),
      })
      ElMessage.success('报表已更新')
    } else {
      myReports.value.unshift({
        id: Date.now().toString(),
        name: reportForm.value.name,
        description: reportForm.value.description,
        chartType: reportForm.value.chartType,
        dataSource: reportForm.value.dataSource,
        timeRange: reportForm.value.timeRange,
        groupBy: reportForm.value.groupBy,
        metric: reportForm.value.metric,
        color: colors[Math.floor(Math.random() * colors.length)],
        scheduled: reportForm.value.scheduled,
        scheduleFrequency: reportForm.value.scheduleFrequency,
        scheduleEmail: reportForm.value.scheduleEmail,
        updatedAt: new Date().toISOString(),
      })
      ElMessage.success('报表已创建')
    }

    showReportDialog.value = false
  } finally {
    saving.value = false
  }
}
</script>

<style scoped>
.report-builder {
  max-width: 1400px;
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

/* 快速统计 */
.quick-stats {
  display: grid;
  grid-template-columns: repeat(4, 1fr);
  gap: 16px;
  margin-bottom: 24px;
}

.stat-card {
  padding: 20px;
  background: var(--color-surface, #fff);
  border: 1px solid var(--color-border, #e2e8f0);
  border-radius: 12px;
  cursor: pointer;
  transition: all 0.2s ease;
}

.stat-card:hover {
  border-color: var(--color-primary, #0891b2);
  transform: translateY(-2px);
  box-shadow: var(--shadow-md);
}

.stat-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: 8px;
}

.stat-label {
  font-size: 13px;
  color: var(--color-text-muted, #64748b);
}

.stat-value {
  font-size: 28px;
  font-weight: 700;
  color: var(--color-text, #1e293b);
  line-height: 1.2;
}

.stat-compare {
  font-size: 12px;
  color: var(--color-text-muted, #94a3b8);
  margin-top: 4px;
}

/* 报表区域 */
.reports-section {
  background: var(--color-surface, #fff);
  border: 1px solid var(--color-border, #e2e8f0);
  border-radius: 16px;
  padding: 20px;
}

.reports-grid {
  display: grid;
  grid-template-columns: repeat(2, 1fr);
  gap: 16px;
}

.report-card {
  display: flex;
  gap: 16px;
  padding: 16px;
  background: var(--color-background, #f8fafc);
  border-radius: 12px;
  cursor: pointer;
  transition: all 0.2s ease;
}

.report-card:hover {
  background: var(--color-surface-hover, #f1f5f9);
}

.report-chart-preview {
  width: 80px;
  height: 80px;
  display: flex;
  align-items: center;
  justify-content: center;
  border-radius: 12px;
  color: white;
  flex-shrink: 0;
}

.report-info {
  flex: 1;
  min-width: 0;
}

.report-info h4 {
  margin: 0 0 6px;
  font-size: 15px;
  font-weight: 600;
  color: var(--color-text, #1e293b);
}

.report-info p {
  margin: 0;
  font-size: 13px;
  color: var(--color-text-muted, #64748b);
  line-height: 1.4;
}

.report-meta {
  margin-top: 8px;
  font-size: 12px;
  color: var(--color-text-muted, #94a3b8);
}

.report-actions {
  display: flex;
  flex-direction: column;
  gap: 4px;
}

/* 模板网格 */
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

/* 表单 */
.report-form {
  padding: 8px 0;
}

/* 响应式 */
@media (max-width: 1024px) {
  .quick-stats {
    grid-template-columns: repeat(2, 1fr);
  }
  
  .reports-grid,
  .templates-grid {
    grid-template-columns: 1fr;
  }
}
</style>
