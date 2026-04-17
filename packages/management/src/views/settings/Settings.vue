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
import { useAuthStore } from '@/stores'

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

onMounted(() => {
  // 已移除清除数据功能
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

</style>
