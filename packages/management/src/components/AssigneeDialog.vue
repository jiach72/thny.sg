<template>
  <el-dialog
    :model-value="visible"
    title="分配负责人"
    width="500px"
    @update:model-value="$emit('update:visible', $event)"
    @open="loadUsers"
  >
    <div class="assignee-dialog-content">
      <el-input
        v-model="searchQuery"
        placeholder="搜索姓名或邮箱..."
        prefix-icon="Search"
        clearable
        class="search-input"
        @input="handleSearch"
      />

      <div class="user-list" v-loading="loading">
        <div
          v-for="user in filteredUsers"
          :key="user.id"
          class="user-item"
          :class="{ active: selectedId === user.id }"
          @click="selectedId = user.id"
        >
          <div class="user-info">
            <el-avatar :size="32" :src="user.avatarUrl">{{ user.name.charAt(0) }}</el-avatar>
            <div class="text-info">
              <div class="name">
                {{ user.name }}
                <el-tag v-if="user.id === currentAssigneeId" size="small" type="info" effect="plain">当前负责人</el-tag>
              </div>
              <div class="email">{{ user.email }}</div>
            </div>
          </div>
          <el-icon v-if="selectedId === user.id" class="check-icon"><Check /></el-icon>
        </div>
        
        <el-empty v-if="filteredUsers.length === 0 && !loading" description="未找到匹配的用户" :image-size="60" />
      </div>

      <div class="dialog-footer">
        <el-input
          v-model="reason"
          type="textarea"
          :rows="2"
          placeholder="填写分配原因（可选）"
          class="reason-input"
        />
        <div class="buttons">
          <el-button @click="$emit('update:visible', false)">取消</el-button>
          <el-button type="primary" :disabled="!selectedId" :loading="submitting" @click="handleConfirm">
            确认分配
          </el-button>
        </div>
      </div>
    </div>
  </el-dialog>
</template>

<script setup lang="ts">
import { computed, ref } from 'vue'
import { Check } from '@element-plus/icons-vue'
import { userApi } from '@/api'
import type { User } from '@/api/userApi'

const props = defineProps<{
  visible: boolean
  currentAssigneeId?: string
}>()

const emit = defineEmits<{
  (e: 'update:visible', value: boolean): void
  (e: 'confirm', payload: { userId: string; reason: string }): void
}>()

const loading = ref(false)
const submitting = ref(false)
const users = ref<User[]>([])
const searchQuery = ref('')
const selectedId = ref('')
const reason = ref('')

// Load users
async function loadUsers() {
  loading.value = true
  selectedId.value = props.currentAssigneeId || ''
  reason.value = ''
  try {
    const result = await userApi.getList({ status: 'ACTIVE' })
    // The result from userApi.getList might be either an array directly or an object with data property
    users.value = Array.isArray(result) ? result : (result as any).data || []
  } catch (error) {
    console.error('Failed to load users', error)
  } finally {
    loading.value = false
  }
}

// Filter users locally
const filteredUsers = computed(() => {
  if (!searchQuery.value) return users.value
  const query = searchQuery.value.toLowerCase()
  return users.value.filter(u => 
    u.name.toLowerCase().includes(query) || 
    u.email.toLowerCase().includes(query)
  )
})

function handleSearch() {
  // Local filtering is responsive enough
}

function handleConfirm() {
  if (!selectedId.value) return
  submitting.value = true
  emit('confirm', { userId: selectedId.value, reason: reason.value })
  // Parent should handle closing logic based on success
}
</script>

<style scoped>
.assignee-dialog-content {
  display: flex;
  flex-direction: column;
  gap: 16px;
}

.search-input {
  margin-bottom: 8px;
}

.user-list {
  max-height: 300px;
  overflow-y: auto;
  border: 1px solid #e2e8f0;
  border-radius: 8px;
}

.user-item {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 10px 16px;
  cursor: pointer;
  transition: all 0.2s;
  border-bottom: 1px solid #f1f5f9;
}

.user-item:last-child {
  border-bottom: none;
}

.user-item:hover {
  background-color: #f8fafc;
}

.user-item.active {
  background-color: #eff6ff;
}

.user-info {
  display: flex;
  align-items: center;
  gap: 12px;
}

.text-info {
  display: flex;
  flex-direction: column;
}

.text-info .name {
  font-weight: 500;
  color: #334155;
  font-size: 14px;
  display: flex;
  align-items: center;
  gap: 8px;
}

.text-info .email {
  font-size: 12px;
  color: #94a3b8;
}

.check-icon {
  color: #3b82f6;
}

.dialog-footer {
  display: flex;
  flex-direction: column;
  gap: 16px;
  margin-top: 8px;
}

.buttons {
  display: flex;
  justify-content: flex-end;
  gap: 12px;
}
</style>
