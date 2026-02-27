<template>
  <div class="customer-detail" v-loading="loading">
    <!-- 返回按钮 -->
    <el-button text :icon="ArrowLeft" @click="$router.push('/customers')" style="margin-bottom: 16px">返回客户列表</el-button>

    <!-- Hero 区域 -->
    <div class="hero-card" v-if="customer">
      <div class="hero-left">
        <el-avatar :size="72" class="hero-avatar">{{ displayName?.[0] || 'C' }}</el-avatar>
        <div class="hero-info">
          <h2 class="hero-name">{{ displayName }}</h2>
          <p class="hero-company">{{ customer.companyName || customer.lead?.companyName || '—' }}</p>
          <div class="hero-tags">
            <el-tag :type="kycTagType(customer.kycStatus)" size="small" effect="dark">KYC: {{ kycLabel(customer.kycStatus) }}</el-tag>
            <el-tag :type="riskTagType(customer.riskGrade)" size="small">风险: {{ riskLabel(customer.riskGrade) }}</el-tag>
            <el-tag v-for="tag in (customer.lead?.tags || [])" :key="tag" size="small" type="info">{{ tag }}</el-tag>
          </div>
        </div>
      </div>
      <div class="hero-contact">
        <div v-if="customer.phone || customer.lead?.phone" class="contact-item">📞 {{ customer.phone || customer.lead?.phone }}</div>
        <div v-if="customer.email || customer.lead?.email" class="contact-item">✉️ {{ customer.email || customer.lead?.email }}</div>
        <div class="hero-actions">
          <el-button type="primary" size="small" :icon="ChatDotRound">发消息</el-button>
          <el-button size="small" :icon="Calendar">预约</el-button>
          <el-button size="small" :icon="Briefcase">创建项目</el-button>
        </div>
      </div>
    </div>

    <!-- 9 Tab 详情 -->
    <el-tabs v-model="activeTab" class="detail-tabs" v-if="customer">
      <!-- Tab 1: 概览 -->
      <el-tab-pane label="概览" name="overview">
        <div class="overview-grid">
          <div class="kpi-row">
            <div class="kpi-card"><div class="kpi-value">{{ customer.projects?.length || 0 }}</div><div class="kpi-label">总项目数</div></div>
            <div class="kpi-card"><div class="kpi-value">{{ activeProjects }}</div><div class="kpi-label">进行中</div></div>
            <div class="kpi-card"><div class="kpi-value">¥{{ totalInvoiceAmount.toLocaleString() }}</div><div class="kpi-label">总发票金额</div></div>
            <div class="kpi-card"><div class="kpi-value">¥{{ totalPaidAmount.toLocaleString() }}</div><div class="kpi-label">已收款</div></div>
          </div>

          <!-- 客户旅程 -->
          <el-card shadow="never" class="section-card">
            <template #header><h3>客户旅程</h3></template>
            <div class="journey-steps">
              <div v-for="(step, i) in journeySteps" :key="i" class="journey-step" :class="{ active: step.active, completed: step.completed }">
                <div class="journey-dot"></div>
                <span>{{ step.label }}</span>
              </div>
            </div>
          </el-card>

          <!-- 最近活动 + 专属顾问 -->
          <div class="overview-bottom">
            <el-card shadow="never" class="section-card flex-2">
              <template #header><h3>最近活动</h3></template>
              <div v-if="customer.lead?.activities?.length" class="recent-activities">
                <div v-for="act in customer.lead.activities" :key="act.id" class="activity-item">
                  <el-tag size="small" type="info">{{ act.actionType }}</el-tag>
                  <span>{{ act.description || act.actionType }}</span>
                  <span class="activity-time">{{ formatRelative(act.createdAt) }}</span>
                </div>
              </div>
              <el-empty v-else description="暂无活动记录" :image-size="60" />
            </el-card>
            <el-card shadow="never" class="section-card" v-if="customer.lead?.assignedTo">
              <template #header><h3>专属顾问</h3></template>
              <div class="advisor-card">
                <el-avatar :size="56">{{ customer.lead.assignedTo.name?.[0] }}</el-avatar>
                <div>
                  <div class="advisor-name">{{ customer.lead.assignedTo.name }}</div>
                  <div class="advisor-dept">{{ customer.lead.assignedTo.department || '顾问团队' }}</div>
                  <div class="advisor-email">{{ customer.lead.assignedTo.email }}</div>
                </div>
              </div>
            </el-card>
          </div>
        </div>
      </el-tab-pane>

      <!-- Tab 2: 客户画像 -->
      <el-tab-pane label="客户画像" name="profile">
        <el-card shadow="never">
          <template #header>
            <div class="section-header"><h3>客户画像信息</h3><el-button type="primary" size="small" @click="saveProfile" :loading="saving">保存修改</el-button></div>
          </template>
          <el-form :model="profileForm" label-width="120px" class="profile-form">
            <el-divider content-position="left">基本信息</el-divider>
            <el-row :gutter="24">
              <el-col :span="12"><el-form-item label="姓名"><el-input v-model="profileForm.contactName" /></el-form-item></el-col>
              <el-col :span="12"><el-form-item label="公司"><el-input v-model="profileForm.companyName" /></el-form-item></el-col>
            </el-row>
            <el-row :gutter="24">
              <el-col :span="12"><el-form-item label="生日"><el-date-picker v-model="profileForm.birthday" type="date" style="width: 100%" /></el-form-item></el-col>
              <el-col :span="12"><el-form-item label="年龄"><el-input :model-value="calcAge(profileForm.birthday)" disabled /></el-form-item></el-col>
            </el-row>
            <el-row :gutter="24">
              <el-col :span="12"><el-form-item label="职业"><el-input v-model="profileForm.occupation" /></el-form-item></el-col>
              <el-col :span="12"><el-form-item label="邮箱"><el-input v-model="profileForm.email" /></el-form-item></el-col>
            </el-row>
            <el-row :gutter="24">
              <el-col :span="12"><el-form-item label="电话"><el-input v-model="profileForm.phone" /></el-form-item></el-col>
            </el-row>

            <el-divider content-position="left">兴趣与偏好</el-divider>
            <el-form-item label="兴趣爱好">
              <div class="tag-editor">
                <el-tag v-for="tag in profileForm.interests" :key="tag" closable @close="removeInterest(tag)">{{ tag }}</el-tag>
                <el-input v-if="showInterestInput" ref="interestInputRef" v-model="newInterest" size="small" style="width: 120px" @keyup.enter="addInterest" @blur="addInterest" />
                <el-button v-else size="small" @click="showInterestInput = true">+ 添加</el-button>
              </div>
            </el-form-item>

            <el-divider content-position="left">顾问备注</el-divider>
            <el-form-item label="备注">
              <el-input v-model="profileForm.profileNotes" type="textarea" :rows="4" placeholder="添加顾问备注..." />
            </el-form-item>
          </el-form>
        </el-card>
      </el-tab-pane>

      <!-- Tab 3: KYC 合规 -->
      <el-tab-pane label="KYC 合规" name="kyc">
        <el-card shadow="never">
          <template #header>
            <div class="section-header"><h3>KYC 状态管理</h3></div>
          </template>
          <el-form label-width="120px">
            <el-row :gutter="24">
              <el-col :span="12">
                <el-form-item label="KYC 状态">
                  <el-select v-model="kycForm.kycStatus" style="width: 100%">
                    <el-option label="待审核" value="PENDING" />
                    <el-option label="已通过" value="APPROVED" />
                    <el-option label="已拒绝" value="REJECTED" />
                    <el-option label="复审中" value="REVIEW" />
                  </el-select>
                </el-form-item>
              </el-col>
              <el-col :span="12">
                <el-form-item label="风险等级">
                  <el-select v-model="kycForm.riskGrade" style="width: 100%">
                    <el-option label="低风险" value="LOW" />
                    <el-option label="中风险" value="MEDIUM" />
                    <el-option label="高风险" value="HIGH" />
                    <el-option label="极高" value="CRITICAL" />
                  </el-select>
                </el-form-item>
              </el-col>
            </el-row>
            <el-form-item>
              <el-button type="primary" @click="saveKyc" :loading="saving">保存 KYC</el-button>
            </el-form-item>
          </el-form>
        </el-card>

        <el-card shadow="never" style="margin-top: 16px">
          <template #header><h3>KYC 文档核查清单</h3></template>
          <div class="kyc-checklist">
            <el-checkbox v-for="item in kycChecklist" :key="item.key" v-model="item.checked">{{ item.label }}</el-checkbox>
          </div>
        </el-card>
      </el-tab-pane>

      <!-- Tab 4: 家庭成员 -->
      <el-tab-pane label="家庭成员" name="family">
        <el-card shadow="never">
          <template #header>
            <div class="section-header"><h3>家庭成员</h3><el-button type="primary" size="small" @click="showFamilyDialog = true">+ 添加成员</el-button></div>
          </template>
          <el-table :data="familyMembers" stripe v-if="familyMembers.length">
            <el-table-column label="姓名" prop="name" />
            <el-table-column label="关系" prop="relationship" />
            <el-table-column label="年龄" prop="age" width="80" />
            <el-table-column label="受益人" width="80" align="center">
              <template #default="{ row }"><el-tag v-if="row.beneficiary" type="success" size="small">✓</el-tag></template>
            </el-table-column>
            <el-table-column label="服务需求" prop="serviceNeeds" />
            <el-table-column label="操作" width="120">
              <template #default="{ $index }">
                <el-button text size="small" type="danger" v-permission="['customers:update']" @click="removeFamilyMember($index)">删除</el-button>
              </template>
            </el-table-column>
          </el-table>
          <el-empty v-else description="暂无家庭成员信息" />
        </el-card>

        <!-- 添加家庭成员 Dialog -->
        <el-dialog v-model="showFamilyDialog" title="添加家庭成员" width="500">
          <el-form :model="newMember" label-width="80px">
            <el-form-item label="姓名"><el-input v-model="newMember.name" /></el-form-item>
            <el-form-item label="关系">
              <el-select v-model="newMember.relationship" style="width: 100%">
                <el-option label="配偶" value="配偶" /><el-option label="子女" value="子女" />
                <el-option label="父母" value="父母" /><el-option label="兄弟姐妹" value="兄弟姐妹" />
                <el-option label="其他" value="其他" />
              </el-select>
            </el-form-item>
            <el-form-item label="年龄"><el-input-number v-model="newMember.age" :min="0" :max="120" /></el-form-item>
            <el-form-item label="受益人"><el-switch v-model="newMember.beneficiary" /></el-form-item>
            <el-form-item label="服务需求"><el-input v-model="newMember.serviceNeeds" /></el-form-item>
          </el-form>
          <template #footer><el-button @click="showFamilyDialog = false">取消</el-button><el-button type="primary" @click="addFamilyMember">确认</el-button></template>
        </el-dialog>
      </el-tab-pane>

      <!-- Tab 5: 项目 & 服务 -->
      <el-tab-pane label="项目服务" name="projects">
        <div class="projects-grid" v-if="customer.projects?.length">
          <el-card v-for="proj in customer.projects" :key="proj.id" shadow="hover" class="project-card" @click="$router.push(`/projects/${proj.id}`)">
            <div class="project-header">
              <span class="project-title">{{ proj.title || proj.id }}</span>
              <el-tag :type="proj.status === 'ACTIVE' ? 'success' : 'info'" size="small">{{ proj.status === 'ACTIVE' ? '进行中' : proj.status === 'COMPLETED' ? '已完成' : proj.status }}</el-tag>
            </div>
            <div class="project-meta">
              <span>任务：{{ proj.tasks?.length || 0 }} 个</span>
              <span>发票：{{ proj.invoices?.length || 0 }} 张</span>
              <span>文档：{{ proj.documents?.length || 0 }} 份</span>
            </div>
            <el-progress :percentage="calcProjectProgress(proj)" :stroke-width="6" />
          </el-card>
        </div>
        <el-empty v-else description="暂无关联项目" />
      </el-tab-pane>

      <!-- Tab 6: 财务记录 -->
      <el-tab-pane label="财务记录" name="finance">
        <div class="kpi-row" style="margin-bottom: 20px">
          <div class="kpi-card"><div class="kpi-value">¥{{ totalInvoiceAmount.toLocaleString() }}</div><div class="kpi-label">总金额</div></div>
          <div class="kpi-card"><div class="kpi-value" style="color: #10b981">¥{{ totalPaidAmount.toLocaleString() }}</div><div class="kpi-label">已收款</div></div>
          <div class="kpi-card"><div class="kpi-value" style="color: #f59e0b">¥{{ (totalInvoiceAmount - totalPaidAmount).toLocaleString() }}</div><div class="kpi-label">待收款</div></div>
          <div class="kpi-card"><div class="kpi-value" style="color: #ef4444">{{ overdueInvoices }}</div><div class="kpi-label">逾期发票</div></div>
        </div>
        <el-card shadow="never">
          <el-table :data="allInvoices" stripe>
            <el-table-column label="发票编号" prop="id" width="220" />
            <el-table-column label="金额" width="120"><template #default="{ row }">¥{{ row.totalAmount?.toLocaleString() }}</template></el-table-column>
            <el-table-column label="已付" width="120"><template #default="{ row }">¥{{ row.paidAmount?.toLocaleString() }}</template></el-table-column>
            <el-table-column label="状态" width="100"><template #default="{ row }"><el-tag :type="row.status === 'PAID' ? 'success' : row.status === 'OVERDUE' ? 'danger' : 'warning'" size="small">{{ row.status }}</el-tag></template></el-table-column>
            <el-table-column label="到期日" width="120"><template #default="{ row }">{{ row.dueDate ? formatDate(row.dueDate) : '—' }}</template></el-table-column>
          </el-table>
        </el-card>
      </el-tab-pane>

      <!-- Tab 7: 互动时间线 -->
      <el-tab-pane label="互动时间线" name="timeline">
        <el-card shadow="never">
          <template #header>
            <div class="section-header"><h3>全部互动记录</h3><el-button size="small" @click="fetchTimeline">刷新</el-button></div>
          </template>
          <el-timeline v-if="timeline.length">
            <el-timeline-item v-for="item in timeline" :key="item.id" :timestamp="formatRelative(item.date)" placement="top"
              :type="item.type === 'appointment' ? 'primary' : 'info'" :hollow="item.type !== 'appointment'">
              <div class="timeline-content">
                <el-tag size="small" :type="item.type === 'appointment' ? 'primary' : 'info'">{{ item.type === 'appointment' ? '预约' : '活动' }}</el-tag>
                <span class="timeline-title">{{ item.title }}</span>
                <span class="timeline-actor">— {{ item.actor }}</span>
              </div>
            </el-timeline-item>
          </el-timeline>
          <el-empty v-else description="暂无互动记录" />
        </el-card>
      </el-tab-pane>

      <!-- Tab 8: 文档 -->
      <el-tab-pane label="文档" name="documents">
        <el-card shadow="never">
          <template #header><h3>关联文档</h3></template>
          <div v-if="allDocuments.length">
            <el-table :data="allDocuments" stripe>
              <el-table-column label="文件名" prop="fileName" />
              <el-table-column label="类型" prop="fileType" width="100" />
              <el-table-column label="大小" width="100"><template #default="{ row }">{{ (row.fileSize / 1024).toFixed(1) }} KB</template></el-table-column>
              <el-table-column label="权限" width="100"><template #default="{ row }"><el-tag size="small">{{ row.accessLevel }}</el-tag></template></el-table-column>
              <el-table-column label="上传时间" width="160"><template #default="{ row }">{{ formatDate(row.createdAt) }}</template></el-table-column>
            </el-table>
          </div>
          <el-empty v-else description="暂无关联文档" />
        </el-card>
      </el-tab-pane>

      <!-- Tab 9: 顾问备注 -->
      <el-tab-pane label="顾问备注" name="notes">
        <el-card shadow="never">
          <template #header>
            <div class="section-header"><h3>顾问备注</h3><el-button type="primary" size="small" @click="saveNotes" :loading="saving">保存</el-button></div>
          </template>
          <el-input v-model="notesContent" type="textarea" :rows="12" placeholder="记录客户跟进信息、重要事项、服务偏好等..." />
        </el-card>
      </el-tab-pane>
    </el-tabs>
  </div>
