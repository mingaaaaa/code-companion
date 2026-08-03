const express = require('express');
const pool = require('../db/connection');
const auth = require('../middleware/auth');

const router = express.Router();

// 获取所有章节（公开）
router.get('/', async (req, res) => {
  try {
    const [rows] = await pool.query(
      'SELECT * FROM chapters WHERE tutorial_key = ? ORDER BY sort_order',
      [req.query.tutorial || 'liaoxuefeng-python']
    );
    res.json({ code: 0, data: rows });
  } catch (err) {
    console.error('获取章节失败:', err);
    res.json({ code: 500, message: '服务器错误' });
  }
});

// 获取单个章节
router.get('/:id', async (req, res) => {
  try {
    const [rows] = await pool.query('SELECT * FROM chapters WHERE id = ?', [req.params.id]);
    if (rows.length === 0) {
      return res.json({ code: 404, message: '章节不存在' });
    }
    res.json({ code: 0, data: rows[0] });
  } catch (err) {
    res.json({ code: 500, message: '服务器错误' });
  }
});

// 获取用户的章节进度
router.get('/progress/all', auth, async (req, res) => {
  try {
    const [rows] = await pool.query(
      `SELECT c.*, up.status, up.updated_at as progress_updated_at
       FROM chapters c
       LEFT JOIN user_progress up ON c.id = up.chapter_id AND up.user_id = ?
       WHERE c.tutorial_key = ?
       ORDER BY c.sort_order`,
      [req.user.id, req.query.tutorial || 'liaoxuefeng-python']
    );
    res.json({ code: 0, data: rows });
  } catch (err) {
    console.error('获取进度失败:', err);
    res.json({ code: 500, message: '服务器错误' });
  }
});

module.exports = router;
