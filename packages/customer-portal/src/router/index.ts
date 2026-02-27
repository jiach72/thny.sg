import { createRouter, createWebHistory, type RouteRecordRaw } from 'vue-router'
import { useAuthStore } from '@/stores'

// 路由配置
const routes: RouteRecordRaw[] = [
    // 认证页面 (无需登录)
    {
        path: '/login',
        name: 'Login',
        component: () => import('@/views/auth/Login.vue'),
        meta: { requiresAuth: false, title: '登录' },
    },
    {
        path: '/forgot-password',
        name: 'ForgotPassword',
        component: () => import('@/views/auth/ForgotPassword.vue'),
        meta: { requiresAuth: false, title: '忘记密码' },
    },
    {
        path: '/reset-password',
        name: 'ResetPassword',
        component: () => import('@/views/auth/ResetPassword.vue'),
        meta: { requiresAuth: false, title: '重置密码' },
    },
    {
        path: '/setup-password',
        name: 'SetupPassword',
        component: () => import('@/views/auth/SetupPassword.vue'),
        meta: { requiresAuth: false, title: '设置密码' },
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
                meta: { title: '我的主页' },
            },
            {
                path: 'projects',
                name: 'Projects',
                component: () => import('@/views/projects/ProjectList.vue'),
                meta: { title: '我的项目' },
            },
            {
                path: 'projects/:id',
                name: 'ProjectDetail',
                component: () => import('@/views/projects/ProjectDetail.vue'),
                meta: { title: '项目详情' },
            },
            {
                path: 'documents',
                name: 'Documents',
                component: () => import('@/views/documents/DocumentList.vue'),
                meta: { title: '我的文档' },
            },
            {
                path: 'messages',
                name: 'Messages',
                component: () => import('@/views/messages/MessageList.vue'),
                meta: { title: '消息中心' },
            },
            {
                path: 'invoices',
                name: 'Invoices',
                component: () => import('@/views/invoices/InvoiceList.vue'),
                meta: { title: '我的账单' },
            },
            {
                path: 'profile',
                name: 'Profile',
                component: () => import('@/views/profile/Profile.vue'),
                meta: { title: '个人资料' },
            },
            {
                path: 'help',
                name: 'Help',
                component: () => import('@/views/help/Help.vue'),
                meta: { title: '帮助与支持' },
            },
            {
                path: 'settings',
                name: 'Settings',
                component: () => import('@/views/settings/Settings.vue'),
                meta: { title: '设置' },
            },
        ],
    },

    // 404
    {
        path: '/:pathMatch(.*)*',
        name: 'NotFound',
        component: () => import('@/views/NotFound.vue'),
        meta: { requiresAuth: false, title: '页面未找到' },
    },
]

const router = createRouter({
    history: createWebHistory(),
    routes,
})

// 导航守卫
router.beforeEach((to, _from, next) => {
    const authStore = useAuthStore()

    // 设置页面标题
    const title = to.meta.title as string
    document.title = title ? `${title} - 通海客户门户` : '通海客户门户'

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
