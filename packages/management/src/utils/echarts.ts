/**
 * ECharts 按需注册入口（统一注册一次）
 *
 * 使用方式：在组件中 `import echarts from '@/utils/echarts'` 替换
 * 原来各组件中重复的 `import * as echarts from 'echarts/core'` + `echarts.use([...])`
 *
 * 参考 vercel-react-best-practices: bundle-barrel-imports / bundle-dynamic-imports
 */
import * as echarts from 'echarts/core'
import { BarChart, LineChart, PieChart, FunnelChart } from 'echarts/charts'
import {
    TitleComponent,
    TooltipComponent,
    LegendComponent,
    GridComponent,
    DatasetComponent,
    TransformComponent,
} from 'echarts/components'
import { CanvasRenderer } from 'echarts/renderers'

// 统一注册所有项目中使用的图表类型和组件
// 只在首次导入时执行一次
echarts.use([
    // 图表类型
    BarChart,
    LineChart,
    PieChart,
    FunnelChart,
    // 组件
    TitleComponent,
    TooltipComponent,
    LegendComponent,
    GridComponent,
    DatasetComponent,
    TransformComponent,
    // 渲染器
    CanvasRenderer,
])

// 使用 re-export 支持 `import * as echarts from '@/utils/echarts'` 用法
export * from 'echarts/core'
export default echarts
