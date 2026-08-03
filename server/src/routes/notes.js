const express = require('express');
const pool = require('../db/connection');
const auth = require('../middleware/auth');

const router = express.Router();

// 获取某章节的笔记
router.get('/:chapterId', auth, async (req, res) => {
  try {
    const [rows] = await pool.query(
      'SELECT * FROM notes WHERE user_id = ? AND chapter_id = ?',
      [req.user.id, req.params.chapterId]
    )
    res.json({
      code: 0,
      data: rows.length > 0 ? rows[0] : { content: '', chapter_id: req.params.chapterId },
    })
  } catch (err) {
    console.error('获取笔记失败:', err)
    res.json({ code: 500, message: '服务器错误' })
  }
})

// 保存/更新笔记
router.put('/:chapterId', auth, async (req, res) => {
  try {
    const { content } = req.body
    const { chapterId } = req.params

    await pool.query(
      `INSERT INTO notes (user_id, chapter_id, content)
       VALUES (?, ?, ?)
       ON DUPLICATE KEY UPDATE content = ?, updated_at = CURRENT_TIMESTAMP`,
      [req.user.id, chapterId, content, content]
    )

    res.json({ code: 0, message: '笔记已保存' })
  } catch (err) {
    console.error('保存笔记失败:', err)
    res.json({ code: 500, message: '服务器错误' })
  }
})

module.exports = router
