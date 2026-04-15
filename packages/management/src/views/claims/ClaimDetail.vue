<template>
  <div class="claim-detail" v-loading="loading">
    <template v-if="claim">
      <!-- 顶部信息卡 -->
      <el-card class="hero-card" shadow="never">
        <div class="hero-header">
          <div class="hero-left">
            <el-button :icon="ArrowLeft" text @click="$router.push('/claims')">返回列表</el-button>
            <h2>{{ claim.claimNumber }}</h2>
            <el-tag :type="getStatusColor(claim.status)" size="large" effect="dark">
              {{ getStatusLabel(claim.status) }}
            </el-tag>
          </div>
          <div class="hero-right">
            <div class="amount-display">
              <span class="currency">{{ claim.currency }}</span>
              <span class="amount-value">{{ Number(claim.totalAmount).toLocaleString('en', { minimumFractionDigits: 2 }) }}</span>
            </div>
          </div>
        </div>
        <div class="hero-info">
          <div class="info-item"><span class="info-label">标题：</span>{{ claim.title }}</div>
          <div class="info-item"><span class="info-label">提交人：</span>{{ claim.submitter?.name }}</div>
          <div class="info-item" v-if="claim.description"><span class="info-label">说明：</span>{{ claim.description }}</div>
          <div class="info-item"><span class="info-label">创建时间：</span>{{ new Date(claim.createdAt).toLocaleString('zh-CN') }}</div>
        </div>

        <!-- 操作按钮 -->
        <div class="action-bar" v-if="showActions">
          <el-button v-if="claim.status === 'DRAFT'" type="primary" @click="submitClaim" :loading="actionLoading">提交审批</el-button>
          <el-button v-if="canApprove" type="success" @click="approveClaim" :loading="actionLoading">批准</el-button>
          <el-button v-if="canReject" type="danger" @click="showRejectDialog = true" :loading="actionLoading">驳回</el-button>
          <el-button v-if="claim.status === 'APPROVED'" type="primary" @click="showPayDialog = true" :loading="actionLoading">标记付款</el-button>
          <el-button v-if="claim.status === 'REJECTED'" type="warning" @click="resubmitClaim" :loading="actionLoading">重新编辑</el-button>
        </div>
      </el-card>

      <!-- 报销明细 -->
      <el-card shadow="never" class="items-card">
        <template #header>
          <div class="card-header">
            <span>费用明细 ({{ claim.items?.length || 0 }})</span>
            <el-button v-if="claim.status === 'DRAFT'" type="primary" size="small" :icon="Plus" @click="showAddItemDialog = true">添加明细</el-button>
          </div>
        </template>

        <el-table :data="claim.items" stripe>
          <el-table-column prop="category" label="分类" width="140">
            <template #default="{ row }">
              <el-tag size="small">{{ getCategoryLabel(row.category) }}</el-tag>
            </template>
          </el-table-column>
          <el-table-column prop="description" label="说明" min-width="200" />
          <el-table-column prop="amount" label="金额" width="120" align="right">
            <template #default="{ row }">
              <span class="item-amount">{{ Number(row.amount).toLocaleString('en', { minimumFractionDigits: 2 }) }}</span>
            </template>
          </el-table-column>
          <el-table-column prop="expenseDate" label="日期" width="120">
            <template #default="{ row }">{{ new Date(row.expenseDate).toLocaleDateString('zh-CN') }}</template>
          </el-table-column>
          <el-table-column label="收据" width="120" align="center">
            <template #default="{ row }">
              <template v-if="row.receiptUrl">
                <el-button link type="primary" size="small" @click="previewReceipt(row.receiptUrl)">查看</el-button>
              </template>
              <template v-else-if="claim.status === 'DRAFT'">
                <el-upload
                  :action="`/api/v1/claims/${claim.id}/items/${row.id}/receipt`"
                  :headers="uploadHeaders"
                  name="receipt"
                  :show-file-list="false"
                  :on-success="() => loadData()"
                  accept=".jpg,.jpeg,.png,.gif,.webp,.pdf"
                >
                  <el-button link type="primary" size="small">上传</el-button>
                </el-upload>
              </template>
              <span v-else class="no-receipt">无</span>
            </template>
          </el-table-column>
          <el-table-column label="操作" width="80" v-if="claim.status === 'DRAFT'">
            <template #default="{ row }">
              <el-button link type="danger" size="small" v-permission="['claims:update']" @click="removeItem(row.id)">删除</el-button>
            </template>
          </el-table-column>
        </el-table>
      </el-card>

      <!-- 审批时间线 -->
      <el-card shadow="never" class="timeline-card">
        <template #header>审批记录</template>
        <el-timeline>
          <el-timeline-item timestamp="创建" placement="top" type="primary">
            {{ claim.submitter?.name }} 创建了报销单
            <div class="timeline-time">{{ new Date(claim.createdAt).toLocaleString('zh-CN') }}</div>
          </el-timeline-item>
          <el-timeline-item v-if="claim.managerApprovedAt" timestamp="经理审批" placement="top" type="success">
            {{ claim.managerApprovedBy?.name }} 批准
            <div class="timeline-comment" v-if="claim.managerComment">{{ claim.managerComment }}</div>
            <div class="timeline-time">{{ new Date(claim.managerApprovedAt).toLocaleString('zh-CN') }}</div>
          </el-timeline-item>
          <el-timeline-item v-if="claim.adminApprovedAt" timestamp="管理员审批" placement="top" type="success">
            {{ claim.adminApprovedBy?.name }} 最终批准
            <div class="timeline-comment" v-if="claim.adminComment">{{ claim.adminComment }}</div>
            <div class="timeline-time">{{ new Date(claim.adminApprovedAt).toLocaleString('zh-CN') }}</div>
          </el-timeline-item>
          <el-timeline-item v-if="claim.rejectedAt" timestamp="驳回" placement="top" type="danger">
            {{ claim.rejectedBy?.name }} 驳回
            <div class="timeline-comment" v-if="claim.rejectionReason">原因：{{ claim.rejectionReason }}</div>
            <div class="timeline-time">{{ new Date(claim.rejectedAt).toLocaleString('zh-CN') }}</div>
          </el-timeline-item>
          <el-timeline-item v-if="claim.paidAt" timestamp="付款" placement="top" type="success">
            已付款 (参考号: {{ claim.paymentRef }})
            <div class="timeline-time">{{ new Date(claim.paidAt).toLocaleString('zh-CN') }}</div>
          </el-timeline-item>
        </el-timeline>
      </el-card>
    </template>

    <!-- 添加明细弹窗 -->
    <el-dialog v-model="showAddItemDialog" title="添加费用明细" width="500px" destroy-on-close>
      <el-form :model="itemForm" label-width="80px" :rules="itemRules" ref="itemFormRef">
        <el-form-item label="分类">
          <el-select v-model="itemForm.category" style="width: 100%">
            <el-option v-for="c in categories" :key="c.value" :label="c.label" :value="c.value" />
          </el-select>
        </el-form-item>
        <el-form-item label="说明" prop="description">
          <el-input v-model="itemForm.description" placeholder="费用说明" />
        </el-form-item>
        <el-row :gutter="16">
          <el-col :span="12">
            <el-form-item label="金额" prop="amount">
              <el-input-number v-model="itemForm.amount" :min="0.01" :precision="2" style="width: 100%" />
            </el-form-item>
          </el-col>
          <el-col :span="12">
            <el-form-item label="日期" prop="expenseDate">
              <el-date-picker v-model="itemForm.expenseDate" type="date" format="YYYY-MM-DD" value-format="YYYY-MM-DD" style="width: 100%" />
            </el-form-item>
          </el-col>
        </el-row>
        <el-form-item label="备注">
          <el-input v-model="itemForm.notes" type="textarea" :rows="2" />
        </el-form-item>
      </el-form>
      <template #footer>
        <el-button @click="showAddItemDialog = false">取消</el-button>
        <el-button type="primary" @click="addItem" :loading="actionLoading">添加</el-button>
      </template>
    </el-dialog>

    <!-- 驳回弹窗 -->
    <el-dialog v-model="showRejectDialog" title="驳回报销单" width="400px">
      <el-input v-model="rejectReason" type="textarea" :rows="3" placeholder="请输入驳回原因" />
      <template #footer>
        <el-button @click="showRejectDialog = false">取消</el-button>
        <el-button type="danger" @click="rejectClaim" :loading="actionLoading">确认驳回</el-button>
      </template>
    </el-dialog>

    <!-- 付款弹窗 -->
    <el-dialog v-model="showPayDialog" title="标记付款" width="400px">
      <el-input v-model="paymentRef" placeholder="请输入付款参考号/交易号" />
      <template #footer>
        <el-button @click="showPayDialog = false">取消</el-button>
        <el-button type="primary" @click="markPaid" :loading="actionLoading">确认付款</el-button>
      </template>
    </el-dialog>
  </div>
