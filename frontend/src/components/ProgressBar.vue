<template>
  <div class="progress-bar">
    <div
      v-for="n in 5"
      :key="n"
      class="progress-step"
      :class="{
        completed: n < currentStep,
        active: n === currentStep,
      }"
    >
      <div class="step-circle">
        <span v-if="n < currentStep">✓</span>
        <span v-else>{{ n }}</span>
      </div>
      <div v-if="n < 5" class="step-line" :class="{ filled: n < currentStep }" />
    </div>
  </div>
</template>

<script setup>
defineProps({
  currentStep: { type: Number, required: true },
})
</script>

<style scoped>
.progress-bar {
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 10px 16px 12px;
  gap: 0;
}

.progress-step {
  display: flex;
  align-items: center;
  flex: 1;
}

.step-circle {
  width: 26px;
  height: 26px;
  border-radius: 50%;
  background: rgba(255, 255, 255, 0.25);
  border: 2px solid rgba(255, 255, 255, 0.4);
  color: rgba(255, 255, 255, 0.7);
  font-size: 11px;
  font-weight: 700;
  display: flex;
  align-items: center;
  justify-content: center;
  flex-shrink: 0;
  transition: all 0.2s;
}

.progress-step.active .step-circle {
  background: white;
  border-color: white;
  color: var(--primary);
}

.progress-step.completed .step-circle {
  background: rgba(255, 255, 255, 0.9);
  border-color: white;
  color: var(--primary);
}

.step-line {
  flex: 1;
  height: 2px;
  background: rgba(255, 255, 255, 0.25);
  margin: 0 4px;
  transition: background 0.2s;
}

.step-line.filled {
  background: rgba(255, 255, 255, 0.8);
}
</style>
