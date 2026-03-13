<template>
  <div class="vendor-detail" v-loading="loading">
    <template v-if="vendor">
      <!-- 返回按钮和标题 -->
      <div class="page-header">
        <el-button :icon="ArrowLeft" text @click="$router.push('/vendors')">返回列表</el-button>
        <h2>{{ vendor.name }}</h2>
        <el-tag :type="vendor.status === 'ACTIVE' ? 'success' : vendor.status === 'BLACKLISTED' ? 'danger' : 'info'" size="large">
          {{ vendor.status === 'ACTIVE' ? '活跃' : vendor.status === 'BLACKLISTED' ? '黑名单' : '非活跃' }}
        </el-tag>
      </div>

      <!-- 多 Tab 视图 -->
      <el-tabs v-model="activeTab" type="border-card">
        <!-- 概览 -->
        <el-tab-pane label="概览" name="overview">
          <el-descriptions :column="2" border>
            <el-descriptions-item label="类型">
              <el-tag size="small">{{ getTypeLabel(vendor.type) }}</el-tag>
            </el-descriptions-item>
            <el-descriptions-item label="评分">
              <el-rate v-model="vendor.rating" :max="5" size="small" @change="handleRatingChange" />
            </el-descriptions-item>
            <el-descriptions-item label="联系人">{{ vendor.contactName || '-' }}</el-descriptions-item>
            <el-descriptions-item label="邮箱">{{ vendor.contactEmail || '-' }}</el-descriptions-item>
            <el-descriptions-item label="电话">{{ vendor.contactPhone || '-' }}</el-descriptions-item>
            <el-descriptions-item label="网站">
              <a v-if="vendor.website" :href="vendor.website" target="_blank">{{ vendor.website }}</a>
              <span v-else>-</span>
            </el-descriptions-item>
            <el-descriptions-item label="地址" :span="2">{{ vendor.address || '-' }}</el-descriptions-item>
            <el-descriptions-item label="注册号">{{ vendor.registrationNo || '-' }}</el-descriptions-item>
            <el-descriptions-item label="税号">{{ vendor.taxId || '-' }}</el-descriptions-item>
            <el-descriptions-item label="服务范围" :span="2">
              <el-tag v-for="s in vendor.serviceScope" :key="s" size="small" class="scope-tag">{{ s }}</el-tag>
              <span v-if="!vendor.serviceScope?.length">-</span>
            </el-descriptions-item>
          </el-descriptions>

          <div class="section-actions">
            <el-button type="primary" @click="showEditDialog = true">编辑信息</el-button>
            <el-button type="danger" plain @click="handleDelete">删除供应商</el-button>
          </div>
        </el-tab-pane>

        <!-- 合同 -->
        <el-tab-pane label="合同" name="contract">
          <el-descriptions :column="2" border>
            <el-descriptions-item label="合同开始">{{ vendor.contractStart ? new Date(vendor.contractStart).toLocaleDateString('zh-CN') : '-' }}</el-descriptions-item>
            <el-descriptions-item label="合同结束">{{ vendor.contractEnd ? new Date(vendor.contractEnd).toLocaleDateString('zh-CN') : '-' }}</el-descriptions-item>
            <el-descriptions-item label="合同条款" :span="2">
              <div class="contract-terms" v-if="vendor.contractTerms">{{ vendor.contractTerms }}</div>
              <span v-else>未设置合同条款</span>
            </el-descriptions-item>
          </el-descriptions>
        </el-tab-pane>

        <!-- 项目分配 -->
        <el-tab-pane label="项目分配" name="assignments">
          <div class="assignment-header">
            <el-button type="primary" size="small" :icon="Plus" @click="showAssignDialog = true">分配到项目</el-button>
          </div>
          <el-table :data="vendor.assignments" stripe>
            <el-table-column prop="projectId" label="项目ID" width="200" />
            <el-table-column prop="role" label="角色" width="160" />
            <el-table-column prop="status" label="状态" width="120">
              <template #default="{ row }">
                <el-tag :type="row.status === 'ACTIVE' ? 'success' : 'info'" size="small">{{ row.status }}</el-tag>
              </template>
            </el-table-column>
            <el-table-column prop="fee" label="费用" width="120" align="right">
              <template #default="{ row }">
                {{ row.fee ? `${row.currency} ${Number(row.fee).toLocaleString('en', { minimumFractionDigits: 2 })}` : '-' }}
              </template>
            </el-table-column>
            <el-table-column prop="notes" label="备注" min-width="200" />
            <el-table-column label="操作" width="100">
              <template #default="{ row }">
                <el-button link type="danger" size="small" @click="removeAssignment(row.id)">移除</el-button>
              </template>
            </el-table-column>
          </el-table>
        </el-tab-pane>

        <!-- 备注 -->
        <el-tab-pane label="备注" name="notes">
          <el-input v-model="notesContent" type="textarea" :rows="8" placeholder="供应商备注..." />
          <el-button type="primary" style="margin-top: 12px" @click="saveNotes" :loading="actionLoading">保存备注</el-button>
        </el-tab-pane>
      </el-tabs>
    </template>

    <!-- 编辑弹窗 -->
    <el-dialog v-model="showEditDialog" title="编辑供应商信息" width="600px" destroy-on-close>
      <el-form :model="editForm" label-width="100px">
        <el-form-item label="名称"><el-input v-model="editForm.name" /></el-form-item>
        <el-form-item label="类型">
          <el-select v-model="editForm.type" style="width: 100%">
            <el-option v-for="t in vendorTypes" :key="t.value" :label="t.label" :value="t.value" />
          </el-select>
        </el-form-item>
        <el-row :gutter="16">
          <el-col :span="12"><el-form-item label="联系人"><el-input v-model="editForm.contactName" /></el-form-item></el-col>
          <el-col :span="12"><el-form-item label="邮箱"><el-input v-model="editForm.contactEmail" /></el-form-item></el-col>
        </el-row>
        <el-row :gutter="16">
          <el-col :span="12"><el-form-item label="电话"><el-input v-model="editForm.contactPhone" /></el-form-item></el-col>
          <el-col :span="12"><el-form-item label="网站"><el-input v-model="editForm.website" /></el-form-item></el-col>
        </el-row>
        <el-form-item label="地址"><el-input v-model="editForm.address" /></el-form-item>
        <el-form-item label="状态">
          <el-select v-model="editForm.status" style="width: 100%">
            <el-option label="活跃" value="ACTIVE" />
            <el-option label="非活跃" value="INACTIVE" />
            <el-option label="黑名单" value="BLACKLISTED" />
          </el-select>
        </el-form-item>
      </el-form>
      <template #footer>
        <el-button @click="showEditDialog = false">取消</el-button>
        <el-button type="primary" @click="saveEdit" :loading="actionLoading">保存</el-button>
      </template>
    </el-dialog>

    <!-- 分配弹窗 -->
    <el-dialog v-model="showAssignDialog" title="分配到项目" width="400px">
      <el-form :model="assignForm" label-width="80px">
        <el-form-item label="项目ID"><el-input v-model="assignForm.projectId" placeholder="粘贴项目ID" /></el-form-item>
        <el-form-item label="角色"><el-input v-model="assignForm.role" placeholder="如：秘书服务" /></el-form-item>
        <el-form-item label="费用"><el-input-number v-model="assignForm.fee" :min="0" :precision="2" style="width: 100%" /></el-form-item>
      </el-form>
      <template #footer>
        <el-button @click="showAssignDialog = false">取消</el-button>
        <el-button type="primary" @click="assignToProject" :loading="actionLoading">分配</el-button>
      </template>
    </el-dialog>
  </div>
