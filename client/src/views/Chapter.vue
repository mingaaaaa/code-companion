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
        <a :href="chapter.url" target="_blank" rel="noopener noreferrer" class="tutorial-link">
          查看教程 →
        </a>
      </div>
    </div>

    <el-divider />

    <!-- 练习文件 -->
    <div class="section">
      <div class="section-header">
        <h3>📝 练习文件</h3>
        <el-button type="primary" size="small" :icon="Plus" @click="createFile">新建文件</el-button>
      </div>

      <el-table :data="chapterFiles" stripe v-loading="filesLoading" v-if="chapterFiles.length > 0">
        <el-table-column label="文件名" min-width="300">
          <template #default="{ row }">
            <div class="file-name" @click="openInPlayground(row)">
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
        <el-table-column label="操作" width="240">
          <template #default="{ row }">
            <el-button size="small" type="primary" link @click="openInPlayground(row)">编辑</el-button>
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

    <!-- 笔记区域 -->
    <div class="section note-section">
      <div class="section-header" @click="noteExpanded = !noteExpanded" style="cursor: pointer;">
        <h3>
          <el-icon><Notebook /></el-icon>
          学习笔记
        </h3>
        <div class="note-header-right">
          <span v-if="noteSaving" class="save-status saving">保存中...</span>
          <span v-else-if="noteSaved" class="save-status saved">已保存</span>
          <span v-if="noteUpdatedAt" class="note-time">最后编辑：{{ formatDate(noteUpdatedAt) }}</span>
          <el-icon :class="{ expanded: noteExpanded }"><ArrowDown /></el-icon>
        </div>
      </div>

      <div v-show="noteExpanded" class="note-editor">
        <div class="note-left">
          <textarea
            v-model="noteContent"
            class="note-textarea"
            placeholder="在这里写 Markdown 笔记..."
            @input="onNoteInput"
          ></textarea>
        </div>
        <div class="note-right">
          <div class="note-preview" v-html="renderedNote"></div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, computed, onMounted, watch } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { chapterAPI, progressAPI, fileAPI, noteAPI } from '../api'
import { Plus, Document, Notebook, ArrowDown } from '@element-plus/icons-vue'
import { ElMessage, ElMessageBox } from 'element-plus'
import { marked } from 'marked'

const route = useRoute()
const router = useRouter()
const chapter = ref(null)
const chapterFiles = ref([])
const filesLoading = ref(false)

// 笔记相关
const noteContent = ref('')
const noteExpanded = ref(false)
const noteSaving = ref(false)
const noteSaved = ref(false)
const noteUpdatedAt = ref(null)
let saveTimer = null

const renderedNote = computed(() => {
  if (!noteContent.value) return '<p style="color:#909399">暂无笔记，开始记录吧...</p>'
  return marked.parse(noteContent.value)
})

async function updateStatus() {
  if (!chapter.value) return
  await progressAPI.update(chapter.value.id, chapter.value.status)
}

function formatDate(dateStr) {
  return new Date(dateStr).toLocaleString('zh-CN')
}

// 文件相关
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
    router.push({ path: '/playground', query: { fileId: res.data.id, chapterId: chapter.value.id } })
  }
}

function openInPlayground(row) {
  router.push({ path: '/playground', query: { fileId: row.id, chapterId: chapter.value.id } })
}

function downloadFile(row) {
  window.open(fileAPI.download(row.id), '_blank')
}

async function deleteFile(row) {
  await fileAPI.delete(row.id)
  ElMessage.success('删除成功')
  loadFiles()
}

// 笔记相关
async function loadNote() {
  if (!chapter.value) return
  try {
    const res = await noteAPI.get(chapter.value.id)
    if (res.code === 0) {
      noteContent.value = res.data.content || ''
      noteUpdatedAt.value = res.data.updated_at || null
    }
  } catch (err) {
    console.error('加载笔记失败:', err)
  }
}

