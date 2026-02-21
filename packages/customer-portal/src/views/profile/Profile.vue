<template>
  <div class="max-w-6xl mx-auto space-y-8 animate-fade-in-up">
    <!-- 头部 -->
    <div class="flex items-center justify-between">
      <div>
        <h1 class="font-serif text-3xl text-text mb-2">我的资料</h1>
        <p class="text-sm text-text-muted">管理您的个人信息和家庭成员</p>
      </div>
    </div>

    <div class="grid grid-cols-1 lg:grid-cols-3 gap-8">
      <!-- 左侧列: 个人信息 & 密码 -->
      <div class="lg:col-span-2 space-y-8">
        
        <!-- 个人信息卡片 -->
        <div class="p-6 rounded-2xl bg-glass/20 border border-white/5">
          <div class="flex items-center gap-4 mb-6 pb-6 border-b border-white/5">
            <div class="p-3 rounded-lg bg-wealth/10 text-wealth">
              <component :is="User" class="w-6 h-6" />
            </div>
            <div>
              <h2 class="font-serif text-xl text-text">个人信息</h2>
              <p class="text-xs text-text-muted">您的主要联系方式</p>
            </div>
          </div>

          <form @submit.prevent="handleSaveProfile" class="space-y-6">
            <div class="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div class="space-y-2">
                <label class="text-xs font-bold uppercase tracking-wider text-text-muted">姓名</label>
                <input v-model="profileForm.name" type="text" class="w-full bg-white/5 border border-white/10 rounded-lg px-4 py-3 text-text focus:border-wealth focus:bg-white/10 focus:outline-none transition-colors" placeholder="您的姓名" />
              </div>
              <div class="space-y-2">
                <label class="text-xs font-bold uppercase tracking-wider text-text-muted">电子邮箱</label>
                <input :value="user?.email" disabled type="email" class="w-full bg-white/5 border border-white/5 rounded-lg px-4 py-3 text-text-muted cursor-not-allowed" />
              </div>
              <div class="space-y-2">
                <label class="text-xs font-bold uppercase tracking-wider text-text-muted">电话号码</label>
                <input v-model="profileForm.phone" type="tel" class="w-full bg-white/5 border border-white/10 rounded-lg px-4 py-3 text-text focus:border-wealth focus:bg-white/10 focus:outline-none transition-colors" placeholder="+65 ..." />
              </div>
              <div class="space-y-2">
                <label class="text-xs font-bold uppercase tracking-wider text-text-muted">公司/信托</label>
                <input v-model="profileForm.company" type="text" class="w-full bg-white/5 border border-white/10 rounded-lg px-4 py-3 text-text focus:border-wealth focus:bg-white/10 focus:outline-none transition-colors" placeholder="家族办公室名称" />
              </div>
            </div>

            <div class="flex justify-end pt-4">
              <button type="submit" :disabled="savingProfile" class="px-6 py-2.5 bg-wealth hover:bg-[#B49248] text-obsidian font-bold rounded shadow-lg shadow-wealth/20 transition-all active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2">
                <span v-if="savingProfile" class="animate-spin">⟳</span>
                保存更改
              </button>
            </div>
          </form>
        </div>

        <!-- 家庭成员卡片 -->
        <div class="p-6 rounded-2xl bg-glass/20 border border-white/5 relative overflow-hidden">
          <div class="absolute top-0 right-0 w-64 h-64 bg-wealth/5 rounded-full blur-[80px] -translate-y-1/2 translate-x-1/2 pointer-events-none"></div>
          
          <div class="flex items-center justify-between mb-6 pb-6 border-b border-white/5 relative z-10">
            <div class="flex items-center gap-4">
              <div class="p-3 rounded-lg bg-purple-500/10 text-purple-400">
                <component :is="Users" class="w-6 h-6" />
              </div>
              <div>
                <h2 class="font-serif text-xl text-text">家庭成员</h2>
                <p class="text-xs text-text-muted">信托受益人和家庭成员</p>
              </div>
            </div>
            <button 
              @click="showAddMemberDialog = true"
              class="text-xs font-bold uppercase tracking-wider text-wealth hover:text-white transition-colors border border-wealth/30 hover:border-wealth rounded px-3 py-1.5 flex items-center gap-2"
            >
              <span class="text-lg leading-none">+</span> 添加成员
            </button>
          </div>

          <div class="grid grid-cols-1 md:grid-cols-2 gap-4 relative z-10">
            <!-- 自己 -->
            <div class="p-4 rounded-xl bg-white/5 border border-white/10 flex items-center gap-4">
              <el-avatar :size="48" class="ring-2 ring-wealth/50">{{ profileForm.name?.[0] || 'U' }}</el-avatar>
              <div>
                <div class="font-medium text-text">{{ profileForm.name }} <span class="text-xs text-text-muted">(主申请人)</span></div>
                <div class="text-xs text-text-muted">设立人</div>
              </div>
            </div>

            <!-- 动态家庭成员 -->
            <div 
              v-for="member in familyMembers" 
              :key="member.id"
              class="p-4 rounded-xl bg-white/5 border border-white/10 flex items-center justify-between gap-4 group hover:border-wealth/30 transition-colors"
            >
              <div class="flex items-center gap-4">
                <el-avatar :size="48" class="ring-2 ring-white/10 group-hover:ring-wealth/30">{{ member.name?.[0] || '?' }}</el-avatar>
                <div>
                  <div class="font-medium text-text">{{ member.name }}</div>
                  <div class="text-xs text-text-muted">{{ getRelationLabel(member.relationship) }} {{ member.isBeneficiary ? '/ 受益人' : '' }}</div>
                </div>
              </div>
              <button 
                @click="handleDeleteMember(member.id)"
                class="opacity-0 group-hover:opacity-100 p-2 rounded hover:bg-red-500/10 text-text-muted hover:text-red-400 transition-all"
                title="删除"
              >
                <component :is="Trash2" class="w-4 h-4" />
              </button>
            </div>

            <!-- 空状态 -->
            <div 
              v-if="familyMembers.length === 0"
              class="p-4 rounded-xl border border-dashed border-white/10 flex items-center justify-center text-text-muted text-sm"
            >
              暂无家庭成员
            </div>
          </div>
        </div>

        <!-- 安全设置卡片 -->
        <div class="p-6 rounded-2xl bg-glass/20 border border-white/5">
          <div class="flex items-center gap-4 mb-6 pb-6 border-b border-white/5">
            <div class="p-3 rounded-lg bg-red-500/10 text-red-400">
              <component :is="Shield" class="w-6 h-6" />
            </div>
            <div>
              <h2 class="font-serif text-xl text-text">安全设置</h2>
              <p class="text-xs text-text-muted">更新密码和身份验证</p>
            </div>
          </div>

          <form @submit.prevent="handleChangePassword" class="space-y-6">
            <div class="space-y-2">
              <label class="text-xs font-bold uppercase tracking-wider text-text-muted">当前密码</label>
              <input v-model="passwordForm.currentPassword" type="password" class="w-full bg-white/5 border border-white/10 rounded-lg px-4 py-3 text-text focus:border-wealth focus:bg-white/10 focus:outline-none transition-colors" />
            </div>
            <div class="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div class="space-y-2">
                <label class="text-xs font-bold uppercase tracking-wider text-text-muted">新密码</label>
                <input v-model="passwordForm.newPassword" type="password" class="w-full bg-white/5 border border-white/10 rounded-lg px-4 py-3 text-text focus:border-wealth focus:bg-white/10 focus:outline-none transition-colors" />
              </div>
              <div class="space-y-2">
                <label class="text-xs font-bold uppercase tracking-wider text-text-muted">确认新密码</label>
                <input v-model="passwordForm.confirmPassword" type="password" class="w-full bg-white/5 border border-white/10 rounded-lg px-4 py-3 text-text focus:border-wealth focus:bg-white/10 focus:outline-none transition-colors" />
              </div>
            </div>
            <div class="flex justify-end pt-4">
              <button type="submit" :disabled="changingPassword" class="px-6 py-2.5 bg-white/5 hover:bg-white/10 border border-white/10 text-text font-bold rounded transition-all active:scale-95 disabled:opacity-50">
                更新密码
              </button>
            </div>
          </form>
        </div>
      </div>

      <!-- 右侧列: 头像 & 偏好 -->
      <div class="space-y-8">
        <!-- 头像组件 -->
        <div class="p-8 rounded-2xl bg-gradient-to-br from-[#1a2333] to-[#0f1621] border border-white/5 flex flex-col items-center text-center relative overflow-hidden">
          <div class="absolute inset-0 bg-[url('https://grainy-gradients.vercel.app/noise.svg')] opacity-20"></div>
          
          <div class="relative z-10 mb-4">
            <div class="w-24 h-24 rounded-full p-1 bg-gradient-to-br from-wealth to-transparent">
              <el-avatar :size="88" class="bg-obsidian ring-4 ring-obsidian">{{ profileForm.name?.[0] || 'U' }}</el-avatar>
            </div>
            <button class="absolute bottom-0 right-0 p-2 rounded-full bg-wealth text-obsidian shadow-lg hover:bg-white transition-colors">
              <component :is="Camera" class="w-4 h-4" />
            </button>
          </div>
          
          <div class="relative z-10">
            <h3 class="font-serif text-xl text-text mb-1">{{ profileForm.name || '用户' }}</h3>
            <span class="inline-block px-3 py-1 rounded-full bg-wealth/10 border border-wealth/20 text-wealth text-[10px] uppercase tracking-wider font-bold">
              家族客户
            </span>
          </div>
        </div>

        <!-- 通知偏好 -->
        <div class="p-6 rounded-2xl bg-glass/20 border border-white/5">
          <div class="flex items-center gap-4 mb-6 pb-6 border-b border-white/5">
             <div class="p-3 rounded-lg bg-blue-500/10 text-blue-400">
               <component :is="Bell" class="w-6 h-6" />
             </div>
             <div>
               <h2 class="font-serif text-lg text-text">通知设置</h2>
             </div>
          </div>
          
          <div class="space-y-4">
            <div class="flex items-center justify-between">
              <span class="text-sm text-text">邮件通知</span>
              <el-switch v-model="notifications.email" active-color="#D6B56E" @change="handlePreferencesChange" />
            </div>
            <div class="flex items-center justify-between">
               <span class="text-sm text-text">短信服务</span>
               <el-switch v-model="notifications.sms" active-color="#D6B56E" @change="handlePreferencesChange" />
            </div>
            <div class="flex items-center justify-between">
               <span class="text-sm text-text">项目更新</span>
               <el-switch v-model="notifications.projectUpdate" active-color="#D6B56E" @change="handlePreferencesChange" />
            </div>
            <div class="flex items-center justify-between">
               <span class="text-sm text-text">文档提醒</span>
               <el-switch v-model="notifications.documentReminder" active-color="#D6B56E" @change="handlePreferencesChange" />
            </div>
          </div>
          
          <div v-if="savingPreferences" class="mt-4 text-xs text-text-muted text-center">
            保存中...
          </div>
        </div>
      </div>
    </div>

    <!-- 添加成员对话框 -->
    <el-dialog v-model="showAddMemberDialog" title="添加家庭成员" width="400px" class="!bg-obsidian !border-white/10 !text-text rounded-xl">
      <form @submit.prevent="handleAddMember" class="space-y-4">
        <div class="space-y-2">
          <label class="text-xs font-bold uppercase tracking-wider text-text-muted">姓名 <span class="text-red-400">*</span></label>
          <input 
            v-model="newMemberForm.name" 
            type="text" 
            class="w-full bg-white/5 border border-white/10 rounded-lg px-4 py-3 text-text focus:border-wealth focus:bg-white/10 focus:outline-none transition-colors" 
            placeholder="成员姓名" 
          />
        </div>
        <div class="space-y-2">
          <label class="text-xs font-bold uppercase tracking-wider text-text-muted">关系 <span class="text-red-400">*</span></label>
          <el-select v-model="newMemberForm.relationship" placeholder="选择关系" class="w-full">
            <el-option label="配偶" value="spouse" />
            <el-option label="子女" value="child" />
            <el-option label="父母" value="parent" />
            <el-option label="兄弟姐妹" value="sibling" />
            <el-option label="其他" value="other" />
          </el-select>
        </div>
        <div class="flex items-center gap-2">
          <el-checkbox v-model="newMemberForm.isBeneficiary" label="设为受益人" />
        </div>
      </form>
      
      <template #footer>
        <div class="flex justify-end gap-3 pt-4 border-t border-white/5">
          <button 
            @click="showAddMemberDialog = false" 
            class="px-5 py-2.5 text-sm font-medium text-text bg-white/5 hover:bg-white/10 border border-white/10 rounded transition-colors"
          >
            取消
          </button>
          <button 
            @click="handleAddMember"
            :disabled="addingMember || !newMemberForm.name || !newMemberForm.relationship"
            class="px-6 py-2.5 bg-wealth hover:bg-[#B49248] text-obsidian rounded font-bold text-sm transition-all active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            添加
          </button>
        </div>
      </template>
    </el-dialog>
  </div>
