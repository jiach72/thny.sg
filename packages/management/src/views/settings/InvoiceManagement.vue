<template>
  <div class="invoice-management">
    <h2 class="page-title">发票管理</h2>
    
    <!-- 统计卡片 -->
    <el-row :gutter="24" class="stats-row">
      <el-col :span="4" v-for="stat in statusStats" :key="stat.status">
        <el-card class="stat-card" shadow="hover" :class="`stat-card--${stat.status.toLowerCase()}`">
          <div class="stat-content">
            <div class="stat-value">{{ stat.count }}</div>
            <div class="stat-label">{{ stat.label }}</div>
            <div class="stat-amount">{{ formatCurrency(stat.amount) }}</div>
          </div>
        </el-card>
      </el-col>
    </el-row>

    <!-- 操作栏 -->
    <el-card class="action-bar">
      <el-row :gutter="16" align="middle">
        <el-col :span="16">
          <el-space>
            <el-button type="primary" @click="openCreateDialog">
              <el-icon><Plus /></el-icon>
              新建发票
            </el-button>
            <el-button @click="checkOverdue" :loading="overdueLoading">
              <el-icon><Warning /></el-icon>
              检查逾期
            </el-button>
            <el-select v-model="filters.status" placeholder="状态筛选" clearable style="width: 120px;">
              <el-option value="DRAFT" label="草稿" />
              <el-option value="SENT" label="已发送" />
              <el-option value="PARTIAL" label="部分付款" />
              <el-option value="PAID" label="已付清" />
              <el-option value="OVERDUE" label="逾期" />
              <el-option value="CANCELLED" label="已取消" />
            </el-select>
          </el-space>
        </el-col>
        <el-col :span="8" style="text-align: right;">
          <el-input 
            v-model="searchText" 
            placeholder="搜索发票号/客户名" 
            clearable 
            style="width: 250px;"
            @clear="loadInvoices"
            @keyup.enter="loadInvoices"
          >
            <template #prefix>
              <el-icon><Search /></el-icon>
            </template>
          </el-input>
        </el-col>
      </el-row>
    </el-card>

    <!-- 发票列表 -->
    <el-card>
      <el-table :data="invoices" v-loading="loading" stripe @row-click="openDetailDialog">
        <el-table-column prop="invoiceNumber" label="发票号" width="150" />
        <el-table-column prop="customer.companyName" label="客户" min-width="150" />
        <el-table-column prop="totalAmount" label="总金额" width="150" align="right">
          <template #default="{ row }">
            <span class="amount">{{ formatCurrency(row.totalAmount, row.currency) }}</span>
          </template>
        </el-table-column>
        <el-table-column prop="paidAmount" label="已付" width="150" align="right">
          <template #default="{ row }">
            <span :class="{ 'amount-partial': row.paidAmount > 0 && row.paidAmount < row.totalAmount }">
              {{ formatCurrency(row.paidAmount, row.currency) }}
            </span>
          </template>
        </el-table-column>
        <el-table-column prop="status" label="状态" width="120" align="center">
          <template #default="{ row }">
            <el-tag :type="getStatusType(row.status)" effect="dark">
              {{ getStatusLabel(row.status) }}
            </el-tag>
          </template>
        </el-table-column>
        <el-table-column prop="issueDate" label="开票日期" width="120">
          <template #default="{ row }">
            {{ formatDate(row.issueDate) }}
          </template>
        </el-table-column>
        <el-table-column prop="dueDate" label="到期日" width="120">
          <template #default="{ row }">
            <span :class="{ 'text-danger': isOverdue(row) }">
              {{ formatDate(row.dueDate) }}
            </span>
          </template>
        </el-table-column>
        <el-table-column label="操作" width="200" fixed="right">
          <template #default="{ row }">
            <el-button type="primary" link @click.stop="openDetailDialog(row)">详情</el-button>
            <el-button 
              v-if="row.status === 'DRAFT'" 
              type="success" 
              link 
              @click.stop="sendInvoice(row)"
            >发送</el-button>
            <el-button 
              v-if="['SENT', 'PARTIAL', 'OVERDUE'].includes(row.status)" 
              type="warning" 
              link 
              @click.stop="openPaymentDialog(row)"
            >收款</el-button>
            <el-popconfirm 
              v-if="row.status === 'DRAFT'"
              title="确定删除该发票吗？" 
              @confirm="deleteInvoiceById(row.id)"
            >
              <template #reference>
                <el-button type="danger" link @click.stop>删除</el-button>
              </template>
            </el-popconfirm>
          </template>
        </el-table-column>
      </el-table>
      
      <div class="pagination-container">
        <el-pagination
          v-model:current-page="pagination.page"
          :page-size="pagination.limit"
          :total="pagination.total"
          layout="total, prev, pager, next"
          @current-change="loadInvoices"
        />
      </div>
    </el-card>

    <!-- 新建发票对话框 -->
    <el-dialog v-model="createDialogVisible" title="新建发票" width="800px" top="5vh">
      <el-form ref="formRef" :model="form" :rules="formRules" label-width="100px">
        <el-row :gutter="16">
          <el-col :span="12">
            <el-form-item label="客户" prop="customerId">
              <el-select v-model="form.customerId" placeholder="选择客户" filterable style="width: 100%;">
                <el-option 
                  v-for="c in customers" 
                  :key="c.id" 
                  :value="c.id"
                  :label="c.companyName"
                />
              </el-select>
            </el-form-item>
          </el-col>
          <el-col :span="6">
            <el-form-item label="币种">
              <el-select v-model="form.currency" style="width: 100%;">
                <el-option value="SGD" label="SGD - 新元" />
                <el-option value="USD" label="USD - 美元" />
                <el-option value="RMB" label="RMB - 人民币" />
                <el-option value="MYR" label="MYR - 马币" />
              </el-select>
            </el-form-item>
          </el-col>
          <el-col :span="6">
            <el-form-item label="到期日" prop="dueDate">
              <el-date-picker 
                v-model="form.dueDate" 
                type="date" 
                placeholder="选择日期"
                value-format="YYYY-MM-DD"
                style="width: 100%;"
              />
            </el-form-item>
          </el-col>
        </el-row>
        
        <el-form-item label="发票项目">
          <div class="invoice-items">
            <div v-for="(item, index) in form.items" :key="index" class="invoice-item">
              <el-input v-model="item.description" placeholder="描述" style="flex: 2;" />
              <el-input-number v-model="item.quantity" :min="1" placeholder="数量" style="width: 100px;" />
              <el-input-number v-model="item.unitPrice" :min="0" :precision="2" placeholder="单价" style="width: 140px;" />
              <span class="item-amount">= {{ formatCurrency(item.quantity * item.unitPrice, form.currency) }}</span>
              <el-button type="danger" link @click="removeItem(index)" :disabled="form.items.length === 1">
                <el-icon><Delete /></el-icon>
              </el-button>
            </div>
            <el-button type="primary" link @click="addItem">
              <el-icon><Plus /></el-icon>
              添加项目
            </el-button>
          </div>
        </el-form-item>
        
        <el-row :gutter="16">
          <el-col :span="12">
            <el-form-item label="备注">
              <el-input v-model="form.notes" type="textarea" :rows="3" placeholder="备注信息（可选）" />
            </el-form-item>
          </el-col>
          <el-col :span="12">
            <div class="invoice-summary">
              <div class="summary-row">
                <span>小计：</span>
                <span>{{ formatCurrency(subtotal, form.currency) }}</span>
              </div>
              <div class="summary-row">
                <span>
                  税率：
                  <el-input-number v-model="form.taxRate" :min="0" :max="100" :precision="1" size="small" style="width: 80px;" />%
                </span>
                <span>{{ formatCurrency(taxAmount, form.currency) }}</span>
              </div>
              <div class="summary-row total">
                <span>总计：</span>
                <span>{{ formatCurrency(totalAmount, form.currency) }}</span>
              </div>
            </div>
          </el-col>
        </el-row>
      </el-form>
      <template #footer>
        <el-button @click="createDialogVisible = false">取消</el-button>
        <el-button type="primary" @click="submitForm" :loading="submitLoading">创建发票</el-button>
      </template>
    </el-dialog>

    <!-- 发票详情抽屉 -->
    <el-drawer v-model="detailDrawerVisible" title="发票详情" size="50%">
      <template v-if="selectedInvoice">
        <el-descriptions :column="2" border>
          <el-descriptions-item label="发票号">{{ selectedInvoice.invoiceNumber }}</el-descriptions-item>
          <el-descriptions-item label="状态">
            <el-tag :type="getStatusType(selectedInvoice.status)" effect="dark">
              {{ getStatusLabel(selectedInvoice.status) }}
            </el-tag>
          </el-descriptions-item>
          <el-descriptions-item label="客户">{{ selectedInvoice.customer?.companyName }}</el-descriptions-item>
          <el-descriptions-item label="币种">{{ selectedInvoice.currency }}</el-descriptions-item>
          <el-descriptions-item label="开票日期">{{ formatDate(selectedInvoice.issueDate) }}</el-descriptions-item>
          <el-descriptions-item label="到期日">{{ formatDate(selectedInvoice.dueDate) }}</el-descriptions-item>
        </el-descriptions>
        
        <h4 style="margin: 24px 0 12px;">发票项目</h4>
        <el-table :data="selectedInvoice.items" border size="small">
          <el-table-column prop="description" label="描述" />
          <el-table-column prop="quantity" label="数量" width="100" align="center" />
          <el-table-column prop="unitPrice" label="单价" width="120" align="right">
            <template #default="{ row }">
              {{ formatCurrency(row.unitPrice, selectedInvoice.currency) }}
            </template>
          </el-table-column>
          <el-table-column prop="amount" label="金额" width="120" align="right">
            <template #default="{ row }">
              {{ formatCurrency(row.quantity * row.unitPrice, selectedInvoice.currency) }}
            </template>
          </el-table-column>
        </el-table>
        
        <div class="detail-summary">
          <div class="summary-row"><span>小计：</span><span>{{ formatCurrency(selectedInvoice.subtotal, selectedInvoice.currency) }}</span></div>
          <div class="summary-row"><span>税额 ({{ selectedInvoice.taxRate }}%)：</span><span>{{ formatCurrency(selectedInvoice.taxAmount, selectedInvoice.currency) }}</span></div>
          <div class="summary-row total"><span>总计：</span><span>{{ formatCurrency(selectedInvoice.totalAmount, selectedInvoice.currency) }}</span></div>
          <div class="summary-row paid"><span>已付：</span><span>{{ formatCurrency(selectedInvoice.paidAmount, selectedInvoice.currency) }}</span></div>
          <div class="summary-row balance"><span>余额：</span><span>{{ formatCurrency(selectedInvoice.totalAmount - selectedInvoice.paidAmount, selectedInvoice.currency) }}</span></div>
        </div>
        
        <h4 style="margin: 24px 0 12px;">付款记录</h4>
        <el-table :data="payments" v-loading="paymentsLoading" border size="small">
          <el-table-column prop="paymentDate" label="日期" width="120">
            <template #default="{ row }">{{ formatDate(row.paymentDate) }}</template>
          </el-table-column>
          <el-table-column prop="amount" label="金额" width="120" align="right">
            <template #default="{ row }">{{ formatCurrency(row.amount, row.currency) }}</template>
          </el-table-column>
          <el-table-column prop="paymentMethod" label="方式" width="100" />
          <el-table-column prop="reference" label="参考号" />
        </el-table>
      </template>
    </el-drawer>

    <!-- 收款对话框 -->
    <el-dialog v-model="paymentDialogVisible" title="记录收款" width="500px">
      <el-form ref="paymentFormRef" :model="paymentForm" :rules="paymentRules" label-width="100px">
        <el-form-item label="收款金额" prop="amount">
          <el-input-number 
            v-model="paymentForm.amount" 
            :min="0.01" 
            :precision="2"
            style="width: 200px;"
          />
        </el-form-item>
        <el-form-item label="付款日期" prop="paymentDate">
          <el-date-picker 
            v-model="paymentForm.paymentDate" 
            type="date" 
            value-format="YYYY-MM-DD"
            style="width: 200px;"
          />
        </el-form-item>
        <el-form-item label="付款方式" prop="paymentMethod">
          <el-select v-model="paymentForm.paymentMethod" style="width: 200px;">
            <el-option value="Bank Transfer" label="银行转账" />
            <el-option value="Credit Card" label="信用卡" />
            <el-option value="Cash" label="现金" />
            <el-option value="PayNow" label="PayNow" />
            <el-option value="Cheque" label="支票" />
          </el-select>
        </el-form-item>
        <el-form-item label="参考号">
          <el-input v-model="paymentForm.reference" placeholder="交易参考号（可选）" />
        </el-form-item>
      </el-form>
      <template #footer>
        <el-button @click="paymentDialogVisible = false">取消</el-button>
        <el-button type="primary" @click="submitPayment" :loading="paymentLoading">确认收款</el-button>
      </template>
    </el-dialog>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted, watch } from 'vue'
