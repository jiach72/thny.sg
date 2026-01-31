<template>
  <div class="news-management">
    <!-- 页面头部 -->
    <div class="page-header">
      <div class="header-left">
        <h1>新闻资讯管理</h1>
        <p class="subtitle">管理公司动态和行业新闻</p>
      </div>
      <div class="header-right">
        <el-button @click="showImportDialog = true">
          <el-icon><Download /></el-icon>
          导入公众号文章
        </el-button>
        <el-button @click="$router.push('/settings/news/rss')">
          <el-icon><Connection /></el-icon>
          RSS 订阅源
        </el-button>
        <el-button type="primary" @click="showArticleDialog = true">
          <el-icon><Plus /></el-icon>
          新增文章
        </el-button>
      </div>
    </div>

    <!-- 统计卡片 -->
    <el-row :gutter="16" class="stats-row">
      <el-col :span="6">
        <div class="stat-card">
          <div class="stat-icon blue"><el-icon><Document /></el-icon></div>
          <div class="stat-content">
            <div class="stat-value">{{ stats.totalArticles }}</div>
            <div class="stat-label">文章总数</div>
          </div>
        </div>
      </el-col>
      <el-col :span="6">
        <div class="stat-card">
          <div class="stat-icon green"><el-icon><CircleCheck /></el-icon></div>
          <div class="stat-content">
            <div class="stat-value">{{ stats.publishedCount }}</div>
            <div class="stat-label">已发布</div>
          </div>
        </div>
      </el-col>
      <el-col :span="6">
        <div class="stat-card">
          <div class="stat-icon orange"><el-icon><Edit /></el-icon></div>
          <div class="stat-content">
            <div class="stat-value">{{ stats.draftCount }}</div>
            <div class="stat-label">草稿</div>
          </div>
        </div>
      </el-col>
      <el-col :span="6">
        <div class="stat-card">
          <div class="stat-icon purple"><el-icon><View /></el-icon></div>
          <div class="stat-content">
            <div class="stat-value">{{ stats.totalViews }}</div>
            <div class="stat-label">总浏览量</div>
          </div>
        </div>
      </el-col>
    </el-row>

    <!-- 筛选栏 -->
    <div class="filter-bar">
      <el-select v-model="filters.type" placeholder="类型" clearable style="width: 120px">
        <el-option label="公司动态" value="COMPANY" />
        <el-option label="行业新闻" value="INDUSTRY" />
      </el-select>
      <el-select v-model="filters.status" placeholder="状态" clearable style="width: 120px">
        <el-option label="已发布" value="PUBLISHED" />
        <el-option label="草稿" value="DRAFT" />
        <el-option label="已归档" value="ARCHIVED" />
      </el-select>
      <el-select v-model="filters.source" placeholder="来源" clearable style="width: 120px">
        <el-option label="手动创建" value="manual" />
        <el-option label="RSS 抓取" value="rss" />
        <el-option label="公众号" value="wechat" />
      </el-select>
      <el-input
        v-model="filters.search"
        placeholder="搜索标题..."
        style="width: 250px"
        clearable
        @keyup.enter="fetchArticles"
      >
        <template #prefix><el-icon><Search /></el-icon></template>
      </el-input>
      <el-button @click="fetchArticles">搜索</el-button>
    </div>

    <!-- 文章列表 -->
    <el-table :data="articles" stripe v-loading="loading" @selection-change="handleSelectionChange">
      <el-table-column type="selection" width="50" />
      <el-table-column label="文章" min-width="300">
        <template #default="{ row }">
          <div class="article-cell">
            <img v-if="row.coverImage" :src="row.coverImage" class="cover-thumb" />
            <div class="article-info">
              <div class="article-title">
                <el-tag v-if="row.isTop" type="danger" size="small">置顶</el-tag>
                {{ row.title }}
              </div>
              <div class="article-meta">
                <el-tag :type="row.type === 'COMPANY' ? 'success' : 'info'" size="small">
                  {{ row.type === 'COMPANY' ? '公司动态' : '行业新闻' }}
                </el-tag>
                <span>{{ row.author || '未知作者' }}</span>
                <span>{{ formatDate(row.publishedAt || row.createdAt) }}</span>
              </div>
            </div>
          </div>
        </template>
      </el-table-column>
      <el-table-column label="来源" width="100">
        <template #default="{ row }">
          <el-tag :type="getSourceType(row.source)" size="small">
            {{ getSourceLabel(row.source) }}
          </el-tag>
        </template>
      </el-table-column>
      <el-table-column label="状态" width="100">
        <template #default="{ row }">
          <el-tag :type="getStatusType(row.status)" size="small">
            {{ getStatusLabel(row.status) }}
          </el-tag>
        </template>
      </el-table-column>
      <el-table-column prop="viewCount" label="浏览" width="80" align="center" />
      <el-table-column label="操作" width="180" align="center">
        <template #default="{ row }">
          <el-button link type="primary" @click="editArticle(row)">编辑</el-button>
          <el-button 
            link 
            :type="row.status === 'PUBLISHED' ? 'warning' : 'success'" 
            @click="togglePublish(row)"
          >
            {{ row.status === 'PUBLISHED' ? '撤回' : '发布' }}
          </el-button>
          <el-button link @click="toggleTop(row)">
            {{ row.isTop ? '取消置顶' : '置顶' }}
          </el-button>
        </template>
      </el-table-column>
    </el-table>

    <!-- 批量操作和分页 -->
    <div class="table-footer">
      <div class="batch-actions" v-if="selectedIds.length > 0">
        <span>已选 {{ selectedIds.length }} 项</span>
        <el-button type="danger" size="small" @click="batchDelete">批量删除</el-button>
      </div>
      <el-pagination
        v-if="pagination.total > 0"
        layout="total, prev, pager, next"
        :total="pagination.total"
        :page-size="pagination.pageSize"
        :current-page="pagination.page"
        @current-change="handlePageChange"
      />
    </div>

    <!-- 文章编辑对话框 -->
    <el-dialog 
      v-model="showArticleDialog" 
      :title="editingArticle ? '编辑文章' : '新增文章'"
      width="800px"
      :close-on-click-modal="false"
    >
      <el-form :model="articleForm" label-width="100px">
        <el-row :gutter="20">
          <el-col :span="12">
            <el-form-item label="类型" required>
              <el-select v-model="articleForm.type" style="width: 100%">
                <el-option label="公司动态" value="COMPANY" />
                <el-option label="行业新闻" value="INDUSTRY" />
              </el-select>
            </el-form-item>
          </el-col>
          <el-col :span="12">
            <el-form-item label="作者">
              <el-input v-model="articleForm.author" />
            </el-form-item>
          </el-col>
        </el-row>

        <el-form-item label="标题（中文）" required>
          <el-input v-model="articleForm.title" />
        </el-form-item>
        <el-form-item label="标题（英文）">
          <el-input v-model="articleForm.titleEn" />
        </el-form-item>

        <el-form-item label="摘要（中文）">
          <el-input v-model="articleForm.summary" type="textarea" :rows="2" />
        </el-form-item>
        <el-form-item label="摘要（英文）">
          <el-input v-model="articleForm.summaryEn" type="textarea" :rows="2" />
        </el-form-item>

        <el-form-item label="正文（中文）" required>
          <el-input v-model="articleForm.content" type="textarea" :rows="6" />
        </el-form-item>
        <el-form-item label="正文（英文）">
          <el-input v-model="articleForm.contentEn" type="textarea" :rows="6" />
        </el-form-item>

        <el-row :gutter="20">
          <el-col :span="12">
            <el-form-item label="封面图">
              <el-input v-model="articleForm.coverImage" placeholder="图片 URL" />
            </el-form-item>
          </el-col>
          <el-col :span="12">
            <el-form-item label="原文链接">
              <el-input v-model="articleForm.sourceUrl" />
            </el-form-item>
          </el-col>
        </el-row>

        <el-form-item label="标签">
          <el-select
            v-model="articleForm.tags"
            multiple
            filterable
            allow-create
            default-first-option
            style="width: 100%"
            placeholder="输入标签后按回车"
          />
        </el-form-item>
      </el-form>
      <template #footer>
        <el-button @click="showArticleDialog = false">取消</el-button>
        <el-button @click="saveArticle('DRAFT')" :loading="saving">保存草稿</el-button>
        <el-button type="primary" @click="saveArticle('PUBLISHED')" :loading="saving">发布</el-button>
      </template>
    </el-dialog>

    <!-- 导入公众号文章对话框 -->
    <el-dialog v-model="showImportDialog" title="导入微信公众号文章" width="500px">
      <el-alert 
        type="info" 
        show-icon 
        :closable="false"
        style="margin-bottom: 20px;"
      >
        <template #title>
          支持导入微信公众号文章，请粘贴文章链接
        </template>
      </el-alert>
      <el-form :model="importForm" label-width="100px">
        <el-form-item label="文章链接" required>
          <el-input 
            v-model="importForm.url" 
            placeholder="请粘贴微信公众号文章链接" 
            type="textarea" 
            :rows="3"
          />
        </el-form-item>
        <el-form-item label="文章类型">
          <el-radio-group v-model="importForm.type">
            <el-radio value="COMPANY">公司动态</el-radio>
            <el-radio value="INDUSTRY">行业新闻</el-radio>
          </el-radio-group>
        </el-form-item>
      </el-form>
      <template #footer>
        <el-button @click="showImportDialog = false">取消</el-button>
        <el-button type="primary" @click="importWechatArticle" :loading="importing">
          导入文章
        </el-button>
      </template>
    </el-dialog>
  </div>
