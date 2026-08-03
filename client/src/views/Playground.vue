<template>
  <div class="playground">
    <!-- 顶部栏 -->
    <div class="playground-header">
      <div class="header-left">
        <el-button v-if="chapterId" text @click="$router.push(`/chapter/${chapterId}`)">
          <el-icon><ArrowLeft /></el-icon>
          {{ chapterTitle || '返回章节' }}
        </el-button>
        <el-divider v-if="chapterId" direction="vertical" />
        <span class="file-name" v-if="currentFileName">{{ currentFileName }}</span>
        <el-tag v-if="isModified" size="small" type="warning">未保存</el-tag>
      </div>
      <div class="header-actions">
        <el-button @click="runCode" :loading="running" type="success" :icon="CaretRight">
          运行
        </el-button>
        <el-button @click="saveCode" :icon="FolderChecked">
          保存
        </el-button>
        <el-button v-if="chapterId" type="primary" size="small" @click="createNewFile">
          新建文件
        </el-button>
      </div>
    </div>

    <!-- 编辑器 + 输出 -->
    <div class="playground-body">
      <div class="editor-section">
        <div ref="editorContainer" class="editor-container"></div>
      </div>
      <div class="output-section">
        <div class="output-header">
          <span>📤 输出</span>
          <el-button size="small" text @click="output = ''">清空</el-button>
        </div>
        <div class="output-content" :class="{ error: hasError }">
          {{ output || '点击「运行」执行代码...' }}
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted, onBeforeUnmount, watch } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { CaretRight, FolderChecked, ArrowLeft } from '@element-plus/icons-vue'
import { ElMessage, ElMessageBox } from 'element-plus'
import { fileAPI, chapterAPI } from '../api'
import loader from '@monaco-editor/loader'

const route = useRoute()
const router = useRouter()

const editorContainer = ref(null)
const output = ref('')
const hasError = ref(false)
const running = ref(false)
const isModified = ref(false)

const currentFileId = ref(null)
const currentFileName = ref('')
const chapterId = ref(null)
const chapterTitle = ref('')

let editor = null
let monaco = null
let pyodide = null

const DEFAULT_CODE = `# 在这里编写 Python 代码\n\nprint("Hello, Code Companion! 🐍")\n`

// 监听路由变化（从章节页跳转过来）
watch(() => route.query, async (q) => {
  if (q.fileId) {
    await loadFile(q.fileId)
  }
  if (q.chapterId) {
    chapterId.value = q.chapterId
    await loadChapter(q.chapterId)
  }
}, { immediate: true })

async function loadChapter(id) {
  try {
    const res = await chapterAPI.get(id)
    if (res.code === 0) chapterTitle.value = res.data.title
  } catch {}
}

async function loadFile(fileId) {
  if (!fileId) return
  try {
    const res = await fileAPI.get(fileId)
    if (res.code === 0) {
      currentFileId.value = res.data.id
      currentFileName.value = res.data.name
      chapterId.value = res.data.chapter_id
      if (editor) {
        editor.setValue(res.data.content || '')
        isModified.value = false
      }
      if (res.data.chapter_id) loadChapter(res.data.chapter_id)
    }
  } catch {
    ElMessage.error('加载文件失败')
  }
}

async function createNewFile() {
  const { value } = await ElMessageBox.prompt('文件名称', '新建练习文件', {
    inputValue: 'untitled.py',
    inputPattern: /\S+/,
    inputErrorMessage: '名称不能为空',
  }).catch(() => ({}))
  if (!value) return

  const res = await fileAPI.create({
    name: value,
    type: 'file',
    content: `# ${chapterTitle.value}\n\n`,
    chapter_id: chapterId.value,
  })
  if (res.code === 0) {
    currentFileId.value = res.data.id
    currentFileName.value = value
    editor.setValue(`# ${chapterTitle.value}\n\n`)
    isModified.value = false
    ElMessage.success('创建成功')
    // 更新 URL（不刷新页面）
    router.replace({ query: { fileId: res.data.id, chapterId: chapterId.value } })
  }
}

