<template>
  <div class="meeting-scheduler">
    <!-- 概览卡片 -->
    <el-row :gutter="24" class="overview-row">
      <el-col :span="6">
        <el-card shadow="hover" class="stat-card upcoming-card">
          <div class="stat-content">
            <div class="stat-info">
              <p class="stat-title">即将到来</p>
              <div class="stat-value-group">
                <h3 class="stat-value">{{ upcomingCount }}</h3>
                <el-tag type="success" size="small" effect="light" round>本周</el-tag>
              </div>
            </div>
            <div class="stat-icon-wrapper blue">
              <el-icon :size="24"><CalendarIcon /></el-icon>
            </div>
          </div>
        </el-card>
      </el-col>
      <el-col :span="6">
        <el-card shadow="hover" class="stat-card today-card">
          <div class="stat-content">
            <div class="stat-info">
              <p class="stat-title">今日会议</p>
              <div class="stat-value-group">
                <h3 class="stat-value">{{ todayCount }}</h3>
              </div>
            </div>
            <div class="stat-icon-wrapper indigo">
              <el-icon :size="24"><ClockIcon /></el-icon>
            </div>
          </div>
        </el-card>
      </el-col>
    </el-row>

    <!-- 主要区域：列表 + 纪要预览 -->
    <el-row :gutter="24" class="main-content-row">
      <!-- 会议列表 -->
      <el-col :span="8">
        <el-card shadow="never" class="meeting-list-card" :body-style="{ padding: '0px', display: 'flex', flexDirection: 'column', height: '600px' }">
          <div class="list-header">
            <h2 class="list-title">近期日程</h2>
            <el-button link type="primary" :icon="ArrowPathIcon" @click="fetchMeetings" :loading="loading" title="刷新"></el-button>
          </div>
          
          <div class="list-body">
            <el-empty v-if="!loading && meetings.length === 0" description="暂无近期会议安排"></el-empty>
            <div v-if="loading && meetings.length === 0" class="loading-wrapper" v-loading="true"></div>
            
            <div v-else class="meeting-items">
              <div v-for="meeting in meetings" :key="meeting.id" 
                   @click="selectMeeting(meeting)"
                   class="meeting-item"
                   :class="{ 'is-selected': selectedMeeting?.id === meeting.id }">
                
                <div class="item-header">
                  <h4 class="item-title" :title="meeting.title">{{ meeting.title }}</h4>
                  <el-tag size="small" :type="meeting.status === 'COMPLETED' ? 'success' : 'primary'" effect="light">
                    {{ meeting.status === 'COMPLETED' ? '已完成' : '已排期' }}
                  </el-tag>
                </div>
                
                <div class="item-meta">
                  <div class="meta-item">
                    <el-icon><CalendarDaysIcon /></el-icon>
                    <span>{{ formatDate(meeting.startTime) }}</span>
                  </div>
                  <div class="meta-item">
                    <el-icon><ClockIcon /></el-icon>
                    <span>{{ formatTime(meeting.startTime) }}</span>
                  </div>
                </div>
                
                <div class="item-footer" v-if="meeting.customer || meeting.lead">
                  <div v-if="meeting.customer" class="footer-item" title="关联客户">
                    <el-icon><BuildingOfficeIcon /></el-icon>
                    <span class="truncate-text">{{ meeting.customer.companyName }}</span>
                  </div>
                  <div v-if="meeting.lead" class="footer-item" title="关联线索">
                    <el-icon><UserIcon /></el-icon>
                    <span class="truncate-text">{{ meeting.lead.contactName }}</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </el-card>
      </el-col>

      <!-- 会议纪要编辑/预览区 -->
      <el-col :span="16">
        <el-card shadow="never" class="minutes-card" :body-style="{ padding: '0px', display: 'flex', flexDirection: 'column', height: '600px' }">
          <template v-if="selectedMeeting">
            <div class="minutes-header">
              <div class="header-top">
                <h2 class="meeting-title">{{ selectedMeeting.title }}</h2>
                <div class="header-actions">
                  <el-button v-if="!isEditing" @click="isEditing = true">编辑纪要</el-button>
                  <template v-else>
                    <el-button @click="cancelEdit">取消</el-button>
                    <el-button type="primary" @click="saveMinutes" :loading="saving">保存</el-button>
                  </template>
                </div>
              </div>
              <div class="header-bottom">
                <div class="meta-item">
                  <el-icon><CalendarIcon /></el-icon>
                  <span>{{ formatDateTime(selectedMeeting.startTime) }} - {{ formatTime(selectedMeeting.endTime) }}</span>
                </div>
                <div class="meta-item" v-if="selectedMeeting.location">
                  <el-icon><MapPinIcon /></el-icon>
                  <span>{{ selectedMeeting.location }}</span>
                </div>
              </div>
            </div>
            
            <div class="minutes-body" v-loading="loadingMinutes">
              <template v-if="!loadingMinutes">
                <!-- 编辑模式 -->
                <div v-if="isEditing" class="edit-mode">
                  <div class="form-group content-group">
                    <label class="form-label">纪要正文</label>
                    <el-input v-model="editForm.content" type="textarea" :rows="10" placeholder="支持 Markdown 格式..." resize="none"></el-input>
                  </div>
                  
                  <div class="form-group action-group">
                    <div class="group-header">
                      <label class="form-label">行动项 (Action Items)</label>
                      <el-button link type="primary" :icon="PlusIcon" @click="addActionItem">添加</el-button>
                    </div>
                    
                    <div class="action-list">
                      <div v-for="(item, index) in editForm.actionItems" :key="index" class="action-list-item">
                        <el-input v-model="item.task" placeholder="任务内容" class="task-input"></el-input>
                        <el-input v-model="item.assignee" placeholder="负责人" class="assignee-input"></el-input>
                        <el-button type="danger" link :icon="TrashIcon" @click="removeActionItem(index)"></el-button>
                      </div>
                      <div v-if="editForm.actionItems.length === 0" class="empty-action-list">
                        暂无行动项
                      </div>
                    </div>
                  </div>
                </div>
                
                <!-- 预览模式 -->
                <div v-else class="preview-mode">
                  <div v-if="!currentMinutes" class="empty-minutes">
                    <el-icon class="empty-icon"><DocumentTextIcon /></el-icon>
                    <h3>暂无会议纪要</h3>
                    <p>该会议尚未记录任何内容，点击上方按钮开始整理纪要。</p>
                    <el-button type="primary" @click="isEditing = true">开始记录</el-button>
                  </div>
                  
                  <template v-else>
                    <div class="markdown-preview bg-preview">{{ currentMinutes.content }}</div>
                    
                    <div v-if="currentMinutes.actionItems && currentMinutes.actionItems.length > 0" class="action-items-preview">
                      <h3 class="section-title">行动项 (Action Items)</h3>
                      <el-table :data="currentMinutes.actionItems" border style="width: 100%" size="small">
                        <el-table-column width="60" align="center" label="状态">
                          <template #default>
                            <el-checkbox></el-checkbox>
                          </template>
                        </el-table-column>
                        <el-table-column prop="task" label="任务"></el-table-column>
                        <el-table-column prop="assignee" label="负责人" width="120">
                          <template #default="{ row }">
                            <el-tag size="small" type="info">{{ row.assignee }}</el-tag>
                          </template>
                        </el-table-column>
                      </el-table>
                    </div>
                    
                    <div class="minutes-footer">
                      <span>记录人：{{ currentMinutes.recordedBy?.name || '未知' }}</span>
                      <span>最后更新：{{ formatDateTime(currentMinutes.updatedAt) }}</span>
                    </div>
                  </template>
                </div>
              </template>
            </div>
          </template>
          
          <div v-else class="empty-state">
            <el-icon class="huge-icon"><CalendarDaysIcon /></el-icon>
            <p class="empty-title">未选择会议</p>
            <p class="empty-subtitle">请在左侧列表中选择一个会议查看或编辑纪要</p>
          </div>
        </el-card>
      </el-col>
    </el-row>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted, computed, watch } from 'vue'
