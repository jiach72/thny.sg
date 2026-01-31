<template>
  <div class="email-templates">
    <h2 class="page-title">邮件模板管理</h2>
    
    <!-- 操作栏 -->
    <el-card class="action-bar">
      <el-row :gutter="16" align="middle">
        <el-col :span="16">
          <el-space>
            <el-button type="primary" @click="openCreateDialog">
              <el-icon><Plus /></el-icon>
              新建模板
            </el-button>
            <el-button @click="seedTemplates" :loading="seedLoading">
              <el-icon><MagicStick /></el-icon>
              初始化默认模板
            </el-button>
            <el-select v-model="categoryFilter" placeholder="筛选分类" clearable style="width: 150px;">
              <el-option value="LEAD" label="线索跟进" />
              <el-option value="CUSTOMER" label="客户服务" />
              <el-option value="GENERAL" label="通用" />
            </el-select>
          </el-space>
        </el-col>
        <el-col :span="8" style="text-align: right;">
          <el-button @click="showLogs = true">
            <el-icon><Document /></el-icon>
            发送记录
          </el-button>
        </el-col>
      </el-row>
    </el-card>

    <!-- 模板列表 -->
    <el-row :gutter="24">
      <el-col :span="24" v-if="loading">
        <el-skeleton :rows="5" animated />
      </el-col>
      
      <el-col 
        v-else 
        :span="8" 
        v-for="template in filteredTemplates" 
        :key="template.id"
        style="margin-bottom: 24px;"
      >
        <el-card class="template-card" shadow="hover">
          <template #header>
            <div class="template-header">
              <div>
                <span class="template-name">{{ template.name }}</span>
                <el-tag size="small" :type="getCategoryType(template.category)" style="margin-left: 8px;">
                  {{ getCategoryLabel(template.category) }}
                </el-tag>
              </div>
              <el-switch 
                :model-value="template.isActive"
                @change="(val: boolean) => toggleActive(template, val)"
                size="small"
              />
            </div>
          </template>
          
          <div class="template-content">
            <p class="template-subject">
              <strong>主题：</strong>{{ template.subject }}
            </p>
            <div class="template-preview" v-html="truncateHtml(template.body, 150)"></div>
            
            <div class="template-vars" v-if="template.variables?.length">
              <span class="vars-label">变量：</span>
              <el-tag 
                v-for="v in template.variables.slice(0, 5)" 
                :key="v" 
                size="small" 
                type="info"
                style="margin-right: 4px;"
              >
                {{ v }}
              </el-tag>
              <span v-if="template.variables.length > 5" class="text-muted">
                +{{ template.variables.length - 5 }}
              </span>
            </div>
          </div>
          
          <div class="template-actions">
            <el-button type="primary" link @click="openEditDialog(template)">编辑</el-button>
            <el-button type="success" link @click="openPreviewDialog(template)">预览</el-button>
            <el-popconfirm 
              title="确定删除该模板吗？" 
              @confirm="deleteTemplateById(template.id)"
            >
              <template #reference>
                <el-button type="danger" link>删除</el-button>
              </template>
            </el-popconfirm>
          </div>
        </el-card>
      </el-col>
      
      <el-col :span="24" v-if="!loading && filteredTemplates.length === 0">
        <el-empty description="暂无模板" />
      </el-col>
    </el-row>

    <!-- 新建/编辑对话框 -->
    <el-dialog 
      v-model="dialogVisible" 
      :title="isEdit ? '编辑模板' : '新建模板'"
      width="800px"
      top="5vh"
    >
      <el-form 
        ref="formRef" 
        :model="form" 
        :rules="formRules" 
        label-width="100px"
      >
        <el-row :gutter="16">
          <el-col :span="16">
            <el-form-item label="模板名称" prop="name">
              <el-input v-model="form.name" placeholder="例如：初次联系邮件" />
            </el-form-item>
          </el-col>
          <el-col :span="8">
            <el-form-item label="分类" prop="category">
              <el-select v-model="form.category" style="width: 100%;">
                <el-option value="LEAD" label="线索跟进" />
                <el-option value="CUSTOMER" label="客户服务" />
                <el-option value="GENERAL" label="通用" />
              </el-select>
            </el-form-item>
          </el-col>
        </el-row>
        <el-form-item label="描述">
          <el-input v-model="form.description" placeholder="模板用途说明（可选）" />
        </el-form-item>
        <el-form-item label="邮件主题" prop="subject">
          <el-input v-model="form.subject" placeholder="支持变量，如 {{name}}" />
        </el-form-item>
        <el-form-item label="邮件正文" prop="body">
          <el-input 
            v-model="form.body" 
            type="textarea" 
            :rows="12" 
            placeholder="支持 HTML 格式和变量，如 {{name}}、{{company}}"
          />
        </el-form-item>
        <el-form-item>
          <div class="form-tip" v-pre>
            <strong>可用变量：</strong>
            <code>{{name}}</code> 联系人姓名，
            <code>{{company}}</code> 公司名，
            <code>{{email}}</code> 邮箱，
            <code>{{phone}}</code> 电话，
            <code>{{lead.字段名}}</code> 线索字段，
            <code>{{customer.字段名}}</code> 客户字段
          </div>
        </el-form-item>
      </el-form>
      <template #footer>
        <el-button @click="dialogVisible = false">取消</el-button>
        <el-button type="primary" @click="submitForm" :loading="submitLoading">
          {{ isEdit ? '保存' : '创建' }}
        </el-button>
      </template>
    </el-dialog>

    <!-- 预览对话框 -->
    <el-dialog v-model="previewVisible" title="模板预览" width="700px">
      <div class="preview-content">
        <div class="preview-subject">
          <strong>主题：</strong>{{ previewData?.subject }}
        </div>
        <el-divider />
        <div class="preview-body" v-html="previewData?.body"></div>
      </div>
    </el-dialog>

    <!-- 发送记录抽屉 -->
    <el-drawer v-model="showLogs" title="发送记录" size="50%">
      <el-table :data="logs" v-loading="logsLoading">
        <el-table-column prop="recipient" label="收件人" width="200" />
        <el-table-column prop="subject" label="主题" />
        <el-table-column prop="status" label="状态" width="100">
          <template #default="{ row }">
            <el-tag :type="getStatusType(row.status)">
              {{ getStatusLabel(row.status) }}
            </el-tag>
          </template>
        </el-table-column>
        <el-table-column prop="createdAt" label="发送时间" width="180">
          <template #default="{ row }">
            {{ formatDate(row.createdAt) }}
          </template>
        </el-table-column>
      </el-table>
      <div style="padding: 16px; text-align: center;">
        <el-pagination
          v-model:current-page="logsPagination.page"
          :page-size="logsPagination.limit"
          :total="logsPagination.total"
          @current-change="loadLogs"
        />
      </div>
    </el-drawer>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted, watch } from 'vue'