</template>

<script setup lang="ts">
import { ref, reactive, computed, onMounted } from 'vue'
import { useRoute } from 'vue-router'
import { ElMessage } from 'element-plus'
import { apiClient } from '@/api'
import { ArrowLeft, ChatDotRound, Calendar, Briefcase } from '@element-plus/icons-vue'

const route = useRoute()
const customerId = computed(() => route.params.id as string)

const loading = ref(false)
const saving = ref(false)
const activeTab = ref('overview')
const customer = ref<any>(null)
const timeline = ref<any[]>([])

// 画像表单
const profileForm = reactive<any>({
  contactName: '', companyName: '', email: '', phone: '',
  birthday: null, occupation: '', interests: [] as string[], profileNotes: '',
})

// KYC
const kycForm = reactive({ kycStatus: 'PENDING', riskGrade: 'LOW' })
const kycChecklist = ref([
  { key: 'passport', label: '护照/身份证', checked: false },
  { key: 'address', label: '地址证明', checked: false },
  { key: 'income', label: '收入证明', checked: false },
  { key: 'bank', label: '银行对账单', checked: false },
  { key: 'tax', label: '税务文件', checked: false },
  { key: 'company', label: '公司注册文件', checked: false },
])

// 家庭成员
const familyMembers = ref<any[]>([])
const showFamilyDialog = ref(false)
const newMember = reactive({ name: '', relationship: '', age: 0, beneficiary: false, serviceNeeds: '' })

