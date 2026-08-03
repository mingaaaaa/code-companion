const express = require('express');
const pool = require('../db/connection');
const auth = require('../middleware/auth');

const router = express.Router();

// 更新章节进度
router.put('/:chapterId', auth, async (req, res) => {
  try {
    const { status } = req.body;
    const { chapterId } = req.params;

    if (!['not_started', 'in_progress', 'completed'].includes(status)) {
      return res.json({ code: 400, message: '状态值无效' });
    }

    await pool.query(
      `INSERT INTO user_progress (user_id, chapter_id, status)
       VALUES (?, ?, ?)
       ON DUPLICATE KEY UPDATE status = ?, updated_at = CURRENT_TIMESTAMP`,
      [req.user.id, chapterId, status, status]
    );

    res.json({ code: 0, message: '进度已更新' });
  } catch (err) {
    console.error('更新进度失败:', err);
    res.json({ code: 500, message: '服务器错误' });
  }
});

// 获取学习统计
router.get('/stats', auth, async (req, res) => {
  try {
    const [total] = await pool.query('SELECT COUNT(*) as count FROM chapters WHERE tutorial_key = ?', ['liaoxuefeng-python']);
    const [completed] = await pool.query(
      'SELECT COUNT(*) as count FROM user_progress WHERE user_id = ? AND status = ?',
      [req.user.id, 'completed']
    );
    const [inProgress] = await pool.query(
      'SELECT COUNT(*) as count FROM user_progress WHERE user_id = ? AND status = ?',
      [req.user.id, 'in_progress']
    );

    res.json({
      code: 0,
      data: {
        total: total[0].count,
        completed: completed[0].count,
        inProgress: inProgress[0].count,
        percentage: total[0].count > 0 ? Math.round((completed[0].count / total[0].count) * 100) : 0,
      },
    });
  } catch (err) {
    res.json({ code: 500, message: '服务器错误' });
  }
});

module.exports = router;
