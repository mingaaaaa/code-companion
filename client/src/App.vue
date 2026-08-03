<template>
  <el-config-provider :locale="zhCn">
    <div id="app">
      <el-container v-if="userStore.token" class="app-container">
        <el-aside width="200px" class="app-aside">
          <div class="logo">
            <el-icon :size="24"><Monitor /></el-icon>
            <span>Code Companion</span>
          </div>
          <el-menu
            :default-active="route.path"
            router
            background-color="#1d1e2c"
            text-color="#a0a3b1"
            active-text-color="#409eff"
          >
            <el-menu-item index="/">
              <el-icon><DataBoard /></el-icon>
              <span>仪表盘</span>
            </el-menu-item>
            <el-menu-item index="/tutorial">
              <el-icon><Reading /></el-icon>
              <span>课程</span>
            </el-menu-item>
            <el-menu-item index="/playground">
              <el-icon><Monitor /></el-icon>
              <span>练习场</span>
            </el-menu-item>
            <el-menu-item index="/files">
              <el-icon><Folder /></el-icon>
              <span>文件区</span>
            </el-menu-item>
          </el-menu>
          <div class="aside-footer">
            <el-dropdown @command="handleCommand">
              <span class="user-info">
                <el-icon><User /></el-icon>
                {{ userStore.user?.username }}
              </span>
              <template #dropdown>
                <el-dropdown-menu>
                  <el-dropdown-item command="logout">退出登录</el-dropdown-item>
                </el-dropdown-menu>
              </template>
            </el-dropdown>
          </div>
        </el-aside>
        <el-main class="app-main">
          <router-view />
        </el-main>
      </el-container>
      <router-view v-else />
    </div>
  </el-config-provider>
</template>

<script setup>
import { useRoute, useRouter } from 'vue-router'
import { useUserStore } from './stores/user'
import zhCn from 'element-plus/dist/locale/zh-cn.mjs'

const route = useRoute()
const router = useRouter()
const userStore = useUserStore()

function handleCommand(cmd) {
  if (cmd === 'logout') {
    userStore.logout()
    router.push('/login')
  }
}
</script>

<style scoped>
.app-container {
  height: 100vh;
}

.app-aside {
  background: #1d1e2c;
  display: flex;
  flex-direction: column;
  overflow: hidden;
}

.logo {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 16px 20px;
  color: #fff;
  font-size: 16px;
  font-weight: 600;
  border-bottom: 1px solid #2d2e3e;
}

.el-menu {
  border-right: none;
  flex: 1;
}

.aside-footer {
  padding: 12px 16px;
  border-top: 1px solid #2d2e3e;
}

.user-info {
  display: flex;
  align-items: center;
  gap: 6px;
  color: #a0a3b1;
  cursor: pointer;
  font-size: 13px;
}

.app-main {
  background: #f5f7fa;
  padding: 20px;
  overflow-y: auto;
}
</style>