// 兴趣标签
const showInterestInput = ref(false)
const newInterest = ref('')


// 备注
const notesContent = ref('')

// 计算属性
const displayName = computed(() => customer.value?.contactName || customer.value?.lead?.contactName || '未命名')
const activeProjects = computed(() => customer.value?.projects?.filter((p: any) => p.status === 'ACTIVE').length || 0)

const allInvoices = computed(() => {
  if (!customer.value?.projects) return []
  return customer.value.projects.flatMap((p: any) => p.invoices || [])
})
const totalInvoiceAmount = computed(() => allInvoices.value.reduce((s: number, i: any) => s + (Number(i.totalAmount) || 0), 0))
const totalPaidAmount = computed(() => allInvoices.value.reduce((s: number, i: any) => s + (Number(i.paidAmount) || 0), 0))
const overdueInvoices = computed(() => allInvoices.value.filter((i: any) => i.status === 'OVERDUE').length)

const allDocuments = computed(() => {
  if (!customer.value?.projects) return []
  return customer.value.projects.flatMap((p: any) => p.documents || [])
})

const journeySteps = computed(() => {
  const kyc = customer.value?.kycStatus
  const hasProjects = (customer.value?.projects?.length || 0) > 0
  const hasActive = activeProjects.value > 0
  return [
    { label: '线索获取', completed: true, active: false },
    { label: '初步联系', completed: true, active: false },
    { label: 'KYC 认证', completed: kyc === 'APPROVED', active: kyc === 'PENDING' || kyc === 'REVIEW' },
    { label: '签约合作', completed: hasProjects, active: kyc === 'APPROVED' && !hasProjects },
    { label: '服务进行', completed: false, active: hasActive },
  ]
})