</template>

<script setup lang="ts">
import { ref, reactive, onMounted, watch } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { ElMessage, ElMessageBox } from 'element-plus'
import { ArrowLeft, Plus } from '@element-plus/icons-vue'
import { apiClient } from '@/api'

const route = useRoute()
const router = useRouter()

const vendorTypes = [
  { value: 'CORPORATE_SECRETARY', label: '秘书公司' }, { value: 'LAW_FIRM', label: '律师事务所' },
  { value: 'ACCOUNTING_FIRM', label: '会计事务所' }, { value: 'BANK', label: '银行' },
  { value: 'INSURANCE', label: '保险公司' }, { value: 'TRANSLATION', label: '翻译公司' },
  { value: 'LOGISTICS', label: '物流公司' }, { value: 'IT_SERVICE', label: 'IT 服务' },
  { value: 'OTHER', label: '其他' },
]

const getTypeLabel = (t: string) => vendorTypes.find(x => x.value === t)?.label || t

const vendor = ref<any>(null)
const loading = ref(false)
const actionLoading = ref(false)
const activeTab = ref('overview')
const showEditDialog = ref(false)
const showAssignDialog = ref(false)
const notesContent = ref('')

const editForm = reactive({
  name: '', type: '', contactName: '', contactEmail: '',
  contactPhone: '', website: '', address: '', status: '',
})