import { ElMessage, type FormInstance, type FormRules } from 'element-plus'
import { Plus, Warning, Search, Delete } from '@element-plus/icons-vue'
import invoiceApi, { 
  type Invoice, 
  type Payment,
  type InvoiceStatus,
  type CreateInvoiceInput,
  type CreatePaymentInput
} from '@/api/invoiceApi'

// 状态
const loading = ref(false)
const invoices = ref<Invoice[]>([])
const filters = ref<{ status?: InvoiceStatus }>({})
const searchText = ref('')
const pagination = ref({ page: 1, limit: 20, total: 0 })

const overdueLoading = ref(false)

// 统计
const statusStats = ref<{ status: string; label: string; count: number; amount: number }[]>([
  { status: 'DRAFT', label: '草稿', count: 0, amount: 0 },
  { status: 'SENT', label: '已发送', count: 0, amount: 0 },
  { status: 'PARTIAL', label: '部分付款', count: 0, amount: 0 },
  { status: 'PAID', label: '已付清', count: 0, amount: 0 },
  { status: 'OVERDUE', label: '逾期', count: 0, amount: 0 },
  { status: 'CANCELLED', label: '已取消', count: 0, amount: 0 }
])

// 新建发票
const createDialogVisible = ref(false)
const submitLoading = ref(false)
const formRef = ref<FormInstance>()
const customers = ref<Array<{ id: string; leadId: string; lead?: { contactName: string } }>>([])
const form = ref<CreateInvoiceInput>({
  customerId: '',
  items: [{ description: '', quantity: 1, unitPrice: 0, amount: 0 }],
  currency: 'SGD',
  taxRate: 9,
  dueDate: ''
})