</template>

<script setup lang="ts">
import { ref, reactive, onMounted, watch } from 'vue'
import { ElMessage, ElMessageBox } from 'element-plus'
import { 
  Plus, Search, Document, CircleCheck, Edit, View, Connection, Download
} from '@element-plus/icons-vue'
import axios from 'axios'

// 状态
const loading = ref(false)
const saving = ref(false)
const importing = ref(false)
const articles = ref<any[]>([])
const selectedIds = ref<string[]>([])

// 导入公众号文章
const showImportDialog = ref(false)
const importForm = ref({
  url: '',
  type: 'COMPANY'
})

// 统计
const stats = ref({
  totalArticles: 0,
  publishedCount: 0,
  draftCount: 0,
  totalViews: 0,
})

// 筛选
const filters = reactive({
  type: '',
  status: '',
  source: '',
  search: '',
})

// 分页
const pagination = ref({
  page: 1,
  pageSize: 20,
  total: 0,
})

// 文章表单
const showArticleDialog = ref(false)
const editingArticle = ref<any>(null)
const articleForm = ref({
  title: '',
  titleEn: '',
  summary: '',
  summaryEn: '',
  content: '',
  contentEn: '',
  coverImage: '',
  author: '',
  sourceUrl: '',
  type: 'COMPANY',
  tags: [] as string[],
})

