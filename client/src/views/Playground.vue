<template>
  <div class="playground">
    <div class="playground-header">
      <h2>💻 代码练习场</h2>
      <div class="header-actions">
        <el-button @click="runCode" :loading="running" type="success" :icon="CaretRight">
          运行
        </el-button>
        <el-button @click="saveCode" :icon="FolderChecked">保存</el-button>
        <el-select v-model="currentFileId" placeholder="打开已保存文件" clearable style="width: 220px;" @change="loadFile">
          <el-option-group label="按章节">
            <el-option
              v-for="f in filesByChapter"
              :key="f.id"
              :label="`[${f.chapter_title}] ${f.name}`"
              :value="f.id"
            />
          </el-option-group>
          <el-option-group label="未关联章节" v-if="unlinkedFiles.length">
            <el-option
              v-for="f in unlinkedFiles"
              :key="f.id"
              :label="f.name"
              :value="f.id"
            />
          </el-option-group>
        </el-select>
      </div>
    </div>

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
          {{ output || '点击"运行"执行代码...' }}
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, computed, onMounted, onBeforeUnmount } from 'vue'
import { CaretRight, FolderChecked } from '@element-plus/icons-vue'
import { ElMessage } from 'element-plus'
import { fileAPI } from '../api'
import loader from '@monaco-editor/loader'

const editorContainer = ref(null)
const output = ref('')
const hasError = ref(false)
const running = ref(false)
const currentFileId = ref(null)
const savedFiles = ref([])

let editor = null
let monaco = null
let pyodide = null

const DEFAULT_CODE = `# 欢迎来到 Code Companion 练习场！
# 在这里编写 Python 代码并运行

def hello():
    print("Hello, Code Companion! 🐍")

hello()
`

const filesByChapter = computed(() =>
  savedFiles.value.filter(f => f.chapter_title)
)

const unlinkedFiles = computed(() =>
  savedFiles.value.filter(f => !f.chapter_title)
)

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
  await loadSavedFiles()
})

onBeforeUnmount(() => {
  editor?.dispose()
})

async function loadSavedFiles() {
  try {
    const res = await fileAPI.list(null)
    if (res.code === 0) {
      savedFiles.value = res.data.filter(f => f.type === 'file')
    }
  } catch {}
}

async function loadFile(fileId) {
  if (!fileId) return
  try {
    const res = await fileAPI.get(fileId)
    if (res.code === 0) {
      editor.setValue(res.data.content || '')
    }
  } catch {
    ElMessage.error('加载文件失败')
  }
}

async function saveCode() {
  const code = editor.getValue()
  const name = prompt('文件名（如 hello.py）:', 'untitled.py')
  if (!name) return

  try {
    if (currentFileId.value) {
      await fileAPI.update(currentFileId.value, { name, content: code })
    } else {
      const res = await fileAPI.create({ name, type: 'file', content: code })
      if (res.code === 0) currentFileId.value = res.data.id
    }
    await loadSavedFiles()
    ElMessage.success('保存成功')
  } catch {
    ElMessage.error('保存失败')
  }
}

async function runCode() {
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
  margin-bottom: 16px;
}

.playground-header h2 {
  margin: 0;
  color: #303133;
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
