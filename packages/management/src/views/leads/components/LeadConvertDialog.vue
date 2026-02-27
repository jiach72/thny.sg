<template>
  <el-dialog
    :model-value="visible"
    title="线索转化核验"
    width="650px"
    @update:model-value="emit('update:visible', $event)"
  >
    <div class="convert-notice">
      <el-alert
        title="转化将创建关联客户及门户用户账号。请仔细核验以下核心联系方式，其中邮箱将作为客户登录独立门户的唯一凭证。"
        type="info"
        :closable="false"
        show-icon
      />
    </div>

    <el-form
      ref="formRef"
      :model="form"
      :rules="rules"
      label-width="100px"
      class="convert-form"
    >
      <el-form-item label="客户姓名" prop="contactName">
        <el-input v-model="form.contactName" disabled />
      </el-form-item>
      
      <el-form-item label="企业名称" prop="companyName">
        <el-input v-model="form.companyName" disabled />
      </el-form-item>

      <el-form-item label="登录邮箱" prop="email">
        <el-input 
          v-model="form.email" 
          placeholder="必填：客户门户登录凭证" 
          @blur="handleCheckDuplicates"
        >
          <template #prefix>
            <el-icon><Message /></el-icon>
          </template>
        </el-input>
      </el-form-item>

      <el-form-item label="联系电话" prop="phone">
        <el-input 
          v-model="form.phone" 
          placeholder="选填：国际区号+号码"
          @blur="handleCheckDuplicates"
        >
          <template #prefix>
            <el-icon><Phone /></el-icon>
          </template>
        </el-input>
      </el-form-item>
    </el-form>

    <!-- 撞库警告区 -->
    <Transition name="el-fade-in-linear">
      <div v-if="duplicateWarning" class="duplicate-warning">
        <el-alert
          title="系统检测到高度重合的联系档案"
          type="warning"
          :closable="false"
          show-icon
        >
          <template #default>
            <div class="duplicate-list">
              <p>该邮箱或电话已被以下档案使用，强行转化可能导致客户视图割裂或门户账户冲突（邮箱不可复用）。建议退回并进行线索合并：</p>
              <ul>
                <li v-for="c in duplicates.customers" :key="'c_'+c.id">
                  <el-tag size="small" type="success" effect="plain">正式客户</el-tag>
                  {{ c.contactName }} ({{ c.email || '无邮箱' }} / {{ c.phone || '无电话' }})
                </li>
                <li v-for="l in duplicates.leads" :key="'l_'+l.id">
                  <el-tag size="small" type="info" effect="plain">其他线索</el-tag>
                  {{ l.contactName }} (负责人: {{ l.assignedTo?.name || '公海' }})
                </li>
              </ul>
            </div>
          </template>
        </el-alert>
      </div>
    </Transition>

    <template #footer>
      <div class="dialog-footer">
        <el-button @click="close">取消</el-button>
        <el-button 
          type="success" 
          :loading="converting" 
          :disabled="duplicateWarning && duplicates.customers.length > 0"
          @click="handleConvert"
        >
          {{ duplicateWarning ? '忽略警告并强行转化' : '确认转化' }}
        </el-button>
      </div>
    </template>
  </el-dialog>
</template>

<script setup lang="ts">
import { ref, reactive, watch } from 'vue'
import { ElMessage, type FormInstance, type FormRules } from 'element-plus'
import { Message, Phone } from '@element-plus/icons-vue'
import { useLeadStore } from '@/stores'
import type { Lead } from '@tonghai/shared/types'

const props = defineProps<{
  visible: boolean
  lead?: Lead | null
}>()

const emit = defineEmits<{
  (e: 'update:visible', value: boolean): void
  (e: 'success'): void
}>()

const leadStore = useLeadStore()
const formRef = ref<FormInstance>()
const converting = ref(false)
const duplicateWarning = ref(false)

const duplicates = reactive({
  leads: [] as any[],
  customers: [] as any[]
})

const form = reactive({
  contactName: '',
  companyName: '',
  email: '',
  phone: '',
})

const rules: FormRules = {
  email: [
    { required: true, message: '必须提供客户的登录邮箱', trigger: 'blur' },
    { type: 'email', message: '必须是有效的邮箱格式', trigger: 'blur' }
  ]
}

watch(
  () => props.visible,
  (val) => {
    if (val && props.lead) {
      form.contactName = props.lead.contactName || ''
      form.companyName = props.lead.companyName || ''
      form.email = props.lead.email || ''
      form.phone = props.lead.phone || ''
      duplicateWarning.value = false
      
      // 打开时做一次初始体检
      if (form.email || form.phone) {
        handleCheckDuplicates()
      }
    }
  }
)

async function handleCheckDuplicates() {
  if (!props.lead) return
  if (!form.email && !form.phone) {
    duplicateWarning.value = false
    return
  }
  
  try {
    const res = await leadStore.checkDuplicates({
      email: form.email || undefined,
      phone: form.phone || undefined,
      excludeLeadId: props.lead.id
    })
    
    if (res.hasDuplicates) {
      duplicates.leads = res.leads
      duplicates.customers = res.customers
      duplicateWarning.value = true
    } else {
      duplicateWarning.value = false
      duplicates.leads = []
      duplicates.customers = []
    }
  } catch (error) {
    console.warn('查重失败', error)
  }
}

function close() {
  emit('update:visible', false)
}

async function handleConvert() {
  if (!formRef.value || !props.lead) return
  
  const leadId = props.lead.id
  await formRef.value.validate(async (valid) => {
    if (!valid) return
    
    converting.value = true
    try {
      // 若邮箱被用户修改，需在 conversion API 附带 overrides (后侧需配合支持接收这些参数)
      await leadStore.convertToCustomer(leadId, {
        email: form.email,
        phone: form.phone
      })
      
      ElMessage.success('已成功转化为正式客户并开通门户账户')
      emit('success')
      close()
    } catch (error: any) {
      ElMessage.error(error.message || '转化失败，请检查数据后重试')
    } finally {
      converting.value = false
    }
  })
}
</script>

<style scoped>
.convert-notice {
  margin-bottom: 24px;
}

.convert-form {
  padding-right: 20px;
}

.duplicate-warning {
  margin-top: 24px;
}

.duplicate-list {
  margin-top: 8px;
  font-size: 13px;
  line-height: 1.6;
}

.duplicate-list p {
  margin: 0 0 8px 0;
  color: var(--el-color-warning-dark-2);
}

.duplicate-list ul {
  margin: 0;
  padding-left: 18px;
}

.duplicate-list li {
  margin-bottom: 4px;
}
</style>
