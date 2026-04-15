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

        <!-- 一键清除测试数据 -->
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
            <!-- 测试数据统计 -->
            <div v-if="purgeStatus.testDataCounts" class="test-data-stats">
              <h4 style="margin: 0 0 12px; color: #606266;">当前测试数据统计</h4>
              <el-descriptions :column="3" size="small" border>
                <el-descriptions-item label="用户">{{ purgeStatus.testDataCounts.users }}</el-descriptions-item>
                <el-descriptions-item label="线索">{{ purgeStatus.testDataCounts.leads }}</el-descriptions-item>
                <el-descriptions-item label="项目">{{ purgeStatus.testDataCounts.projects }}</el-descriptions-item>
                <el-descriptions-item label="任务">{{ purgeStatus.testDataCounts.tasks }}</el-descriptions-item>
                <el-descriptions-item label="文档">{{ purgeStatus.testDataCounts.documents }}</el-descriptions-item>
                <el-descriptions-item label="咨询">{{ purgeStatus.testDataCounts.inquiries }}</el-descriptions-item>
                <el-descriptions-item label="预约">{{ purgeStatus.testDataCounts.appointments }}</el-descriptions-item>
              </el-descriptions>
            </div>

            <!-- 真实数据警告 -->
            <el-alert
              v-if="purgeStatus.hasRealData"
              type="warning"
              show-icon
              :closable="false"
              style="margin-top: 16px;"
            >
              <template #title>检测到真实业务数据，清除功能已自动禁用</template>
              <template #default>
                <ul style="margin: 4px 0 0; padding-left: 18px;">
                  <li v-for="(w, i) in purgeStatus.realDataWarnings" :key="i">{{ w }}</li>
                </ul>
              </template>
            </el-alert>

            <!-- 生产环境警告 -->
            <el-alert
              v-if="purgeStatus.environment === 'production'"
              type="error"
              show-icon
              :closable="false"
              style="margin-top: 16px;"
              title="生产环境严禁执行数据清除操作"
            />

            <!-- 操作按钮 -->
            <div class="purge-actions">
              <el-button @click="refreshStatus" :loading="statusLoading" size="small">
                刷新状态
              </el-button>
              <el-popconfirm
                v-if="purgeStatus.canPurge"
                title="此操作将永久清除所有测试数据且不可恢复，确定继续吗？"
                confirm-button-text="确定清除"
                cancel-button-text="取消"
                confirm-button-type="danger"
                @confirm="handlePurge"
              >
                <template #reference>
                  <el-button type="danger" :loading="purgeLoading" size="small">
                    一键清除所有测试数据
                  </el-button>
                </template>
              </el-popconfirm>
              <el-tooltip v-else content="当前条件不满足，无法执行清除操作" placement="top">
                <el-button type="danger" disabled size="small">
                  一键清除所有测试数据
                </el-button>
              </el-tooltip>
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

// ========== 测试数据清除 ==========
interface TestStatus {
  canPurge: boolean
  hasRealData: boolean
  realDataWarnings: string[]
  testDataCounts: Record<string, number>
  environment: string
}

const statusLoading = ref(false)
const purgeLoading = ref(false)
const purgeStatus = ref<TestStatus>({
  canPurge: false,
  hasRealData: false,
  realDataWarnings: [],
  testDataCounts: {},
  environment: '',
})

async function refreshStatus() {
  if (!isAdmin.value) return
  statusLoading.value = true
  try {
    const result = await systemApi.getTestDataStatus() as any
    purgeStatus.value = result
  } catch (e: any) {
    ElMessage.error('获取测试数据状态失败：' + (e.message || '未知错误'))
  } finally {
    statusLoading.value = false
  }
}

async function handlePurge() {
  try {
    await ElMessageBox.prompt(
      '此操作不可逆！请输入 "确认清除" 以继续：',
      '二次确认',
      {
        confirmButtonText: '执行清除',
        cancelButtonText: '取消',
        type: 'warning',
        inputPattern: /^确认清除$/,
        inputErrorMessage: '请输入"确认清除"以确认操作',
      }
    )

    purgeLoading.value = true
    const result = await systemApi.purgeTestData() as any
    ElMessage.success(result.message || `已成功清除 ${result.totalDeleted} 条测试数据`)
    await refreshStatus()
  } catch (e: any) {
    if (e !== 'cancel' && e?.message !== 'cancel') {
      ElMessage.error('清除测试数据失败：' + (e.response?.data?.error?.message || e.message || '未知错误'))
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