onMounted(async () => {
  await fetchDetail()
  fetchTimeline()
})

async function fetchDetail() {
  loading.value = true
  try {
    const res = await apiClient.get(`/customers/${customerId.value}`) as any
    customer.value = res
    // 填充表单
    profileForm.contactName = customer.value.contactName || customer.value.lead?.contactName || ''
    profileForm.companyName = customer.value.companyName || customer.value.lead?.companyName || ''
    profileForm.email = customer.value.email || customer.value.lead?.email || ''
    profileForm.phone = customer.value.phone || customer.value.lead?.phone || ''
    profileForm.birthday = customer.value.birthday || null
    profileForm.occupation = customer.value.occupation || ''
    profileForm.interests = customer.value.interests || []
    profileForm.profileNotes = customer.value.profileNotes || ''

    kycForm.kycStatus = customer.value.kycStatus || 'PENDING'
    kycForm.riskGrade = customer.value.riskGrade || 'LOW'

    familyMembers.value = Array.isArray(customer.value.familyMembers) ? customer.value.familyMembers : []
    notesContent.value = customer.value.profileNotes || ''
  } catch (e) {
    console.error('加载客户详情失败', e)
  } finally {
    loading.value = false
  }
}

async function fetchTimeline() {
  try {
    const res = await apiClient.get(`/customers/${customerId.value}/timeline`) as any
    timeline.value = Array.isArray(res) ? res : []
  } catch (e) {
    console.error('加载时间线失败', e)
    timeline.value = []
  }
}

