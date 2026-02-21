<template>
  <div class="role-permissions">
    <div class="page-header">
      <div class="page-header-left">
        <h1 class="page-title">角色权限管理</h1>
        <p class="page-subtitle">配置系统角色与访问权限</p>
      </div>
      <div class="page-header-right">
        <el-button type="primary" @click="showAddRoleDialog = true">
          <el-icon><Plus /></el-icon>
          新增角色
        </el-button>
      </div>
    </div>

    <div class="role-container">
      <!-- 左侧角色列表 -->
      <el-card class="role-list-card" shadow="never">
        <template #header>
          <span>角色列表</span>
        </template>
        <div class="role-list">
          <div 
            v-for="role in roles" 
            :key="role.id" 
            class="role-item"
            :class="{ active: selectedRole?.id === role.id }"
            @click="selectRole(role)"
          >
            <div class="role-info">
              <span class="role-name">{{ role.name }}</span>
              <span class="role-code">{{ role.code }}</span>
            </div>
            <el-tag v-if="role.isSystem" type="info" size="small">系统</el-tag>
          </div>
        </div>
      </el-card>

      <!-- 右侧权限配置 -->
      <el-card class="permission-card" shadow="never" v-loading="loadingPermissions">
        <template #header>
          <div class="permission-header">
            <span>{{ selectedRole?.name || '请选择角色' }} - 权限配置</span>
            <el-button 
              v-if="selectedRole && !isAdmin" 
              type="primary" 
              size="small"
              :loading="saving"
              @click="savePermissions"
            >
              保存权限
            </el-button>
          </div>
        </template>

        <div v-if="!selectedRole" class="empty-state">
          <el-empty description="请从左侧选择一个角色" />
        </div>

        <div v-else-if="isAdmin" class="admin-notice">
          <el-alert type="warning" :closable="false" show-icon>
            <template #title>管理员拥有系统所有权限，无需配置</template>
          </el-alert>
        </div>

        <div v-else class="permission-groups">
          <div v-for="(perms, resource) in groupedPermissions" :key="resource" class="permission-group">
            <div class="group-header">
              <el-checkbox 
                :model-value="isGroupChecked(resource as string)" 
                :indeterminate="isGroupIndeterminate(resource as string)"
                @change="toggleGroup(resource as string, $event as boolean)"
              >
                {{ getResourceName(resource as string) }}
              </el-checkbox>
            </div>
            <div class="group-items">
              <el-checkbox 
                v-for="perm in perms" 
                :key="perm.code"
                :model-value="selectedPermissions.has(perm.code)"
                @change="togglePermission(perm.code, $event as boolean)"
              >
                {{ perm.name }}
              </el-checkbox>
            </div>
          </div>
        </div>
      </el-card>
    </div>

    <!-- 新增角色对话框 -->
    <el-dialog v-model="showAddRoleDialog" title="新增角色" width="400px">
      <el-form ref="roleFormRef" :model="roleForm" :rules="roleRules" label-width="80px">
        <el-form-item label="角色代码" prop="code">
          <el-input v-model="roleForm.code" placeholder="如 TEAM_LEADER" />
        </el-form-item>
        <el-form-item label="角色名称" prop="name">
          <el-input v-model="roleForm.name" placeholder="如 组长" />
        </el-form-item>
        <el-form-item label="描述">
          <el-input v-model="roleForm.description" type="textarea" placeholder="角色描述" />
        </el-form-item>
      </el-form>
      <template #footer>
        <el-button @click="showAddRoleDialog = false">取消</el-button>
        <el-button type="primary" :loading="creatingRole" @click="createRole">创建</el-button>
      </template>
    </el-dialog>
  </div>
</template>

<script setup lang="ts">
import { ref, reactive, computed, onMounted } from 'vue'
import { Plus } from '@element-plus/icons-vue'
import { ElMessage } from 'element-plus'
import { apiClient } from '@/api'

interface Role {
  id: string
  code: string
  name: string
  description?: string
  isSystem: boolean
}

interface Permission {
  id: string
  code: string
  name: string
  resource: string
  action: string
}

const roles = ref<Role[]>([])
const allPermissions = ref<Permission[]>([])
const selectedRole = ref<Role | null>(null)
const selectedPermissions = ref<Set<string>>(new Set())
const loadingPermissions = ref(false)
const saving = ref(false)
const showAddRoleDialog = ref(false)
const creatingRole = ref(false)
const roleFormRef = ref()

const roleForm = reactive({
  code: '',
  name: '',
  description: '',
})

const roleRules = {
  code: [{ required: true, message: '请输入角色代码', trigger: 'blur' }],
  name: [{ required: true, message: '请输入角色名称', trigger: 'blur' }],
}

const isAdmin = computed(() => selectedRole.value?.code === 'ADMIN')

