<template>
  <div class="rss-management">
    <!-- 页面头部 -->
    <div class="page-header">
      <div class="header-left">
        <el-button text @click="$router.push('/settings/news')">
          <el-icon><ArrowLeft /></el-icon>
          返回新闻管理
        </el-button>
        <h1>RSS 订阅源管理</h1>
      </div>
      <div class="header-right">
        <el-button type="success" @click="fetchAllFeeds" :loading="fetching">
          <el-icon><Refresh /></el-icon>
          抓取全部
        </el-button>
        <el-button type="primary" @click="showFeedDialog = true">
          <el-icon><Plus /></el-icon>
          添加订阅源
        </el-button>
      </div>
    </div>

    <!-- 统计卡片 -->
    <el-row :gutter="16" class="stats-row">
      <el-col :span="8">
        <div class="stat-card">
          <div class="stat-icon blue"><el-icon><Connection /></el-icon></div>
          <div class="stat-content">
            <div class="stat-value">{{ stats.totalFeeds }}</div>
            <div class="stat-label">订阅源总数</div>
          </div>
        </div>
      </el-col>
      <el-col :span="8">
        <div class="stat-card">
          <div class="stat-icon green"><el-icon><CircleCheck /></el-icon></div>
          <div class="stat-content">
            <div class="stat-value">{{ stats.activeFeeds }}</div>
            <div class="stat-label">活跃订阅</div>
          </div>
        </div>
      </el-col>
      <el-col :span="8">
        <div class="stat-card">
          <div class="stat-icon orange"><el-icon><Document /></el-icon></div>
          <div class="stat-content">
            <div class="stat-value">{{ totalArticles }}</div>
            <div class="stat-label">已抓取文章</div>
          </div>
        </div>
      </el-col>
    </el-row>

    <!-- 订阅源列表 -->
    <el-table :data="feeds" stripe v-loading="loading">
      <el-table-column prop="name" label="名称" width="200" />
      <el-table-column label="URL" min-width="300">
        <template #default="{ row }">
          <el-link :href="row.url" target="_blank" type="info">{{ row.url }}</el-link>
        </template>
      </el-table-column>
      <el-table-column label="分类" width="120">
        <template #default="{ row }">
          <el-tag>{{ row.category }}</el-tag>
        </template>
      </el-table-column>
      <el-table-column label="文章数" width="80" align="center">
        <template #default="{ row }">{{ row._count?.articles || 0 }}</template>
      </el-table-column>
      <el-table-column label="状态" width="100">
        <template #default="{ row }">
          <el-tag :type="row.isActive ? 'success' : 'info'" size="small">
            {{ row.isActive ? '启用' : '禁用' }}
          </el-tag>
        </template>
      </el-table-column>
      <el-table-column label="最后抓取" width="160">
        <template #default="{ row }">
          <div v-if="row.lastFetchAt">{{ formatDateTime(row.lastFetchAt) }}</div>
          <div v-else class="text-muted">未抓取</div>
          <div v-if="row.lastError" class="text-error">{{ row.lastError }}</div>
        </template>
      </el-table-column>
      <el-table-column label="操作" width="200" align="center">
        <template #default="{ row }">
          <el-button link type="primary" @click="fetchSingleFeed(row)" :loading="row.fetching">
            抓取
          </el-button>
          <el-button link type="primary" @click="editFeed(row)">编辑</el-button>
          <el-button link :type="row.isActive ? 'warning' : 'success'" @click="toggleFeedStatus(row)">
            {{ row.isActive ? '禁用' : '启用' }}
          </el-button>
          <el-button link type="danger" v-permission="['settings:manage']" @click="deleteFeed(row)">删除</el-button>
        </template>
      </el-table-column>
    </el-table>

    <!-- 添加/编辑对话框 -->
    <el-dialog 
      v-model="showFeedDialog" 
      :title="editingFeed ? '编辑订阅源' : '添加订阅源'"
      width="550px"
    >
      <el-form :model="feedForm" label-width="100px">
        <el-form-item label="名称" required>
          <el-input v-model="feedForm.name" placeholder="如：36氪科技" />
        </el-form-item>
        <el-form-item label="RSS URL" required>
          <el-input v-model="feedForm.url" placeholder="https://example.com/rss">
            <template #append>
              <el-button @click="testFeed" :loading="testing">测试</el-button>
            </template>
          </el-input>
        </el-form-item>
        <el-form-item label="分类" required>
          <el-select v-model="feedForm.category" style="width: 100%">
            <el-option label="行业动态" value="industry" />
            <el-option label="政策法规" value="policy" />
            <el-option label="金融财经" value="finance" />
            <el-option label="移民签证" value="immigration" />
            <el-option label="科技创新" value="tech" />
            <el-option label="其他" value="other" />
          </el-select>
        </el-form-item>
        <el-form-item label="语言">
          <el-select v-model="feedForm.language" style="width: 100%">
            <el-option label="中文" value="zh" />
            <el-option label="英文" value="en" />
          </el-select>
        </el-form-item>
        <el-form-item label="抓取间隔">
          <el-input-number v-model="feedForm.fetchInterval" :min="15" :max="1440" />
          <span style="margin-left: 8px">分钟</span>
        </el-form-item>
      </el-form>

      <!-- 测试结果 -->
      <el-alert
        v-if="testResult"
        :type="testResult.valid ? 'success' : 'error'"
        :title="testResult.valid ? `测试成功：${testResult.title}，共 ${testResult.itemCount} 条` : testResult.error"
        :closable="false"
        style="margin-top: 16px"
      />

      <template #footer>
        <el-button @click="showFeedDialog = false">取消</el-button>
        <el-button type="primary" @click="saveFeed" :loading="saving">保存</el-button>
      </template>
    </el-dialog>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted, watch } from 'vue'