</template>

<script setup lang="ts">
import { ref, reactive, computed, onMounted } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { ElMessage, ElMessageBox } from 'element-plus'
import { ArrowLeft, Plus } from '@element-plus/icons-vue'
import { apiClient } from '@/api'
import { useAuthStore } from '@/stores/authStore'

const route = useRoute()
const router = useRouter()

const claim = ref<any>(null)
const loading = ref(false)
const actionLoading = ref(false)
const showAddItemDialog = ref(false)
const showRejectDialog = ref(false)
const showPayDialog = ref(false)
const rejectReason = ref('')
const paymentRef = ref('')
const itemFormRef = ref()

const authStore = useAuthStore()

const uploadHeaders = computed(() => ({
  Authorization: `Bearer ${authStore.accessToken || ''}`,
}))

const categories = [
  { value: 'TRANSPORT', label: '交通' }, { value: 'MEALS', label: '餐饮' },
  { value: 'ACCOMMODATION', label: '住宿' }, { value: 'OFFICE_SUPPLIES', label: '办公用品' },
  { value: 'CLIENT_ENTERTAINMENT', label: '客户招待' }, { value: 'COMMUNICATION', label: '通讯' },
  { value: 'PROFESSIONAL_SERVICES', label: '专业服务费' }, { value: 'OTHER', label: '其他' },
]

