# Code Companion - 开发计划

> 编程学习伴侣 — Python 学习进度追踪 + 在线代码练习 + 个人文件管理

## 技术栈

| 层级 | 技术选型 | 说明 |
|------|----------|------|
| 前端 | Vite + Vue 3 + TypeScript | 轻量快速 |
| 代码编辑器 | Monaco Editor | VS Code 同款，体验好 |
| 代码执行 | Pyodide (WebAssembly) | 浏览器端跑 Python，零后端负担 |
| UI 组件 | Element Plus / Naive UI | Vue 3 生态 |
| 后端 | Node.js + Express | 已有 Node v22 |
| 数据库 | MySQL 8.0 | 已有服务 |
| 部署 | Docker + Nginx 反代 | 容器化部署 |

---

## 功能模块

### P0 - 核心功能（第一版）

#### 1. 课程进度追踪
- 预置廖雪峰 Python 教程全部章节（~80 节）
- 章节状态：未开始 / 进行中 / 已完成
- 整体进度条 + 分章节进度可视化
- 章节点击跳转到原始教程页面

#### 2. 代码练习场
- Monaco Editor 在线编辑 Python 代码
- Pyodide 浏览器端执行，实时输出结果
- 支持多文件编辑（左侧文件树）
- 代码保存到个人文件区

#### 3. 个人文件区
- 文件夹/文件 CRUD（树形结构）
- 在线编辑代码文件
- 文件下载（单文件 / 文件夹 zip 打包）
- 文件关联到具体章节

#### 4. 用户系统
- 注册 / 登录（用户名 + 密码）
- JWT 鉴权
- 学习数据按用户隔离

### P1 - 增强功能（第二版）

#### 5. 笔记系统
- 每节课可关联笔记
- Markdown 编辑 + 预览
- 笔记搜索

#### 6. 学习统计
- 每日学习时长统计
- 连续学习天数（Streak）
- 代码运行次数统计

### P2 - 可选功能（第三版）

#### 7. 分享功能
- 文件/笔记生成分享链接
- 代码片段分享

#### 8. 多教程支持
- 支持添加自定义教程 URL + 章节
- 不只限于廖雪峰 Python 教程

---

## 数据库设计

### users 表
```sql
CREATE TABLE users (
  id INT PRIMARY KEY AUTO_INCREMENT,
  username VARCHAR(50) UNIQUE NOT NULL,
  password_hash VARCHAR(255) NOT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
);
```

### chapters 表（预置数据）
```sql
CREATE TABLE chapters (
  id INT PRIMARY KEY AUTO_INCREMENT,
  tutorial_key VARCHAR(50) DEFAULT 'liaoxuefeng-python',
  title VARCHAR(200) NOT NULL,
  url VARCHAR(500) NOT NULL,
  sort_order INT DEFAULT 0,
  parent_id INT DEFAULT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
```

### user_progress 表
```sql
CREATE TABLE user_progress (
  id INT PRIMARY KEY AUTO_INCREMENT,
  user_id INT NOT NULL,
  chapter_id INT NOT NULL,
  status ENUM('not_started', 'in_progress', 'completed') DEFAULT 'not_started',
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  UNIQUE KEY uk_user_chapter (user_id, chapter_id),
  FOREIGN KEY (user_id) REFERENCES users(id),
  FOREIGN KEY (chapter_id) REFERENCES chapters(id)
);
```

### files 表
```sql
CREATE TABLE files (
  id INT PRIMARY KEY AUTO_INCREMENT,
  user_id INT NOT NULL,
  parent_id INT DEFAULT NULL,
  name VARCHAR(200) NOT NULL,
  type ENUM('file', 'folder') NOT NULL,
  content LONGTEXT,
  chapter_id INT DEFAULT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  FOREIGN KEY (user_id) REFERENCES users(id),
  FOREIGN KEY (chapter_id) REFERENCES chapters(id)
);
```

### notes 表（P1）
```sql
CREATE TABLE notes (
  id INT PRIMARY KEY AUTO_INCREMENT,
  user_id INT NOT NULL,
  chapter_id INT NOT NULL,
  content TEXT,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  UNIQUE KEY uk_user_chapter (user_id, chapter_id),
  FOREIGN KEY (user_id) REFERENCES users(id),
  FOREIGN KEY (chapter_id) REFERENCES chapters(id)
);
```

---

## 项目结构