import { ElMessage, ElMessageBox } from 'element-plus'
import { 
  Plus, ArrowLeft, Refresh, Connection, CircleCheck, Document
} from '@element-plus/icons-vue'
import apiClient from '@/api/apiClient'

// RSS 订阅源接口
interface RssFeed {
  id: string
  name: string
  url: string
  category: string
  language: string
  fetchInterval: number
  isActive: boolean
  lastFetchAt?: string
  _count?: { articles: number }
  fetching?: boolean
}

interface RssTestResult {
  valid?: boolean
  error?: string
  title?: string
  itemCount?: number
  sampleItems?: Array<{ title: string; link: string }>
}
// 状态
const loading = ref(false)
const saving = ref(false)
const testing = ref(false)
const fetching = ref(false)
const feeds = ref<RssFeed[]>([])

// 统计
const stats = ref({
  totalFeeds: 0,
  activeFeeds: 0,
})

const totalArticles = computed(() => {
  return feeds.value.reduce((sum, feed) => sum + (feed._count?.articles || 0), 0)
})

// 表单
const showFeedDialog = ref(false)
const editingFeed = ref<RssFeed | null>(null)
const feedForm = ref({
  name: '',
  url: '',
  category: 'industry',
  language: 'zh',
  fetchInterval: 60,
})
const testResult = ref<RssTestResult | null>(null)

// 获取订阅源列表
async function fetchFeeds() {
  loading.value = true
  try {
    const data = await apiClient.get('/news-admin/feeds') as RssFeed[] | { data: RssFeed[] }
    // 兼容 { success, data: [...] } 和直接数组两种返回格式
    const feedList = Array.isArray(data) ? data : (data as any)?.data || []
    feeds.value = feedList.map((f: RssFeed) => ({ ...f, fetching: false }))
    stats.value.totalFeeds = feeds.value.length
    stats.value.activeFeeds = feeds.value.filter((f) => f.isActive).length
  } catch (error) {
    console.error('Error fetching feeds:', error)
  } finally {
    loading.value = false
  }
}

// 测试订阅源
async function testFeed() {
  if (!feedForm.value.url) {
    ElMessage.warning('请输入 RSS URL')
    return
  }

  testing.value = true
  testResult.value = null
  try {
    const resp = await apiClient.post('/news-admin/feeds/test', {
      url: feedForm.value.url,
    }) as any
    // 兼容 { success, data: { valid, ... } } 格式
    testResult.value = (resp?.data || resp) as RssTestResult
  } catch (error) {
    testResult.value = { valid: false, error: '测试失败' }
  } finally {
    testing.value = false
  }
}

