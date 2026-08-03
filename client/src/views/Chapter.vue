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
      <div class="section-header" @click="toggleNote" style="cursor: pointer;">
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

      <div v-show="noteExpanded" ref="vditorContainer" class="vditor-wrap"></div>
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted, onBeforeUnmount, nextTick } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { chapterAPI, progressAPI, fileAPI, noteAPI } from '../api'
import { Plus, Document, Notebook, ArrowDown } from '@element-plus/icons-vue'
import { ElMessage, ElMessageBox } from 'element-plus'
import Vditor from 'vditor'
import 'vditor/dist/index.css'

const route = useRoute()
const router = useRouter()
const chapter = ref(null)
const chapterFiles = ref([])
const filesLoading = ref(false)

// 笔记相关
const vditorContainer = ref(null)
const noteExpanded = ref(false)
const noteSaving = ref(false)
const noteSaved = ref(false)
const noteUpdatedAt = ref(null)
let vditor = null
let saveTimer = null

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
      noteUpdatedAt.value = res.data.updated_at || null
      if (vditor) {
        vditor.setValue(res.data.content || '')
      }
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
  if (!chapter.value || !vditor) return
  noteSaving.value = true
  try {
    const content = vditor.getValue()
    await noteAPI.save(chapter.value.id, content)
    noteSaved.value = true
    noteUpdatedAt.value = new Date().toISOString()
  } catch (err) {
    console.error('保存笔记失败:', err)
  } finally {
    noteSaving.value = false
  }
}

async function toggleNote() {
  noteExpanded.value = !noteExpanded.value
  if (noteExpanded.value && !vditor) {
    await nextTick()
    initVditor()
  }
}

function initVditor() {
  vditor = new Vditor(vditorContainer.value, {
    height: 400,
    mode: 'ir',
    placeholder: '在这里写笔记...',
    outline: { enable: false },
    toolbar: [
      'emoji', 'headings', 'bold', 'italic', 'strike', '|',
      'line', 'quote', 'list', 'ordered-list', 'check', '|',
      'code', 'inline-code', 'table', '|',
      'undo', 'redo', '|',
      'edit-mode', 'fullscreen', '|',
      {
        name: 'save',
        tipPosition: 's',
        tip: '保存 (Ctrl+S)',
        icon: '<svg viewBox="0 0 16 16" width="16" height="16"><path d="M13.353 1.146l1.5 1.5L15 3v10.5l-.5.5h-13l-.5-.5v-13l.5-.5H3l.354.146L13.353 1.146zM2 2v11h12V3.207L11.793 2H11v3H4V2H2z"/><path d="M4 13h8v1H4z"/></svg>',
        click: () => saveNote(),
      },
    ],
    after: () => {
      loadNote()
    },
    input: () => onNoteInput(),
    cache: { enable: false },
  })
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
    }
  } catch (err) {
    console.error('获取章节失败:', err)
  }
})

onBeforeUnmount(() => {
  if (vditor) {
    vditor.destroy()
    vditor = null
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

.vditor-wrap {
  margin-top: 8px;
}
</style>
