<template>
  <el-dialog
    :model-value="visible"
    :title="lead ? '编辑线索' : '新建线索'"
    width="600px"
    @update:model-value="emit('update:visible', $event)"
  >
    <el-form
      ref="formRef"
      :model="form"
      :rules="rules"
      label-width="100px"
    >
      <el-form-item label="联系人" prop="contactName">
        <el-input v-model="form.contactName" placeholder="请输入联系人姓名" />
      </el-form-item>
      <el-form-item label="邮箱" prop="email">
        <el-input v-model="form.email" placeholder="请输入邮箱" />
      </el-form-item>
      <el-form-item label="电话" prop="phone">
        <el-input v-model="form.phone" placeholder="请输入电话" />
      </el-form-item>
      <el-form-item label="公司" prop="companyName">
        <el-input v-model="form.companyName" placeholder="请输入公司名称" />
      </el-form-item>
      <el-form-item label="国家/地区" prop="country">
        <el-select v-model="form.country" filterable placeholder="请选择">
          <el-option label="新加坡" value="Singapore" />
          <el-option label="中国" value="China" />
          <el-option label="香港" value="Hong Kong" />
          <el-option label="美国" value="USA" />
          <el-option label="其他" value="Other" />
        </el-select>
      </el-form-item>
      <el-form-item label="服务类型" prop="serviceTypes">
        <el-select v-model="form.serviceTypes" multiple placeholder="请选择服务类型">
          <el-option label="企业设立" value="Enterprise Setup" />
          <el-option label="签证规划" value="Visa Planning" />
          <el-option label="税务规划" value="Tax Planning" />
          <el-option label="财富管理" value="Wealth Management" />
          <el-option label="家族办公室" value="Family Office" />
        </el-select>
      </el-form-item>
      <el-form-item label="来源渠道" prop="sourceChannel">
        <el-select v-model="form.sourceChannel" placeholder="请选择来源">
          <el-option label="官网表单" value="website_form" />
          <el-option label="推荐" value="referral" />
          <el-option label="活动" value="event" />
          <el-option label="其他" value="other" />
        </el-select>
      </el-form-item>
      <el-form-item label="咨询内容" prop="inquiryMessage">
        <el-input
          v-model="form.inquiryMessage"
          type="textarea"
          :rows="3"
          placeholder="请输入咨询内容"
        />
      </el-form-item>
    </el-form>
    <template #footer>
      <el-button @click="close">取消</el-button>
      <el-button type="primary" :loading="submitting" @click="handleSubmit">
        {{ lead ? '保存' : '创建' }}
      </el-button>
    </template>
  </el-dialog>
</template>

<script setup lang="ts">
import { ref, reactive, watch } from 'vue'
import { ElMessage, type FormInstance, type FormRules } from 'element-plus'
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
const submitting = ref(false)

const form = reactive({
  contactName: '',
  email: '',
  phone: '',
  companyName: '',
  country: '',
  serviceTypes: [] as string[],
  sourceChannel: 'website_form',
  inquiryMessage: '',
})

const rules: FormRules = {
  contactName: [{ required: true, message: '请输入联系人姓名', trigger: 'blur' }],
  sourceChannel: [{ required: true, message: '请选择来源渠道', trigger: 'change' }],
  email: [{ type: 'email', message: '请输入有效的邮箱', trigger: 'blur' }],
}

watch(
  () => props.visible,
  (val) => {
    if (val) {
      if (props.lead) {
        Object.assign(form, {
          contactName: props.lead.contactName,
          email: props.lead.email || '',
          phone: props.lead.phone || '',
          companyName: props.lead.companyName || '',
          country: props.lead.country || '',
          serviceTypes: props.lead.serviceTypes || [],
          sourceChannel: props.lead.sourceChannel,
          inquiryMessage: props.lead.inquiryMessage || '',
        })
      } else {
        resetForm()
      }
    }
  }
)

function resetForm() {
  Object.assign(form, {
    contactName: '',
    email: '',
    phone: '',
    companyName: '',
    country: '',
    serviceTypes: [],
    sourceChannel: 'website_form',
    inquiryMessage: '',
  })
}

function close() {
  emit('update:visible', false)
}

async function handleSubmit() {
  if (!formRef.value) return
  
  await formRef.value.validate(async (valid) => {
    if (!valid) return
    
    submitting.value = true
    try {
      if (props.lead) {
        await leadStore.updateLead(props.lead.id, form)
        ElMessage.success('更新成功')
      } else {
        await leadStore.createLead(form)
        ElMessage.success('创建成功')
      }
      emit('success')
      close()
    } catch (error: any) {
      ElMessage.error((error as Error).message || '操作失败')
    } finally {
      submitting.value = false
    }
  })
}
</script>