// 保存订阅源
async function saveFeed() {
  if (!feedForm.value.name || !feedForm.value.url) {
    ElMessage.warning('请填写名称和 URL')
    return
  }

  saving.value = true
  try {
    if (editingFeed.value) {
      await apiClient.put(`/news-admin/feeds/${editingFeed.value.id}`, feedForm.value)
    } else {
      await apiClient.post('/news-admin/feeds', feedForm.value)
    }
    ElMessage.success('保存成功')
    showFeedDialog.value = false
    resetForm()
    await fetchFeeds()
  } catch (error: unknown) {
    const err = error as { response?: { data?: { message?: string } }; message?: string }
    if (err.response?.data?.message) {
      ElMessage.error(err.response.data.message)
    } else {
      ElMessage.error('保存失败')
    }
  } finally {
    saving.value = false
  }
}

// 编辑订阅源
function editFeed(feed: RssFeed) {
  editingFeed.value = feed
  feedForm.value = {
    name: feed.name,
    url: feed.url,
    category: feed.category,
    language: feed.language || 'zh',
    fetchInterval: feed.fetchInterval || 60,
  }
  showFeedDialog.value = true
}

// 切换状态
async function toggleFeedStatus(feed: RssFeed) {
  try {
    await apiClient.put(`/news-admin/feeds/${feed.id}`, {
      isActive: !feed.isActive,
    })
    ElMessage.success(feed.isActive ? '已禁用' : '已启用')
    await fetchFeeds()
  } catch (error) {
    ElMessage.error('操作失败')
  }
}

// 删除订阅源
async function deleteFeed(feed: RssFeed) {
  await ElMessageBox.confirm(`确定要删除订阅源"${feed.name}"吗？`, '提示', { type: 'warning' })
  try {
    await apiClient.delete(`/news-admin/feeds/${feed.id}`)
    ElMessage.success('删除成功')
    await fetchFeeds()
  } catch (error) {
    ElMessage.error('删除失败')
  }
}

// 抓取单个订阅源
async function fetchSingleFeed(feed: RssFeed) {
  feed.fetching = true
  try {
    await apiClient.post(`/news-admin/feeds/${feed.id}/fetch`)
    ElMessage.success('抓取完成')
    await fetchFeeds()
  } catch (error: unknown) {
    ElMessage.error((error as Error)?.message || '抓取失败')
  } finally {
    feed.fetching = false
  }
}

// 抓取全部
async function fetchAllFeeds() {
  fetching.value = true
  try {
    await apiClient.post('/news-admin/feeds/fetch-all')
    ElMessage.success('全部抓取完成')
    await fetchFeeds()
  } catch (error: unknown) {
    ElMessage.error((error as Error)?.message || '抓取失败')
  } finally {
    fetching.value = false
  }
}

// 重置表单
function resetForm() {
  editingFeed.value = null
  feedForm.value = {
    name: '',
    url: '',
    category: 'industry',
    language: 'zh',
    fetchInterval: 60,
  }
  testResult.value = null
}

// 格式化时间
function formatDateTime(dateStr: string) {
  const date = new Date(dateStr)
  return date.toLocaleString('zh-CN', {
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
  })
}

// 监听对话框关闭
watch(showFeedDialog, (val) => {
  if (!val) resetForm()
})

// 初始化
onMounted(fetchFeeds)
</script>

<style scoped>
.rss-management {
  padding: 20px;
}

.page-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 24px;
}

.header-left {
  display: flex;
  align-items: center;
  gap: 16px;
}

.page-header h1 {
  margin: 0;
  font-size: 24px;
  color: var(--color-text);
}

.header-right {
  display: flex;
  gap: 12px;
}

.stats-row {
  margin-bottom: 24px;
}

.stat-card {
  background: var(--color-surface);
  border: 1px solid var(--color-border);
  border-radius: 12px;
  padding: 20px;
  display: flex;
  align-items: center;
  gap: 16px;
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

.stat-value {
  font-size: 28px;
  font-weight: 600;
  color: var(--color-text);
}

.stat-label {
  font-size: 14px;
  color: var(--color-text-muted);
}

.text-muted {
  color: var(--color-text-muted);
  font-size: 12px;
}

.text-error {
  color: #ef4444;
  font-size: 12px;
}
</style>