import {
  Calendar as CalendarIcon,
  Clock as ClockIcon,
  Location as MapPinIcon,
  Document as DocumentTextIcon,
  DataAnalysis as CalendarDaysIcon,
  OfficeBuilding as BuildingOfficeIcon,
  User as UserIcon,
  Refresh as ArrowPathIcon,
  Plus as PlusIcon,
  Delete as TrashIcon
} from '@element-plus/icons-vue'
import { apiClient } from '@/api'
import { format } from 'date-fns'
import { zhCN } from 'date-fns/locale'

// 状态
const loading = ref(false)
const saving = ref(false)
const loadingMinutes = ref(false)
const meetings = ref<any[]>([])
const selectedMeeting = ref<any>(null)
const currentMinutes = ref<any>(null)
const isEditing = ref(false)

// 统计
const upcomingCount = computed(() => meetings.value.length)
const todayCount = computed(() => {
  const today = format(new Date(), 'yyyy-MM-dd')
  return meetings.value.filter(m => format(new Date(m.startTime), 'yyyy-MM-dd') === today).length
})

// 表单
const editForm = ref({
  content: '',
  actionItems: [] as { task: string, assignee: string }[]
})

// 格式化工具
const formatDate = (dateString: string) => format(new Date(dateString), 'MM月dd日 (EEE)', { locale: zhCN })
const formatTime = (dateString: string) => format(new Date(dateString), 'HH:mm')
const formatDateTime = (dateString: string) => format(new Date(dateString), 'yyyy年MM月dd日 HH:mm', { locale: zhCN })

