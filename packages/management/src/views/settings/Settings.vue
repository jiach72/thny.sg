<template>
  <div class="settings">
    <h2 class="page-title">系统设置</h2>

    <el-row :gutter="24">
      <el-col :span="16">
        <el-card>
          <template #header>
            <span>个人信息</span>
          </template>
          <el-form label-width="100px">
            <el-form-item label="用户名">
              <el-input :value="user?.name" disabled />
            </el-form-item>
            <el-form-item label="邮箱">
              <el-input :value="user?.email" disabled />
            </el-form-item>
            <el-form-item label="角色">
              <el-tag>{{ getRoleLabel(user?.role || '') }}</el-tag>
            </el-form-item>
          </el-form>
        </el-card>

        <el-card style="margin-top: 24px;">
          <template #header>
            <span>修改密码</span>
          </template>
          <el-form label-width="100px">
            <el-form-item label="当前密码">
              <el-input type="password" placeholder="请输入当前密码" show-password />
            </el-form-item>
            <el-form-item label="新密码">
              <el-input type="password" placeholder="请输入新密码" show-password />
            </el-form-item>
            <el-form-item label="确认密码">
              <el-input type="password" placeholder="请确认新密码" show-password />
            </el-form-item>
            <el-form-item>
              <el-button type="primary" disabled>修改密码</el-button>
            </el-form-item>
          </el-form>
        </el-card>

        <!-- 数据管理 -->
        <el-card v-if="isAdmin" style="margin-top: 24px;" class="purge-card">
          <template #header>
            <div class="purge-header">
              <span>数据管理</span>
              <el-tag v-if="purgeStatus.environment" :type="purgeStatus.environment === 'production' ? 'danger' : 'info'" size="small">
                {{ purgeStatus.environment === 'production' ? '生产环境' : '开发环境' }}
              </el-tag>
            </div>
          </template>

          <div v-loading="statusLoading">
            <!-- 数据统计 -->
            <div v-if="purgeStatus.dataCounts" class="test-data-stats">
              <h4 style="margin: 0 0 12px; color: #606266;">当前数据统计</h4>
              <el-descriptions :column="3" size="small" border>
                <el-descriptions-item label="用户">{{ purgeStatus.dataCounts.users }}</el-descriptions-item>
                <el-descriptions-item label="线索">{{ purgeStatus.dataCounts.leads }}</el-descriptions-item>
                <el-descriptions-item label="项目">{{ purgeStatus.dataCounts.projects }}</el-descriptions-item>
                <el-descriptions-item label="任务">{{ purgeStatus.dataCounts.tasks }}</el-descriptions-item>
                <el-descriptions-item label="文档">{{ purgeStatus.dataCounts.documents }}</el-descriptions-item>
                <el-descriptions-item label="咨询">{{ purgeStatus.dataCounts.inquiries }}</el-descriptions-item>
                <el-descriptions-item label="预约">{{ purgeStatus.dataCounts.appointments }}</el-descriptions-item>
                <el-descriptions-item label="客户">{{ purgeStatus.dataCounts.customers }}</el-descriptions-item>
                <el-descriptions-item label="发票">{{ purgeStatus.dataCounts.invoices }}</el-descriptions-item>
                <el-descriptions-item label="付款">{{ purgeStatus.dataCounts.payments }}</el-descriptions-item>
                <el-descriptions-item label="供应商">{{ purgeStatus.dataCounts.vendors }}</el-descriptions-item>
                <el-descriptions-item label="报销">{{ purgeStatus.dataCounts.claims }}</el-descriptions-item>
                <el-descriptions-item label="新闻">{{ purgeStatus.dataCounts.newsArticles }}</el-descriptions-item>
              </el-descriptions>
            </div>

            <!-- 危险操作警告 -->
            <el-alert
              type="error"
              show-icon
              :closable="false"
              style="margin-top: 16px;"
            >
              <template #title>危险操作：清除所有数据</template>
              <template #default>
                此操作将永久删除系统中所有业务数据（包括客户、项目、线索、文档等），仅保留角色权限配置和当前管理员账号。此操作不可逆！
              </template>
            </el-alert>

            <!-- 操作按钮 -->
            <div class="purge-actions">
              <el-button @click="refreshStatus" :loading="statusLoading" size="small">
                刷新状态
              </el-button>
              <el-button type="danger" :loading="purgeLoading" size="small" @click="handlePurge">
                清除所有数据
              </el-button>
            </div>
          </div>
        </el-card>
      </el-col>
      
      <el-col :span="8">
        <el-card>
          <template #header>
            <span>系统信息</span>
          </template>
          <el-descriptions :column="1">
            <el-descriptions-item label="版本">v1.0.0</el-descriptions-item>
            <el-descriptions-item label="环境">开发环境</el-descriptions-item>
            <el-descriptions-item label="API 地址">/api/v1</el-descriptions-item>
          </el-descriptions>
        </el-card>
      </el-col>
    </el-row>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted } from 'vue'