const groupedPermissions = computed(() => {
  const groups: Record<string, Permission[]> = {}
  for (const perm of allPermissions.value) {
    if (!groups[perm.resource]) {
      groups[perm.resource] = []
    }
    groups[perm.resource].push(perm)
  }
  return groups
})

onMounted(() => {
  loadRoles()
  loadAllPermissions()
})

async function loadRoles() {
  try {
    const res = await apiClient.get('/rbac/roles') as any
    roles.value = res.data || []
  } catch (error) {
    console.error('加载角色失败:', error)
  }
}

async function loadAllPermissions() {
  try {
    const res = await apiClient.get('/rbac/permissions') as any
    allPermissions.value = res.data || []
  } catch (error) {
    console.error('加载权限失败:', error)
  }
}

async function selectRole(role: Role) {
  selectedRole.value = role
  loadingPermissions.value = true
  
  try {
    const res = await apiClient.get(`/rbac/roles/${role.code}/permissions`) as any
    selectedPermissions.value = new Set(res.data || [])
  } catch (error) {
    console.error('加载角色权限失败:', error)
    selectedPermissions.value = new Set()
  } finally {
    loadingPermissions.value = false
  }
}

function togglePermission(code: string, checked: boolean) {
  if (checked) {
    selectedPermissions.value.add(code)
  } else {
    selectedPermissions.value.delete(code)
  }
  // 触发响应式更新
  selectedPermissions.value = new Set(selectedPermissions.value)
}

function isGroupChecked(resource: string): boolean {
  const perms = groupedPermissions.value[resource] || []
  return perms.every(p => selectedPermissions.value.has(p.code))
}

function isGroupIndeterminate(resource: string): boolean {
  const perms = groupedPermissions.value[resource] || []
  const checked = perms.filter(p => selectedPermissions.value.has(p.code)).length
  return checked > 0 && checked < perms.length
}

function toggleGroup(resource: string, checked: boolean) {
  const perms = groupedPermissions.value[resource] || []
  for (const perm of perms) {
    if (checked) {
      selectedPermissions.value.add(perm.code)
    } else {
      selectedPermissions.value.delete(perm.code)
    }
  }
  selectedPermissions.value = new Set(selectedPermissions.value)
}

async function savePermissions() {
  if (!selectedRole.value) return
  
  saving.value = true
  try {
    await apiClient.put(`/rbac/roles/${selectedRole.value.code}/permissions`, {
      permissionCodes: Array.from(selectedPermissions.value)
    })
    ElMessage.success('权限保存成功')
  } catch (error: unknown) {
    ElMessage.error((error as Error).message || '保存失败')
  } finally {
    saving.value = false
  }
}

async function createRole() {
  const valid = await roleFormRef.value?.validate().catch(() => false)
  if (!valid) return

  creatingRole.value = true
  try {
    await apiClient.post('/rbac/roles', roleForm)
    ElMessage.success('角色创建成功')
    showAddRoleDialog.value = false
    roleForm.code = ''
    roleForm.name = ''
    roleForm.description = ''
    loadRoles()
  } catch (error: unknown) {
    ElMessage.error((error as Error).message || '创建失败')
  } finally {
    creatingRole.value = false
  }
}

function getResourceName(resource: string): string {
  const map: Record<string, string> = {
    leads: '线索管理',
    customers: '客户管理',
    projects: '项目管理',
    tasks: '任务管理',
    documents: '文档管理',
    messages: '消息管理',
    users: '用户管理',
    rbac: '权限管理',
  }
  return map[resource] || resource
}
</script>

<style scoped>
.role-permissions {
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

.role-container {
  display: grid;
  grid-template-columns: 280px 1fr;
  gap: 16px;
}

.role-list-card {
  height: fit-content;
}

.role-list {
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.role-item {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 12px 16px;
  border-radius: var(--radius-sm);
  cursor: pointer;
  transition: all 0.2s;
  border: 1px solid transparent;
}

.role-item:hover {
  background: var(--color-surface-hover);
}

.role-item.active {
  background: rgba(8, 145, 178, 0.1);
  border-color: var(--color-primary);
}

.role-info {
  display: flex;
  flex-direction: column;
  gap: 2px;
}

.role-name {
  font-weight: 600;
  color: var(--color-text);
}

.role-code {
  font-size: 12px;
  color: var(--color-text-muted);
  font-family: monospace;
}

.permission-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.empty-state, .admin-notice {
  padding: 40px 0;
}

.permission-groups {
  display: flex;
  flex-direction: column;
  gap: 24px;
}

.permission-group {
  border: 1px solid var(--color-border);
  border-radius: var(--radius-sm);
  overflow: hidden;
}

.group-header {
  padding: 12px 16px;
  background: var(--color-surface);
  border-bottom: 1px solid var(--color-border);
  font-weight: 600;
}

.group-items {
  padding: 16px;
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(150px, 1fr));
  gap: 12px;
}
</style>