// 加载会议列表
const fetchMeetings = async () => {
  loading.value = true
  try {
    const data = await apiClient.get('/meetings/upcoming')
    meetings.value = data || []
    
    // 如果没有选中的会议且列表不为空，默认选中第一个
    if (!selectedMeeting.value && meetings.value.length > 0) {
      selectMeeting(meetings.value[0])
    }
  } catch (error) {
    console.error('获取日程失败:', error)
  } finally {
    loading.value = false
  }
}

// 选择会议，加载纪要
const selectMeeting = async (meeting: any) => {
  selectedMeeting.value = meeting
  isEditing.value = false
  await fetchMinutes(meeting.id)
}

// 获取纪要详情
const fetchMinutes = async (appointmentId: string) => {
  loadingMinutes.value = true
  currentMinutes.value = null
  try {
    const data = await apiClient.get(`/meetings/${appointmentId}/minutes`)
    currentMinutes.value = data // 可能返回空，即状态200但内容为空
  } catch (error) {
    console.error('获取纪要失败:', error)
  } finally {
    loadingMinutes.value = false
  }
}

// 开始编辑前初始化表单
watch(isEditing, (val) => {
  if (val) {
    editForm.value = {
      content: currentMinutes.value?.content || '',
      actionItems: currentMinutes.value?.actionItems ? JSON.parse(JSON.stringify(currentMinutes.value.actionItems)) : []
    }
  }
})

// 取消编辑
const cancelEdit = () => {
  isEditing.value = false
}

// 添加 action item
const addActionItem = () => {
  editForm.value.actionItems.push({ task: '', assignee: '' })
}

// 移除 action item
const removeActionItem = (index: number) => {
  editForm.value.actionItems.splice(index, 1)
}

// 保存纪要
const saveMinutes = async () => {
  if (!selectedMeeting.value) return
  
  saving.value = true
  try {
    // 过滤掉空的 action item
    const validItems = editForm.value.actionItems.filter(item => item.task.trim() && item.assignee.trim())
    
    const res = await apiClient.post(`/meetings/${selectedMeeting.value.id}/minutes`, {
      content: editForm.value.content,
      actionItems: validItems
    })
    
    currentMinutes.value = res
    isEditing.value = false
  } catch (error) {
    console.error('保存纪要失败:', error)
  } finally {
    saving.value = false
  }
}

onMounted(() => {
  fetchMeetings()
})
</script>

<style scoped>
.meeting-scheduler {
  display: flex;
  flex-direction: column;
  gap: 24px;
}

.overview-row {
  margin-bottom: 24px;
}

.stat-card {
  border-radius: 12px;
  cursor: pointer;
  transition: all 0.3s;
}

.stat-card.upcoming-card:hover {
  border-color: var(--el-color-primary-light-5);
}

.stat-card.today-card:hover {
  border-color: #818cf8; /* indigo-400 */
}

