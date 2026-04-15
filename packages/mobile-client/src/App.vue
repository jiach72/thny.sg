<script setup lang="ts">
import { onLaunch, onShow, onHide } from "@dcloudio/uni-app";
import { useAuthStore } from "./stores/auth";

onLaunch(() => {
  const authStore = useAuthStore();
  authStore.init();
});
onShow(() => {
});
onHide(() => {
});
</script>
<style lang="scss">
:root {
  --th-bg-base: #ffffff;
  --th-bg-surface: #f9fafb;
  --th-text-main: #1f2937;
  --th-text-secondary: #6b7280;
  --th-border-color: #e5e7eb;
}

@media (prefers-color-scheme: dark) {
  :root {
    --th-bg-base: #111827;
    --th-bg-surface: #1f2937;
    --th-text-main: #f9fafb;
    --th-text-secondary: #9ca3af;
    --th-border-color: #374151;
    
    --nut-button-default-bg-color: #1f2937;
    --nut-button-default-border-color: #374151;
    --nut-button-default-color: #f9fafb;
  }
}

page {
  background-color: var(--th-bg-base);
  color: var(--th-text-main);
  transition: background-color 0.3s, color 0.3s;
  font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Oxygen, Ubuntu, Cantarell, 'Open Sans', 'Helvetica Neue', sans-serif;
  min-height: 100vh;
}
</style>
