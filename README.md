# Code Companion

> 编程学习伴侣 — Python 学习进度追踪 + 在线代码练习 + 个人文件管理

## 功能

- 📚 **课程进度追踪** — 预置廖雪峰 Python 教程，标记学习状态
- 💻 **代码练习场** — Monaco Editor + Pyodide，浏览器端在线执行 Python
- 📁 **个人文件区** — 创建文件/文件夹，在线编辑、保存、下载
- 🔄 **跨设备同步** — 登录后数据同步到服务器

## 技术栈

- **前端**：Vite + Vue 3 + TypeScript
- **代码编辑器**：Monaco Editor (VS Code 同款)
- **代码执行**：Pyodide (Python in WebAssembly)
- **后端**：Node.js + Express
- **数据库**：MySQL 8.0
- **部署**：Docker + Nginx

## 快速开始

```bash
# 克隆仓库
git clone <repo-url>
cd code-companion

# 后端
cd server
cp .env.example .env  # 配置数据库连接
npm install
npm run dev

# 前端
cd ../client
npm install
npm run dev
```

## Docker 部署

```bash
docker-compose up -d
```

访问 `http://localhost:8080`

## 项目结构

```
code-companion/
├── client/          # 前端 Vue 3
├── server/          # 后端 Express
├── docker/          # Docker 配置
├── nginx/           # Nginx 反代
├── PLAN.md          # 开发计划
├── AGENTS.md        # Agent 协作规范
└── README.md        # 本文件
```

## License

MIT
