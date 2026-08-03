<template>
  <div class="files-page">
    <div class="files-header">
      <h2>📁 个人文件区</h2>
      <div class="header-actions">
        <el-button type="primary" :icon="FolderAdd" @click="showCreateFolder">新建文件夹</el-button>
        <el-button :icon="DocumentAdd" @click="showCreateFile">新建文件</el-button>
      </div>
    </div>

    <!-- 面包屑导航 -->
    <el-breadcrumb separator="/" class="breadcrumb">
      <el-breadcrumb-item :clickable="true" @click="navigateTo(null)">根目录</el-breadcrumb-item>
      <el-breadcrumb-item
        v-for="(crumb, idx) in breadcrumbs"
        :key="crumb.id"
        :clickable="idx < breadcrumbs.length - 1"
        @click="navigateTo(crumb.id)"
      >
        {{ crumb.name }}
      </el-breadcrumb-item>
    </el-breadcrumb>

    <!-- 文件列表 -->
    <el-table :data="files" stripe v-loading="loading" class="file-table">
      <el-table-column label="名称" min-width="300">
        <template #default="{ row }">
          <div class="file-name" @click="handleClick(row)">
            <el-icon v-if="row.type === 'folder'" color="#e6a23c"><Folder /></el-icon>
            <el-icon v-else color="#409eff"><Document /></el-icon>
            <span>{{ row.name }}</span>
          </div>
        </template>
      </el-table-column>
      <el-table-column label="类型" width="100">
        <template #default="{ row }">
          <el-tag :type="row.type === 'folder' ? 'warning' : 'info'" size="small">
            {{ row.type === 'folder' ? '文件夹' : '文件' }}
          </el-tag>
        </template>
      </el-table-column>
      <el-table-column label="更新时间" width="180">
        <template #default="{ row }">
          {{ formatDate(row.updated_at) }}
        </template>
      </el-table-column>
      <el-table-column label="操作" width="240">
        <template #default="{ row }">
          <el-button size="small" type="primary" link @click="editFile(row)" v-if="row.type === 'file'">
            编辑
          </el-button>
          <el-button size="small" type="success" link @click="downloadItem(row)">
            下载
          </el-button>
          <el-button size="small" type="warning" link @click="renameItem(row)">
            重命名
          </el-button>
          <el-popconfirm title="确定删除？" @confirm="deleteItem(row)">
            <template #reference>
              <el-button size="small" type="danger" link>删除</el-button>
            </template>
          </el-popconfirm>
        </template>
      </el-table-column>
    </el-table>

    <el-empty v-if="!loading && files.length === 0" description="空空如也，创建一个文件吧" />

    <!-- 编辑器弹窗 -->
    <el-dialog v-model="editorVisible" :title="editingFile?.name" width="80%" top="5vh" destroy-on-close>
      <div ref="dialogEditor" class="dialog-editor"></div>
      <template #footer>
        <el-button @click="editorVisible = false">取消</el-button>
        <el-button type="primary" @click="saveFile" :loading="saving">保存</el-button>
      </template>
    </el-dialog>
  </div>
</template>

<script setup>
import { ref, nextTick, onBeforeUnmount } from 'vue'
import { FolderAdd, DocumentAdd, Folder, Document } from '@element-plus/icons-vue'
import { ElMessage, ElMessageBox } from 'element-plus'
import { fileAPI } from '../api'
import loader from '@monaco-editor/loader'

const files = ref([])
const loading = ref(false)
const currentParent = ref(null)
const breadcrumbs = ref([])

// 编辑器
const editorVisible = ref(false)
const editingFile = ref(null)
const dialogEditor = ref(null)
const saving = ref(false)
let editorInstance = null
let monaco = null

async function loadFiles(parentId = null) {
  loading.value = true
  currentParent.value = parentId
  try {
    const res = await fileAPI.list(parentId)
    if (res.code === 0) {
      files.value = res.data
    }
    // 更新面包屑
    if (parentId) {
      await buildBreadcrumbs(parentId)
    } else {
      breadcrumbs.value = []
    }
  } catch (err) {
    ElMessage.error('加载文件失败')
  } finally {
    loading.value = false
  }
}

async function buildBreadcrumbs(fileId) {
  const res = await fileAPI.tree()
  if (res.code !== 0) return

  const map = {}
  res.data.forEach(f => { map[f.id] = f })

  const trail = []
  let current = map[fileId]
  while (current) {
    trail.unshift({ id: current.id, name: current.name })
    current = current.parent_id ? map[current.parent_id] : null
  }
  breadcrumbs.value = trail
}

