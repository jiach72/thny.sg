import { createRouter, createWebHistory, type RouteRecordRaw } from 'vue-router'
import DefaultLayout from '@/layouts/DefaultLayout.vue'

// 默认 SEO 信息
const DEFAULT_TITLE = '通海南洋 | 稳健出海 · 传承未来'
const DEFAULT_DESC = '新加坡一站式企业落地、身份规划、财富架构与资产配置专业咨询服务'

const routes: RouteRecordRaw[] = [
    {
        path: '/',
        component: DefaultLayout,
        children: [
            {
                path: '',
                name: 'Home',
                component: () => import('@/views/Home.vue'),
                meta: {
                    title: '通海南洋 | 稳健出海 · 传承未来',
                    description: '新加坡一站式企业落地、身份规划、财富架构与资产配置专业咨询服务。为您打造全球化商业布局的坚实基础。',
                },
            },
            {
                path: 'services',
                name: 'Services',
                component: () => import('@/views/Services.vue'),
                meta: {
                    title: '服务项目 | 通海南洋',
                    description: '提供公司注册、EP工作签证申请、家族办公室设立、税务筹划等新加坡一站式商业服务。',
                },
            },
            {
                path: 'industries',
                name: 'Industries',
                component: () => import('@/views/Industries.vue'),
                meta: {
                    title: '行业方案 | 通海南洋',
                    description: '覆盖金融科技、跨境电商、家族办公室等行业的定制化新加坡落地解决方案。',
                },
            },
            {
                path: 'about',
                name: 'About',
                component: () => import('@/views/About.vue'),
                meta: {
                    title: '关于我们 | 通海南洋',
                    description: '了解通海南洋的品牌故事、企业使命与核心价值观。扎根新加坡，服务全球华人企业家。',
                },
            },
            {
                path: 'team',
                name: 'Team',
                component: () => import('@/views/Team.vue'),
                meta: {
                    title: '专家团队 | 通海南洋',
                    description: '认识我们的专业顾问团队，拥有丰富的新加坡商业法规与跨境运营经验。',
                },
            },
            {
                path: 'contact',
                name: 'Contact',
                component: () => import('@/views/Contact.vue'),
                meta: {
                    title: '联系我们 | 通海南洋',
                    description: '预约免费咨询，获取新加坡公司注册、签证申请等专业建议。电话、邮件、在线表单均可联系。',
                },
            },
            {
                path: 'news',
                name: 'News',
                component: () => import('@/views/News.vue'),
                meta: {
                    title: '新闻资讯 | 通海南洋',
                    description: '获取新加坡最新政策动态、行业资讯和通海南洋企业新闻。',
                },
            },
            {
                path: 'news/:id',
                name: 'NewsDetail',
                component: () => import('@/views/NewsDetail.vue'),
                meta: {
                    title: '新闻详情 | 通海南洋',
                    description: '阅读通海南洋的专业文章与行业分析报告。',
                },
            },
        ],
    },
]

const router = createRouter({
    history: createWebHistory(),
    routes,
    scrollBehavior() {
        return { top: 0 }
    },
})

// 动态更新文档 title 和 meta description
router.afterEach((to) => {
    const title = (to.meta?.title as string) || DEFAULT_TITLE
    const description = (to.meta?.description as string) || DEFAULT_DESC

    document.title = title

    // 更新 <meta name="description">
    let metaDesc = document.querySelector('meta[name="description"]')
    if (metaDesc) {
        metaDesc.setAttribute('content', description)
    } else {
        metaDesc = document.createElement('meta')
        metaDesc.setAttribute('name', 'description')
        metaDesc.setAttribute('content', description)
        document.head.appendChild(metaDesc)
    }
})

export default router

