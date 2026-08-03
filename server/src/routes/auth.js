const express = require('express');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const pool = require('../db/connection');

const router = express.Router();

// 注册
router.post('/register', async (req, res) => {
  try {
    const { username, password } = req.body;
    if (!username || !password) {
      return res.json({ code: 400, message: '用户名和密码不能为空' });
    }
    if (username.length < 3 || username.length > 50) {
      return res.json({ code: 400, message: '用户名长度 3-50 个字符' });
    }
    if (password.length < 6) {
      return res.json({ code: 400, message: '密码至少 6 个字符' });
    }

    // 检查用户名是否已存在
    const [existing] = await pool.query('SELECT id FROM users WHERE username = ?', [username]);
    if (existing.length > 0) {
      return res.json({ code: 400, message: '用户名已存在' });
    }

    const passwordHash = await bcrypt.hash(password, 10);
    const [result] = await pool.query(
      'INSERT INTO users (username, password_hash) VALUES (?, ?)',
      [username, passwordHash]
    );

    const token = jwt.sign(
      { id: result.insertId, username },
      process.env.JWT_SECRET,
      { expiresIn: '7d' }
    );

    res.json({
      code: 0,
      data: { token, user: { id: result.insertId, username } },
      message: '注册成功',
    });
  } catch (err) {
    console.error('注册失败:', err);
    res.json({ code: 500, message: '服务器错误' });
  }
});

// 登录
router.post('/login', async (req, res) => {
  try {
    const { username, password } = req.body;
    if (!username || !password) {
      return res.json({ code: 400, message: '用户名和密码不能为空' });
    }

    const [rows] = await pool.query('SELECT * FROM users WHERE username = ?', [username]);
    if (rows.length === 0) {
      return res.json({ code: 400, message: '用户名或密码错误' });
    }

    const user = rows[0];
    const valid = await bcrypt.compare(password, user.password_hash);
    if (!valid) {
      return res.json({ code: 400, message: '用户名或密码错误' });
    }

    const token = jwt.sign(
      { id: user.id, username: user.username },
      process.env.JWT_SECRET,
      { expiresIn: '7d' }
    );

    res.json({
      code: 0,
      data: { token, user: { id: user.id, username: user.username } },
      message: '登录成功',
    });
  } catch (err) {
    console.error('登录失败:', err);
    res.json({ code: 500, message: '服务器错误' });
  }
});

// 获取当前用户信息
router.get('/me', require('../middleware/auth'), async (req, res) => {
  try {
    const [rows] = await pool.query(
      'SELECT id, username, created_at FROM users WHERE id = ?',
      [req.user.id]
    );
    if (rows.length === 0) {
      return res.json({ code: 404, message: '用户不存在' });
    }
    res.json({ code: 0, data: rows[0] });
  } catch (err) {
    res.json({ code: 500, message: '服务器错误' });
  }
});

module.exports = router;