```
code-companion/
├── client/                  # 前端 Vue 3 项目
│   ├── src/
│   │   ├── views/
│   │   │   ├── Home.vue           # 首页（仪表盘）
│   │   │   ├── Login.vue          # 登录
│   │   │   ├── Register.vue       # 注册
│   │   │   ├── Tutorial.vue       # 课程列表
│   │   │   ├── Chapter.vue        # 章节详情 + 进度
│   │   │   ├── Playground.vue     # 代码练习场
│   │   │   └── Files.vue          # 个人文件区
│   │   ├── components/
│   │   │   ├── CodeEditor.vue     # Monaco 编辑器
│   │   │   ├── CodeRunner.vue     # Pyodide 执行器
│   │   │   ├── FileTree.vue       # 文件树
│   │   │   ├── ProgressBar.vue    # 进度条
│   │   │   └── NoteEditor.vue     # 笔记编辑器（P1）
│   │   ├── stores/                # Pinia 状态管理
│   │   ├── router/
│   │   ├── api/                   # 接口请求
│   │   └── utils/
│   ├── index.html
│   ├── vite.config.ts
│   └── package.json
├── server/                  # 后端 Express 项目
│   ├── src/
│   │   ├── routes/
│   │   │   ├── auth.js            # 登录注册
│   │   │   ├── chapters.js        # 章节 CRUD
│   │   │   ├── progress.js        # 进度管理
│   │   │   ├── files.js           # 文件管理
│   │   │   └── notes.js           # 笔记管理（P1）
│   │   ├── middleware/
│   │   │   └── auth.js            # JWT 中间件
│   │   ├── db/
│   │   │   ├── connection.js      # MySQL 连接
│   │   │   └── seed.js            # 章节初始数据
│   │   └── app.js
│   └── package.json
├── docker/
│   ├── Dockerfile.client
│   ├── Dockerfile.server
│   └── docker-compose.yml
├── nginx/
│   └── default.conf         # Nginx 反代配置
├── AGENTS.md
├── PLAN.md
└── README.md
```

---

## 开发排期

### 第一阶段：基础框架（1-2 天）
- [ ] 初始化前后端项目
- [ ] MySQL 建表 + 章节数据导入
- [ ] 后端 API 框架（Express + 路由）
- [ ] 前端路由 + 页面骨架

### 第二阶段：核心功能（3-5 天）
- [ ] 用户注册/登录（JWT）
- [ ] 课程列表 + 章节进度追踪
- [ ] Monaco Editor 集成
- [ ] Pyodide 代码执行
- [ ] 个人文件区 CRUD + 下载

### 第三阶段：体验优化（2-3 天）
- [ ] UI 美化（进度可视化、响应式）
- [ ] 代码编辑器体验优化（语法高亮、自动保存）
- [ ] 文件夹 zip 打包下载
- [ ] Docker 部署 + Nginx 反代

### 第四阶段：增强功能（可选）
- [ ] 笔记系统
- [ ] 学习统计
- [ ] 分享功能

---

## 部署方案

```yaml
# docker-compose.yml 概要
services:
  client:
    build: ./client
    ports:
      - "3000:80"
  server:
    build: ./server
    ports:
      - "3001:3001"
    environment:
      - DB_HOST=host.docker.internal
      - DB_PORT=3306
      - DB_NAME=code_companion
      - DB_USER=root
      - DB_PASS=xxx
  nginx:
    image: nginx:alpine
    ports:
      - "8080:80"
    volumes:
      - ./nginx/default.conf:/etc/nginx/conf.d/default.conf
    depends_on:
      - client
      - server
```

Nginx 反代：
- `/` → client（前端）
- `/api` → server（后端）

---

## 章节数据（廖雪峰 Python 教程）

自动抓取，完整章节列表见 `server/src/db/seed.js`，包含：
- 简介、Python 历史、安装
- 第一个程序、输入输出
- 基本数据类型、字符串编码、List/Tuple、Dict/Set、条件判断、循环、模式匹配
- 函数定义、调用、参数、递归函数
- 面向对象编程（类、属性、访问控制、继承）
- 面向对象高级（__slots__、property、多继承、枚举、元类、魔术方法）
- 函数式编程（高阶函数、map/reduce、sorted、匿名函数、装饰器、返回函数、偏函数）
- 高级特性（切片、迭代、迭代器、列表推导式、生成器）
- IO（文件读写、StringIO/BytesIO、序列化、操作文件和目录）
- 模块
- 错误处理、调试、单元测试
- 数据库（SQLite、MySQL、SQLAlchemy）
- Web 开发（HTTP 协议、HTML 基础、WSGI、模板、Web 框架）
- 网络编程（TCP/IP、TCP、UDP）
- 多进程/多线程
- 常用第三方模块
- 内置模块
- 异步 IO
- GUI（ turtle）
- Email
- 正则表达式
- 常见问题
- 总结
