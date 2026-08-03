<template>
  <div class="files-page">
    <div class="files-header">
      <h2>📁 个人文件区</h2>
      <div class="header-actions">
        <el-button type="primary" :icon="FolderAdd" @click="showCreateFolder">新建文件夹</el-button>
        <el-button :icon="DocumentAdd" @click="showCreateFile">新建文件</el-button>
      </div>
    </div>

    <!-- 面包屑 -->
    <el-breadcrumb separator="/" class="breadcrumb" v-if="breadcrumbs.length > 0">
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

    <!-- 筛选 -->
    <div class="filter-bar">
      <el-radio-group v-model="filterMode" size="small">
        <el-radio-button value="all">全部</el-radio-button>
        <el-radio-button value="linked">已关联章节</el-radio-button>
        <el-radio-button value="unlinked">未关联章节</el-radio-button>
      </el-radio-group>
    </div>

    <!-- 文件列表 -->
    <el-table :data="filteredFiles" stripe v-loading="loading" class="file-table">
      <el-table-column label="名称" min-width="250">
        <template #default="{ row }">
          <div class="file-name" @click="handleClick(row)">
            <el-icon v-if="row.type === 'folder'" color="#e6a23c"><Folder /></el-icon>
            <el-icon v-else color="#409eff"><Document /></el-icon>
            <span>{{ row.name }}</span>
          </div>
        </template>
      </el-table-column>
      <el-table-column label="关联章节" width="200">
        <template #default="{ row }">
          <el-tag v-if="row.chapter_title" size="small" type="info">{{ row.chapter_title }}</el-tag>
          <span v-else class="text-muted">—</span>
        </template>
      </el-table-column>
      <el-table-column label="类型" width="80">
        <template #default="{ row }">
          <el-tag :type="row.type === 'folder' ? 'warning' : 'info'" size="small">
            {{ row.type === 'folder' ? '文件夹' : '文件' }}
          </el-tag>
        </template>
      </el-table-column>
      <el-table-column label="更新时间" width="170">
        <template #default="{ row }">
          {{ formatDate(row.updated_at) }}
        </template>
      </el-table-column>
      <el-table-column label="操作" width="200">
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

    <el-empty v-if="!loading && filteredFiles.length === 0" description="空空如也" />

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
import { ref, computed, nextTick, onMounted, onBeforeUnmount } from 'vue'
import { FolderAdd, DocumentAdd, Folder, Document } from '@element-plus/icons-vue'
import { ElMessage, ElMessageBox } from 'element-plus'
import { fileAPI } from '../api'
import loader from '@monaco-editor/loader'

const files = ref([])
const loading = ref(false)
const currentParent = ref(null)
const breadcrumbs = ref([])
const filterMode = ref('all')

const editorVisible = ref(false)
const editingFile = ref(null)
const dialogEditor = ref(null)
const saving = ref(false)
let editorInstance = null
let monaco = null

const filteredFiles = computed(() => {
  if (filterMode.value === 'linked') return files.value.filter(f => f.chapter_title)
  if (filterMode.value === 'unlinked') return files.value.filter(f => !f.chapter_title && f.type === 'file')
  return files.value
})

async function loadFiles(parentId = null) {
  loading.value = true
  currentParent.value = parentId
  try {
    const res = await fileAPI.list(parentId)
    if (res.code === 0) files.value = res.data
    if (parentId) {
      const treeRes = await fileAPI.tree()
      if (treeRes.code === 0) {
        const map = {}
        treeRes.data.forEach(f => { map[f.id] = f })
        const trail = []
        let current = map[parentId]
        while (current) {
          trail.unshift({ id: current.id, name: current.name })
          current = current.parent_id ? map[current.parent_id] : null
        }
        breadcrumbs.value = trail
      }
    } else {
      breadcrumbs.value = []
    }
  } catch {
    ElMessage.error('加载文件失败')
  } finally {
    loading.value = false
  }
}

function handleClick(row) {
  if (row.type === 'folder') navigateTo(row.id)
  else editFile(row)
}

function navigateTo(parentId) { loadFiles(parentId) }
function formatDate(d) { return new Date(d).toLocaleString('zh-CN') }

function showCreateFolder() {
  ElMessageBox.prompt('文件夹名称', '新建文件夹', { inputPattern: /\S+/, inputErrorMessage: '名称不能为空' })
    .then(async ({ value }) => {
      await fileAPI.create({ name: value, type: 'folder', parent_id: currentParent.value })
      ElMessage.success('创建成功')
      loadFiles(currentParent.value)
    }).catch(() => {})
}

function showCreateFile() {
  ElMessageBox.prompt('文件名称', '新建文件', { inputPattern: /\S+/, inputErrorMessage: '名称不能为空' })
    .then(async ({ value }) => {
      const res = await fileAPI.create({ name: value, type: 'file', content: '', parent_id: currentParent.value })
      if (res.code === 0) {
        ElMessage.success('创建成功')
        loadFiles(currentParent.value)
        editFile({ id: res.data.id, name: value, type: 'file', content: '' })
      }
    }).catch(() => {})
}

async function editFile(row) {
  editingFile.value = row
  editorVisible.value = true
  await nextTick()
  if (!monaco) monaco = await loader.init()
  if (editorInstance) editorInstance.dispose()

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

function getLanguage(f) {
  if (f.endsWith('.py')) return 'python'
  if (f.endsWith('.js')) return 'javascript'
  if (f.endsWith('.ts')) return 'typescript'
  if (f.endsWith('.html')) return 'html'
  if (f.endsWith('.css')) return 'css'
  if (f.endsWith('.json')) return 'json'
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
  } catch { ElMessage.error('保存失败') }
  finally { saving.value = false }
}

function downloadItem(row) {
  window.open(row.type === 'folder' ? fileAPI.downloadZip(row.id) : fileAPI.download(row.id), '_blank')
}

function renameItem(row) {
  ElMessageBox.prompt('新名称', '重命名', { inputValue: row.name, inputPattern: /\S+/, inputErrorMessage: '名称不能为空' })
    .then(async ({ value }) => {
      await fileAPI.update(row.id, { name: value })
      ElMessage.success('重命名成功')
      loadFiles(currentParent.value)
    }).catch(() => {})
}

async function deleteItem(row) {
  await fileAPI.delete(row.id)
  ElMessage.success('删除成功')
  loadFiles(currentParent.value)
}

onBeforeUnmount(() => { editorInstance?.dispose() })
onMounted(() => loadFiles())
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

.files-header h2 { margin: 0; color: #303133; }
.header-actions { display: flex; gap: 8px; }
.breadcrumb { margin-bottom: 12px; }

.filter-bar {
  margin-bottom: 12px;
}

.file-table { flex: 1; }

.file-name {
  display: flex;
  align-items: center;
  gap: 8px;
  cursor: pointer;
}

.file-name:hover { color: #409eff; }

.text-muted { color: #c0c4cc; font-size: 12px; }

.dialog-editor {
  height: 500px;
  border-radius: 8px;
  overflow: hidden;
}
</style>
