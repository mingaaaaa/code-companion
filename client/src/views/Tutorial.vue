<template>
  <div class="tutorial" @click="closeMenu" @contextmenu.prevent="closeMenu">
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
            @contextmenu.prevent.stop="openMenu($event, ch)"
          >
            <div class="chapter-status">
              <el-icon v-if="ch.status === 'completed'" color="#67c23a" :size="18"><CircleCheckFilled /></el-icon>
              <el-icon v-else-if="ch.status === 'in_progress'" color="#e6a23c" :size="18"><Loading /></el-icon>
              <el-icon v-else color="#c0c4cc" :size="18"><CircleClose /></el-icon>
            </div>
            <div class="chapter-info">
              <span class="chapter-name">{{ ch.title }}</span>
              <a :href="ch.url" target="_blank" rel="noopener noreferrer" class="tutorial-link" @click.stop>
                查看教程
              </a>
            </div>
          </div>
        </div>
      </div>
    </div>

    <!-- 右键菜单 -->
    <div
      v-show="menuVisible"
      class="context-menu"
      :style="{ left: menuX + 'px', top: menuY + 'px' }"
      @click.stop
    >
      <div class="menu-title">设置状态</div>
      <div
        v-for="item in statusOptions"
        :key="item.value"
        class="menu-item"
        :class="{ active: menuChapter?.status === item.value }"
        @click="setStatus(item.value)"
      >
        <el-icon :color="item.color" :size="16">
          <component :is="item.icon" />
        </el-icon>
        <span>{{ item.label }}</span>
        <el-icon v-if="menuChapter?.status === item.value" class="check-icon"><Check /></el-icon>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, computed, onMounted, onActivated, watch } from 'vue'
import { useRoute } from 'vue-router'
import { chapterAPI, progressAPI } from '../api'
import { CircleCheckFilled, Loading, CircleClose, Check } from '@element-plus/icons-vue'
import { ElMessage } from 'element-plus'

const route = useRoute()

const search = ref('')
const loading = ref(true)
const chapters = ref([])

// 右键菜单
const menuVisible = ref(false)
const menuX = ref(0)
const menuY = ref(0)
const menuChapter = ref(null)

const statusOptions = [
  { value: 'not_started', label: '未开始', color: '#c0c4cc', icon: CircleClose },
  { value: 'in_progress', label: '进行中', color: '#e6a23c', icon: Loading },
  { value: 'completed', label: '已完成', color: '#67c23a', icon: CircleCheckFilled },
]

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

  return Object.values(groups).sort((a, b) => a.items[0].sort_order - b.items[0].sort_order)
})

function openMenu(e, chapter) {
  menuVisible.value = true
  menuX.value = e.clientX
  menuY.value = e.clientY
  menuChapter.value = chapter
}

function closeMenu() {
  menuVisible.value = false
  menuChapter.value = null
}

async function setStatus(status) {
  if (!menuChapter.value) return
  menuChapter.value.status = status
  await progressAPI.update(menuChapter.value.id, status)
  closeMenu()
}

async function loadChapters() {
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
}

onMounted(loadChapters)
onActivated(() => { loadChapters() })
watch(() => route.fullPath, (p) => { if (p === '/tutorial') loadChapters() })
</script>

<style scoped>
.tutorial-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: 20px;
}

.tutorial-header h2 { margin: 0; color: #303133; }

.chapter-group { margin-bottom: 24px; }

.group-title {
  font-size: 1.05rem;
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
  user-select: none;
}

.chapter-item:hover { background: #f0f2f5; transform: translateX(4px); }
.chapter-item.completed { opacity: 0.7; }

.chapter-info {
  flex: 1;
  display: flex;
  align-items: center;
  justify-content: space-between;
}

.chapter-name { font-size: 1rem; color: #303133; }
.chapter-item.completed .chapter-name { color: #909399; }

.tutorial-link {
  font-size: 0.85rem;
  color: #409eff;
  text-decoration: none;
  white-space: nowrap;
}
.tutorial-link:hover { text-decoration: underline; }

/* 右键菜单 */
.context-menu {
  position: fixed;
  z-index: 9999;
  background: #fff;
  border-radius: 8px;
  box-shadow: 0 4px 20px rgba(0, 0, 0, 0.15);
  padding: 6px 0;
  min-width: 160px;
}

.menu-title {
  padding: 6px 16px;
  font-size: 0.85rem;
  color: #909399;
  border-bottom: 1px solid #ebeef5;
  margin-bottom: 4px;
}

.menu-item {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 8px 16px;
  cursor: pointer;
  font-size: 0.9rem;
  color: #303133;
  transition: background 0.15s;
}

.menu-item:hover { background: #f5f7fa; }
.menu-item.active { color: #409eff; font-weight: 500; }

.check-icon {
  margin-left: auto;
  color: #409eff;
}
</style>
