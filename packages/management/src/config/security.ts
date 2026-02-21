/**
 * 安全配置
 * 管理后台安全相关的常量和配置
 */

// 管理员登录路径（支持环境变量覆盖）
export const ADMIN_LOGIN_PATH = import.meta.env.VITE_ADMIN_LOGIN_PATH || '/sys-portal'
