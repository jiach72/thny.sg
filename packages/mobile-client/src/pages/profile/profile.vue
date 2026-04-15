<template>
  <base-layout>
    <view class="profile-page">
      <!-- 个人信息头 -->
      <view class="user-header">
        <view class="avatar" v-if="!pageLoading">{{ userInitial }}</view>
        <view class="avatar skeleton" v-else></view>
        <view class="info" v-if="!pageLoading">
          <text class="name">{{ authStore.userName || '匿名访客' }}</text>
          <text class="email">{{ authStore.user?.email || '暂无邮箱档案' }}</text>
        </view>
        <view class="info" v-else>
          <view style="width: 150rpx; height: 40rpx; background: #e2e8f0; border-radius: 8rpx; margin-bottom: 8rpx;"></view>
          <view style="width: 250rpx; height: 30rpx; background: #f1f5f9; border-radius: 8rpx;"></view>
        </view>
      </view>

      <!-- 个人资料编辑 -->
      <view class="section-card">
        <view class="section-header">
          <text class="section-icon">👤</text>
          <view>
            <text class="section-title">个人资料</text>
            <text class="section-desc">修改您的基本联系信息</text>
          </view>
        </view>
        <view class="form-area">
          <view class="field-group">
            <text class="field-label">姓名</text>
            <input v-model="profileForm.name" type="text" placeholder="您的姓名" class="field-input" />
          </view>
          <view class="field-group">
            <text class="field-label">电话号码</text>
            <input v-model="profileForm.phone" type="tel" placeholder="+65 ..." class="field-input" />
          </view>
          <view class="field-group">
            <text class="field-label">公司/信托</text>
            <input v-model="profileForm.company" type="text" placeholder="家族办公室名称" class="field-input" />
          </view>
          <nut-button type="primary" size="small" :loading="savingProfile" @click="handleSaveProfile" style="margin-top: 16rpx;">
            保存更改
          </nut-button>
        </view>
      </view>

      <!-- 家庭成员 -->
      <view class="section-card">
        <view class="section-header">
          <text class="section-icon">👨‍👩‍👧‍👦</text>
          <view style="flex:1;">
            <text class="section-title">家庭成员</text>
            <text class="section-desc">信托受益人和家庭成员</text>
          </view>
          <nut-button size="mini" plain @click="showAddMember = true">+ 添加</nut-button>
        </view>

        <view class="member-list">
          <!-- 自己 -->
          <view class="member-item">
            <view class="member-avatar primary">{{ (profileForm.name || 'U')[0] }}</view>
            <view class="member-info">
              <text class="member-name">{{ profileForm.name || '我' }} <text class="member-tag">主申请人</text></text>
              <text class="member-role">设立人</text>
            </view>
          </view>

          <!-- 动态成员 -->
          <view v-for="m in familyMembers" :key="m.id" class="member-item">
            <view class="member-avatar">{{ (m.name || '?')[0] }}</view>
            <view class="member-info">
              <text class="member-name">{{ m.name }}</text>
              <text class="member-role">{{ getRelationLabel(m.relationship) }}{{ m.isBeneficiary ? ' / 受益人' : '' }}</text>
            </view>
            <text class="member-delete" @click="handleDeleteMember(m.id)">删除</text>
          </view>

          <view v-if="familyMembers.length === 0" class="empty-member">
            <text>暂无家庭成员</text>
          </view>
        </view>
      </view>

      <!-- 安全设置 -->
      <view class="section-card">
        <view class="section-header">
          <text class="section-icon">🔒</text>
          <view>
            <text class="section-title">修改密码</text>
            <text class="section-desc">更新您的登录凭据</text>
          </view>
        </view>
        <view class="form-area">
          <view class="field-group">
            <text class="field-label">当前密码</text>
            <input v-model="passwordForm.currentPassword" :password="true" placeholder="请输入当前密码" class="field-input" />
          </view>
          <view class="field-group">
            <text class="field-label">新密码</text>
            <input v-model="passwordForm.newPassword" :password="true" placeholder="至少8个字符" class="field-input" />
          </view>
          <view class="field-group">
            <text class="field-label">确认新密码</text>
            <input v-model="passwordForm.confirmPassword" :password="true" placeholder="再次输入新密码" class="field-input" />
          </view>
          <nut-button plain size="small" :loading="changingPassword" @click="handleChangePassword" style="margin-top: 16rpx;">
            更新密码
          </nut-button>
        </view>
      </view>

      <!-- 快捷导航 -->
      <view class="menu-list">
        <nut-cell title="我的专属账单" sub-title="查看本期服务费历史与待付款项" is-link @click="goTo('/pages/invoices/invoices')">
          <template #link>
            <text class="badge primary" v-if="invoiceCount > 0">{{ invoiceCount }} 笔待处理</text>
            <text class="badge" v-else style="background: #f1f5f9; color: #64748b;">全部缴清</text>
          </template>
        </nut-cell>
        <nut-cell title="我的文档" sub-title="管理专属文件并处理待签项目" is-link @click="goTo('/pages/documents/documents')"></nut-cell>
        <nut-cell title="消息中心" sub-title="来自顾问团队的通知" is-link @click="goTo('/pages/messages/messages')"></nut-cell>
        <nut-cell title="帮助与支持" sub-title="浏览知识库或寻求协助" is-link @click="goTo('/pages/help/help')"></nut-cell>
        <nut-cell title="应用设置" sub-title="外观、语言与安全偏好" is-link @click="goTo('/pages/settings/settings')"></nut-cell>
      </view>

      <!-- 登出 -->
      <view class="logout-zone">
        <nut-button shape="round" block plain type="danger" @click="handleLogout">安全退出设备登录</nut-button>
      </view>

      <!-- 添加成员弹窗 -->
      <nut-popup v-model:visible="showAddMember" position="bottom" round :style="{ height: '50%' }">
        <view class="add-member-modal">
          <text class="modal-title">添加家庭成员</text>
          <view class="field-group">
            <text class="field-label">姓名</text>
            <input v-model="newMember.name" type="text" placeholder="成员姓名" class="field-input" />
          </view>
          <view class="field-group">
            <text class="field-label">与主申请人关系</text>
            <view class="relation-chips">
              <text v-for="r in relationOptions" :key="r.value" class="chip" :class="{ active: newMember.relationship === r.value }" @click="newMember.relationship = r.value">{{ r.label }}</text>
            </view>
          </view>
          <view class="field-group" style="flex-direction: row; align-items: center; gap: 16rpx;">
            <nut-switch v-model="newMember.isBeneficiary" />
            <text class="field-label" style="margin-bottom: 0;">设为受益人</text>
          </view>
          <nut-button type="primary" block :disabled="addingMember || !newMember.name || !newMember.relationship" :loading="addingMember" @click="handleAddMember" style="margin-top: 24rpx;">
            添加成员
          </nut-button>
        </view>
      </nut-popup>
    </view>
  </base-layout>
