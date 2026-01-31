<template>
  <div class="scoring-management">
    <h2 class="page-title">评分规则管理</h2>
    
    <!-- 操作栏 -->
    <el-card class="action-bar">
      <el-row :gutter="16" align="middle">
        <el-col :span="12">
          <el-space>
            <el-button type="primary" @click="openCreateDialog">
              <el-icon><Plus /></el-icon>
              新建规则
            </el-button>
            <el-button @click="batchUpdate" :loading="batchLoading">
              <el-icon><Refresh /></el-icon>
              批量更新评分
            </el-button>
            <el-button @click="seedRules" :loading="seedLoading">
              <el-icon><MagicStick /></el-icon>
              初始化默认规则
            </el-button>
          </el-space>
        </el-col>
        <el-col :span="12" style="text-align: right;">
          <el-switch
            v-model="showInactive"
            active-text="显示禁用规则"
            @change="loadRules"
          />
        </el-col>
      </el-row>
    </el-card>

    <!-- 规则列表 -->
    <el-card class="rule-list">
      <el-table :data="rules" v-loading="loading" stripe>
        <el-table-column prop="sortOrder" label="排序" width="80" align="center" />
        <el-table-column prop="name" label="规则名称" min-width="150" />
        <el-table-column prop="field" label="字段" width="150">
          <template #default="{ row }">
            <el-tag type="info" size="small">{{ row.field }}</el-tag>
          </template>
        </el-table-column>
        <el-table-column prop="operator" label="操作符" width="120">
          <template #default="{ row }">
            <code>{{ operatorLabels[row.operator] || row.operator }}</code>
          </template>
        </el-table-column>
        <el-table-column prop="value" label="比较值" width="150">
          <template #default="{ row }">
            <span v-if="row.value">{{ formatValue(row.value) }}</span>
            <span v-else class="text-muted">-</span>
          </template>
        </el-table-column>
        <el-table-column prop="score" label="分值" width="100" align="center">
          <template #default="{ row }">
            <el-tag :type="row.score > 0 ? 'success' : 'danger'">
              {{ row.score > 0 ? '+' : '' }}{{ row.score }}
            </el-tag>
          </template>
        </el-table-column>
        <el-table-column prop="isActive" label="状态" width="100" align="center">
          <template #default="{ row }">
            <el-switch 
              :model-value="row.isActive" 
              @change="(val: boolean) => toggleActive(row, val)"
            />
          </template>
        </el-table-column>
        <el-table-column label="操作" width="150" fixed="right">
          <template #default="{ row }">
            <el-button type="primary" link @click="openEditDialog(row)">编辑</el-button>
            <el-popconfirm 
              title="确定删除该规则吗？" 
              @confirm="deleteRuleById(row.id)"
            >
              <template #reference>
                <el-button type="danger" link>删除</el-button>
              </template>
            </el-popconfirm>
          </template>
        </el-table-column>
      </el-table>
    </el-card>

    <!-- 新建/编辑对话框 -->
    <el-dialog 
      v-model="dialogVisible" 
      :title="isEdit ? '编辑规则' : '新建规则'"
      width="600px"
    >
      <el-form 
        ref="formRef" 
        :model="form" 
        :rules="formRules" 
        label-width="100px"
      >
        <el-form-item label="规则名称" prop="name">
          <el-input v-model="form.name" placeholder="例如：有邮箱" />
        </el-form-item>
        <el-form-item label="描述">
          <el-input v-model="form.description" type="textarea" :rows="2" placeholder="规则说明（可选）" />
        </el-form-item>
        <el-form-item label="字段" prop="field">
          <el-select v-model="form.field" placeholder="选择字段" filterable allow-create>
            <el-option-group label="常用字段">
              <el-option value="email" label="email - 邮箱" />
              <el-option value="phone" label="phone - 电话" />
              <el-option value="companyName" label="companyName - 公司名" />
              <el-option value="budgetRange" label="budgetRange - 预算范围" />
              <el-option value="serviceTypes" label="serviceTypes - 服务类型" />
              <el-option value="sourceChannel" label="sourceChannel - 来源渠道" />
              <el-option value="country" label="country - 国家" />
              <el-option value="lastContactedAt" label="lastContactedAt - 最后联系时间" />
            </el-option-group>
          </el-select>
        </el-form-item>
        <el-form-item label="操作符" prop="operator">
          <el-select v-model="form.operator" placeholder="选择操作符">
            <el-option value="exists" label="存在 (exists)" />
            <el-option value="not_exists" label="不存在 (not_exists)" />
            <el-option value="eq" label="等于 (eq)" />
            <el-option value="neq" label="不等于 (neq)" />
            <el-option value="gt" label="大于 (gt)" />
            <el-option value="gte" label="大于等于 (gte)" />
            <el-option value="lt" label="小于 (lt)" />
            <el-option value="lte" label="小于等于 (lte)" />
            <el-option value="contains" label="包含 (contains)" />
            <el-option value="in" label="在列表中 (in)" />
            <el-option value="array_includes" label="数组包含 (array_includes)" />
            <el-option value="array_length_gt" label="数组长度大于 (array_length_gt)" />
          </el-select>
        </el-form-item>
        <el-form-item 
          label="比较值" 
          v-if="!['exists', 'not_exists'].includes(form.operator)"
        >
          <el-input 
            v-model="form.value" 
            placeholder="JSON 格式，如 &quot;value&quot; 或 [&quot;a&quot;, &quot;b&quot;]" 
          />
          <div class="form-tip">提示：字符串需要加引号，数组使用 JSON 格式</div>
        </el-form-item>
        <el-row :gutter="16">
          <el-col :span="12">
            <el-form-item label="分值" prop="score">
              <el-input-number v-model="form.score" :step="5" />
            </el-form-item>
          </el-col>
          <el-col :span="12">
            <el-form-item label="排序">
              <el-input-number v-model="form.sortOrder" :min="0" />
            </el-form-item>
          </el-col>
        </el-row>
      </el-form>
      <template #footer>
        <el-button @click="dialogVisible = false">取消</el-button>
        <el-button type="primary" @click="submitForm" :loading="submitLoading">
          {{ isEdit ? '保存' : '创建' }}
        </el-button>
      </template>
    </el-dialog>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted } from 'vue'