import { storeToRefs } from 'pinia'
import { ElMessage, ElMessageBox } from 'element-plus'
import { useAuthStore } from '@/stores'
import { systemApi } from '@/api'

const authStore = useAuthStore()
const { user } = storeToRefs(authStore)

const isAdmin = computed(() => user.value?.role === 'ADMIN')

function getRoleLabel(role: string): string {
  const map: Record<string, string> = {
    ADMIN: '管理员',
    MANAGER: '经理',
    SALES: '销售顾问',
    DELIVERY: '交付经理',
    COMPLIANCE: '合规专员',
    FINANCE: '财务专员',
    CUSTOMER: '客户',
  }
  return map[role] || role
}

// ========== 数据管理 ==========
interface DataStatus {
  dataCounts: Record<string, number>
  confirmCode: string
  environment: string
}

const statusLoading = ref(false)
const purgeLoading = ref(false)
const purgeStatus = ref<DataStatus>({
  dataCounts: {},
  confirmCode: '',
  environment: '',
})

async function refreshStatus() {
  if (!isAdmin.value) return
  statusLoading.value = true
  try {
    const result = await systemApi.getDataStatus() as any
    purgeStatus.value = result
  } catch (e: any) {
    ElMessage.error('获取数据状态失败：' + (e.message || '未知错误'))
  } finally {
    statusLoading.value = false
  }
}

async function handlePurge() {
  try {
    await ElMessageBox.confirm(
      '此操作将永久清除系统中所有业务数据，仅保留角色权限配置和当前管理员账号。此操作不可逆！',
      '警告',
      {
        confirmButtonText: '我知道了，继续',
        cancelButtonText: '取消',
        type: 'warning',
      }
    )

    // 二次确认：要求输入动态确认码
    const confirmCode = purgeStatus.value.confirmCode
    await ElMessageBox.prompt(
      `请输入确认码以执行清除操作：${confirmCode}`,
      '二次确认',
      {
        confirmButtonText: '执行清除',
        cancelButtonText: '取消',
        type: 'warning',
        inputPattern: new RegExp(`^${confirmCode.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}$`),
        inputErrorMessage: `确认码不匹配，请输入：${confirmCode}`,
      }
    )

    purgeLoading.value = true
    const result = await systemApi.purgeAllData(confirmCode) as any
    ElMessage.success(result.message || `已成功清除 ${result.totalDeleted} 条数据`)
    await refreshStatus()
  } catch (e: any) {
    if (e !== 'cancel' && e?.message !== 'cancel') {
      ElMessage.error('清除数据失败：' + (e.response?.data?.error?.message || e.message || '未知错误'))
    }
  } finally {
    purgeLoading.value = false
  }
}

onMounted(() => {
  if (isAdmin.value) refreshStatus()
})
</script>

<style scoped>
.settings {
  max-width: 1000px;
}

.page-title {
  font-size: 24px;
  font-weight: 600;
  color: #333;
  margin: 0 0 24px;
}

.purge-card :deep(.el-card__header) {
  padding: 12px 20px;
}

.purge-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
}

.test-data-stats {
  margin-bottom: 16px;
}

.purge-actions {
  display: flex;
  justify-content: flex-end;
  gap: 12px;
  margin-top: 16px;
  padding-top: 16px;
  border-top: 1px solid #ebeef5;
}
</style>