</template>

<script setup lang="ts">
import { ref, reactive, onMounted } from 'vue'
import { storeToRefs } from 'pinia'
import { ElMessage, ElAvatar, ElSwitch, ElSelect, ElOption, ElCheckbox } from 'element-plus'
import { User, Shield, Bell, Users, Camera, Trash2 } from 'lucide-vue-next'
import { useAuthStore } from '@/stores'
import { portalApi } from '@/api'

interface FamilyMember {
  id: string
  name: string
  relationship: string
  isBeneficiary: boolean
}

const authStore = useAuthStore()
const { user } = storeToRefs(authStore)

const profileLoading = ref(false)
const savingProfile = ref(false)
const changingPassword = ref(false)
const savingPreferences = ref(false)
const addingMember = ref(false)
const showAddMemberDialog = ref(false)

const familyMembers = ref<FamilyMember[]>([])

const profileForm = reactive({
  name: '',
  phone: '',
  company: '',
})

const passwordForm = reactive({
  currentPassword: '',
  newPassword: '',
  confirmPassword: '',
})

const notifications = reactive({
  email: true,
  sms: false,
  projectUpdate: true,
  documentReminder: true,
})

const newMemberForm = reactive({
  name: '',
  relationship: '',
  isBeneficiary: false,
})

const relationLabels: Record<string, string> = {
  spouse: '配偶',
  child: '子女',
  parent: '父母',
  sibling: '兄弟姐妹',
  other: '其他',
}