async function saveProfile() {
  saving.value = true
  try {
    await apiClient.put(`/customers/${customerId.value}`, {
      contactName: profileForm.contactName,
      companyName: profileForm.companyName,
      email: profileForm.email,
      phone: profileForm.phone,
      birthday: profileForm.birthday,
      occupation: profileForm.occupation,
      interests: profileForm.interests,
      profileNotes: profileForm.profileNotes,
    })
    ElMessage.success('画像信息已保存')
    await fetchDetail()
  } catch (e) {
    ElMessage.error('保存失败')
  } finally {
    saving.value = false
  }
}

async function saveKyc() {
  saving.value = true
  try {
    await apiClient.put(`/customers/${customerId.value}/kyc`, kycForm)
    ElMessage.success('KYC 状态已更新')
    await fetchDetail()
  } catch (e) {
    ElMessage.error('更新失败')
  } finally {
    saving.value = false
  }
}

async function saveNotes() {
  saving.value = true
  try {
    await apiClient.put(`/customers/${customerId.value}/notes`, { profileNotes: notesContent.value })
    ElMessage.success('备注已保存')
  } catch (e) {
    ElMessage.error('保存失败')
  } finally {
    saving.value = false
  }
}

async function saveFamilyMembers() {
  try {
    await apiClient.put(`/customers/${customerId.value}/family`, { familyMembers: familyMembers.value })
    ElMessage.success('家庭成员已更新')
  } catch (e) {
    ElMessage.error('更新失败')
  }
}

