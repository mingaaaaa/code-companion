<template>
  <div class="tutorial">
    <div class="tutorial-header">
      <h2>📚 廖雪峰 Python 教程</h2>
      <el-input
        v-model="search"
        placeholder="搜索章节..."
        prefix-icon="Search"
        clearable
        style="max-width: 300px;"
      />
    </div>

    <div v-if="loading" class="loading">
      <el-skeleton :rows="10" animated />
    </div>

    <div v-else>
      <div v-for="group in filteredGroups" :key="group.name" class="chapter-group">
        <h3 class="group-title">{{ group.name }}</h3>
        <div class="chapter-list">
          <div
            v-for="ch in group.items"
            :key="ch.id"
            class="chapter-item"
            :class="ch.status"
            @click="$router.push(`/chapter/${ch.id}`)"
          >
            <div class="chapter-status">
              <el-icon v-if="ch.status === 'completed'" color="#67c23a" :size="18"><CircleCheckFilled /></el-icon>
              <el-icon v-else-if="ch.status === 'in_progress'" color="#e6a23c" :size="18"><Loading /></el-icon>
              <el-icon v-else color="#c0c4cc" :size="18"><CircleClose /></el-icon>
            </div>
            <div class="chapter-info">
              <span class="chapter-name">{{ ch.title }}</span>
              <span class="chapter-actions" @click.stop>
                <el-button size="small" type="primary" link :href="ch.url" target="_blank">
                  查看教程
                </el-button>
              </span>
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue'
import { chapterAPI } from '../api'

const search = ref('')
const loading = ref(true)
const chapters = ref([])

const categoryMap = {
  '简介': 1, '安装': 2,
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
    return a.items[0].sort_order - b.items[0].sort_order
  })
})

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
.tutorial-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: 20px;
}

.tutorial-header h2 {
  margin: 0;
  color: #303133;
}

.chapter-group {
  margin-bottom: 24px;
}

.group-title {
  font-size: 15px;
  color: #606266;
  margin-bottom: 8px;
  padding-left: 4px;
  font-weight: 600;
}

.chapter-list {
  display: flex;
  flex-direction: column;
  gap: 4px;
}

.chapter-item {
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 10px 16px;
  border-radius: 8px;
  cursor: pointer;
  transition: all 0.2s;
  background: #fff;
}

.chapter-item:hover {
  background: #f0f2f5;
  transform: translateX(4px);
}

.chapter-item.completed {
  opacity: 0.7;
}

.chapter-info {
  flex: 1;
  display: flex;
  align-items: center;
  justify-content: space-between;
}

.chapter-name {
  font-size: 14px;
  color: #303133;
}

.chapter-item.completed .chapter-name {
  color: #909399;
}
</style>