import { ElMessage, type FormInstance, type FormRules } from 'element-plus'
import { Plus, MagicStick, Document } from '@element-plus/icons-vue'
import emailTemplateApi, { 
  type EmailTemplate, 
  type EmailLog,
  type CreateTemplateInput, 
  type UpdateTemplateInput 
} from '@/api/emailTemplateApi'

// 状态
const loading = ref(false)
const templates = ref<EmailTemplate[]>([])
const categoryFilter = ref('')

const dialogVisible = ref(false)
const isEdit = ref(false)
const editId = ref('')
const submitLoading = ref(false)
const seedLoading = ref(false)

const previewVisible = ref(false)
const previewData = ref<{ subject: string; body: string } | null>(null)

const showLogs = ref(false)
const logsLoading = ref(false)
const logs = ref<EmailLog[]>([])
const logsPagination = ref({ page: 1, limit: 20, total: 0 })

const formRef = ref<FormInstance>()
const form = ref<CreateTemplateInput>({
  name: '',
  subject: '',
  body: '',
  category: 'GENERAL',
  description: ''
})

const formRules: FormRules = {
  name: [{ required: true, message: '请输入模板名称', trigger: 'blur' }],
  subject: [{ required: true, message: '请输入邮件主题', trigger: 'blur' }],
  body: [{ required: true, message: '请输入邮件正文', trigger: 'blur' }],
  category: [{ required: true, message: '请选择分类', trigger: 'change' }]
}

// 计算属性
const filteredTemplates = computed(() => {
  if (!categoryFilter.value) return templates.value
  return templates.value.filter(t => t.category === categoryFilter.value)
})

// 加载模板列表
async function loadTemplates() {
  loading.value = true
  try {
    templates.value = await emailTemplateApi.getTemplates()
  } catch (err: any) {
    ElMessage.error(err.message || '加载失败')
  } finally {
    loading.value = false
  }
}

// 加载发送记录
async function loadLogs() {
  logsLoading.value = true
  try {
    const result = await emailTemplateApi.getEmailLogs({}, logsPagination.value)
    logs.value = result.data
    logsPagination.value.total = result.pagination.total
  } catch (err: any) {
    ElMessage.error(err.message || '加载失败')
  } finally {
    logsLoading.value = false
  }
}

// 辅助函数
function getCategoryLabel(category: string): string {
  const map: Record<string, string> = {
    LEAD: '线索跟进',
    CUSTOMER: '客户服务',
    GENERAL: '通用'
  }
  return map[category] || category
}

