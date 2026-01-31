<template>
  <div class="faq-management">
    <!-- 页面头部 -->
    <div class="page-header">
      <div class="header-left">
        <h1>FAQ 知识库管理</h1>
        <p class="subtitle">管理聊天机器人的问答知识库</p>
      </div>
      <div class="header-right">
        <el-button @click="showImportDialog = true">
          <el-icon><Upload /></el-icon>
          导入及导出
        </el-button>
        <el-button type="primary" @click="showCreateCategory = true">
          <el-icon><FolderAdd /></el-icon>
          新增分类
        </el-button>
        <el-button type="primary" @click="showCreateItem = true">
          <el-icon><Plus /></el-icon>
          新增 FAQ
        </el-button>
      </div>
    </div>

    <!-- 统计卡片 -->
    <el-row :gutter="16" class="stats-row">
      <el-col :span="6">
        <div class="stat-card">
          <div class="stat-icon blue"><el-icon><ChatDotRound /></el-icon></div>
          <div class="stat-content">
            <div class="stat-value">{{ stats.totalFaqs }}</div>
            <div class="stat-label">FAQ 条目</div>
          </div>
        </div>
      </el-col>
      <el-col :span="6">
        <div class="stat-card">
          <div class="stat-icon green"><el-icon><Comment /></el-icon></div>
          <div class="stat-content">
            <div class="stat-value">{{ stats.totalSessions }}</div>
            <div class="stat-label">对话总数</div>
          </div>
        </div>
      </el-col>
      <el-col :span="6">
        <div class="stat-card">
          <div class="stat-icon orange"><el-icon><ChatLineRound /></el-icon></div>
          <div class="stat-content">
            <div class="stat-value">{{ stats.totalMessages }}</div>
            <div class="stat-label">消息总数</div>
          </div>
        </div>
      </el-col>
      <el-col :span="6">
        <div class="stat-card">
          <div class="stat-icon red"><el-icon><QuestionFilled /></el-icon></div>
          <div class="stat-content">
            <div class="stat-value">{{ stats.pendingUnrecognized }}</div>
            <div class="stat-label">待处理问题</div>
          </div>
        </div>
      </el-col>
    </el-row>

    <!-- 标签页 -->
    <el-tabs v-model="activeTab" class="content-tabs">
      <!-- FAQ 条目管理 -->
      <el-tab-pane label="FAQ 条目" name="items">
        <div class="tab-toolbar">
          <el-select v-model="filterCategoryId" placeholder="筛选分类" clearable style="width: 200px">
            <el-option
              v-for="cat in categories"
              :key="cat.id"
              :label="cat.name"
              :value="cat.id"
            />
          </el-select>
          <el-input
            v-model="searchKeyword"
            placeholder="搜索问题..."
            style="width: 300px; margin-left: 12px"
            clearable
          >
            <template #prefix><el-icon><Search /></el-icon></template>
          </el-input>
        </div>

        <el-table :data="filteredItems" stripe v-loading="loading">
          <el-table-column label="问题" min-width="300">
            <template #default="{ row }">
              <div class="question-cell">
                <el-tag :type="row.isActive ? 'success' : 'info'" size="small">
                  {{ row.isActive ? '启用' : '禁用' }}
                </el-tag>
                <span class="question-text">{{ row.question }}</span>
              </div>
            </template>
          </el-table-column>
          <el-table-column label="分类" width="120">
            <template #default="{ row }">
              <el-tag>{{ row.category?.name }}</el-tag>
            </template>
          </el-table-column>
          <el-table-column label="查看/有用" width="100" align="center">
            <template #default="{ row }">
              {{ row.viewCount }} / {{ row.helpfulCount }}
            </template>
          </el-table-column>
          <el-table-column label="操作" width="150" align="center">
            <template #default="{ row }">
              <el-button link type="primary" @click="editItem(row)">编辑</el-button>
              <el-button link :type="row.isActive ? 'danger' : 'success'" @click="toggleItemStatus(row)">
                {{ row.isActive ? '禁用' : '启用' }}
              </el-button>
            </template>
          </el-table-column>
        </el-table>
      </el-tab-pane>

      <!-- 分类管理 -->
      <el-tab-pane label="分类管理" name="categories">
        <el-table :data="categories" stripe v-loading="loading">
          <el-table-column prop="name" label="中文名称" width="200" />
          <el-table-column prop="nameEn" label="英文名称" width="200" />
          <el-table-column prop="description" label="描述" />
          <el-table-column label="条目数" width="80" align="center">
            <template #default="{ row }">{{ row._count?.items || 0 }}</template>
          </el-table-column>
          <el-table-column label="状态" width="80" align="center">
            <template #default="{ row }">
              <el-tag :type="row.isActive ? 'success' : 'info'" size="small">
                {{ row.isActive ? '启用' : '禁用' }}
              </el-tag>
            </template>
          </el-table-column>
          <el-table-column label="操作" width="150" align="center">
            <template #default="{ row }">
              <el-button link type="primary" @click="editCategory(row)">编辑</el-button>
              <el-button link :type="row.isActive ? 'danger' : 'success'" @click="toggleCategoryStatus(row)">
                {{ row.isActive ? '禁用' : '启用' }}
              </el-button>
            </template>
          </el-table-column>
        </el-table>
      </el-tab-pane>

      <!-- 对话记录 -->
      <el-tab-pane label="对话记录" name="sessions">
        <div class="tab-toolbar">
          <el-select v-model="sessionStatus" placeholder="筛选状态" clearable style="width: 150px">
            <el-option label="活跃" value="active" />
            <el-option label="已关闭" value="closed" />
            <el-option label="已归档" value="archived" />
          </el-select>
        </div>

        <el-table :data="sessions" stripe v-loading="sessionsLoading">
          <el-table-column label="访客" width="180">
            <template #default="{ row }">
              <div>{{ row.visitorName || row.visitorId?.substring(0, 12) || '匿名' }}</div>
              <div class="text-muted">{{ row.visitorEmail }}</div>
            </template>
          </el-table-column>
          <el-table-column label="消息数" width="80" align="center">
            <template #default="{ row }">{{ row._count?.messages || 0 }}</template>
          </el-table-column>
          <el-table-column label="状态" width="100">
            <template #default="{ row }">
              <el-tag :type="getSessionStatusType(row.status)" size="small">
                {{ getSessionStatusLabel(row.status) }}
              </el-tag>
            </template>
          </el-table-column>
          <el-table-column label="开始时间" width="180">
            <template #default="{ row }">{{ formatDateTime(row.createdAt) }}</template>
          </el-table-column>
          <el-table-column label="操作" width="120" align="center">
            <template #default="{ row }">
              <el-button link type="primary" @click="viewSession(row)">查看</el-button>
            </template>
          </el-table-column>
        </el-table>

        <el-pagination
          v-if="sessionPagination.total > 0"
          class="pagination"
          layout="prev, pager, next"
          :total="sessionPagination.total"
          :page-size="sessionPagination.pageSize"
          :current-page="sessionPagination.page"
          @current-change="handleSessionPageChange"
        />
      </el-tab-pane>

      <!-- 未识别问题 -->
      <el-tab-pane label="未识别问题" name="unrecognized">
        <el-table :data="unrecognizedQuestions" stripe v-loading="loading">
          <el-table-column prop="question" label="问题" />
          <el-table-column prop="frequency" label="出现次数" width="100" align="center" />
          <el-table-column label="操作" width="200" align="center">
            <template #default="{ row }">
              <el-button link type="primary" @click="addToFaq(row)">添加到 FAQ</el-button>
              <el-button link type="info" @click="ignoreQuestion(row)">忽略</el-button>
            </template>
          </el-table-column>
        </el-table>
      </el-tab-pane>
    </el-tabs>

    <!-- 创建/编辑分类对话框 -->
    <el-dialog 
      v-model="showCreateCategory" 
      :title="editingCategory ? '编辑分类' : '新增分类'"
      width="500px"
    >
      <el-form :model="categoryForm" label-width="100px">
        <el-form-item label="中文名称" required>
          <el-input v-model="categoryForm.name" />
        </el-form-item>
        <el-form-item label="英文名称">
          <el-input v-model="categoryForm.nameEn" />
        </el-form-item>
        <el-form-item label="描述">
          <el-input v-model="categoryForm.description" type="textarea" :rows="2" />
        </el-form-item>
        <el-form-item label="排序">
          <el-input-number v-model="categoryForm.sortOrder" :min="0" />
        </el-form-item>
      </el-form>
      <template #footer>
        <el-button @click="showCreateCategory = false">取消</el-button>
        <el-button type="primary" @click="saveCategory" :loading="saving">保存</el-button>
      </template>
    </el-dialog>

    <!-- 创建/编辑 FAQ 对话框 -->
    <el-dialog 
      v-model="showCreateItem" 
      :title="editingItem ? '编辑 FAQ' : '新增 FAQ'"
      width="700px"
    >
      <el-form :model="itemForm" label-width="100px">
        <el-form-item label="分类" required>
          <el-select v-model="itemForm.categoryId" style="width: 100%">
            <el-option
              v-for="cat in categories.filter(c => c.isActive)"
              :key="cat.id"
              :label="cat.name"
              :value="cat.id"
            />
          </el-select>
        </el-form-item>
        <el-form-item label="问题（中文）" required>
          <el-input v-model="itemForm.question" />
        </el-form-item>
        <el-form-item label="问题（英文）">
          <el-input v-model="itemForm.questionEn" />
        </el-form-item>
        <el-form-item label="答案（中文）" required>
          <el-input v-model="itemForm.answer" type="textarea" :rows="4" />
        </el-form-item>
        <el-form-item label="答案（英文）">
          <el-input v-model="itemForm.answerEn" type="textarea" :rows="4" />
        </el-form-item>
        <el-form-item label="关键词">
          <el-select
            v-model="itemForm.keywords"
            multiple
            filterable
            allow-create
            default-first-option
            style="width: 100%"
            placeholder="输入关键词后按回车"
          />
        </el-form-item>
        <el-form-item label="排序">
          <el-input-number v-model="itemForm.sortOrder" :min="0" />
        </el-form-item>
      </el-form>
      <template #footer>
        <el-button @click="showCreateItem = false">取消</el-button>
        <el-button type="primary" @click="saveItem" :loading="saving">保存</el-button>
      </template>
    </el-dialog>

    <!-- 导入 FAQ 对话框 -->
    <el-dialog v-model="showImportDialog" title="批量导入 FAQ" width="500px">
      <div style="text-align: center; margin-bottom: 20px;">
        <el-alert title="请使用 Excel 模板上传，支持 .xlsx 格式" type="info" :closable="false" style="margin-bottom: 15px" />
        <el-button type="primary" link @click="downloadTemplate">
          <el-icon><Download /></el-icon> 点击下载导入模板
        </el-button>
      </div>
      
      <el-upload
        class="upload-demo"
        drag
        action="#"
        :http-request="handleImport"
        :show-file-list="false"
        accept=".xlsx,.xls,.csv"
      >
        <el-icon class="el-icon--upload"><upload-filled /></el-icon>
        <div class="el-upload__text">
            拖拽文件到此处或 <em>点击上传</em>
        </div>
        <template #tip>
          <div class="el-upload__tip">
            文件大小不超过 5MB
          </div>
        </template>
      </el-upload>
    </el-dialog>

    <!-- 会话详情抽屉 -->
    <el-drawer v-model="showSessionDetail" title="对话详情" size="500px">
      <template v-if="selectedSession">
        <div class="session-info">
          <p><strong>访客：</strong>{{ selectedSession.visitorName || selectedSession.visitorId || '匿名' }}</p>
          <p><strong>邮箱：</strong>{{ selectedSession.visitorEmail || '-' }}</p>
          <p><strong>状态：</strong>{{ getSessionStatusLabel(selectedSession.status) }}</p>
          <p><strong>开始时间：</strong>{{ formatDateTime(selectedSession.createdAt) }}</p>
        </div>
        <el-divider />
        <div class="session-messages">
          <div 
            v-for="msg in selectedSession.messages" 
            :key="msg.id" 
            class="message-bubble"
            :class="msg.role"
          >
            <div class="message-role">{{ msg.role === 'user' ? '访客' : '机器人' }}</div>
            <div class="message-content">{{ msg.content }}</div>
            <div class="message-time">{{ formatDateTime(msg.createdAt) }}</div>
          </div>
        </div>
      </template>
    </el-drawer>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted, watch } from 'vue'
