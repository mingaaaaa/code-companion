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
        <el-button type="primary" :icon="Link" @click="openOriginal" plain>
          查看教程
        </el-button>
      </div>
    </div>

    <el-divider />

    <!-- 教程内容嵌入 -->
    <el-card class="content-card">
      <iframe
        :src="chapter.url"
        class="tutorial-frame"
        sandbox="allow-same-origin allow-scripts allow-popups"
      />
    </el-card>
  </div>
</template>

<script setup>
import { ref, onMounted } from 'vue'
import { useRoute } from 'vue-router'
import { chapterAPI, progressAPI } from '../api'
import { Link } from '@element-plus/icons-vue'

const route = useRoute()
const chapter = ref(null)

async function updateStatus() {
  if (!chapter.value) return
  await progressAPI.update(chapter.value.id, chapter.value.status)
}

function openOriginal() {
  window.open(chapter.value.url, '_blank')
}

onMounted(async () => {
  try {
    const res = await chapterAPI.get(route.params.id)
    if (res.code === 0) {
      chapter.value = { ...res.data, status: res.data.status || 'in_progress' }
      // 自动标记为进行中
      if (chapter.value.status === 'not_started') {
        chapter.value.status = 'in_progress'
        updateStatus()
      }
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

.content-card {
  height: calc(100vh - 200px);
}

.tutorial-frame {
  width: 100%;
  height: 100%;
  border: none;
  border-radius: 8px;
}
</style>