function getCategoryType(category: string): string {
  const map: Record<string, string> = {
    LEAD: 'warning',
    CUSTOMER: 'success',
    GENERAL: 'info'
  }
  return map[category] || 'info'
}

function getStatusLabel(status: string): string {
  const map: Record<string, string> = {
    PENDING: '待发送',
    SENT: '已发送',
    FAILED: '发送失败'
  }
  return map[status] || status
}

function getStatusType(status: string): string {
  const map: Record<string, string> = {
    PENDING: 'warning',
    SENT: 'success',
    FAILED: 'danger'
  }
  return map[status] || 'info'
}

function truncateHtml(html: string, maxLength: number): string {
  const text = html.replace(/<[^>]*>/g, '')
  if (text.length <= maxLength) return html
  return text.substring(0, maxLength) + '...'
}

function formatDate(dateStr: string): string {
  return new Date(dateStr).toLocaleString('zh-CN')
}

// 打开对话框
function openCreateDialog() {
  isEdit.value = false
  editId.value = ''
  form.value = {
    name: '',
    subject: '',
    body: '',
    category: 'GENERAL',
    description: ''
  }
  dialogVisible.value = true
}

function openEditDialog(template: EmailTemplate) {
  isEdit.value = true
  editId.value = template.id
  form.value = {
    name: template.name,
    subject: template.subject,
    body: template.body,
    category: template.category,
    description: template.description || ''
  }
  dialogVisible.value = true
}

function openPreviewDialog(template: EmailTemplate) {
  previewData.value = {
    subject: template.subject,
    body: template.body
  }
  previewVisible.value = true
}

// 提交表单
async function submitForm() {
  await formRef.value?.validate()
  submitLoading.value = true
  
  try {
    if (isEdit.value) {
      await emailTemplateApi.updateTemplate(editId.value, form.value as UpdateTemplateInput)
      ElMessage.success('模板已更新')
    } else {
      await emailTemplateApi.createTemplate(form.value)
      ElMessage.success('模板已创建')
    }
    
    dialogVisible.value = false
    loadTemplates()
  } catch (err: any) {
    ElMessage.error(err.message || '操作失败')
  } finally {
    submitLoading.value = false
  }
}

// 切换启用状态
async function toggleActive(template: EmailTemplate, isActive: boolean) {
  try {
    await emailTemplateApi.updateTemplate(template.id, { isActive })
    template.isActive = isActive
    ElMessage.success(isActive ? '模板已启用' : '模板已禁用')
  } catch (err: any) {
    ElMessage.error(err.message || '操作失败')
  }
}

// 删除模板
async function deleteTemplateById(id: string) {
  try {
    await emailTemplateApi.deleteTemplate(id)
    ElMessage.success('模板已删除')
    loadTemplates()
  } catch (err: any) {
    ElMessage.error(err.message || '删除失败')
  }
}

// 初始化默认模板
async function seedTemplates() {
  seedLoading.value = true
  try {
    await emailTemplateApi.seedDefaultTemplates()
    ElMessage.success('默认模板已初始化')
    loadTemplates()
  } catch (err: any) {
    ElMessage.error(err.message || '初始化失败')
  } finally {
    seedLoading.value = false
  }
}

// 监听抽屉打开
watch(showLogs, (val) => {
  if (val) loadLogs()
})

onMounted(() => {
  loadTemplates()
})
</script>

<style scoped>
.email-templates {
  max-width: 1400px;
}

.page-title {
  font-size: 24px;
  font-weight: 600;
  color: #333;
  margin: 0 0 24px;
}

.action-bar {
  margin-bottom: 24px;
}

.template-card {
  height: 100%;
}

.template-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.template-name {
  font-weight: 600;
  font-size: 16px;
}

.template-content {
  min-height: 150px;
}

.template-subject {
  margin-bottom: 12px;
  color: #666;
}

.template-preview {
  color: #999;
  font-size: 13px;
  line-height: 1.6;
  margin-bottom: 12px;
  max-height: 80px;
  overflow: hidden;
}

.template-vars {
  margin-top: 8px;
}

.vars-label {
  font-size: 12px;
  color: #666;
  margin-right: 8px;
}

.template-actions {
  margin-top: 16px;
  padding-top: 12px;
  border-top: 1px solid #eee;
}

.text-muted {
  color: #999;
  font-size: 12px;
}

.form-tip {
  font-size: 12px;
  color: #999;
  line-height: 1.8;
}

.form-tip code {
  background: #f5f5f5;
  padding: 2px 6px;
  border-radius: 4px;
  margin: 0 4px;
}

.preview-content {
  padding: 16px;
}

.preview-subject {
  font-size: 16px;
  margin-bottom: 16px;
}

.preview-body {
  line-height: 1.8;
}
</style>