const formRules: FormRules = {
  customerId: [{ required: true, message: '请选择客户', trigger: 'change' }],
  dueDate: [{ required: true, message: '请选择到期日', trigger: 'change' }]
}

// 发票详情
const detailDrawerVisible = ref(false)
const selectedInvoice = ref<Invoice | null>(null)
const payments = ref<Payment[]>([])
const paymentsLoading = ref(false)

// 收款
const paymentDialogVisible = ref(false)
const paymentLoading = ref(false)
const paymentFormRef = ref<FormInstance>()
const paymentInvoice = ref<Invoice | null>(null)
const paymentForm = ref<CreatePaymentInput>({
  amount: 0,
  paymentDate: new Date().toISOString().split('T')[0],
  paymentMethod: 'Bank Transfer'
})

const paymentRules: FormRules = {
  amount: [{ required: true, message: '请输入金额', trigger: 'blur' }],
  paymentDate: [{ required: true, message: '请选择日期', trigger: 'change' }],
  paymentMethod: [{ required: true, message: '请选择方式', trigger: 'change' }]
}

// 计算属性
const subtotal = computed(() => 
  form.value.items.reduce((sum, item) => sum + item.quantity * item.unitPrice, 0)
)
const taxAmount = computed(() => subtotal.value * (form.value.taxRate || 0) / 100)
const totalAmount = computed(() => subtotal.value + taxAmount.value)

