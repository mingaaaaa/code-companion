<template>
  <div class="home">
    <h2>👋 欢迎，{{ userStore.user?.username }}</h2>

    <el-row :gutter="20" class="stats-row">
      <el-col :span="8">
        <el-card shadow="hover" class="stat-card">
          <div class="stat-icon" style="background: #ecf5ff;">
            <el-icon :size="28" color="#409eff"><Reading /></el-icon>
          </div>
          <div class="stat-info">
            <div class="stat-value">{{ stats.completed }}</div>
            <div class="stat-label">已完成</div>
          </div>
        </el-card>
      </el-col>
      <el-col :span="8">
        <el-card shadow="hover" class="stat-card">
          <div class="stat-icon" style="background: #fdf6ec;">
            <el-icon :size="28" color="#e6a23c"><Loading /></el-icon>
          </div>
          <div class="stat-info">
            <div class="stat-value">{{ stats.inProgress }}</div>
            <div class="stat-label">进行中</div>
          </div>
        </el-card>
      </el-col>
      <el-col :span="8">
        <el-card shadow="hover" class="stat-card">
          <div class="stat-icon" style="background: #f0f9eb;">
            <el-icon :size="28" color="#67c23a"><CircleCheckFilled /></el-icon>
          </div>
          <div class="stat-info">
            <div class="stat-value">{{ stats.percentage }}%</div>
            <div class="stat-label">总进度</div>
          </div>
        </el-card>
      </el-col>
    </el-row>

    <el-card class="progress-card">
      <template #header>
        <span>📚 廖雪峰 Python 教程</span>
      </template>
      <el-progress
        :percentage="stats.percentage"
        :stroke-width="20"
        :text-inside="true"
        status="success"
      />
      <div class="progress-detail">
        共 {{ stats.total }} 节，已完成 {{ stats.completed }} 节，进行中 {{ stats.inProgress }} 节
      </div>
      <el-button type="primary" @click="$router.push('/tutorial')" style="margin-top: 16px;">
        继续学习
      </el-button>
    </el-card>
  </div>
</template>

<script setup>
import { ref, onMounted } from 'vue'
import { useUserStore } from '../stores/user'
import { progressAPI } from '../api'

const userStore = useUserStore()
const stats = ref({ total: 0, completed: 0, inProgress: 0, percentage: 0 })

onMounted(async () => {
  await userStore.fetchUser()
  try {
    const res = await progressAPI.stats()
    if (res.code === 0) {
      stats.value = res.data
    }
  } catch (err) {
    console.error('获取统计失败:', err)
  }
})
</script>

<style scoped>
.home h2 {
  margin-bottom: 24px;
  color: #303133;
}

.stats-row {
  margin-bottom: 24px;
}

.stat-card {
  cursor: pointer;
}

.stat-card :deep(.el-card__body) {
  display: flex;
  align-items: center;
  gap: 16px;
  padding: 20px;
}

.stat-icon {
  width: 56px;
  height: 56px;
  border-radius: 12px;
  display: flex;
  align-items: center;
  justify-content: center;
  flex-shrink: 0;
}

.stat-value {
  font-size: 28px;
  font-weight: 700;
  color: #303133;
}

.stat-label {
  font-size: 13px;
  color: #909399;
}

.progress-card {
  max-width: 600px;
}

.progress-detail {
  margin-top: 12px;
  font-size: 13px;
  color: #909399;
}
</style>
