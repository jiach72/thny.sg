<template>
  <div class="user-management">
    <div class="page-header">
      <div class="page-header-left">
        <h1 class="page-title">用户管理</h1>
        <p class="page-subtitle">管理系统用户账号与权限分配</p>
      </div>
      <div class="page-header-right">
        <el-button type="primary" @click="showAddDialog = true">
          <el-icon><Plus /></el-icon>
          新增用户
        </el-button>
      </div>
    </div>

    <!-- 搜索过滤 -->
    <el-card class="filter-card" shadow="never">
      <el-form :inline="true" :model="filters">
        <el-form-item label="搜索">
          <el-input v-model="filters.search" placeholder="姓名/邮箱" clearable @change="loadUsers" />
        </el-form-item>
        <el-form-item label="角色">
          <el-select v-model="filters.roleCode" placeholder="全部" clearable @change="loadUsers">
            <el-option v-for="role in roles" :key="role.code" :label="role.name" :value="role.code" />
          </el-select>
        </el-form-item>
        <el-form-item label="状态">
          <el-select v-model="filters.status" placeholder="全部" clearable @change="loadUsers">
            <el-option label="活跃" value="ACTIVE" />
            <el-option label="停用" value="INACTIVE" />
            <el-option label="暂停" value="SUSPENDED" />
          </el-select>
        </el-form-item>
      </el-form>
    </el-card>

    <!-- 用户列表 -->
    <el-card shadow="never">
      <el-table :data="users" v-loading="loading" stripe>
        <el-table-column label="用户" min-width="200">
          <template #default="{ row }">
            <div class="user-cell">
              <el-avatar :size="36">{{ row.name?.[0] }}</el-avatar>
              <div class="user-info">
                <span class="user-name">{{ row.name }}</span>
                <span class="user-email">{{ row.email }}</span>
              </div>
            </div>
          </template>
        </el-table-column>
        <el-table-column label="角色" width="120">
          <template #default="{ row }">
            <el-tag :type="getRoleType(row.role?.code)">{{ row.role?.name }}</el-tag>
          </template>
        </el-table-column>
        <el-table-column label="部门" prop="department" width="120" />
        <el-table-column label="状态" width="100">
          <template #default="{ row }">
            <el-tag :type="row.status === 'ACTIVE' ? 'success' : 'info'" size="small">
              {{ row.status === 'ACTIVE' ? '活跃' : row.status === 'INACTIVE' ? '停用' : '暂停' }}
            </el-tag>
          </template>
        </el-table-column>
        <el-table-column label="创建时间" width="160">
          <template #default="{ row }">
            {{ formatDate(row.createdAt) }}
          </template>
        </el-table-column>
        <el-table-column label="操作" width="150" fixed="right">
          <template #default="{ row }">
            <el-button type="primary" text size="small" @click="editUser(row)">编辑</el-button>
            <el-button 
              :type="row.status === 'ACTIVE' ? 'warning' : 'success'" 
              text 
              size="small"
              @click="toggleStatus(row)"
            >
              {{ row.status === 'ACTIVE' ? '停用' : '启用' }}
            </el-button>
          </template>
        </el-table-column>
      </el-table>
    </el-card>

    <!-- 新增/编辑用户对话框 -->
    <el-dialog 
      v-model="showAddDialog" 
      :title="editingUser ? '编辑用户' : '新增用户'" 
      width="500px"
      @closed="resetForm"
    >
      <el-form ref="formRef" :model="form" :rules="rules" label-width="80px">
        <el-form-item label="姓名" prop="name">
          <el-input v-model="form.name" placeholder="请输入姓名" />
        </el-form-item>
        <el-form-item label="邮箱" prop="email">
          <el-input v-model="form.email" placeholder="请输入邮箱" :disabled="!!editingUser" />
        </el-form-item>
        <el-form-item label="角色" prop="roleId">
          <el-select v-model="form.roleId" placeholder="请选择角色" style="width: 100%">
            <el-option v-for="role in roles" :key="role.id" :label="role.name" :value="role.id" />
          </el-select>
        </el-form-item>
        <el-form-item label="部门">
          <el-input v-model="form.department" placeholder="请输入部门" />
        </el-form-item>
        <el-form-item v-if="!editingUser" label="密码" prop="password">
          <el-input v-model="form.password" type="password" placeholder="请输入密码" show-password />
        </el-form-item>
      </el-form>
      <template #footer>
        <el-button @click="showAddDialog = false">取消</el-button>
        <el-button type="primary" :loading="submitting" @click="submitForm">确定</el-button>
      </template>
    </el-dialog>
  </div>
</template>

<script setup lang="ts">
import { ref, reactive, onMounted } from 'vue'
import { Plus } from '@element-plus/icons-vue'
import { ElMessage, ElMessageBox } from 'element-plus'
import { apiClient } from '@/api'

