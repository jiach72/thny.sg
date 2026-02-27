import { ref, onMounted, onUnmounted } from 'vue'
import { useRouter } from 'vue-router'
import { useAuthStore } from '@/stores/authStore'
import { ElMessage } from 'element-plus'

export function useIdleTimeout(timeoutMinutes = 30) {
    const router = useRouter()
    const authStore = useAuthStore()
    
    const timeoutMs = timeoutMinutes * 60 * 1000
    let idleTimer: ReturnType<typeof setTimeout> | null = null
    const isIdle = ref(false)

    // 监听可能说明用户活跃的事件
    const events = ['mousemove', 'keydown', 'wheel', 'DOMMouseScroll', 'mousewheel', 'mousedown', 'touchstart', 'touchmove']

    const resetTimer = () => {
        if (idleTimer) {
            clearTimeout(idleTimer)
        }
        
        // 重新开始计时
        idleTimer = setTimeout(() => {
            handleIdle()
        }, timeoutMs)
    }

    const handleIdle = () => {
        isIdle.value = true
        
        // 退出登录状态
        authStore.logout()
        ElMessage.warning('由于您长时间未操作，为了您的账号安全已自动安全退出')
        
        // 跳转到登录页
        const currentPath = router.currentRoute.value.fullPath
        router.push({
            path: '/login',
            query: currentPath !== '/' ? { redirect: currentPath } : {}
        })
    }

    onMounted(() => {
        events.forEach(event => {
            document.addEventListener(event, resetTimer, { passive: true })
        })
        resetTimer() // 组件挂载时即开始计时
    })

    onUnmounted(() => {
        if (idleTimer) clearTimeout(idleTimer)
        events.forEach(event => {
            document.removeEventListener(event, resetTimer)
        })
    })

    return {
        isIdle,
        resetTimer
    }
}