import { ElMessage, type FormInstance, type FormRules } from 'element-plus'
import { Plus, Refresh, MagicStick } from '@element-plus/icons-vue'
import scoringApi, { type ScoringRule, type CreateRuleInput, type UpdateRuleInput } from '@/api/scoringApi'

// 状态
const loading = ref(false)
const rules = ref<ScoringRule[]>([])
const showInactive = ref(false)

const dialogVisible = ref(false)
const isEdit = ref(false)
const editId = ref('')
const submitLoading = ref(false)
const batchLoading = ref(false)
const seedLoading = ref(false)

const formRef = ref<FormInstance>()
const form = ref<CreateRuleInput & { sortOrder: number }>({
  name: '',
  description: '',
  field: '',
  operator: 'exists',
  value: '',
  score: 10,
  sortOrder: 0
})

const formRules: FormRules = {
  name: [{ required: true, message: '请输入规则名称', trigger: 'blur' }],
  field: [{ required: true, message: '请选择字段', trigger: 'change' }],
  operator: [{ required: true, message: '请选择操作符', trigger: 'change' }],
  score: [{ required: true, message: '请输入分值', trigger: 'blur' }]
}

const operatorLabels: Record<string, string> = {
  exists: '存在',
  not_exists: '不存在',
  eq: '等于',
  neq: '不等于',
  gt: '大于',
  gte: '大于等于',
  lt: '小于',
  lte: '小于等于',
  contains: '包含',
  in: '在列表中',
  array_includes: '数组包含',
  array_length_gt: '数组长度>'
}