</template>

<script setup lang="ts">
import { ref, computed, reactive, onMounted } from 'vue'
import { useAuthStore } from '../../stores/auth'
import { portalApi, invoiceApi } from '../../api/portalApi'

interface FamilyMember {
  id: string
  name: string
  relationship: string
  isBeneficiary: boolean
}

const authStore = useAuthStore()
const pageLoading = ref(true)
const invoiceCount = ref(0)
const savingProfile = ref(false)
const changingPassword = ref(false)
const addingMember = ref(false)
const showAddMember = ref(false)
const familyMembers = ref<FamilyMember[]>([])

const profileForm = reactive({ name: '', phone: '', company: '' })
const passwordForm = reactive({ currentPassword: '', newPassword: '', confirmPassword: '' })
const newMember = reactive({ name: '', relationship: '', isBeneficiary: false })

const relationOptions = [
  { label: '配偶', value: 'spouse' },
  { label: '子女', value: 'child' },
  { label: '父母', value: 'parent' },
  { label: '兄弟姐妹', value: 'sibling' },
  { label: '其他', value: 'other' },
]

const relationLabels: Record<string, string> = {
  spouse: '配偶', child: '子女', parent: '父母', sibling: '兄弟姐妹', other: '其他',
}

const userInitial = computed(() => (authStore.userName || 'U').charAt(0).toUpperCase())