function getRelationLabel(relationship: string): string {
  return relationLabels[relationship] || relationship
}

async function loadProfile() {
  profileLoading.value = true
  try {
    const data = await portalApi.getProfile() as any
    profileForm.name = data.name || ''
    profileForm.phone = data.phone || ''
    profileForm.company = data.company || ''
    
    // 加载家庭成员
    if (data.familyMembers && Array.isArray(data.familyMembers)) {
      familyMembers.value = data.familyMembers
    }
  } catch (error: any) {
    ElMessage.error(error.message || '加载个人资料失败')
  } finally {
    profileLoading.value = false
  }
}

async function handleSaveProfile() {
  savingProfile.value = true
  try {
    await portalApi.updateProfile({
      name: profileForm.name,
      phone: profileForm.phone,
      company: profileForm.company,
    })
    ElMessage.success('个人资料已保存')
    if (user.value) {
      user.value.name = profileForm.name
    }
  } catch (error: any) {
    ElMessage.error(error.message || '保存失败')
  } finally {
    savingProfile.value = false
  }
}

async function handleChangePassword() {
  if (passwordForm.newPassword !== passwordForm.confirmPassword) {
    ElMessage.error('两次输入的密码不一致')
    return
  }
  if (passwordForm.newPassword.length < 8) {
    ElMessage.error('密码至少需要8个字符')
    return
  }

  changingPassword.value = true
  try {
    await portalApi.changePassword({
      currentPassword: passwordForm.currentPassword,
      newPassword: passwordForm.newPassword,
    })
    ElMessage.success('密码已更新')
    passwordForm.currentPassword = ''
    passwordForm.newPassword = ''
    passwordForm.confirmPassword = ''
  } catch (error: any) {
    ElMessage.error(error.message || '更新失败')
  } finally {
    changingPassword.value = false
  }
}

