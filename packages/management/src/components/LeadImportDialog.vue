<script setup lang="ts">
import { ref } from 'vue'
import { UploadFilled, Download } from '@element-plus/icons-vue'
import { ElMessage, type UploadRawFile } from 'element-plus'
import { leadApi } from '../api'
import { logger } from '@/utils/logger'

const visible = ref(false)
const uploading = ref(false)
const file = ref<UploadRawFile | null>(null)

const emit = defineEmits(['success'])

const show = () => {
  visible.value = true
  file.value = null
  uploading.value = false
}

const handleFileChange = (uploadFile: any) => {
  file.value = uploadFile.raw
}

const handleUpload = async () => {
  if (!file.value) return

  uploading.value = true
  try {
    const formData = new FormData()
    formData.append('file', file.value)
    
    // Using simple fetch or axios directly if api signature doesn't support FormData yet, 
    // but assuming leadApi.import will accept logic or we add it. 
    // Here we assume leadApi.importLeads(formData)
    await leadApi.importLeads(formData)

    ElMessage.success('导入成功')
    visible.value = false
    emit('success')
  } catch (error: any) {
    logger.error('LeadImportDialog', 'Error:', error)
    ElMessage.error((error as Error).message || '导入失败')
  } finally {
    uploading.value = false
  }
}

const downloadTemplate = () => {
  const headers = ['contactName,email,phone,companyName,notes']
  const blob = new Blob([headers.join('\n')], { type: 'text/csv' })
  const url = window.URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = 'leads_template.csv'
  a.click()
  window.URL.revokeObjectURL(url)
}

defineExpose({ show })
</script>

<template>
  <el-dialog
    v-model="visible"
    title="批量导入线索"
    width="500px"
    destroy-on-close
  >
    <div class="import-container">
      <div class="template-download">
        <el-button link type="primary" @click="downloadTemplate">
          下载 CSV 模板
          <el-icon class="el-icon--right"><Download /></el-icon>
        </el-button>
      </div>

      <el-upload
        class="upload-demo"
        drag
        action="#"
        :auto-upload="false"
        :on-change="handleFileChange"
        :limit="1"
        accept=".csv"
      >
        <el-icon class="el-icon--upload"><upload-filled /></el-icon>
        <div class="el-upload__text">
          拖拽文件到此处或 <em>点击上传</em>
        </div>
        <template #tip>
          <div class="el-upload__tip">
            支持 .csv 文件，请使用标准模板格式
          </div>
        </template>
      </el-upload>
    </div>

    <template #footer>
      <span class="dialog-footer">
        <el-button @click="visible = false">取消</el-button>
        <el-button type="primary" :loading="uploading" :disabled="!file" @click="handleUpload">
          开始导入
        </el-button>
      </span>
    </template>
  </el-dialog>
</template>

<style scoped>
.import-container {
  padding: 20px;
}
.template-download {
  margin-bottom: 20px;
  text-align: right;
}
</style>
