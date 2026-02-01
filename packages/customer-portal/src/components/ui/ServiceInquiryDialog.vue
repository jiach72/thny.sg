<template>
  <el-dialog 
    v-model="visible" 
    :title="dialogTitle" 
    width="500px" 
    class="!bg-obsidian !border-white/10 !text-text rounded-xl"
    :close-on-click-modal="false"
  >
    <div class="space-y-6">
      <!-- 服务类型展示 -->
      <div class="flex items-center gap-4 p-4 rounded-lg bg-white/5 border border-white/10">
        <div 
          class="p-3 rounded-full shadow-lg"
          :class="serviceConfig.iconBg"
        >
          <component :is="serviceConfig.icon" class="w-6 h-6 text-white" />
        </div>
        <div>
          <div class="font-medium text-text">{{ serviceConfig.name }}</div>
          <div class="text-xs text-text-muted">{{ serviceConfig.description }}</div>
        </div>
      </div>

      <!-- 表单 -->
      <form @submit.prevent="handleSubmit" class="space-y-4">
        <div class="grid grid-cols-2 gap-4">
          <div class="space-y-2">
            <label class="text-xs font-bold uppercase tracking-wider text-text-muted">姓名</label>
            <el-input 
              v-model="form.name" 
              placeholder="您的姓名"
              class="login-input"
            />
          </div>
          <div class="space-y-2">
            <label class="text-xs font-bold uppercase tracking-wider text-text-muted">联系电话</label>
            <el-input 
              v-model="form.phone" 
              placeholder="+65 ..."
              class="login-input"
            />
          </div>
        </div>

        <div class="space-y-2">
          <label class="text-xs font-bold uppercase tracking-wider text-text-muted">电子邮箱</label>
          <el-input 
            v-model="form.email" 
            type="email"
            placeholder="your@email.com"
            class="login-input"
          />
        </div>

        <div class="space-y-2">
          <label class="text-xs font-bold uppercase tracking-wider text-text-muted">咨询内容 <span class="text-red-400">*</span></label>
          <el-input 
            v-model="form.message" 
            type="textarea"
            :rows="4"
            placeholder="请描述您的需求..."
            class="login-input"
          />
        </div>

        <div class="space-y-2">
          <label class="text-xs font-bold uppercase tracking-wider text-text-muted">偏好联系方式</label>
          <el-radio-group v-model="form.preferredContact" class="!flex gap-4">
            <el-radio value="phone" class="!text-text">电话</el-radio>
            <el-radio value="email" class="!text-text">邮件</el-radio>
            <el-radio value="whatsapp" class="!text-text">WhatsApp</el-radio>
          </el-radio-group>
        </div>
      </form>
    </div>

    <template #footer>
      <div class="flex justify-end gap-3 pt-4 border-t border-white/5">
        <button 
          type="button"
          @click="visible = false" 
          class="px-5 py-2.5 text-sm font-medium text-text bg-white/5 hover:bg-white/10 border border-white/10 rounded transition-colors"
          :disabled="submitting"
        >
          取消
        </button>
        <button 
          type="button"
          @click="handleSubmit"
          :disabled="submitting || !form.message"
          class="px-6 py-2.5 bg-wealth hover:bg-[#B49248] text-obsidian rounded font-bold text-sm transition-all active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
        >
          <span v-if="submitting" class="animate-spin">⟳</span>
          提交咨询
        </button>
      </div>
    </template>
  </el-dialog>
</template>

<script setup lang="ts">
import { ref, reactive, computed, watch } from 'vue'
import { ElMessage } from 'element-plus'
import { Globe, GraduationCap, Briefcase, Landmark } from 'lucide-vue-next'
import { portalApi } from '@/api'

// 服务类型定义
type ServiceType = 'immigration' | 'education' | 'business' | 'realestate'

interface ServiceConfig {
  name: string
  description: string
  icon: any
  iconBg: string
}

const serviceConfigs: Record<ServiceType, ServiceConfig> = {
  immigration: {
    name: '移民服务',
    description: '签证、永居、公民身份申请',
    icon: Globe,
    iconBg: 'bg-gradient-to-br from-emerald-400 to-emerald-600 shadow-emerald-500/30'
  },
  education: {
    name: '教育咨询',
    description: '留学规划、学校申请、学业辅导',
    icon: GraduationCap,
    iconBg: 'bg-gradient-to-br from-blue-400 to-blue-600 shadow-blue-500/30'
  },
  business: {
    name: '商业服务',
    description: '公司注册、税务规划、商业顾问',
    icon: Briefcase,
    iconBg: 'bg-gradient-to-br from-amber-400 to-amber-600 shadow-amber-500/30'
  },
  realestate: {
    name: '房产投资',
    description: '房产购置、投资分析、资产配置',
    icon: Landmark,
    iconBg: 'bg-gradient-to-br from-rose-400 to-rose-600 shadow-rose-500/30'
  }
}

const props = withDefaults(defineProps<{
  modelValue: boolean
  serviceType?: ServiceType
  userName?: string
  userPhone?: string
  userEmail?: string
}>(), {
  serviceType: 'immigration',
  userName: '',
  userPhone: '',
  userEmail: ''
})

const emit = defineEmits<{
  (e: 'update:modelValue', value: boolean): void
  (e: 'success'): void
}>()

const visible = computed({
  get: () => props.modelValue,
  set: (val) => emit('update:modelValue', val)
})

const submitting = ref(false)

const form = reactive({
  name: '',
  phone: '',
  email: '',
  message: '',
  preferredContact: 'phone'
})

// 预填用户信息
watch(() => props.modelValue, (val) => {
  if (val) {
    form.name = props.userName
    form.phone = props.userPhone
    form.email = props.userEmail
  }
})

const serviceConfig = computed(() => serviceConfigs[props.serviceType])
const dialogTitle = computed(() => `咨询${serviceConfig.value.name}`)

async function handleSubmit() {
  if (!form.message.trim()) {
    ElMessage.warning('请填写咨询内容')
    return
  }

  submitting.value = true
  try {
    await portalApi.createInquiry({
      serviceType: props.serviceType,
      name: form.name,
      phone: form.phone,
      email: form.email,
      message: form.message,
      preferredContact: form.preferredContact
    })
    
    ElMessage.success('咨询已提交，我们会尽快与您联系')
    visible.value = false
    emit('success')
    
    // 重置表单
    form.message = ''
    form.preferredContact = 'phone'
  } catch (error: any) {
    ElMessage.error(error.message || '提交失败，请稍后重试')
  } finally {
    submitting.value = false
  }
}
</script>
