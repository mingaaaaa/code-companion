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
        <el-table-column label="操作" width="180">
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
  </div>
</template>

<script setup>
import { ref, onMounted } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { chapterAPI, progressAPI, fileAPI } from '../api'
import { downloadFile as dlFile } from '../utils/download'
import { Link, Plus, Document } from '@element-plus/icons-vue'
import { ElMessage, ElMessageBox } from 'element-plus'

const route = useRoute()
const router = useRouter()
const chapter = ref(null)
const chapterFiles = ref([])
const filesLoading = ref(false)

async function updateStatus() {
  if (!chapter.value) return
  await progressAPI.update(chapter.value.id, chapter.value.status)
}

function formatDate(dateStr) {
  return new Date(dateStr).toLocaleString('zh-CN')
}

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

// 新建文件 → 跳转练习场
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

// 打开已有文件 → 跳转练习场
function openInPlayground(row) {
  router.push({ path: '/playground', query: { fileId: row.id, chapterId: chapter.value.id } })
}

function downloadFile(row) {
  dlFile(row.id, row.name)
}

async function deleteFile(row) {
  await fileAPI.delete(row.id)
  ElMessage.success('删除成功')
  loadFiles()
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

.tutorial-link {
  display: inline-flex;
  align-items: center;
  padding: 8px 16px;
  background: #409eff;
  color: #fff;
  border-radius: 6px;
  font-size: 14px;
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
</style>
