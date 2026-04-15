<script setup lang="ts">
import { ref, reactive, onMounted } from 'vue'
import { customerApi, type ProjectCustomerOption } from '@/api/customerApi'
import { useProjectStore } from '@/stores/projectStore'
import { ElMessage } from 'element-plus'
import { logger } from '@/utils/logger'

const props = defineProps<{
  visible: boolean
  isEdit?: boolean
  initialData?: any
}>()

const emit = defineEmits(['update:visible', 'success'])

const projectStore = useProjectStore()
const formRef = ref()
const isLoading = ref(false)
const customerOptions = ref<ProjectCustomerOption[]>([])
const loadingCustomers = ref(false)

const form = reactive({
  title: '',
  description: '',
  customerId: '',
  projectType: '',
  startDate: '',
  estimatedEndDate: '',
  budget: 0,
  currency: 'SGD'
})

const rules = {
  title: [{ required: true, message: '请输入项目名称', trigger: 'blur' }],
  customerId: [{ required: true, message: '请选择关联客户', trigger: 'change' }],
  projectType: [{ required: true, message: '请选择项目类型', trigger: 'change' }]
}

const projectTypeOptions = [
  { label: '注册公司 (Incorporation)', value: 'Incorporation' },
  { label: '工作签证 (Employment Pass)', value: 'EP_Application' },
  { label: '自雇移民 (Self-Employed)', value: 'Self_Employed' },
  { label: '家属准证 (DP/LTVP)', value: 'Dependent_Pass' },
  { label: '企业税务 (Corporate Tax)', value: 'Tax_Service' },
  { label: '其他 (Other)', value: 'Other' }
]

// 初始化
onMounted(() => {
  if (props.isEdit && props.initialData) {
    Object.assign(form, props.initialData)
    // 如果是编辑，可能需要预加载对应的客户信息（这里简化处理，假设下拉列表能搜到）
    if (props.initialData.customerId) {
       searchCustomers('')
    }
  } else {
      searchCustomers('')
  }
})

// 搜索客户
const searchCustomers = async (query: string) => {
  loadingCustomers.value = true
  try {
    const data = await customerApi.getOptions(query)
    customerOptions.value = data
  } catch (error) {
    logger.error('ProjectForm', 'Error:', error)
  } finally {
    loadingCustomers.value = false
  }
}

const handleClose = () => {
  emit('update:visible', false)
}

const handleSubmit = async () => {
  if (!formRef.value) return
  
  await formRef.value.validate(async (valid: boolean) => {
    if (valid) {
      isLoading.value = true
      try {
        if (props.isEdit && props.initialData?.id) {
          await projectStore.updateProject(props.initialData.id, form)
          ElMessage.success('项目更新成功')
        } else {
          await projectStore.createProject(form)
          ElMessage.success('项目创建成功')
        }
        emit('success')
        handleClose()
      } catch (error) {
        ElMessage.error('操作失败')
      } finally {
        isLoading.value = false
      }
    }
  })
}
</script>

<template>
  <el-dialog
    :model-value="visible"
    :title="isEdit ? '编辑项目' : '新建项目'"
    width="600px"
    @close="handleClose"
  >
    <el-form ref="formRef" :model="form" :rules="rules" label-width="100px" status-icon>
      <el-form-item label="项目名称" prop="title">
        <el-input v-model="form.title" placeholder="例如：ABC Tech 公司注册" />
      </el-form-item>

      <el-form-item label="关联客户" prop="customerId">
        <el-select
          v-model="form.customerId"
          filterable
          remote
          reserve-keyword
          placeholder="搜索客户名称或公司..."
          :remote-method="searchCustomers"
          :loading="loadingCustomers"
          style="width: 100%"
        >
          <el-option
            v-for="item in customerOptions"
            :key="item.id"
            :label="(item.companyInfo?.name || item.lead.companyName) ? `${item.lead.contactName} - ${item.companyInfo?.name || item.lead.companyName}` : item.lead.contactName"
            :value="item.id"
          >
             <div class="customer-option">
               <span>{{ item.lead.contactName }}</span>
               <span class="company" v-if="item.companyInfo?.name || item.lead.companyName">
                 ({{ item.companyInfo?.name || item.lead.companyName }})
               </span>
             </div>
          </el-option>
        </el-select>
      </el-form-item>

      <el-form-item label="项目类型" prop="projectType">
        <el-select v-model="form.projectType" placeholder="请选择服务类型" style="width: 100%">
          <el-option
            v-for="opt in projectTypeOptions"
            :key="opt.value"
            :label="opt.label"
            :value="opt.value"
          />
        </el-select>
      </el-form-item>

      <el-row :gutter="20">
        <el-col :span="12">
          <el-form-item label="开始日期" prop="startDate">
            <el-date-picker
              v-model="form.startDate"
              type="date"
              placeholder="选择日期"
              style="width: 100%"
              value-format="YYYY-MM-DD"
            />
          </el-form-item>
        </el-col>
        <el-col :span="12">
          <el-form-item label="预计结束" prop="estimatedEndDate">
            <el-date-picker
              v-model="form.estimatedEndDate"
              type="date"
              placeholder="选择日期"
              style="width: 100%"
              value-format="YYYY-MM-DD"
            />
          </el-form-item>
        </el-col>
      </el-row>

      <el-form-item label="预算 (SGD)" prop="budget">
        <el-input-number v-model="form.budget" :min="0" :step="1000" style="width: 100%" />
      </el-form-item>

      <el-form-item label="项目描述" prop="description">
        <el-input v-model="form.description" type="textarea" :rows="3" placeholder="简述项目目标和关键要求..." />
      </el-form-item>
    </el-form>

    <template #footer>
      <span class="dialog-footer">
        <el-button @click="handleClose">取消</el-button>
        <el-button type="primary" :loading="isLoading" @click="handleSubmit">
          {{ isEdit ? '保存更改' : '立即创建' }}
        </el-button>
      </span>
    </template>
  </el-dialog>
</template>

<style scoped>
.customer-option {
  display: flex;
  justify-content: space-between;
  align-items: center;
}
.company {
  color: var(--color-text-muted);
  font-size: 12px;
  margin-left: 8px;
}
</style>