// API 基础路径
const apiBase = import.meta.env.VITE_API_BASE_URL || ''

// 获取文章列表
async function fetchArticles() {
  loading.value = true
  try {
    const params: any = {
      page: pagination.value.page,
      pageSize: pagination.value.pageSize,
    }
    if (filters.type) params.type = filters.type
    if (filters.status) params.status = filters.status
    if (filters.source) params.source = filters.source
    if (filters.search) params.search = filters.search

    const response = await axios.get(`${apiBase}/api/v1/news-admin/articles`, { params })
    if (response.data.success) {
      articles.value = response.data.data.articles
      pagination.value = { ...pagination.value, ...response.data.data.pagination }
    }
  } catch (error) {
    console.error('Error fetching articles:', error)
  } finally {
    loading.value = false
  }
}

// 获取统计数据
async function fetchStats() {
  try {
    const response = await axios.get(`${apiBase}/api/v1/news-admin/stats`)
    if (response.data.success) {
      stats.value = response.data.data
    }
  } catch (error) {
    console.error('Error fetching stats:', error)
  }
}

// 编辑文章
function editArticle(article: any) {
  editingArticle.value = article
  articleForm.value = {
    title: article.title,
    titleEn: article.titleEn || '',
    summary: article.summary || '',
    summaryEn: article.summaryEn || '',
    content: article.content,
    contentEn: article.contentEn || '',
    coverImage: article.coverImage || '',
    author: article.author || '',
    sourceUrl: article.sourceUrl || '',
    type: article.type,
    tags: article.tags || [],
  }
  showArticleDialog.value = true
}

// 保存文章
async function saveArticle(status: string) {
  if (!articleForm.value.title || !articleForm.value.content) {
    ElMessage.warning('请填写标题和正文')
    return
  }

  saving.value = true
  try {
    const data = {
      ...articleForm.value,
      status,
      publishedAt: status === 'PUBLISHED' ? new Date() : undefined,
    }

    if (editingArticle.value) {
      await axios.put(`${apiBase}/api/v1/news-admin/articles/${editingArticle.value.id}`, data)
    } else {
      await axios.post(`${apiBase}/api/v1/news-admin/articles`, data)
    }

    ElMessage.success(status === 'PUBLISHED' ? '文章已发布' : '草稿已保存')
    showArticleDialog.value = false
    resetForm()
    await fetchArticles()
    await fetchStats()
  } catch (error) {
    ElMessage.error('保存失败')
  } finally {
    saving.value = false
  }
}

// 切换发布状态
async function togglePublish(article: any) {
  try {
    if (article.status === 'PUBLISHED') {
      await axios.post(`${apiBase}/api/v1/news-admin/articles/${article.id}/unpublish`)
      ElMessage.success('已撤回')
    } else {
      await axios.post(`${apiBase}/api/v1/news-admin/articles/${article.id}/publish`)
      ElMessage.success('已发布')
    }
    await fetchArticles()
    await fetchStats()
  } catch (error) {
    ElMessage.error('操作失败')
  }
}