// 加载规则列表
async function loadRules() {
  loading.value = true
  try {
    rules.value = await scoringApi.getRules(showInactive.value)
  } catch (err: any) {
    ElMessage.error(err.message || '加载失败')
  } finally {
    loading.value = false
  }
}

// 格式化值显示
function formatValue(value: string): string {
  try {
    const parsed = JSON.parse(value)
    if (Array.isArray(parsed)) {
      return parsed.join(', ')
    }
    return String(parsed)
  } catch {
    return value
  }
}

// 打开新建对话框
function openCreateDialog() {
  isEdit.value = false
  editId.value = ''
  form.value = {
    name: '',
    description: '',
    field: '',
    operator: 'exists',
    value: '',
    score: 10,
    sortOrder: rules.value.length
  }
  dialogVisible.value = true
}

// 打开编辑对话框
function openEditDialog(rule: ScoringRule) {
  isEdit.value = true
  editId.value = rule.id
  form.value = {
    name: rule.name,
    description: rule.description || '',
    field: rule.field,
    operator: rule.operator,
    value: rule.value || '',
    score: rule.score,
    sortOrder: rule.sortOrder
  }
  dialogVisible.value = true
}

// 提交表单
async function submitForm() {
  await formRef.value?.validate()
  submitLoading.value = true
  
  try {
    const data = { ...form.value }
    if (!data.value) delete (data as any).value
    if (!data.description) delete (data as any).description
    
    if (isEdit.value) {
      await scoringApi.updateRule(editId.value, data as UpdateRuleInput)
      ElMessage.success('规则已更新')
    } else {
      await scoringApi.createRule(data)
      ElMessage.success('规则已创建')
    }
    
    dialogVisible.value = false
    loadRules()
  } catch (err: any) {
    ElMessage.error(err.message || '操作失败')
  } finally {
    submitLoading.value = false
  }
}

// 切换启用状态
async function toggleActive(rule: ScoringRule, isActive: boolean) {
  try {
    await scoringApi.updateRule(rule.id, { isActive })
    rule.isActive = isActive
    ElMessage.success(isActive ? '规则已启用' : '规则已禁用')
  } catch (err: any) {
    ElMessage.error(err.message || '操作失败')
  }
}

// 删除规则
async function deleteRuleById(id: string) {
  try {
    await scoringApi.deleteRule(id)
    ElMessage.success('规则已删除')
    loadRules()
  } catch (err: any) {
    ElMessage.error(err.message || '删除失败')
  }
}

// 批量更新评分
async function batchUpdate() {
  batchLoading.value = true
  try {
    const result = await scoringApi.batchUpdateScores()
    ElMessage.success(`评分更新完成：成功 ${result.updated} 条，失败 ${result.failed} 条`)
  } catch (err: any) {
    ElMessage.error(err.message || '批量更新失败')
  } finally {
    batchLoading.value = false
  }
}

// 初始化默认规则
async function seedRules() {
  seedLoading.value = true
  try {
    await scoringApi.seedDefaultRules()
    ElMessage.success('默认规则已初始化')
    loadRules()
  } catch (err: any) {
    ElMessage.error(err.message || '初始化失败')
  } finally {
    seedLoading.value = false
  }
}

onMounted(() => {
  loadRules()
})
</script>

<style scoped>
.scoring-management {
  max-width: 1400px;
}

.page-title {
  font-size: 24px;
  font-weight: 600;
  color: #333;
  margin: 0 0 24px;
}

.action-bar {
  margin-bottom: 24px;
}

.text-muted {
  color: #999;
}

.form-tip {
  font-size: 12px;
  color: #999;
  margin-top: 4px;
}

code {
  background: #f5f5f5;
  padding: 2px 6px;
  border-radius: 4px;
  font-size: 12px;
}
</style>