// 加载发票列表
async function loadInvoices() {
  loading.value = true
  try {
    const result = await invoiceApi.getInvoices(filters.value, pagination.value)
    invoices.value = result.data
    pagination.value.total = result.pagination?.total || 0
  } catch (err: unknown) {
    ElMessage.error((err as Error).message || '加载失败')
  } finally {
    loading.value = false
  }
}

// 加载统计
async function loadStats() {
  try {
    const stats = await invoiceApi.getInvoiceStats()
    if (stats.byStatus) {
      statusStats.value = statusStats.value.map(s => ({
        ...s,
        count: stats.byStatus[s.status as InvoiceStatus]?.count || 0,
        amount: stats.byStatus[s.status as InvoiceStatus]?.amount || 0
      }))
    }
  } catch (err) {
    console.error('加载统计失败:', err)
  }
}

// 辅助函数
function getStatusLabel(status: string): string {
  const map: Record<string, string> = {
    DRAFT: '草稿',
    SENT: '已发送',
    PARTIAL: '部分付款',
    PAID: '已付清',
    OVERDUE: '逾期',
    CANCELLED: '已取消'
  }
  return map[status] || status
}

function getStatusType(status: string): string {
  const map: Record<string, string> = {
    DRAFT: 'info',
    SENT: 'primary',
    PARTIAL: 'warning',
    PAID: 'success',
    OVERDUE: 'danger',
    CANCELLED: ''
  }
  return map[status] || 'info'
}