// 切换置顶
async function toggleTop(article: any) {
  try {
    await axios.post(`${apiBase}/api/v1/news-admin/articles/${article.id}/toggle-top`)
    ElMessage.success(article.isTop ? '已取消置顶' : '已置顶')
    await fetchArticles()
  } catch (error) {
    ElMessage.error('操作失败')
  }
}

// 批量删除
async function batchDelete() {
  await ElMessageBox.confirm(`确定要删除选中的 ${selectedIds.value.length} 篇文章吗？`, '提示', {
    type: 'warning',
  })

  try {
    await axios.post(`${apiBase}/api/v1/news-admin/articles/batch-delete`, {
      ids: selectedIds.value,
    })
    ElMessage.success('删除成功')
    selectedIds.value = []
    await fetchArticles()
    await fetchStats()
  } catch (error) {
    ElMessage.error('删除失败')
  }
}

// 导入微信公众号文章
async function importWechatArticle() {
  if (!importForm.value.url) {
    ElMessage.warning('请输入公众号文章链接')
    return
  }
  
  if (!importForm.value.url.includes('mp.weixin.qq.com')) {
    ElMessage.warning('请输入有效的微信公众号文章链接')
    return
  }
  
  importing.value = true
  try {
    const response = await axios.post(`${apiBase}/api/v1/news-admin/articles/import-wechat`, {
      url: importForm.value.url,
      type: importForm.value.type
    })
    
    if (response.data.success) {
      ElMessage.success(response.data.message || '导入成功')
      showImportDialog.value = false
      importForm.value.url = ''
      await fetchArticles()
      await fetchStats()
    } else {
      ElMessage.error(response.data.message || '导入失败')
    }
  } catch (error: any) {
    ElMessage.error(error.response?.data?.message || '导入失败')
  } finally {
    importing.value = false
  }
}

// 处理选择变化
function handleSelectionChange(rows: any[]) {
  selectedIds.value = rows.map((r) => r.id)
}

// 处理分页
function handlePageChange(page: number) {
  pagination.value.page = page
  fetchArticles()
}

// 重置表单
function resetForm() {
  editingArticle.value = null
  articleForm.value = {
    title: '',
    titleEn: '',
    summary: '',
    summaryEn: '',
    content: '',
    contentEn: '',
    coverImage: '',
    author: '',
    sourceUrl: '',
    type: 'COMPANY',
    tags: [],
  }
}

// 辅助函数
function getSourceType(source: string) {
  switch (source) {
    case 'manual': return 'primary'
    case 'rss': return 'success'
    case 'wechat': return 'warning'
    default: return 'info'
  }
}

function getSourceLabel(source: string) {
  switch (source) {
    case 'manual': return '手动'
    case 'rss': return 'RSS'
    case 'wechat': return '公众号'
    default: return source
  }
}

function getStatusType(status: string) {
  switch (status) {
    case 'PUBLISHED': return 'success'
    case 'DRAFT': return 'warning'
    case 'ARCHIVED': return 'info'
    default: return 'info'
  }
}

function getStatusLabel(status: string) {
  switch (status) {
    case 'PUBLISHED': return '已发布'
    case 'DRAFT': return '草稿'
    case 'ARCHIVED': return '已归档'
    default: return status
  }
}

function formatDate(dateStr: string) {
  if (!dateStr) return '-'
  const date = new Date(dateStr)
  return date.toLocaleDateString('zh-CN')
}

// 监听对话框关闭
watch(showArticleDialog, (val) => {
  if (!val) resetForm()
})

// 初始化
onMounted(async () => {
  await Promise.all([fetchStats(), fetchArticles()])
})
</script>

<style scoped>
.news-management {
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
.stat-icon.purple { background: #f3e8ff; color: #9333ea; }

.stat-value {
  font-size: 28px;
  font-weight: 600;
  color: #1f2937;
}

.stat-label {
  font-size: 14px;
  color: #6b7280;
}

.filter-bar {
  display: flex;
  gap: 12px;
  margin-bottom: 16px;
  padding: 16px;
  background: white;
  border-radius: 12px;
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.1);
}

.article-cell {
  display: flex;
  gap: 12px;
  align-items: center;
}

.cover-thumb {
  width: 60px;
  height: 40px;
  object-fit: cover;
  border-radius: 4px;
}

.article-title {
  font-weight: 500;
  margin-bottom: 4px;
  display: flex;
  align-items: center;
  gap: 6px;
}

.article-meta {
  display: flex;
  gap: 8px;
  font-size: 12px;
  color: #9ca3af;
}

.table-footer {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-top: 16px;
  padding: 12px 16px;
  background: white;
  border-radius: 8px;
}

.batch-actions {
  display: flex;
  align-items: center;
  gap: 12px;
}
</style>