function addFamilyMember() {
  familyMembers.value.push({ ...newMember })
  showFamilyDialog.value = false
  Object.assign(newMember, { name: '', relationship: '', age: 0, beneficiary: false, serviceNeeds: '' })
  saveFamilyMembers()
}

function removeFamilyMember(index: number) {
  familyMembers.value.splice(index, 1)
  saveFamilyMembers()
}

function addInterest() {
  if (newInterest.value.trim()) {
    profileForm.interests.push(newInterest.value.trim())
    newInterest.value = ''
  }
  showInterestInput.value = false
}

function removeInterest(tag: string) {
  profileForm.interests = profileForm.interests.filter((t: string) => t !== tag)
}

function calcAge(birthday: string | Date | null): string {
  if (!birthday) return '—'
  const diff = Date.now() - new Date(birthday).getTime()
  return String(Math.floor(diff / (365.25 * 24 * 60 * 60 * 1000)))
}

function calcProjectProgress(proj: any): number {
  const tasks = proj.tasks || []
  if (!tasks.length) return 0
  const done = tasks.filter((t: any) => t.status === 'DONE').length
  return Math.round((done / tasks.length) * 100)
}

function formatDate(d: string) { return new Date(d).toLocaleDateString('zh-CN') }
function formatRelative(d: string) {
  const ms = Date.now() - new Date(d).getTime()
  const min = Math.floor(ms / 60000)
  if (min < 60) return `${min} 分钟前`
  const hr = Math.floor(min / 60)
  if (hr < 24) return `${hr} 小时前`
  return `${Math.floor(hr / 24)} 天前`
}

function kycTagType(s: string) { return ({ APPROVED: 'success', PENDING: 'warning', REJECTED: 'danger', REVIEW: 'info' } as Record<string, string>)[s] || 'info' }
function kycLabel(s: string) { return ({ APPROVED: '已通过', PENDING: '待审核', REJECTED: '已拒绝', REVIEW: '复审中' } as Record<string, string>)[s] || s }
function riskTagType(s: string) { return ({ LOW: 'success', MEDIUM: 'warning', HIGH: 'danger', CRITICAL: 'danger' } as Record<string, string>)[s] || 'info' }
function riskLabel(s: string) { return ({ LOW: '低', MEDIUM: '中', HIGH: '高', CRITICAL: '极高' } as Record<string, string>)[s] || s }
</script>

<style scoped>
.customer-detail { max-width: 1400px; }