// 防抖保存通知偏好
let preferencesTimer: ReturnType<typeof setTimeout> | null = null
async function handlePreferencesChange() {
  if (preferencesTimer) clearTimeout(preferencesTimer)
  preferencesTimer = setTimeout(async () => {
    savingPreferences.value = true
    try {
      await portalApi.updatePreferences({
        email: notifications.email,
        sms: notifications.sms,
        projectUpdate: notifications.projectUpdate,
        documentReminder: notifications.documentReminder,
      })
    } catch (error) {
      console.error('保存偏好失败:', error)
    } finally {
      savingPreferences.value = false
    }
  }, 1000)
}

async function handleAddMember() {
  if (!newMemberForm.name || !newMemberForm.relationship) return
  
  addingMember.value = true
  try {
    const result = await portalApi.addFamilyMember({
      name: newMemberForm.name,
      relationship: newMemberForm.relationship,
      isBeneficiary: newMemberForm.isBeneficiary,
    }) as any
    
    // 添加到本地列表
    if (result.member) {
      familyMembers.value.push(result.member)
    }
    
    ElMessage.success('成员已添加')
    showAddMemberDialog.value = false
    
    // 重置表单
    newMemberForm.name = ''
    newMemberForm.relationship = ''
    newMemberForm.isBeneficiary = false
  } catch (error: any) {
    ElMessage.error(error.message || '添加失败')
  } finally {
    addingMember.value = false
  }
}

async function handleDeleteMember(memberId: string) {
  try {
    await portalApi.deleteFamilyMember(memberId)
    familyMembers.value = familyMembers.value.filter(m => m.id !== memberId)
    ElMessage.success('成员已删除')
  } catch (error: any) {
    ElMessage.error(error.message || '删除失败')
  }
}

onMounted(() => {
  loadProfile()
})
</script>
