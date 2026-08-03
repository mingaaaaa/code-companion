<template>
  <div class="font-switcher">
    <span class="label">字体</span>
    <div class="buttons">
      <button
        v-for="size in sizes"
        :key="size.value"
        :class="{ active: current === size.value }"
        @click="setSize(size.value)"
        :title="size.label"
      >
        {{ size.text }}
      </button>
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted } from 'vue'

const sizes = [
  { value: 0.85, label: '小', text: 'A-' },
  { value: 1, label: '默认', text: 'A' },
  { value: 1.15, label: '大', text: 'A+' },
  { value: 1.3, label: '特大', text: 'A++' },
]

const current = ref(1)

function setSize(val) {
  current.value = val
  localStorage.setItem('font-scale', val)
  applyScale(val)
}

function applyScale(val) {
  document.documentElement.style.setProperty('--font-scale', val)
}

onMounted(() => {
  const saved = localStorage.getItem('font-scale')
  if (saved) {
    current.value = parseFloat(saved)
    applyScale(current.value)
  }
})
</script>

<style scoped>
.font-switcher {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 8px 16px;
  border-top: 1px solid #2d2e3e;
}

.label {
  font-size: 12px;
  color: #a0a3b1;
  white-space: nowrap;
}

.buttons {
  display: flex;
  gap: 2px;
}

.buttons button {
  background: transparent;
  border: 1px solid #3d3e4e;
  color: #a0a3b1;
  padding: 2px 8px;
  border-radius: 4px;
  cursor: pointer;
  font-size: 12px;
  transition: all 0.2s;
}

.buttons button:hover {
  background: #3d3e4e;
  color: #fff;
}

.buttons button.active {
  background: #409eff;
  border-color: #409eff;
  color: #fff;
}
</style>
