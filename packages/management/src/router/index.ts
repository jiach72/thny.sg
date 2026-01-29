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

    // 主应用 (需要登录)
    {
        path: '/',
        component: () => import('@/layouts/AdminLayout.vue'),
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
                meta: { title: '仪表板' },
            },
            {
                path: 'leads',
                name: 'LeadList',
                component: () => import('@/views/leads/LeadList.vue'),
                meta: { title: '线索管理' },
            },
            {
                path: 'leads/:id',
                name: 'LeadDetail',
                component: () => import('@/views/leads/LeadDetail.vue'),
                meta: { title: '线索详情' },
            },
            {
                path: 'tasks',
                name: 'TaskBoard',
                component: () => import('@/views/tasks/TaskBoard.vue'),
                meta: { title: '任务看板' },
            },
            {
                path: 'projects',
                name: 'ProjectList',
                component: () => import('@/views/projects/ProjectList.vue'),
                meta: { title: '项目管理' },
            },
            {
                path: 'projects/:id',
                name: 'ProjectDetail',
                component: () => import('@/views/projects/ProjectDetail.vue'),
                meta: { title: '项目详情' },
            },
            {
                path: 'settings',
                name: 'Settings',
                component: () => import('@/views/settings/Settings.vue'),
                meta: { title: '系统设置' },
            },
            {
                path: 'settings/users',
                name: 'UserManagement',
                component: () => import('@/views/settings/UserManagement.vue'),
                meta: { title: '用户管理' },
            },
            {
                path: 'settings/roles',
                name: 'RolePermissions',
                component: () => import('@/views/settings/RolePermissions.vue'),
                meta: { title: '角色权限' },
            },
            {
                path: 'messages',
                name: 'MessageSend',
                component: () => import('@/views/messages/MessageSend.vue'),
                meta: { title: '消息发送' },
            },
            {
                path: 'reports',
                name: 'ReportCenter',
                component: () => import('@/views/reports/ReportCenter.vue'),
                meta: { title: '报表中心' },
            },
        ],
    },

    // 404
    {
        path: '/:pathMatch(.*)*',
        redirect: '/dashboard',
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
    document.title = title ? `${title} - 通海南洋CRM` : '通海南洋CRM'

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
