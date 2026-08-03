const express = require('express');
const cors = require('cors');
require('dotenv').config();

const authRoutes = require('./routes/auth');
const chapterRoutes = require('./routes/chapters');
const progressRoutes = require('./routes/progress');
const fileRoutes = require('./routes/files');

const app = express();
const PORT = process.env.PORT || 3001;

// 中间件
app.use(cors());
app.use(express.json({ limit: '10mb' }));

// 路由
app.use('/api/v1/auth', authRoutes);
app.use('/api/v1/chapters', chapterRoutes);
app.use('/api/v1/progress', progressRoutes);
app.use('/api/v1/files', fileRoutes);

// 健康检查
app.get('/api/v1/health', (req, res) => {
  res.json({ code: 0, message: 'ok', timestamp: new Date().toISOString() });
});

// 启动
app.listen(PORT, () => {
  console.log(`🚀 Code Companion API running on port ${PORT}`);
});