import { ElMessage, ElMessageBox } from 'element-plus'
import { 
  FolderAdd, Plus, Search, ChatDotRound, Comment, 
  ChatLineRound, QuestionFilled, Upload, UploadFilled, Download
} from '@element-plus/icons-vue'
import apiClient from '@/api/apiClient'

// 状态
const loading = ref(false)
const saving = ref(false)
const sessionsLoading = ref(false)
const activeTab = ref('items')

// 统计数据
const stats = ref({
  totalFaqs: 0,
  totalSessions: 0,
  totalMessages: 0,
  pendingUnrecognized: 0
})

// 分类
const categories = ref<any[]>([])
const showCreateCategory = ref(false)
const editingCategory = ref<any>(null)
const categoryForm = ref({
  name: '',
  nameEn: '',
  description: '',
  sortOrder: 0
})

// FAQ 条目
const items = ref<any[]>([])
const showCreateItem = ref(false)
const editingItem = ref<any>(null)
const itemForm = ref({
  question: '',
  questionEn: '',
  answer: '',
  answerEn: '',
  keywords: [] as string[],
  categoryId: '',
  sortOrder: 0
})
const filterCategoryId = ref('')
const searchKeyword = ref('')
const showImportDialog = ref(false)

// 会话
const sessions = ref<any[]>([])
const sessionStatus = ref('')
const sessionPagination = ref({ page: 1, pageSize: 20, total: 0 })
const showSessionDetail = ref(false)
const selectedSession = ref<any>(null)

