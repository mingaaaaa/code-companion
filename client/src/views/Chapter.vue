<template>
  <div class="chapter" v-if="chapter">
    <div class="chapter-header">
      <el-page-header @back="$router.push('/tutorial')">
        <template #content>
          <span class="chapter-title">{{ chapter.title }}</span>
        </template>
      </el-page-header>
      <div class="chapter-actions">
        <el-select v-model="chapter.status" size="default" @change="updateStatus" style="width: 120px;">
          <el-option label="未开始" value="not_started" />
          <el-option label="进行中" value="in_progress" />
          <el-option label="已完成" value="completed" />
        </el-select>
        <a :href="chapter.url" target="_blank" rel="noopener noreferrer">
          <el-button type="primary" plain>
            查看教程
            <el-icon class="el-icon--right"><Link /></el-icon>
          </el-button>
        </a>
      </div>
    </div>

    <el-divider />

    <!-- 关联练习文件 -->
    <div class="section">
      <div class="section-header">
        <h3>📝 练习文件</h3>
        <el-button type="primary" size="small" :icon="Plus" @click="createFile">新建文件</el-button>
      </div>

      <el-table :data="chapterFiles" stripe v-loading="filesLoading" v-if="chapterFiles.length > 0">
        <el-table-column label="文件名" min-width="250">
          <template #default="{ row }">
            <div class="file-name" @click="editFile(row)">
              <el-icon color="#409eff"><Document /></el-icon>
              <span>{{ row.name }}</span>
            </div>
          </template>
        </el-table-column>
        <el-table-column label="更新时间" width="180">
          <template #default="{ row }">
            {{ formatDate(row.updated_at) }}
          </template>
        </el-table-column>
        <el-table-column label="操作" width="180">
          <template #default="{ row }">
            <el-button size="small" type="primary" link @click="editFile(row)">编辑</el-button>
            <el-button size="small" type="success" link @click="downloadFile(row)">下载</el-button>
            <el-popconfirm title="确定删除？" @confirm="deleteFile(row)">
              <template #reference>
                <el-button size="small" type="danger" link>删除</el-button>
              </template>
            </el-popconfirm>
          </template>
        </el-table-column>
      </el-table>

      <el-empty v-else description="还没有练习文件，创建一个开始练习吧" :image-size="80" />
    </div>

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
import { ref, nextTick, onMounted, onBeforeUnmount } from 'vue'
import { useRoute } from 'vue-router'
import { chapterAPI, progressAPI, fileAPI } from '../api'
import { Link, Plus, Document } from '@element-plus/icons-vue'
import { ElMessage, ElMessageBox } from 'element-plus'
import loader from '@monaco-editor/loader'

const route = useRoute()
const chapter = ref(null)
const chapterFiles = ref([])
const filesLoading = ref(false)

// 编辑器
const editorVisible = ref(false)
const editingFile = ref(null)
const dialogEditor = ref(null)
const saving = ref(false)
let editorInstance = null
let monaco = null

async function updateStatus() {
  if (!chapter.value) return
  await progressAPI.update(chapter.value.id, chapter.value.status)
}


function formatDate(dateStr) {
  return new Date(dateStr).toLocaleString('zh-CN')
}

// 加载关联文件
async function loadFiles() {
  if (!chapter.value) return
  filesLoading.value = true
  try {
    const res = await fileAPI.list(null)
    if (res.code === 0) {
      chapterFiles.value = res.data.filter(f => f.chapter_id === chapter.value.id)
    }
  } catch (err) {
    console.error('加载文件失败:', err)
  } finally {
    filesLoading.value = false
  }
}

// 创建文件
async function createFile() {
  const { value } = await ElMessageBox.prompt('文件名称', '新建练习文件', {
    inputValue: `${chapter.value.title}.py`,
    inputPattern: /\S+/,
    inputErrorMessage: '名称不能为空',
  }).catch(() => ({}))

  if (!value) return

  const res = await fileAPI.create({
    name: value,
    type: 'file',
    content: `# ${chapter.value.title}\n# 在这里编写练习代码\n\n`,
    chapter_id: chapter.value.id,
  })
  if (res.code === 0) {
    ElMessage.success('创建成功')
    await loadFiles()
    // 直接打开编辑
    const newFile = { id: res.data.id, name: value, type: 'file', content: `# ${chapter.value.title}\n# 在这里编写练习代码\n\n` }
    editFile(newFile)
  }
}

// 编辑文件
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

function getLanguage(filename) {
  if (filename.endsWith('.py')) return 'python'
  if (filename.endsWith('.js')) return 'javascript'
  if (filename.endsWith('.ts')) return 'typescript'
  if (filename.endsWith('.html')) return 'html'
  if (filename.endsWith('.css')) return 'css'
  if (filename.endsWith('.json')) return 'json'
  return 'plaintext'
}

async function saveFile() {
  if (!editorInstance || !editingFile.value) return
  saving.value = true
  try {
    await fileAPI.update(editingFile.value.id, { content: editorInstance.getValue() })
    ElMessage.success('保存成功')
    editorVisible.value = false
    loadFiles()
  } catch {
    ElMessage.error('保存失败')
  } finally {
    saving.value = false
  }
}

function downloadFile(row) {
  window.open(fileAPI.download(row.id), '_blank')
}

async function deleteFile(row) {
  await fileAPI.delete(row.id)
  ElMessage.success('删除成功')
  loadFiles()
}

onBeforeUnmount(() => {
  editorInstance?.dispose()
})

onMounted(async () => {
  try {
    const res = await chapterAPI.get(route.params.id)
    if (res.code === 0) {
      chapter.value = { ...res.data, status: res.data.status || 'in_progress' }
      if (chapter.value.status === 'not_started') {
        chapter.value.status = 'in_progress'
        updateStatus()
      }
      loadFiles()
    }
  } catch (err) {
    console.error('获取章节失败:', err)
  }
})
</script>

<style scoped>
.chapter-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
}

.chapter-title {
  font-size: 18px;
  font-weight: 600;
}

.chapter-actions {
  display: flex;
  gap: 12px;
  align-items: center;
}

.section {
  margin-top: 20px;
}

.section-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: 12px;
}

.section-header h3 {
  margin: 0;
  color: #303133;
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