async function saveCode() {
  if (!editor) return

  // 没有文件时先创建
  if (!currentFileId.value) {
    const { value: name } = await ElMessageBox.prompt('文件名称', '保存文件', {
      inputValue: 'untitled.py',
      inputPattern: /\S+/,
      inputErrorMessage: '名称不能为空',
    }).catch(() => ({}))
    if (!name) return

    const res = await fileAPI.create({
      name,
      type: 'file',
      content: editor.getValue(),
      chapter_id: chapterId.value || null,
    })
    if (res.code === 0) {
      currentFileId.value = res.data.id
      currentFileName.value = name
      isModified.value = false
      ElMessage.success('保存成功')
      router.replace({ query: { fileId: res.data.id, chapterId: chapterId.value } })
    }
    return
  }

  // 有文件时直接保存
  try {
    await fileAPI.update(currentFileId.value, { content: editor.getValue() })
    isModified.value = false
    ElMessage.success('保存成功')
  } catch {
    ElMessage.error('保存失败')
  }
}

async function runCode() {
  if (!editor) return
  const code = editor.getValue()
  if (!code.trim()) {
    output.value = '请先编写代码'
    return
  }

  running.value = true
  hasError.value = false
  output.value = '正在加载 Python 环境...'

  try {
    if (!pyodide) {
      const pyodideModule = await import('https://cdn.jsdelivr.net/pyodide/v0.25.0/full/pyodide.mjs')
      pyodide = await pyodideModule.loadPyodide({
        indexURL: 'https://cdn.jsdelivr.net/pyodide/v0.25.0/full/',
      })
    }

    output.value = '执行中...\n'

    pyodide.runPython(`
import sys
from io import StringIO
_stdout = StringIO()
_stderr = StringIO()
sys.stdout = _stdout
sys.stderr = _stderr
`)

    try {
      pyodide.runPython(code)
    } catch (e) {
      hasError.value = true
    }

    const stdout = pyodide.runPython('_stdout.getvalue()')
    const stderr = pyodide.runPython('_stderr.getvalue()')
    pyodide.runPython('sys.stdout = sys.__stdout__; sys.stderr = sys.__stderr__')

    let result = ''
    if (stdout) result += stdout
    if (stderr) {
      result += (result ? '\n' : '') + stderr
      hasError.value = true
    }
    output.value = result || '(无输出)'
  } catch (err) {
    hasError.value = true
    output.value = `错误: ${err.message}`
  } finally {
    running.value = false
  }
}

// Ctrl+S 保存
function handleKeydown(e) {
  if ((e.ctrlKey || e.metaKey) && e.key === 's') {
    e.preventDefault()
    saveCode()
  }
}

onMounted(async () => {
  monaco = await loader.init()
  editor = monaco.editor.create(editorContainer.value, {
    value: DEFAULT_CODE,
    language: 'python',
    theme: 'vs-dark',
    minimap: { enabled: false },
    fontSize: 14,
    lineNumbers: 'on',
    scrollBeyondLastLine: false,
    automaticLayout: true,
  })

  editor.onDidChangeModelContent(() => {
    isModified.value = true
  })

  document.addEventListener('keydown', handleKeydown)
})

onBeforeUnmount(() => {
  editor?.dispose()
  document.removeEventListener('keydown', handleKeydown)
})
</script>

<style scoped>
.playground {
  height: calc(100vh - 40px);
  display: flex;
  flex-direction: column;
}

.playground-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: 12px;
  padding-bottom: 12px;
  border-bottom: 1px solid #e4e7ed;
}

.header-left {
  display: flex;
  align-items: center;
  gap: 8px;
}

.file-name {
  font-weight: 600;
  color: #303133;
  font-size: 15px;
}

.header-actions {
  display: flex;
  gap: 8px;
  align-items: center;
}

.playground-body {
  flex: 1;
  display: flex;
  gap: 16px;
  min-height: 0;
}

.editor-section {
  flex: 1;
  min-width: 0;
}

.editor-container {
  height: 100%;
  border-radius: 8px;
  overflow: hidden;
}

.output-section {
  width: 400px;
  display: flex;
  flex-direction: column;
  background: #1e1e1e;
  border-radius: 8px;
  overflow: hidden;
}

.output-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 10px 16px;
  background: #252526;
  color: #ccc;
  font-size: 13px;
}

.output-content {
  flex: 1;
  padding: 12px 16px;
  color: #d4d4d4;
  font-family: 'Consolas', 'Monaco', monospace;
  font-size: 13px;
  white-space: pre-wrap;
  overflow-y: auto;
  line-height: 1.5;
}

.output-content.error {
  color: #f48771;
}
</style>
