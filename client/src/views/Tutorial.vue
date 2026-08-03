<template>
  <div class="tutorial">
    <h2>📚 廖雪峰 Python 教程</h2>

    <el-input
      v-model="search"
      placeholder="搜索章节..."
      prefix-icon="Search"
      clearable
      style="max-width: 400px; margin-bottom: 20px;"
    />

    <div v-if="loading" class="loading">
      <el-skeleton :rows="10" animated />
    </div>

    <div v-else>
      <!-- 按分类分组显示 -->
      <div v-for="group in filteredGroups" :key="group.name" class="chapter-group">
        <h3 class="group-title">{{ group.name }}</h3>
        <el-table :data="group.items" stripe style="width: 100%">
          <el-table-column label="章节" min-width="300">
            <template #default="{ row }">
              <div class="chapter-name">
                <el-icon v-if="row.status === 'completed'" color="#67c23a"><CircleCheckFilled /></el-icon>
                <el-icon v-else-if="row.status === 'in_progress'" color="#e6a23c"><Loading /></el-icon>
                <el-icon v-else color="#c0c4cc"><CircleClose /></el-icon>
                <a :href="row.url" target="_blank" class="chapter-link">{{ row.title }}</a>
              </div>
            </template>
          </el-table-column>
          <el-table-column label="状态" width="140">
            <template #default="{ row }">
              <el-select
                v-model="row.status"
                size="small"
                @change="updateStatus(row)"
              >
                <el-option label="未开始" value="not_started" />
                <el-option label="进行中" value="in_progress" />
                <el-option label="已完成" value="completed" />
              </el-select>
            </template>
          </el-table-column>
          <el-table-column label="操作" width="120">
            <template #default="{ row }">
              <el-button size="small" type="primary" link @click="$router.push(`/chapter/${row.id}`)">
                进入
              </el-button>
            </template>
          </el-table-column>
        </el-table>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue'
import { chapterAPI, progressAPI } from '../api'
import { ElMessage } from 'element-plus'

const search = ref('')
const loading = ref(true)
const chapters = ref([])

// 分类映射
const categoryMap = {
  '简介': 1, '历史': 2, '安装': 3,
  '第一个程序': 10, '基本数据类型': 20,
  '函数': 30, '面向对象编程': 40, '面向对象高级': 50,
  '函数式编程': 60, '高级特性': 70, '模块': 80,
  'IO': 90, '错误处理': 100, '数据库': 110,
  'Web': 120, '网络编程': 130, '多进程多线程': 140,
  '第三方模块': 150, '内置模块': 160, '异步IO': 180,
  'GUI': 190, 'Email': 200, '正则表达式': 210,
  '常见问题': 220, '总结': 230,
}

function getCategory(sortOrder) {
  for (const [name, threshold] of Object.entries(categoryMap).sort((a, b) => b[1] - a[1])) {
    if (sortOrder >= threshold) return name
  }
  return '其他'
}

const filteredGroups = computed(() => {
  const filtered = search.value
    ? chapters.value.filter(c => c.title.includes(search.value))
    : chapters.value

  const groups = {}
  filtered.forEach(ch => {
    const cat = getCategory(ch.sort_order)
    if (!groups[cat]) groups[cat] = { name: cat, items: [] }
    groups[cat].items.push(ch)
  })

  return Object.values(groups).sort((a, b) => {
    const aFirst = a.items[0]
    const bFirst = b.items[0]
    return aFirst.sort_order - bFirst.sort_order
  })
})

async function updateStatus(chapter) {
  try {
    await progressAPI.update(chapter.id, chapter.status)
  } catch {
    ElMessage.error('更新失败')
  }
}

onMounted(async () => {
  try {
    const res = await chapterAPI.progress('liaoxuefeng-python')
    if (res.code === 0) {
      chapters.value = res.data.map(ch => ({
        ...ch,
        status: ch.status || 'not_started',
      }))
    }
  } catch (err) {
    console.error('获取章节失败:', err)
  } finally {
    loading.value = false
  }
})
</script>

<style scoped>
.tutorial h2 {
  margin-bottom: 16px;
  color: #303133;
}

.chapter-group {
  margin-bottom: 24px;
}

.group-title {
  font-size: 16px;
  color: #606266;
  margin-bottom: 8px;
  padding-left: 4px;
}

.chapter-name {
  display: flex;
  align-items: center;
  gap: 8px;
}

.chapter-link {
  color: #409eff;
}

.chapter-link:hover {
  text-decoration: underline;
}
</style>