// 未识别问题
const unrecognizedQuestions = ref<any[]>([])

// 计算属性
const filteredItems = computed(() => {
  let result = items.value
  
  if (filterCategoryId.value) {
    result = result.filter(item => item.categoryId === filterCategoryId.value)
  }
  
  if (searchKeyword.value) {
    const keyword = searchKeyword.value.toLowerCase()
    result = result.filter(item => 
      item.question.toLowerCase().includes(keyword) ||
      item.questionEn?.toLowerCase().includes(keyword)
    )
  }
  
  return result
})

// API 调用
async function fetchStats() {
  try {
    const response = await apiClient.get(`/faq-admin/stats`)
    if (response.data.success) {
      stats.value = response.data.data
    }
  } catch (error) {
    console.error('Error fetching stats:', error)
  }
}

async function fetchCategories() {
  try {
    const response = await apiClient.get(`/faq-admin/categories`)
    if (response.data.success) {
      categories.value = response.data.data
    }
  } catch (error) {
    console.error('Error fetching categories:', error)
  }
}

async function fetchItems() {
  loading.value = true
  try {
    const response = await apiClient.get(`/faq-admin/items`)
    if (response.data.success) {
      items.value = response.data.data
    }
  } catch (error) {
    console.error('Error fetching items:', error)
  } finally {
    loading.value = false
  }
}