const assignForm = reactive({ projectId: '', role: '', fee: 0 })

const loadData = async () => {
  loading.value = true
  try {
    const res = await apiClient.get(`/vendors/${route.params.id}`) as any
    vendor.value = res
    notesContent.value = res?.notes || ''
  } catch {
    ElMessage.error('加载失败')
    router.push('/vendors')
  } finally { loading.value = false }
}

watch(() => showEditDialog.value, (v) => {
  if (v && vendor.value) {
    Object.assign(editForm, {
      name: vendor.value.name, type: vendor.value.type, contactName: vendor.value.contactName || '',
      contactEmail: vendor.value.contactEmail || '', contactPhone: vendor.value.contactPhone || '',
      website: vendor.value.website || '', address: vendor.value.address || '', status: vendor.value.status,
    })
  }
})

const saveEdit = async () => {
  actionLoading.value = true
  try {
    await apiClient.put(`/vendors/${vendor.value.id}`, editForm)
    ElMessage.success('更新成功')
    showEditDialog.value = false
    loadData()
  } catch (e: any) { ElMessage.error(e.response?.data?.message || '更新失败') }
  finally { actionLoading.value = false }
}

const saveNotes = async () => {
  actionLoading.value = true
  try {
    await apiClient.put(`/vendors/${vendor.value.id}`, { notes: notesContent.value })
    ElMessage.success('备注已保存')
  } catch { ElMessage.error('保存失败') }
  finally { actionLoading.value = false }
}

const handleRatingChange = async (value: number) => {
  try {
    await apiClient.put(`/vendors/${vendor.value.id}`, { rating: value })
    ElMessage.success('评分已更新')
  } catch { ElMessage.error('更新失败') }
}

const handleDelete = async () => {
  try {
    await ElMessageBox.confirm(`确定要删除供应商「${vendor.value.name}」吗？`, '确认', { type: 'warning' })
    await apiClient.delete(`/vendors/${vendor.value.id}`)
    ElMessage.success('删除成功')
    router.push('/vendors')
  } catch { /* 取消 */ }
}

const assignToProject = async () => {
  if (!assignForm.projectId || !assignForm.role) {
    ElMessage.warning('请填写项目ID和角色')
    return
  }
  actionLoading.value = true
  try {
    await apiClient.post(`/vendors/${vendor.value.id}/assign`, assignForm)
    ElMessage.success('分配成功')
    showAssignDialog.value = false
    Object.assign(assignForm, { projectId: '', role: '', fee: 0 })
    loadData()
  } catch (e: any) { ElMessage.error(e.response?.data?.message || '分配失败') }
  finally { actionLoading.value = false }
}

const removeAssignment = async (id: string) => {
  try {
    await ElMessageBox.confirm('确定移除此分配？', '确认', { type: 'warning' })
    await apiClient.delete(`/vendors/assignments/${id}`)
    ElMessage.success('已移除')
    loadData()
  } catch { /* 取消 */ }
}

onMounted(loadData)
</script>

<style scoped>
.vendor-detail { padding: 20px; max-width: 1000px; margin: 0 auto; }
.page-header { display: flex; align-items: center; gap: 12px; margin-bottom: 20px; }
.page-header h2 { margin: 0; font-size: 22px; }
.scope-tag { margin-right: 6px; margin-bottom: 4px; }
.section-actions { margin-top: 20px; display: flex; gap: 8px; }
.contract-terms { white-space: pre-wrap; line-height: 1.8; }
.assignment-header { margin-bottom: 12px; }
</style>