function getRelationLabel(r: string): string { return relationLabels[r] || r }

onMounted(async () => {
  try {
    await authStore.fetchMe()
    const [profile, invoiceRes] = await Promise.all([
      portalApi.getProfile(),
      invoiceApi.getMyInvoices({ limit: 1 }),
    ])
    const p = profile as any
    profileForm.name = p?.name || ''
    profileForm.phone = p?.phone || ''
    profileForm.company = p?.company || ''
    const members = p?.familyMembers
    if (members && Array.isArray(members)) {
      familyMembers.value = members
    }
    if (invoiceRes?.pagination?.total) {
      invoiceCount.value = invoiceRes.pagination.total
    }
  } catch (e) {
    console.error('Failed to sync profile', e)
  } finally {
    pageLoading.value = false
  }
})

async function handleSaveProfile() {
  savingProfile.value = true
  try {
    await portalApi.updateProfile({ name: profileForm.name, phone: profileForm.phone, company: profileForm.company })
    uni.showToast({ title: '个人资料已保存', icon: 'success' })
    if (authStore.user) authStore.user.name = profileForm.name
  } catch {
    uni.showToast({ title: '保存失败', icon: 'none' })
  } finally {
    savingProfile.value = false
  }
}

async function handleChangePassword() {
  if (passwordForm.newPassword.length < 8) {
    uni.showToast({ title: '密码至少需要8个字符', icon: 'none' }); return
  }
  if (passwordForm.newPassword !== passwordForm.confirmPassword) {
    uni.showToast({ title: '两次输入的密码不一致', icon: 'none' }); return
  }
  changingPassword.value = true
  try {
    await portalApi.changePassword({ currentPassword: passwordForm.currentPassword, newPassword: passwordForm.newPassword })
    uni.showToast({ title: '密码已更新', icon: 'success' })
    passwordForm.currentPassword = ''
    passwordForm.newPassword = ''
    passwordForm.confirmPassword = ''
  } catch {
    uni.showToast({ title: '更新失败', icon: 'none' })
  } finally {
    changingPassword.value = false
  }
}

async function handleAddMember() {
  if (!newMember.name || !newMember.relationship) return
  addingMember.value = true
  try {
    const result = await portalApi.addFamilyMember({ name: newMember.name, relationship: newMember.relationship, isBeneficiary: newMember.isBeneficiary }) as any
    if (result?.member) {
      familyMembers.value.push(result.member)
    } else {
      familyMembers.value.push({ id: result?.id || `tmp_${Date.now()}`, name: newMember.name, relationship: newMember.relationship, isBeneficiary: newMember.isBeneficiary })
    }
    uni.showToast({ title: '成员已添加', icon: 'success' })
    showAddMember.value = false
    newMember.name = ''
    newMember.relationship = ''
    newMember.isBeneficiary = false
  } catch {
    uni.showToast({ title: '添加失败', icon: 'none' })
  } finally {
    addingMember.value = false
  }
}

function handleDeleteMember(id: string) {
  uni.showModal({
    title: '确认删除', content: '确定移除此家庭成员吗？',
    success: async (res) => {
      if (res.confirm) {
        try {
          await portalApi.deleteFamilyMember(id)
          familyMembers.value = familyMembers.value.filter(m => m.id !== id)
          uni.showToast({ title: '已删除', icon: 'success' })
        } catch {
          uni.showToast({ title: '删除失败', icon: 'none' })
        }
      }
    }
  })
}

function handleLogout() {
  uni.showModal({
    title: '退出登录状态', content: '确定退出并断开通海南洋的连接？',
    success: (res) => { if (res.confirm) authStore.logout() }
  })
}

function goTo(url: string) { uni.navigateTo({ url }) }
</script>