async function fetchSessions() {
  sessionsLoading.value = true
  try {
    const params: any = {
      page: sessionPagination.value.page,
      pageSize: sessionPagination.value.pageSize
    }
    if (sessionStatus.value) {
      params.status = sessionStatus.value
    }
    
    const response = await apiClient.get(`/faq-admin/sessions`, { params })
    if (response.data.success) {
      sessions.value = response.data.data
      sessionPagination.value = { ...sessionPagination.value, ...response.data.pagination }
    }
  } catch (error) {
    console.error('Error fetching sessions:', error)
  } finally {
    sessionsLoading.value = false
  }
}

async function fetchUnrecognized() {
  try {
    const response = await apiClient.get(`/faq-admin/unrecognized`)
    if (response.data.success) {
      unrecognizedQuestions.value = response.data.data
    }
  } catch (error) {
    console.error('Error fetching unrecognized:', error)
  }
}

// 分类操作
function editCategory(category: any) {
  editingCategory.value = category
  categoryForm.value = {
    name: category.name,
    nameEn: category.nameEn || '',
    description: category.description || '',
    sortOrder: category.sortOrder || 0
  }
  showCreateCategory.value = true
}

async function saveCategory() {
  if (!categoryForm.value.name) {
    ElMessage.warning('请输入分类名称')
    return
  }

  saving.value = true
  try {
    if (editingCategory.value) {
      await apiClient.put(`/faq-admin/categories/${editingCategory.value.id}`, categoryForm.value)
    } else {
      await apiClient.post(`/faq-admin/categories`, categoryForm.value)
    }
    ElMessage.success('保存成功')
    showCreateCategory.value = false
    editingCategory.value = null
    categoryForm.value = { name: '', nameEn: '', description: '', sortOrder: 0 }
    await fetchCategories()
  } catch (error) {
    ElMessage.error('保存失败')
  } finally {
    saving.value = false
  }
}

