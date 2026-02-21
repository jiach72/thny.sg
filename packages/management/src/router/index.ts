import { createRouter, createWebHistory, type RouteRecordRaw } from 'vue-router'
import { useAuthStore } from '@/stores'
import { ADMIN_LOGIN_PATH } from '@/config/security'

// 路由配置
const routes: RouteRecordRaw[] = [
    // 认证页面 (无需登录)
    {
        path: ADMIN_LOGIN_PATH,
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
                path: 'reports',
                name: 'ReportBuilder',
                component: () => import('@/views/reports/ReportBuilder.vue'),
                meta: { title: '报表中心' },
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
            {
                path: 'settings/faq',
                name: 'FaqManagement',
                component: () => import('@/views/settings/FaqManagement.vue'),
                meta: { title: 'FAQ 知识库' },
            },
            {
                path: 'settings/news',
                name: 'NewsManagement',
                component: () => import('@/views/settings/NewsManagement.vue'),
                meta: { title: '新闻管理' },
            },
            {
                path: 'settings/ai',
                name: 'AiSettings',
                component: () => import('@/views/settings/AiSettings.vue'),
                meta: { title: 'AI 模型配置' },
            },
            {
                path: 'settings/news/rss',
                name: 'RssManagement',
                component: () => import('@/views/settings/RssManagement.vue'),
                meta: { title: 'RSS 订阅源' },
            },
            {
                path: 'settings/scoring',
                name: 'ScoringRules',
                component: () => import('@/views/settings/ScoringRules.vue'),
                meta: { title: '评分规则' },
            },
            {
                path: 'settings/email-templates',
                name: 'EmailTemplates',
                component: () => import('@/views/settings/EmailTemplates.vue'),
                meta: { title: '邮件模板' },
            },
            {
                path: 'workbench',
                name: 'Workbench',
                component: () => import('@/views/dashboard/Workbench.vue'),
                meta: { title: '工作台' },
            },
            {
                path: 'settings/invoices',
                name: 'InvoiceManagement',
                component: () => import('@/views/settings/InvoiceManagement.vue'),
                meta: { title: '发票管理' },
            },
            {
                path: 'settings/scheduler',
                name: 'SchedulerManagement',
                component: () => import('@/views/settings/SchedulerManagement.vue'),
                meta: { title: '定时任务' },
            },
            {
                path: 'settings/workflow',
                name: 'WorkflowRules',
                component: () => import('@/views/settings/WorkflowRules.vue'),
                meta: { title: '工作流自动化' },
            },
            {
                path: 'analytics',
                name: 'SalesDashboard',
                component: () => import('@/views/analytics/SalesDashboard.vue'),
                meta: { title: '销售分析' },
            },
            {
                path: 'settings/workflow-designer',
                name: 'WorkflowDesigner',
                component: () => import('@/views/settings/WorkflowDesigner.vue'),
                meta: { title: '工作流设计器' },
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
        next({ path: ADMIN_LOGIN_PATH, query: { redirect: to.fullPath } })
    } else if (to.path === ADMIN_LOGIN_PATH && authStore.isAuthenticated) {
        next('/dashboard')
    } else {
        next()
    }
})

export default router