const getCategoryLabel = (c: string) => categories.find(x => x.value === c)?.label || c

const getStatusLabel = (s: string) => {
  const m: Record<string, string> = {
    DRAFT: '草稿', SUBMITTED: '待审批', MANAGER_APPROVED: '经理已批',
    APPROVED: '已批准', REJECTED: '已驳回', PAID: '已付款',
  }
  return m[s] || s
}

const getStatusColor = (s: string) => {
  const m: Record<string, string> = {
    DRAFT: 'info', SUBMITTED: 'warning', MANAGER_APPROVED: '',
    APPROVED: 'success', REJECTED: 'danger', PAID: 'success',
  }
  return m[s] || 'info'
}

const showActions = computed(() => claim.value && ['DRAFT', 'SUBMITTED', 'MANAGER_APPROVED', 'APPROVED', 'REJECTED'].includes(claim.value.status))
const canApprove = computed(() => claim.value && ['SUBMITTED', 'MANAGER_APPROVED'].includes(claim.value.status))
const canReject = computed(() => claim.value && ['SUBMITTED', 'MANAGER_APPROVED'].includes(claim.value.status))

const itemForm = reactive({
  category: 'OTHER', description: '', amount: 0, expenseDate: '', notes: '',
})
const itemRules = {
  description: [{ required: true, message: '请输入费用说明', trigger: 'blur' }],
  amount: [{ required: true, message: '请输入金额', trigger: 'blur' }],
  expenseDate: [{ required: true, message: '请选择日期', trigger: 'change' }],
}

const loadData = async () => {
  loading.value = true
  try {
    const res = await apiClient.get(`/claims/${route.params.id}`) as any
    claim.value = res
  } catch (e: any) {
    ElMessage.error('加载报销单失败')
    router.push('/claims')
  } finally {
    loading.value = false
  }
}

const submitClaim = async () => {
  actionLoading.value = true
  try {
    await apiClient.post(`/claims/${claim.value.id}/submit`)
    ElMessage.success('报销单已提交审批')
    loadData()
  } catch (e: any) {
    ElMessage.error(e.response?.data?.message || '提交失败')
  } finally { actionLoading.value = false }
}