/* Hero */
.hero-card {
  display: flex; justify-content: space-between; align-items: center; padding: 28px 32px;
  background: var(--color-surface); border: 1px solid var(--color-border); border-radius: 16px; margin-bottom: 24px;
}
.hero-left { display: flex; gap: 20px; align-items: center; }
.hero-avatar { background: linear-gradient(135deg, #6366f1, #818cf8); color: #fff; font-size: 28px; font-weight: 700; }
.hero-name { margin: 0; font-size: 24px; font-weight: 700; }
.hero-company { margin: 4px 0 8px 0; color: var(--color-text-muted); }
.hero-tags { display: flex; gap: 6px; flex-wrap: wrap; }
.hero-contact { text-align: right; }
.contact-item { margin-bottom: 4px; font-size: 14px; color: var(--color-text-muted); }
.hero-actions { display: flex; gap: 8px; margin-top: 12px; }

/* Tabs */
.detail-tabs { margin-top: 8px; }

/* KPI */
.kpi-row { display: grid; grid-template-columns: repeat(4, 1fr); gap: 16px; margin-bottom: 20px; }
.kpi-card { background: var(--color-surface); border: 1px solid var(--color-border); border-radius: 12px; padding: 16px 20px; text-align: center; }
.kpi-value { font-size: 24px; font-weight: 700; color: var(--color-text); }
.kpi-label { font-size: 12px; color: var(--color-text-muted); margin-top: 4px; }

/* Journey */
.journey-steps { display: flex; gap: 0; }
.journey-step { flex: 1; text-align: center; position: relative; padding: 16px 0 0; font-size: 13px; color: var(--color-text-muted); }
.journey-dot { width: 16px; height: 16px; background: var(--color-border); border-radius: 50%; margin: 0 auto 8px; position: relative; z-index: 1; }
.journey-step.completed .journey-dot { background: #10b981; }
.journey-step.active .journey-dot { background: #6366f1; box-shadow: 0 0 0 4px rgba(99,102,241,0.2); animation: pulse 1.5s infinite; }
.journey-step.completed { color: #10b981; font-weight: 600; }
.journey-step.active { color: #6366f1; font-weight: 600; }
@keyframes pulse { 0%,100% { box-shadow: 0 0 0 4px rgba(99,102,241,0.2); } 50% { box-shadow: 0 0 0 8px rgba(99,102,241,0.1); } }

/* Overview */
.overview-grid { display: flex; flex-direction: column; gap: 16px; }
.overview-bottom { display: grid; grid-template-columns: 2fr 1fr; gap: 16px; }
.section-card { border-radius: 12px; }
.section-header { display: flex; justify-content: space-between; align-items: center; }
.section-header h3 { margin: 0; }
.flex-2 { grid-column: span 1; }

/* Activities */
.recent-activities { display: flex; flex-direction: column; gap: 10px; }
.activity-item { display: flex; align-items: center; gap: 8px; font-size: 13px; }
.activity-time { color: var(--color-text-muted); margin-left: auto; font-size: 12px; }

/* Advisor */
.advisor-card { display: flex; gap: 16px; align-items: center; }
.advisor-name { font-weight: 600; font-size: 16px; }
.advisor-dept { font-size: 13px; color: var(--color-text-muted); }
.advisor-email { font-size: 12px; color: var(--color-primary); }

/* Tag editor */
.tag-editor { display: flex; flex-wrap: wrap; gap: 8px; align-items: center; }

/* KYC checklist */
.kyc-checklist { display: grid; grid-template-columns: repeat(3, 1fr); gap: 12px; }

/* Projects */
.projects-grid { display: grid; grid-template-columns: repeat(2, 1fr); gap: 16px; }
.project-card { cursor: pointer; border-radius: 12px; }
.project-header { display: flex; justify-content: space-between; align-items: center; margin-bottom: 8px; }
.project-title { font-weight: 600; }
.project-meta { display: flex; gap: 16px; font-size: 12px; color: var(--color-text-muted); margin-bottom: 12px; }

/* Timeline */
.timeline-content { display: flex; align-items: center; gap: 8px; }
.timeline-title { font-weight: 500; }
.timeline-actor { font-size: 12px; color: var(--color-text-muted); }

/* Profile form */
.profile-form :deep(.el-form-item) { margin-bottom: 16px; }

/* Responsive */
@media (max-width: 1000px) { .kpi-row { grid-template-columns: repeat(2, 1fr); } .overview-bottom { grid-template-columns: 1fr; } .projects-grid { grid-template-columns: 1fr; } .kyc-checklist { grid-template-columns: repeat(2, 1fr); } }
@media (max-width: 600px) { .hero-card { flex-direction: column; text-align: center; } .hero-contact { text-align: center; } }
</style>
