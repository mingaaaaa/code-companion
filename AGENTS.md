# AGENTS.md - Code Companion

## 项目简介

**Code Companion** 是一个 Python 编程学习伴侣，帮助学习者追踪学习进度、在线练习代码、管理学习文件。

核心功能：
1. **课程进度追踪** — 预置廖雪峰 Python 教程，标记每节学习状态
2. **代码练习场** — Monaco Editor + Pyodide，浏览器端在线执行 Python
3. **个人文件区** — 创建文件/文件夹，在线编辑、保存、下载
4. **跨设备同步** — 用户登录后数据同步到服务器

## 技术栈

- **前端**：Vite + Vue 3 + TypeScript + Monaco Editor + Pyodide
- **后端**：Node.js + Express
- **数据库**：MySQL 8.0
- **部署**：Docker + Nginx

## 项目结构

```
code-companion/
├── client/          # 前端 Vue 3
├── server/          # 后端 Express
├── docker/          # Docker 配置
├── nginx/           # Nginx 反代
├── PLAN.md          # 开发计划
└── AGENTS.md        # 本文件
```

## 开发约定

### 代码风格
- 前端：Vue 3 Composition API + `<script setup>` 语法
- 后端：CommonJS（Node.js），路由按模块拆分
- 数据库：使用 mysql2 连接池
- 提交信息：`feat: xxx` / `fix: xxx` / `chore: xxx`

### API 规范
- 基础路径：`/api/v1`
- 认证：JWT Token，Header `Authorization: Bearer <token>`
- 响应格式：
  ```json
  { "code": 0, "data": {}, "message": "ok" }
  ```

### 分支策略
- `main` — 生产分支
- `dev` — 开发分支
- `feat/*` — 功能分支

## 关键依赖

### 前端
- `vue` ^3.x
- `vue-router` ^4.x
- `pinia` — 状态管理
- `@monaco-editor/loader` — Monaco Editor
- `pyodide` — Python WebAssembly 执行
- `axios` — HTTP 请求
- `element-plus` 或 `naive-ui` — UI 组件库
- `jszip` — 文件夹打包下载
- `file-saver` — 文件下载

### 后端
- `express` — Web 框架
- `mysql2` — MySQL 驱动
- `bcryptjs` — 密码加密
- `jsonwebtoken` — JWT 签发
- `cors` — 跨域
- `multer` — 文件上传（可选）

## 环境变量

后端 `.env`：
```
DB_HOST=127.0.0.1
DB_PORT=3306
DB_NAME=code_companion
DB_USER=root
DB_PASS=your_password
JWT_SECRET=your_jwt_secret
PORT=3001
```

## 运行方式

### 开发环境
```bash
# 后端
cd server && npm install && npm run dev

# 前端
cd client && npm install && npm run dev
```

### Docker 部署
```bash
docker-compose up -d
```

## 章节数据来源

教程：[廖雪峰 Python 教程](https://liaoxuefeng.com/books/python/introduction/index.html)

章节数据通过爬取页面获取，存入 MySQL `chapters` 表，包含约 80+ 节内容。

## 注意事项

1. Pyodide 首次加载约 10MB，需要 CDN 加速或本地部署 wasm 文件
2. Monaco Editor 体积较大，建议使用 CDN 或按需加载
3. MySQL 字符集使用 `utf8mb4`，支持中文内容
4. 文件内容存 MySQL LONGBLOB，单文件上限约 64MB，足够学习使用