interface Role {
  id: string
  code: string
  name: string
}

interface User {
  id: string
  name: string
  email: string
  role?: Role
  roleId: string
  department?: string
  status: string
  createdAt: string
}

const loading = ref(false)
const submitting = ref(false)
const showAddDialog = ref(false)
const editingUser = ref<User | null>(null)
const users = ref<User[]>([])
const roles = ref<Role[]>([])
const formRef = ref()

const filters = reactive({
  search: '',
  roleCode: '',
  status: '',
})

const form = reactive({
  name: '',
  email: '',
  roleId: '',
  department: '',
  password: '',
})

const rules = {
  name: [{ required: true, message: '请输入姓名', trigger: 'blur' }],
  email: [
    { required: true, message: '请输入邮箱', trigger: 'blur' },
    { type: 'email', message: '请输入有效的邮箱地址', trigger: 'blur' },
  ],
  roleId: [{ required: true, message: '请选择角色', trigger: 'change' }],
  password: [{ required: true, message: '请输入密码', trigger: 'blur', min: 8 }],
}

onMounted(() => {
  loadRoles()
  loadUsers()
})

async function loadRoles() {
  try {
    const res = await apiClient.get('/rbac/roles') as any
    roles.value = res.data || []
  } catch (error) {
    console.error('加载角色失败:', error)
  }
}

async function loadUsers() {
  loading.value = true
  try {
    const params = new URLSearchParams()
    if (filters.search) params.append('search', filters.search)
    if (filters.roleCode) params.append('roleCode', filters.roleCode)
    if (filters.status) params.append('status', filters.status)
    
    const res = await apiClient.get(`/users?${params}`) as any
    users.value = res.data || res || []
  } catch (error) {
    console.error('加载用户失败:', error)
    users.value = []
  } finally {
    loading.value = false
  }
}

function editUser(user: User) {
  editingUser.value = user
  form.name = user.name
  form.email = user.email
  form.roleId = user.roleId
  form.department = user.department || ''
  form.password = ''
  showAddDialog.value = true
}

async function submitForm() {
  if (!formRef.value) return
  
  const valid = await formRef.value.validate().catch(() => false)
  if (!valid) return

  submitting.value = true
  try {
    if (editingUser.value) {
      await apiClient.put(`/users/${editingUser.value.id}`, {
        name: form.name,
        roleId: form.roleId,
        department: form.department,
      })
      ElMessage.success('用户更新成功')
    } else {
      await apiClient.post('/users', {
        name: form.name,
        email: form.email,
        roleId: form.roleId,
        department: form.department,
        password: form.password,
      })
      ElMessage.success('用户创建成功')
    }
    showAddDialog.value = false
    loadUsers()
  } catch (error: unknown) {
    ElMessage.error((error as Error).message || '操作失败')
  } finally {
    submitting.value = false
  }
}

async function toggleStatus(user: User) {
  const newStatus = user.status === 'ACTIVE' ? 'INACTIVE' : 'ACTIVE'
  const action = newStatus === 'ACTIVE' ? '启用' : '停用'
  
  try {
    await ElMessageBox.confirm(`确定要${action}用户 "${user.name}" 吗？`, '确认操作', { type: 'warning' })
    await apiClient.put(`/users/${user.id}`, { status: newStatus })
    ElMessage.success(`${action}成功`)
    loadUsers()
  } catch (error: unknown) {
    if (error !== 'cancel') {
      ElMessage.error((error as Error).message || '操作失败')
    }
  }
}

function resetForm() {
  editingUser.value = null
  form.name = ''
  form.email = ''
  form.roleId = ''
  form.department = ''
  form.password = ''
}

function formatDate(date: string) {
  return new Date(date).toLocaleDateString('zh-CN', {
    year: 'numeric', month: '2-digit', day: '2-digit',
    hour: '2-digit', minute: '2-digit'
  })
}

function getRoleType(code?: string) {
  const map: Record<string, string> = {
    ADMIN: 'danger',
    MANAGER: 'warning',
    SALES: 'success',
    DELIVERY: 'primary',
    CUSTOMER: 'info',
  }
  return map[code || ''] || 'info'
}
</script>

<style scoped>
.user-management {
  max-width: 1400px;
}

.page-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 24px;
}

.page-header h1 {
  font-size: 24px;
  font-weight: 700;
  color: var(--color-text);
  margin: 0;
}

.filter-card {
  margin-bottom: 16px;
}

.user-cell {
  display: flex;
  align-items: center;
  gap: 12px;
}

.user-info {
  display: flex;
  flex-direction: column;
}

.user-name {
  font-weight: 600;
  color: var(--color-text);
}

.user-email {
  font-size: 12px;
  color: var(--color-text-muted);
}
</style>
