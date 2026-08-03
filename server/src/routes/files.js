const express = require('express');
const archiver = require('archiver');
const pool = require('../db/connection');
const auth = require('../middleware/auth');

const router = express.Router();

// 获取用户的文件列表
router.get('/', auth, async (req, res) => {
  try {
    const parentId = req.query.parent_id || null;
    const [rows] = await pool.query(
      `SELECT f.*, c.title as chapter_title
       FROM files f
       LEFT JOIN chapters c ON f.chapter_id = c.id
       WHERE f.user_id = ? AND (f.parent_id <=> ?)
       ORDER BY f.type DESC, f.name ASC`,
      [req.user.id, parentId]
    );
    res.json({ code: 0, data: rows });
  } catch (err) {
    console.error('获取文件列表失败:', err);
    res.json({ code: 500, message: '服务器错误' });
  }
});

// 获取完整文件树
router.get('/tree', auth, async (req, res) => {
  try {
    const [rows] = await pool.query(
      'SELECT id, parent_id, name, type FROM files WHERE user_id = ? ORDER BY type DESC, name ASC',
      [req.user.id]
    );
    res.json({ code: 0, data: rows });
  } catch (err) {
    res.json({ code: 500, message: '服务器错误' });
  }
});

// 获取单个文件内容
router.get('/:id', auth, async (req, res) => {
  try {
    const [rows] = await pool.query(
      'SELECT * FROM files WHERE id = ? AND user_id = ?',
      [req.params.id, req.user.id]
    );
    if (rows.length === 0) {
      return res.json({ code: 404, message: '文件不存在' });
    }
    res.json({ code: 0, data: rows[0] });
  } catch (err) {
    res.json({ code: 500, message: '服务器错误' });
  }
});

// 创建文件或文件夹
router.post('/', auth, async (req, res) => {
  try {
    const { name, type, parent_id, content, chapter_id } = req.body;
    if (!name || !type) {
      return res.json({ code: 400, message: '名称和类型不能为空' });
    }
    if (!['file', 'folder'].includes(type)) {
      return res.json({ code: 400, message: '类型只能是 file 或 folder' });
    }

    const [result] = await pool.query(
      'INSERT INTO files (user_id, parent_id, name, type, content, chapter_id) VALUES (?, ?, ?, ?, ?, ?)',
      [req.user.id, parent_id || null, name, type, content || '', chapter_id || null]
    );

    res.json({
      code: 0,
      data: { id: result.insertId, name, type },
      message: '创建成功',
    });
  } catch (err) {
    console.error('创建文件失败:', err);
    res.json({ code: 500, message: '服务器错误' });
  }
});

// 更新文件内容
router.put('/:id', auth, async (req, res) => {
  try {
    const { name, content, chapter_id } = req.body;
    const updates = [];
    const values = [];

    if (name !== undefined) { updates.push('name = ?'); values.push(name); }
    if (content !== undefined) { updates.push('content = ?'); values.push(content); }
    if (chapter_id !== undefined) { updates.push('chapter_id = ?'); values.push(chapter_id); }

    if (updates.length === 0) {
      return res.json({ code: 400, message: '没有需要更新的内容' });
    }

    values.push(req.params.id, req.user.id);
    await pool.query(
      `UPDATE files SET ${updates.join(', ')} WHERE id = ? AND user_id = ?`,
      values
    );

    res.json({ code: 0, message: '更新成功' });
  } catch (err) {
    console.error('更新文件失败:', err);
    res.json({ code: 500, message: '服务器错误' });
  }
});

// 删除文件/文件夹
router.delete('/:id', auth, async (req, res) => {
  try {
    const [file] = await pool.query('SELECT * FROM files WHERE id = ? AND user_id = ?', [req.params.id, req.user.id]);
    if (file.length === 0) {
      return res.json({ code: 404, message: '文件不存在' });
    }

    // 如果是文件夹，递归删除子文件
    if (file[0].type === 'folder') {
      await pool.query('DELETE FROM files WHERE user_id = ? AND parent_id = ?', [req.user.id, req.params.id]);
    }
    await pool.query('DELETE FROM files WHERE id = ? AND user_id = ?', [req.params.id, req.user.id]);

    res.json({ code: 0, message: '删除成功' });
  } catch (err) {
    console.error('删除文件失败:', err);
    res.json({ code: 500, message: '服务器错误' });
  }
});

// 下载单个文件
router.get('/:id/download', auth, async (req, res) => {
  try {
    const [rows] = await pool.query(
      'SELECT * FROM files WHERE id = ? AND user_id = ?',
      [req.params.id, req.user.id]
    );
    if (rows.length === 0) {
      return res.json({ code: 404, message: '文件不存在' });
    }
    const file = rows[0];
    res.setHeader('Content-Disposition', `attachment; filename="${encodeURIComponent(file.name)}"`);
    res.setHeader('Content-Type', 'application/octet-stream');
    res.send(file.content || '');
  } catch (err) {
    res.json({ code: 500, message: '服务器错误' });
  }
});

// 下载文件夹（zip）
router.get('/:id/download-zip', auth, async (req, res) => {
  try {
    const [folder] = await pool.query('SELECT * FROM files WHERE id = ? AND user_id = ? AND type = ?', [req.params.id, req.user.id, 'folder']);
    if (folder.length === 0) {
      return res.json({ code: 404, message: '文件夹不存在' });
    }

    const [files] = await pool.query(
      'SELECT * FROM files WHERE user_id = ? AND (id = ? OR parent_id = ?)',
      [req.user.id, req.params.id, req.params.id]
    );

    res.setHeader('Content-Type', 'application/zip');
    res.setHeader('Content-Disposition', `attachment; filename="${encodeURIComponent(folder[0].name)}.zip"`);

    const archive = archiver('zip', { zlib: { level: 9 } });
    archive.pipe(res);

    files.forEach(f => {
      if (f.type === 'file') {
        archive.append(f.content || '', { name: f.name });
      }
    });

    archive.finalize();
  } catch (err) {
    console.error('下载失败:', err);
    res.json({ code: 500, message: '服务器错误' });
  }
});

module.exports = router;
