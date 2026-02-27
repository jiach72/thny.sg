/**
 * 首页各栏目的数据配置
 * 从 Home.vue 中提取，减少主组件体积
 */
import type { Component } from 'vue'
import {
    OfficeBuilding,
    User,
    TrendCharts,
    House,
    Connection,
    Document,
    Service,
    Message,
} from '@element-plus/icons-vue'

export interface ServiceItem {
    icon: Component
}

export interface StepItem {
    step: number
}

export interface ReasonItem {
    icon: Component
}

/** "我们做什么" 栏目图标列表 */
export const services: ServiceItem[] = [
    { icon: OfficeBuilding },
    { icon: User },
    { icon: TrendCharts },
    { icon: House },
]

/** "我们如何工作" 流程步骤 */
export const steps: StepItem[] = [
    { step: 1 },
    { step: 2 },
    { step: 3 },
    { step: 4 },
]

/** "为什么选择我们" 理由图标列表 */
export const reasons: ReasonItem[] = [
    { icon: Connection },
    { icon: Document },
    { icon: Service },
    { icon: Message },
]