function onNoteInput() {
  noteSaved.value = false
  if (saveTimer) clearTimeout(saveTimer)
  saveTimer = setTimeout(() => saveNote(), 2000)
}

async function saveNote() {
  if (!chapter.value) return
  noteSaving.value = true
  try {
    await noteAPI.save(chapter.value.id, noteContent.value)
    noteSaved.value = true
    noteUpdatedAt.value = new Date().toISOString()
  } catch (err) {
    console.error('保存笔记失败:', err)
  } finally {
    noteSaving.value = false
  }
}

onMounted(async () => {
  try {
    const res = await chapterAPI.get(route.params.id)
    if (res.code === 0) {
      chapter.value = { ...res.data, status: res.data.status || 'not_started' }
      if (!res.data.status || res.data.status === 'not_started') {
        chapter.value.status = 'in_progress'
        updateStatus()
      }
      loadFiles()
      loadNote()
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
  font-size: 1.3rem;
  font-weight: 600;
}

.chapter-actions {
  display: flex;
  gap: 12px;
  align-items: center;
}

.tutorial-link {
  display: inline-flex;
  align-items: center;
  padding: 8px 16px;
  background: #409eff;
  color: #fff;
  border-radius: 6px;
  font-size: 1rem;
  text-decoration: none;
  transition: background 0.2s;
}

.tutorial-link:hover {
  background: #337ecc;
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
  display: flex;
  align-items: center;
  gap: 6px;
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

/* 笔记区域 */
.note-section {
  margin-top: 32px;
  border: 1px solid #ebeef5;
  border-radius: 8px;
  padding: 16px;
  background: #fff;
}

.note-header-right {
  display: flex;
  align-items: center;
  gap: 12px;
  font-size: 0.85rem;
}

.save-status {
  padding: 2px 8px;
  border-radius: 4px;
}

.save-status.saving {
  color: #e6a23c;
  background: #fdf6ec;
}

.save-status.saved {
  color: #67c23a;
  background: #f0f9eb;
}

.note-time {
  color: #909399;
}

.expanded {
  transform: rotate(180deg);
  transition: transform 0.2s;
}

.note-editor {
  display: flex;
  gap: 16px;
  height: 400px;
  margin-top: 8px;
}

.note-left, .note-right {
  flex: 1;
  min-width: 0;
}

.note-textarea {
  width: 100%;
  height: 100%;
  padding: 12px;
  border: 1px solid #dcdfe6;
  border-radius: 6px;
  font-family: 'Consolas', 'Monaco', monospace;
  font-size: 0.9rem;
  line-height: 1.6;
  resize: none;
  outline: none;
  transition: border-color 0.2s;
}

.note-textarea:focus {
  border-color: #409eff;
}

.note-preview {
  height: 100%;
  padding: 12px;
  border: 1px solid #ebeef5;
  border-radius: 6px;
  overflow-y: auto;
  background: #fafafa;
  line-height: 1.6;
}

.note-preview :deep(h1) { font-size: 1.5rem; margin: 0.5rem 0; }
.note-preview :deep(h2) { font-size: 1.3rem; margin: 0.5rem 0; }
.note-preview :deep(h3) { font-size: 1.1rem; margin: 0.5rem 0; }
.note-preview :deep(code) {
  background: #f0f2f5;
  padding: 2px 6px;
  border-radius: 3px;
  font-size: 0.9em;
}
.note-preview :deep(pre) {
  background: #282c34;
  color: #abb2bf;
  padding: 12px;
  border-radius: 6px;
  overflow-x: auto;
}
.note-preview :deep(pre code) {
  background: none;
  padding: 0;
  color: inherit;
}
.note-preview :deep(ul), .note-preview :deep(ol) {
  padding-left: 1.5rem;
}
.note-preview :deep(blockquote) {
  border-left: 3px solid #409eff;
  margin: 0.5rem 0;
  padding: 0.5rem 1rem;
  color: #606266;
  background: #f5f7fa;
}
</style>