function formatCurrency(amount: number, currency = 'SGD'): string {
  return new Intl.NumberFormat('en-SG', { 
    style: 'currency', 
    currency 
  }).format(amount || 0)
}

function formatDate(dateStr: string): string {
  if (!dateStr) return '-'
  return new Date(dateStr).toLocaleDateString('zh-CN')
}

function isOverdue(invoice: Invoice): boolean {
  if (['PAID', 'CANCELLED', 'DRAFT'].includes(invoice.status)) return false
  return new Date(invoice.dueDate) < new Date()
}

// 发票项目操作
function addItem() {
  form.value.items.push({ description: '', quantity: 1, unitPrice: 0, amount: 0 })
}

function removeItem(index: number) {
  form.value.items.splice(index, 1)
}

// 打开新建对话框
function openCreateDialog() {
  form.value = {
    customerId: '',
    items: [{ description: '', quantity: 1, unitPrice: 0, amount: 0 }],
    currency: 'SGD',
    taxRate: 9,
    dueDate: ''
  }
  createDialogVisible.value = true
}

// 提交发票
async function submitForm() {
  await formRef.value?.validate()
  submitLoading.value = true
  
  try {
    // 计算每项金额
    form.value.items = form.value.items.map(item => ({
      ...item,
      amount: item.quantity * item.unitPrice
    }))
    
    await invoiceApi.createInvoice(form.value)
    ElMessage.success('发票已创建')
    createDialogVisible.value = false
    loadInvoices()
    loadStats()
  } catch (err: unknown) {
    ElMessage.error((err as Error).message || '创建失败')
  } finally {
    submitLoading.value = false
  }
}

// 打开详情抽屉
async function openDetailDialog(invoice: Invoice) {
  selectedInvoice.value = invoice
  detailDrawerVisible.value = true
  
  // 加载付款记录
  paymentsLoading.value = true
  try {
    payments.value = await invoiceApi.getPayments(invoice.id)
  } catch (err) {
    console.error('加载付款记录失败:', err)
  } finally {
    paymentsLoading.value = false
  }
}

// 发送发票
async function sendInvoice(invoice: Invoice) {
  try {
    await invoiceApi.sendInvoice(invoice.id)
    ElMessage.success('发票已发送')
    loadInvoices()
    loadStats()
  } catch (err: unknown) {
    ElMessage.error((err as Error).message || '发送失败')
  }
}