async function toggleCategoryStatus(category: any) {
  try {
    await apiClient.put(`/faq-admin/categories/${category.id}`, {
      isActive: !category.isActive
    })
    ElMessage.success(category.isActive ? '已禁用' : '已启用')
    await fetchCategories()
  } catch (error) {
    ElMessage.error('操作失败')
  }
}

// FAQ 条目操作
function editItem(item: any) {
  editingItem.value = item
  itemForm.value = {
    question: item.question,
    questionEn: item.questionEn || '',
    answer: item.answer,
    answerEn: item.answerEn || '',
    keywords: item.keywords || [],
    categoryId: item.categoryId,
    sortOrder: item.sortOrder || 0
  }
  showCreateItem.value = true
}

async function saveItem() {
  if (!itemForm.value.question || !itemForm.value.answer || !itemForm.value.categoryId) {
    ElMessage.warning('请填写必填项')
    return
  }

  saving.value = true
  try {
    if (editingItem.value) {
      await apiClient.put(`/faq-admin/items/${editingItem.value.id}`, itemForm.value)
    } else {
      await apiClient.post(`/faq-admin/items`, itemForm.value)
    }
    ElMessage.success('保存成功')
    showCreateItem.value = false
    editingItem.value = null
    itemForm.value = { question: '', questionEn: '', answer: '', answerEn: '', keywords: [], categoryId: '', sortOrder: 0 }
    await fetchItems()
    await fetchStats()
  } catch (error) {
    ElMessage.error('保存失败')
  } finally {
    saving.value = false
  }
}

async function toggleItemStatus(item: any) {
  try {
    await apiClient.put(`/faq-admin/items/${item.id}`, {
      isActive: !item.isActive
    })
    ElMessage.success(item.isActive ? '已禁用' : '已启用')
    await fetchItems()
  } catch (error) {
    ElMessage.error('操作失败')
  }
}

// 会话操作
async function viewSession(session: any) {
  try {
    const response = await apiClient.get(`/faq-admin/sessions/${session.id}`)
    if (response.data.success) {
      selectedSession.value = response.data.data
      showSessionDetail.value = true
    }
  } catch (error) {
    ElMessage.error('获取会话详情失败')
  }
}

function handleSessionPageChange(page: number) {
  sessionPagination.value.page = page
  fetchSessions()
}

// 未识别问题操作
async function addToFaq(question: any) {
  itemForm.value = {
    question: question.question,
    questionEn: '',
    answer: '',
    answerEn: '',
    keywords: [],
    categoryId: '',
    sortOrder: 0
  }
  showCreateItem.value = true
  
  // 标记为已添加
  await apiClient.put(`/faq-admin/unrecognized/${question.id}`, { status: 'added' })
  await fetchUnrecognized()
}

async function ignoreQuestion(question: any) {
  await ElMessageBox.confirm('确定要忽略此问题吗？', '提示', { type: 'warning' })
  try {
    await apiClient.put(`/faq-admin/unrecognized/${question.id}`, { status: 'ignored' })
    ElMessage.success('已忽略')
    await fetchUnrecognized()
  } catch (error) {
    ElMessage.error('操作失败')
  }
}

// 导入操作
async function downloadTemplate() {
  const apiBase = import.meta.env.VITE_API_BASE_URL || '/api/v1'
  window.open(`${apiBase}/faq-admin/import/template`, '_blank')
}

