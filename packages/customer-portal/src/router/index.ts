import { createRouter, createWebHistory, type RouteRecordRaw } from 'vue-router'
import { useAuthStore } from '@/stores'

// 路由配置
const routes: RouteRecordRaw[] = [
    // 认证页面 (无需登录)
    {
        path: '/login',
        name: 'Login',
        component: () => import('@/views/auth/Login.vue'),
        meta: { requiresAuth: false, title: 'Login' },
    },
    {
        path: '/forgot-password',
        name: 'ForgotPassword',
        component: () => import('@/views/auth/ForgotPassword.vue'),
        meta: { requiresAuth: false, title: 'Forgot Password' },
    },
    {
        path: '/reset-password',
        name: 'ResetPassword',
        component: () => import('@/views/auth/ResetPassword.vue'),
        meta: { requiresAuth: false, title: 'Reset Password' },
    },
    {
        path: '/setup-password',
        name: 'SetupPassword',
        component: () => import('@/views/auth/SetupPassword.vue'),
        meta: { requiresAuth: false, title: 'Setup Password' },
    },

    {
        path: '/payment/success',
        name: 'PaymentSuccess',
        component: () => import('@/views/invoices/PaymentResult.vue'),
        meta: { requiresAuth: false, title: 'Payment Success' },
    },
    {
        path: '/payment/cancel',
        name: 'PaymentCancel',
        component: () => import('@/views/invoices/PaymentResult.vue'),
        meta: { requiresAuth: false, title: 'Payment Cancelled' },
    },

    // 客户门户 (需要登录)
    {
        path: '/',
        component: () => import('@/layouts/PortalLayout.vue'),
        meta: { requiresAuth: true },
        children: [
            {
                path: '',
                redirect: '/dashboard',
            },
            {
                path: 'dashboard',
                name: 'Dashboard',
                component: () => import('@/views/dashboard/Dashboard.vue'),
                meta: { title: 'Dashboard' },
            },
            {
                path: 'projects',
                name: 'Projects',
                component: () => import('@/views/projects/ProjectList.vue'),
                meta: { title: 'Projects' },
            },
            {
                path: 'projects/:id',
                name: 'ProjectDetail',
                component: () => import('@/views/projects/ProjectDetail.vue'),
                meta: { title: 'Project Detail' },
            },
            {
                path: 'documents',
                name: 'Documents',
                component: () => import('@/views/documents/DocumentList.vue'),
                meta: { title: 'Documents' },
            },
            {
                path: 'documents/checklist',
                name: 'DocumentChecklist',
                component: () => import('@/views/documents/DocumentChecklist.vue'),
                meta: { title: 'Document Checklist' },
            },
            {
                path: 'messages',
                name: 'Messages',
                component: () => import('@/views/messages/MessageList.vue'),
                meta: { title: 'Messages' },
            },
            {
                path: 'invoices',
                name: 'Invoices',
                component: () => import('@/views/invoices/InvoiceList.vue'),
                meta: { title: 'Invoices' },
            },
            {
                path: 'chat',
                name: 'Chat',
                component: () => import('@/views/chat/ChatView.vue'),
                meta: { title: 'Chat' },
            },
            {
                path: 'appointments',
                name: 'Appointments',
                component: () => import('@/views/appointments/AppointmentList.vue'),
                meta: { title: 'Appointments' },
            },
            {
                path: 'profile',
                name: 'Profile',
                component: () => import('@/views/profile/Profile.vue'),
                meta: { title: 'Profile' },
            },
            {
                path: 'help',
                name: 'Help',
                component: () => import('@/views/help/Help.vue'),
                meta: { title: 'Help & Support' },
            },
            {
                path: 'settings',
                name: 'Settings',
                component: () => import('@/views/settings/Settings.vue'),
                meta: { title: 'Settings' },
            },
            {
                path: 'support',
                name: 'Support',
                component: () => import('@/views/support/TicketList.vue'),
                meta: { title: 'Support' },
            },
            {
                path: 'support/:id',
                name: 'TicketDetail',
                component: () => import('@/views/support/TicketDetail.vue'),
                meta: { title: 'Ticket Detail' },
            },
            {
                path: 'resources',
                name: 'Resources',
                component: () => import('@/views/resources/ResourceCenter.vue'),
                meta: { title: 'Resources' },
            },
            {
                path: 'projects/:id/collaboration',
                name: 'ProjectCollaboration',
                component: () => import('@/views/projects/ProjectCollaboration.vue'),
                meta: { title: 'Project Collaboration' },
            },
            {
                path: 'feedback',
                name: 'Feedback',
                component: () => import('@/views/feedback/FeedbackList.vue'),
                meta: { title: 'Feedback' },
            },
            {
                path: 'analytics',
                name: 'Analytics',
                component: () => import('@/views/analytics/DataDashboard.vue'),
                meta: { title: 'Analytics' },
            },
        ],
    },

    // 404
    {
        path: '/:pathMatch(.*)*',
        name: 'NotFound',
        component: () => import('@/views/NotFound.vue'),
        meta: { requiresAuth: false, title: 'Not Found' },
    },
]

const router = createRouter({
    history: createWebHistory(),
    routes,
})

// 导航守卫
router.beforeEach(async (to, _from, next) => {
    const authStore = useAuthStore()

    // 确保身份验证已经初始化完毕
    if (!authStore.isInitialized) {
        await authStore.initAuth()
    }

    // 设置页面标题
    const title = to.meta.title as string
    document.title = title ? `${title} - TongHai Portal` : 'TongHai Portal'

    // 检查认证
    if (to.meta.requiresAuth !== false && !authStore.isAuthenticated) {
        next({ path: '/login', query: { redirect: to.fullPath } })
    } else if (to.path === '/login' && authStore.isAuthenticated) {
        next('/dashboard')
    } else {
        next()
    }
})

export default router