.stat-content {
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.stat-title {
  color: var(--el-text-color-secondary);
  font-size: 14px;
  margin: 0 0 8px 0;
}

.stat-value-group {
  display: flex;
  align-items: baseline;
  gap: 8px;
}

.stat-value {
  font-size: 24px;
  font-weight: bold;
  margin: 0;
  color: var(--el-text-color-primary);
}

.stat-icon-wrapper {
  width: 48px;
  height: 48px;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  transition: transform 0.3s;
}

.stat-card:hover .stat-icon-wrapper {
  transform: scale(1.1);
}

.stat-icon-wrapper.blue {
  background-color: var(--el-color-primary-light-9);
  color: var(--el-color-primary);
}

.stat-icon-wrapper.indigo {
  background-color: #e0e7ff; /* indigo-50 */
  color: #4f46e5; /* indigo-600 */
}

/* 列表区 */
.list-header {
  padding: 16px;
  border-bottom: 1px solid var(--el-border-color-lighter);
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.list-title {
  font-size: 16px;
  font-weight: 600;
  margin: 0;
}

.list-body {
  flex: 1;
  overflow-y: auto;
  padding: 16px;
}

.loading-wrapper {
  height: 100px;
  display: flex;
  align-items: center;
  justify-content: center;
}

.meeting-items {
  display: flex;
  flex-direction: column;
  gap: 16px;
}

.meeting-item {
  padding: 16px;
  border: 2px solid var(--el-border-color-lighter);
  border-radius: 8px;
  cursor: pointer;
  transition: all 0.2s;
}

.meeting-item:hover {
  border-color: var(--el-color-primary-light-5);
  background-color: var(--el-fill-color-light);
}

.meeting-item.is-selected {
  border-color: var(--el-color-primary);
  background-color: var(--el-color-primary-light-9);
}

.item-header {
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
  margin-bottom: 8px;
}

.item-title {
  font-weight: 500;
  margin: 0;
  font-size: 14px;
  color: var(--el-text-color-primary);
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
  max-width: 70%;
}

.item-meta {
  display: flex;
  gap: 16px;
  color: var(--el-text-color-secondary);
  font-size: 13px;
  margin-bottom: 8px;
}

.meta-item {
  display: flex;
  align-items: center;
  gap: 4px;
}

.item-footer {
  display: flex;
  gap: 16px;
  padding-top: 8px;
  border-top: 1px solid var(--el-border-color-lighter);
  font-size: 13px;
  color: var(--el-text-color-regular);
}

.footer-item {
  display: flex;
  align-items: center;
  gap: 4px;
}

.truncate-text {
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
  max-width: 120px;
}

/* 纪要区 */
.minutes-header {
  padding: 24px;
  border-bottom: 1px solid var(--el-border-color-lighter);
}

.header-top {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 16px;
}

.meeting-title {
  font-size: 20px;
  font-weight: bold;
  margin: 0;
}

.header-bottom {
  display: flex;
  gap: 24px;
  color: var(--el-text-color-secondary);
  font-size: 14px;
}

.minutes-body {
  flex: 1;
  overflow-y: auto;
  padding: 24px;
  background-color: var(--el-fill-color-blank);
}

.edit-mode {
  display: flex;
  flex-direction: column;
  gap: 24px;
  height: 100%;
}

.form-group {
  display: flex;
  flex-direction: column;
}

.form-label {
  font-size: 14px;
  font-weight: 500;
  color: var(--el-text-color-regular);
  margin-bottom: 8px;
  display: block;
}

.group-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 8px;
}

.action-list {
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.action-list-item {
  display: flex;
  gap: 12px;
  align-items: center;
}

.task-input {
  flex: 1;
}

.assignee-input {
  width: 120px;
}

.empty-action-list {
  text-align: center;
  padding: 16px;
  border: 1px dashed var(--el-border-color);
  border-radius: 8px;
  color: var(--el-text-color-secondary);
  font-size: 13px;
}

.empty-minutes {
  text-align: center;
  padding: 64px 0;
}

.empty-icon {
  font-size: 48px;
  color: var(--el-text-color-disabled);
  margin-bottom: 16px;
}

.markdown-preview {
  font-family: var(--el-font-family);
  font-size: 14px;
  line-height: 1.8;
  color: var(--el-text-color-primary);
  white-space: pre-wrap;
  margin-bottom: 32px;
  padding: 16px;
  background-color: var(--el-fill-color-lighter);
  border-radius: 8px;
}

.section-title {
  font-size: 16px;
  font-weight: 600;
  margin: 0 0 16px 0;
  border-bottom: 1px solid var(--el-border-color-lighter);
  padding-bottom: 8px;
}

.minutes-footer {
  margin-top: 32px;
  padding-top: 16px;
  border-top: 1px solid var(--el-border-color-lighter);
  display: flex;
  justify-content: space-between;
  color: var(--el-text-color-secondary);
  font-size: 12px;
}

.empty-state {
  flex: 1;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  color: var(--el-text-color-secondary);
  background-color: var(--el-fill-color-lighter);
}

.huge-icon {
  font-size: 64px;
  color: var(--el-text-color-disabled);
  margin-bottom: 16px;
}

.empty-title {
  font-size: 18px;
  font-weight: 500;
  margin: 0 0 8px 0;
  color: var(--el-text-color-primary);
}

.empty-subtitle {
  font-size: 14px;
  margin: 0;
}
</style>