// 删除发票
async function deleteInvoiceById(id: string) {
  try {
    await invoiceApi.deleteInvoice(id)
    ElMessage.success('发票已删除')
    loadInvoices()
    loadStats()
  } catch (err: unknown) {
    ElMessage.error((err as Error).message || '删除失败')
  }
}

// 检查逾期
async function checkOverdue() {
  overdueLoading.value = true
  try {
    const overdueList = await invoiceApi.checkOverdueInvoices()
    if (overdueList.length > 0) {
      ElMessage.warning(`发现 ${overdueList.length} 张逾期发票`)
    } else {
      ElMessage.success('没有逾期发票')
    }
    loadInvoices()
    loadStats()
  } catch (err: unknown) {
    ElMessage.error((err as Error).message || '检查失败')
  } finally {
    overdueLoading.value = false
  }
}

// 收款相关
function openPaymentDialog(invoice: Invoice) {
  paymentInvoice.value = invoice
  paymentForm.value = {
    amount: invoice.totalAmount - invoice.paidAmount,
    paymentDate: new Date().toISOString().split('T')[0],
    paymentMethod: 'Bank Transfer'
  }
  paymentDialogVisible.value = true
}

async function submitPayment() {
  await paymentFormRef.value?.validate()
  if (!paymentInvoice.value) return
  
  paymentLoading.value = true
  try {
    await invoiceApi.createPayment(paymentInvoice.value.id, paymentForm.value)
    ElMessage.success('收款已记录')
    paymentDialogVisible.value = false
    loadInvoices()
    loadStats()
  } catch (err: unknown) {
    ElMessage.error((err as Error).message || '记录失败')
  } finally {
    paymentLoading.value = false
  }
}

// 监听筛选变化
watch(() => filters.value.status, () => {
  pagination.value.page = 1
  loadInvoices()
})

onMounted(() => {
  loadInvoices()
  loadStats()
})
</script>

<style scoped>
.invoice-management {
  max-width: 1600px;
}

.page-title {
  font-size: 24px;
  font-weight: 600;
  color: #333;
  margin: 0 0 24px;
}

.stats-row {
  margin-bottom: 24px;
}

.stat-card {
  text-align: center;
  padding: 16px 8px;
}

.stat-card--draft { border-left: 4px solid #909399; }
.stat-card--sent { border-left: 4px solid #409eff; }
.stat-card--partial { border-left: 4px solid #e6a23c; }
.stat-card--paid { border-left: 4px solid #67c23a; }
.stat-card--overdue { border-left: 4px solid #f56c6c; }
.stat-card--cancelled { border-left: 4px solid #c0c4cc; }

.stat-value {
  font-size: 28px;
  font-weight: 600;
  color: #333;
}

.stat-label {
  font-size: 13px;
  color: #666;
  margin: 4px 0;
}

.stat-amount {
  font-size: 12px;
  color: #999;
}

.action-bar {
  margin-bottom: 24px;
}

.pagination-container {
  padding: 16px 0;
  display: flex;
  justify-content: flex-end;
}

.amount {
  font-weight: 600;
}

.amount-partial {
  color: #e6a23c;
}

.text-danger {
  color: #f56c6c;
}

.invoice-items {
  width: 100%;
}

.invoice-item {
  display: flex;
  gap: 12px;
  align-items: center;
  margin-bottom: 12px;
}

.item-amount {
  width: 120px;
  text-align: right;
  font-weight: 500;
}

.invoice-summary,
.detail-summary {
  background: #f5f7fa;
  padding: 16px;
  border-radius: 8px;
}

.summary-row {
  display: flex;
  justify-content: space-between;
  padding: 8px 0;
  border-bottom: 1px solid #eee;
}

.summary-row.total {
  font-size: 18px;
  font-weight: 600;
  color: #333;
  border-bottom: none;
  padding-top: 12px;
}

.summary-row.paid {
  color: #67c23a;
}

.summary-row.balance {
  color: #409eff;
  font-weight: 600;
}

.detail-summary {
  margin-top: 24px;
}
</style>