function handleClick(row) {
  if (row.type === 'folder') {
    navigateTo(row.id)
  } else {
    editFile(row)
  }
}

function navigateTo(parentId) {
  loadFiles(parentId)
}

function formatDate(dateStr) {
  return new Date(dateStr).toLocaleString('zh-CN')
}

// 创建文件夹
function showCreateFolder() {
  ElMessageBox.prompt('文件夹名称', '新建文件夹', { inputPattern: /\S+/, inputErrorMessage: '名称不能为空' })
    .then(async ({ value }) => {
      const res = await fileAPI.create({ name: value, type: 'folder', parent_id: currentParent.value })
      if (res.code === 0) {
        ElMessage.success('创建成功')
        loadFiles(currentParent.value)
      }
    })
    .catch(() => {})
}

// 创建文件
function showCreateFile() {
  ElMessageBox.prompt('文件名称（如 hello.py）', '新建文件', { inputPattern: /\S+/, inputErrorMessage: '名称不能为空' })
    .then(async ({ value }) => {
      const res = await fileAPI.create({ name: value, type: 'file', content: '', parent_id: currentParent.value })
      if (res.code === 0) {
        ElMessage.success('创建成功')
        loadFiles(currentParent.value)
        // 直接打开编辑
        const newFile = { id: res.data.id, name: value, type: 'file', content: '' }
        editFile(newFile)
      }
    })
    .catch(() => {})
}

// 编辑文件
async function editFile(row) {
  editingFile.value = row
  editorVisible.value = true

  await nextTick()

  if (!monaco) {
    monaco = await loader.init()
  }

  if (editorInstance) {
    editorInstance.dispose()
  }

  // 获取文件内容
  let content = row.content || ''
  if (!content && row.id) {
    const res = await fileAPI.get(row.id)
    if (res.code === 0) content = res.data.content || ''
  }

  editorInstance = monaco.editor.create(dialogEditor.value, {
    value: content,
    language: getLanguage(row.name),
    theme: 'vs-dark',
    minimap: { enabled: false },
    fontSize: 14,
    automaticLayout: true,
  })
}

function getLanguage(filename) {
  if (filename.endsWith('.py')) return 'python'
  if (filename.endsWith('.js')) return 'javascript'
  if (filename.endsWith('.ts')) return 'typescript'
  if (filename.endsWith('.html')) return 'html'
  if (filename.endsWith('.css')) return 'css'
  if (filename.endsWith('.json')) return 'json'
  if (filename.endsWith('.md')) return 'markdown'
  return 'plaintext'
}

async function saveFile() {
  if (!editorInstance || !editingFile.value) return
  saving.value = true
  try {
    await fileAPI.update(editingFile.value.id, { content: editorInstance.getValue() })
    ElMessage.success('保存成功')
    editorVisible.value = false
    loadFiles(currentParent.value)
  } catch {
    ElMessage.error('保存失败')
  } finally {
    saving.value = false
  }
}

// 下载
function downloadItem(row) {
  const url = row.type === 'folder'
    ? fileAPI.downloadZip(row.id)
    : fileAPI.download(row.id)
  window.open(url, '_blank')
}

// 重命名
function renameItem(row) {
  ElMessageBox.prompt('新名称', '重命名', { inputValue: row.name, inputPattern: /\S+/, inputErrorMessage: '名称不能为空' })
    .then(async ({ value }) => {
      await fileAPI.update(row.id, { name: value })
      ElMessage.success('重命名成功')
      loadFiles(currentParent.value)
    })
    .catch(() => {})
}

// 删除
async function deleteItem(row) {
  try {
    await fileAPI.delete(row.id)
    ElMessage.success('删除成功')
    loadFiles(currentParent.value)
  } catch {
    ElMessage.error('删除失败')
  }
}

onBeforeUnmount(() => {
  editorInstance?.dispose()
})

// 初始加载
loadFiles()
</script>

<style scoped>
.files-page {
  height: calc(100vh - 40px);
  display: flex;
  flex-direction: column;
}

.files-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: 16px;
}

.files-header h2 {
  margin: 0;
  color: #303133;
}

.header-actions {
  display: flex;
  gap: 8px;
}

.breadcrumb {
  margin-bottom: 16px;
}

.file-table {
  flex: 1;
}

.file-name {
  display: flex;
  align-items: center;
  gap: 8px;
  cursor: pointer;
}

.file-name:hover {
  color: #409eff;
}

.dialog-editor {
  height: 500px;
  border-radius: 8px;
  overflow: hidden;
}
</style>