<style lang="scss">
.profile-page { min-height: 100vh; background: #f1f5f9; padding-bottom: 240rpx; }

.user-header {
  padding: 100rpx 48rpx 64rpx; background: white; display: flex; align-items: center; gap: 32rpx; margin-bottom: 24rpx;
  .avatar {
    width: 140rpx; height: 140rpx; background: linear-gradient(135deg, #1e293b, #0f172a);
    color: white; font-size: 56rpx; font-weight: bold; display: flex; align-items: center; justify-content: center;
    border-radius: 40rpx; box-shadow: 0 12rpx 32rpx rgba(15, 23, 42, 0.25);
    &.skeleton { background: #e2e8f0; animation: pulse 1.5s infinite; }
  }
  .info { display: flex; flex-direction: column; gap: 12rpx;
    .name { font-size: 40rpx; font-weight: 800; color: #0f172a; }
    .email { font-size: 26rpx; color: #64748b; }
  }
}
@keyframes pulse { 0%,100% { opacity:1; } 50% { opacity:0.5; } }

.section-card {
  background: white; border-radius: 20rpx; margin: 0 24rpx 24rpx; padding: 32rpx; box-shadow: 0 2rpx 12rpx rgba(0,0,0,0.04);
}
.section-header {
  display: flex; align-items: flex-start; gap: 20rpx; margin-bottom: 24rpx; padding-bottom: 20rpx; border-bottom: 1px solid #f1f5f9;
  .section-icon { font-size: 40rpx; }
  .section-title { font-size: 30rpx; font-weight: 700; color: #0f172a; display: block; }
  .section-desc { font-size: 22rpx; color: #94a3b8; display: block; margin-top: 4rpx; }
}
.form-area {
  .field-group { margin-bottom: 24rpx; }
  .field-label { font-size: 24rpx; color: #64748b; display: block; margin-bottom: 8rpx; }
  .field-input {
    width: 100%; height: 80rpx; background: #f8fafc; border: 1px solid #e2e8f0;
    border-radius: 12rpx; padding: 0 24rpx; font-size: 28rpx; color: #1e293b; box-sizing: border-box;
  }
}

.member-list {
  .member-item {
    display: flex; align-items: center; gap: 20rpx; padding: 16rpx 0; border-bottom: 1px solid #f8fafc;
    &:last-child { border-bottom: none; }
  }
  .member-avatar {
    width: 72rpx; height: 72rpx; border-radius: 50%; background: #e2e8f0; color: #64748b;
    font-size: 28rpx; font-weight: 700; display: flex; align-items: center; justify-content: center;
    &.primary { background: linear-gradient(135deg, #3b82f6, #8b5cf6); color: white; }
  }
  .member-info { flex: 1; min-width: 0; }
  .member-name { font-size: 28rpx; color: #1e293b; font-weight: 500; display: block; }
  .member-tag { font-size: 20rpx; color: #94a3b8; background: #f1f5f9; padding: 2rpx 12rpx; border-radius: 6rpx; margin-left: 8rpx; }
  .member-role { font-size: 22rpx; color: #94a3b8; display: block; margin-top: 4rpx; }
  .member-delete { font-size: 24rpx; color: #ef4444; flex-shrink: 0; }
  .empty-member { padding: 40rpx; text-align: center; color: #cbd5e1; font-size: 26rpx; }
}

.menu-list {
  margin-top: 24rpx; background: white;
  .badge {
    background: rgba(59, 130, 246, 0.15); color: #3b82f6;
    padding: 6rpx 16rpx; border-radius: 12rpx; font-size: 24rpx; font-weight: 600;
  }
}
.logout-zone { margin-top: 64rpx; padding: 0 48rpx; }

.add-member-modal {
  padding: 40rpx; display: flex; flex-direction: column; gap: 24rpx;
  .modal-title { font-size: 36rpx; font-weight: 700; color: #0f172a; text-align: center; }
  .field-group { display: flex; flex-direction: column; }
  .field-label { font-size: 24rpx; color: #64748b; margin-bottom: 8rpx; }
  .field-input {
    width: 100%; height: 80rpx; background: #f8fafc; border: 1px solid #e2e8f0;
    border-radius: 12rpx; padding: 0 24rpx; font-size: 28rpx; color: #1e293b; box-sizing: border-box;
  }
  .relation-chips { display: flex; flex-wrap: wrap; gap: 12rpx; }
  .chip {
    padding: 12rpx 28rpx; border: 1px solid #e2e8f0; border-radius: 32rpx; font-size: 24rpx; color: #64748b;
    &.active { background: #eff6ff; color: #3b82f6; border-color: #93c5fd; font-weight: 600; }
  }
}
</style>
