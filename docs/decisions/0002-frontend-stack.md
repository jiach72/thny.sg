# 0002. 前端采用 Vue 3 + Pinia + Element Plus

**状态**: 🟢 已采纳
**日期**: 2026-01-30

## 背景

三个前端应用都需要现代化、响应式的 UI 开发体验，且核心业务为管理后台 (CRM)，对表单、表格等组件需求量大。团队（或未来维护者）需要一种学习曲线平滑且生态成熟的技术栈。

## 选项

1.  **React 生态 (React + Redux/Zustand + AntD)**
    *   利: 生态最大，灵活性最高。
    *   弊: 样板代码较多（尤其是 Redux），Hooks 心智模型门槛较高。

2.  **Vue 生态 (Vue 3 + Pinia + Element Plus)**
    *   利: 模板语法直观，Composition API 兼顾逻辑复用，Element Plus 是后台类应用的行业标准，开发速度快。
    *   弊: 相比 React，社区资源略少（但在国内非常流行）。

## 决策

选择 **Vue 3** 全家桶：
*   框架: **Vue 3** (使用 `<script setup>`)
*   状态管理: **Pinia** (Vue 官方推荐，替代 Vuex，天然支持 TS)
*   UI 库: **Element Plus** (最适合中后台业务)
*   构建: **Vite** (开发体验极佳)

## 后果

*   [+] 能够快速搭建复杂的表单和列表页面。
*   [+] Pinia 的 Store 模式非常清晰，易于维护。
*   [!] 需要注意 Element Plus 的按需引入配置，以优化包体积。
