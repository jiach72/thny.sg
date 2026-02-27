import type { App, Directive, DirectiveBinding } from 'vue'
import { useAuthStore } from '@/stores/authStore'

/**
 * v-permission 指令
 * 
 * 用法:
 * ```html
 * <button v-permission="'leads:delete'">删除</button>
 * <button v-permission="['leads:create', 'leads:update']">编辑</button>
 * ```
 */
const permissionDirective: Directive = {
    mounted(el: HTMLElement, binding: DirectiveBinding) {
        checkPermission(el, binding)
    },
    updated(el: HTMLElement, binding: DirectiveBinding) {
        checkPermission(el, binding)
    },
}

function checkPermission(el: HTMLElement, binding: DirectiveBinding) {
    const authStore = useAuthStore()
    const { value } = binding

    // 安全取值：permissions 可能是 Ref 或普通数组
    const perms: string[] = Array.isArray(authStore.permissions)
        ? authStore.permissions
        : []

    // ADMIN 拥有所有权限
    if (authStore.user?.role === 'ADMIN' || perms.includes('*')) {
        return
    }

    let hasPermission = false

    if (typeof value === 'string') {
        hasPermission = perms.includes(value)
    } else if (Array.isArray(value)) {
        hasPermission = value.some((p: string) => perms.includes(p))
    }

    if (!hasPermission) {
        // 隐藏元素而非移除，避免响应式更新时找不到节点
        el.style.display = 'none'
    } else {
        el.style.display = ''
    }
}

/**
 * 注册 v-permission 指令
 */
export function setupPermissionDirective(app: App) {
    app.directive('permission', permissionDirective)
}

export default permissionDirective