const approveClaim = async () => {
  actionLoading.value = true
  try {
    await apiClient.post(`/claims/${claim.value.id}/approve`, { comment: '' })
    ElMessage.success('报销单已批准')
    loadData()
  } catch (e: any) {
    ElMessage.error(e.response?.data?.message || '审批失败')
  } finally { actionLoading.value = false }
}

const rejectClaim = async () => {
  if (!rejectReason.value.trim()) { ElMessage.warning('请输入驳回原因'); return }
  actionLoading.value = true
  try {
    await apiClient.post(`/claims/${claim.value.id}/reject`, { reason: rejectReason.value })
    ElMessage.success('报销单已驳回')
    showRejectDialog.value = false
    loadData()
  } catch (e: any) {
    ElMessage.error(e.response?.data?.message || '操作失败')
  } finally { actionLoading.value = false }
}

const markPaid = async () => {
  if (!paymentRef.value.trim()) { ElMessage.warning('请输入付款参考号'); return }
  actionLoading.value = true
  try {
    await apiClient.post(`/claims/${claim.value.id}/pay`, { paymentRef: paymentRef.value })
    ElMessage.success('已标记付款')
    showPayDialog.value = false
    loadData()
  } catch (e: any) {
    ElMessage.error(e.response?.data?.message || '操作失败')
  } finally { actionLoading.value = false }
}

const resubmitClaim = async () => {
  actionLoading.value = true
  try {
    await apiClient.post(`/claims/${claim.value.id}/resubmit`)
    ElMessage.success('报销单已恢复为草稿')
    loadData()
  } catch (e: any) {
    ElMessage.error(e.response?.data?.message || '操作失败')
  } finally { actionLoading.value = false }
}

const addItem = async () => {
  try { await itemFormRef.value?.validate() } catch { return }
  actionLoading.value = true
  try {
    await apiClient.post(`/claims/${claim.value.id}/items`, itemForm)
    ElMessage.success('明细已添加')
    showAddItemDialog.value = false
    Object.assign(itemForm, { category: 'OTHER', description: '', amount: 0, expenseDate: '', notes: '' })
    loadData()
  } catch (e: any) {
    ElMessage.error(e.response?.data?.message || '添加失败')
  } finally { actionLoading.value = false }
}

const removeItem = async (itemId: string) => {
  try {
    await ElMessageBox.confirm('确定删除这条明细？', '确认', { type: 'warning' })
    await apiClient.delete(`/claims/${claim.value.id}/items/${itemId}`)
    ElMessage.success('已删除')
    loadData()
  } catch { /* 取消 */ }
}

const previewReceipt = (url: string) => {
  window.open(url, '_blank')
}

onMounted(loadData)
</script>

<style scoped>
.claim-detail { padding: 20px; max-width: 1000px; margin: 0 auto; }
.hero-card { margin-bottom: 20px; border-radius: 12px; }
.hero-header { display: flex; justify-content: space-between; align-items: center; margin-bottom: 16px; }
.hero-left { display: flex; align-items: center; gap: 12px; }
.hero-left h2 { margin: 0; font-size: 22px; }
.amount-display { text-align: right; }
.currency { font-size: 14px; color: var(--el-text-color-secondary); margin-right: 4px; }
.amount-value { font-size: 32px; font-weight: 700; color: var(--el-color-primary); font-family: 'Courier New', monospace; }
.hero-info { display: flex; flex-wrap: wrap; gap: 16px 32px; margin-bottom: 16px; font-size: 14px; }
.info-label { color: var(--el-text-color-secondary); }
.action-bar { display: flex; gap: 8px; padding-top: 16px; border-top: 1px solid var(--el-border-color-lighter); }
.items-card, .timeline-card { margin-bottom: 20px; border-radius: 12px; }
.card-header { display: flex; justify-content: space-between; align-items: center; }
.item-amount { font-weight: 600; font-family: 'Courier New', monospace; }
.no-receipt { color: var(--el-text-color-placeholder); font-size: 12px; }
.timeline-comment { color: var(--el-text-color-regular); font-size: 13px; margin-top: 4px; padding: 8px; background: var(--el-fill-color-lighter); border-radius: 4px; }
.timeline-time { color: var(--el-text-color-secondary); font-size: 12px; margin-top: 4px; }
</style>