async function handleImport(options: any) {
  const formData = new FormData()
  formData.append('file', options.file)
  
  const loadingInstance = ElMessage.success({
    message: '正在上传处理中...',
    duration: 0
  })
  
  try {
    const response = await apiClient.post('/faq-admin/import', formData, {
      headers: { 'Content-Type': 'multipart/form-data' }
    })
    
    loadingInstance.close()
    
    if (response.data.success) {
      ElMessageBox.alert(response.data.message, '导入结果', {
        confirmButtonText: '确定',
        type: 'success'
      })
      showImportDialog.value = false
      // 刷新数据
      await Promise.all([
        fetchItems(),
        fetchStats(),
        fetchCategories()
      ])
    }
  } catch (error: any) {
    loadingInstance.close()
    ElMessage.error(error.response?.data?.message || '导入失败')
  }
}

// 辅助函数
function getSessionStatusType(status: string) {
  switch (status) {
    case 'active': return 'success'
    case 'closed': return 'info'
    case 'archived': return 'warning'
    default: return 'info'
  }
}

function getSessionStatusLabel(status: string) {
  switch (status) {
    case 'active': return '活跃'
    case 'closed': return '已关闭'
    case 'archived': return '已归档'
    default: return status
  }
}

function formatDateTime(dateStr: string) {
  const date = new Date(dateStr)
  return date.toLocaleString('zh-CN', {
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit'
  })
}

// 监听标签页切换
watch(activeTab, async (tab) => {
  if (tab === 'sessions') {
    await fetchSessions()
  } else if (tab === 'unrecognized') {
    await fetchUnrecognized()
  }
})

watch(sessionStatus, () => {
  sessionPagination.value.page = 1
  fetchSessions()
})

// 重置对话框
watch(showCreateCategory, (val) => {
  if (!val) {
    editingCategory.value = null
    categoryForm.value = { name: '', nameEn: '', description: '', sortOrder: 0 }
  }
})

watch(showCreateItem, (val) => {
  if (!val) {
    editingItem.value = null
    itemForm.value = { question: '', questionEn: '', answer: '', answerEn: '', keywords: [], categoryId: '', sortOrder: 0 }
  }
})

// 初始化
onMounted(async () => {
  await Promise.all([
    fetchStats(),
    fetchCategories(),
    fetchItems()
  ])
})
</script>

<style scoped>
.faq-management {
  padding: 20px;
}

.page-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 24px;
}

.page-header h1 {
  margin: 0;
  font-size: 24px;
  color: #1f2937;
}

.page-header .subtitle {
  margin: 4px 0 0;
  color: #6b7280;
}

.header-right {
  display: flex;
  gap: 12px;
}

.stats-row {
  margin-bottom: 24px;
}

.stat-card {
  background: white;
  border-radius: 12px;
  padding: 20px;
  display: flex;
  align-items: center;
  gap: 16px;
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.1);
}

.stat-icon {
  width: 48px;
  height: 48px;
  border-radius: 12px;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 24px;
}

.stat-icon.blue { background: #dbeafe; color: #2563eb; }
.stat-icon.green { background: #dcfce7; color: #16a34a; }
.stat-icon.orange { background: #ffedd5; color: #ea580c; }
.stat-icon.red { background: #fee2e2; color: #dc2626; }

.stat-value {
  font-size: 28px;
  font-weight: 600;
  color: #1f2937;
}

.stat-label {
  font-size: 14px;
  color: #6b7280;
}

.content-tabs {
  background: white;
  border-radius: 12px;
  padding: 20px;
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.1);
}

.tab-toolbar {
  margin-bottom: 16px;
  display: flex;
  align-items: center;
}

.question-cell {
  display: flex;
  align-items: center;
  gap: 8px;
}

.question-text {
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.text-muted {
  font-size: 12px;
  color: #9ca3af;
}

.pagination {
  margin-top: 16px;
  justify-content: center;
}

/* 会话详情 */
.session-info p {
  margin: 8px 0;
}

.session-messages {
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.message-bubble {
  padding: 12px 16px;
  border-radius: 12px;
  max-width: 85%;
}

.message-bubble.user {
  align-self: flex-end;
  background: #2563eb;
  color: white;
}

.message-bubble.assistant {
  align-self: flex-start;
  background: #f3f4f6;
  color: #1f2937;
}

.message-role {
  font-size: 12px;
  font-weight: 600;
  margin-bottom: 4px;
  opacity: 0.8;
}

.message-content {
  white-space: pre-wrap;
  word-break: break-word;
}

.message-time {
  font-size: 11px;
  margin-top: 4px;
  opacity: 0.6;
}
</style>
