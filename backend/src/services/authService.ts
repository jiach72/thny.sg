import bcrypt from 'bcryptjs'
import jwt from 'jsonwebtoken'
// @ts-ignore: otplib 在某些 ESM/TS 配置下的类型定义与实际运行时导出存在差异，在此显式忽略 tsc 检查以确保项目正常编译
import otplibDefault from '@otplib/preset-default'
const { authenticator } = otplibDefault
import QRCode from 'qrcode'
import { prisma, config } from '../config/index.js'
import { UnauthorizedError, NotFoundError, BadRequestError } from '../middlewares/index.js'

interface LoginInput {
    email: string
    password: string
}

interface RegisterInput {
    email: string
    password: string
    name: string
}

export const authService = {
    /**
     * 用户登录
     */
    async login({ email, password }: LoginInput) {
        const user = await prisma.user.findUnique({
            where: { email },
            include: { role: true },
        })

        if (!user) {
            throw new UnauthorizedError('邮箱或密码错误')
        }

        if (user.status !== 'ACTIVE') {
            throw new UnauthorizedError('账户已被禁用')
        }

        const isPasswordValid = await bcrypt.compare(password, user.passwordHash)
        if (!isPasswordValid) {
            throw new UnauthorizedError('邮箱或密码错误')
        }

        // 检查是否开启了双因素认证
        if (user.twoFactorEnabled) {
            const tempToken = jwt.sign(
                { sub: user.id, type: '2fa_temp' },
                config.jwt.secret,
                { expiresIn: '5m' }
            )
            return {
                requires2FA: true,
                tempToken,
                message: '请输入双重认证验证码',
            }
        }

        const accessToken = this.generateAccessToken(user)
        const refreshToken = this.generateRefreshToken(user)

        return {
            accessToken,
            refreshToken,
            tokenType: 'Bearer',
            expiresIn: 900, // 15 分钟
            user: {
                id: user.id,
                name: user.name,
                email: user.email,
                role: user.role.code,
                roleId: user.roleId,
                avatarUrl: user.avatarUrl,
            },
        }
    },

    /**
     * 验证双因素验证码进行最终登录
     */
    async verify2FALogin(tempToken: string, code: string) {
        try {
            const decoded = jwt.verify(tempToken, config.jwt.secret) as any
            if (decoded.type !== '2fa_temp') {
                throw new UnauthorizedError('无效的会话')
            }

            const user = await prisma.user.findUnique({
                where: { id: decoded.sub },
                include: { role: true },
            })

            if (!user || user.status !== 'ACTIVE' || !user.twoFactorEnabled || !user.twoFactorSecret) {
                throw new UnauthorizedError('2FA 验证环境失效')
            }

            const isValid = authenticator.verify({ token: code, secret: user.twoFactorSecret })
            if (!isValid) {
                throw new UnauthorizedError('验证码错误')
            }

            const accessToken = this.generateAccessToken(user)
            const refreshToken = this.generateRefreshToken(user)

            return {
                accessToken,
                refreshToken,
                tokenType: 'Bearer',
                expiresIn: 900,
                user: {
                    id: user.id,
                    name: user.name,
                    email: user.email,
                    role: user.role.code,
                    roleId: user.roleId,
                    avatarUrl: user.avatarUrl,
                },
            }
        } catch (e: any) {
            if (e instanceof UnauthorizedError) throw e
            throw new UnauthorizedError('会话已失效，请重新登录')
        }
    },

    /**
     * 生成 2FA 密钥并返回绑定二维码 (设置开启用)
     */
    async generate2FA(userId: string) {
        const user = await prisma.user.findUnique({ where: { id: userId } })
        if (!user) throw new NotFoundError('用户不存在')

        const secret = authenticator.generateSecret()
        const otpauthUrl = authenticator.keyuri(user.email, 'TongHai CRM', secret)

        // 临时保存在数据库，此时尚未启用，如果中途终止也不会产生影响
        await prisma.user.update({
            where: { id: userId },
            data: { twoFactorSecret: secret, twoFactorEnabled: false }
        })

        const qrCodeUrl = await QRCode.toDataURL(otpauthUrl)

        return {
            secret,
            qrCodeUrl
        }
    },

    /**
     * 内部登录之后、用户设置的确认与激活
     */
    async verifyAndEnable2FA(userId: string, code: string) {
        const user = await prisma.user.findUnique({ where: { id: userId } })
        if (!user || !user.twoFactorSecret) throw new BadRequestError('请先获取验证二维码')

        const isValid = authenticator.verify({ token: code, secret: user.twoFactorSecret })
        if (!isValid) {
            throw new UnauthorizedError('验证码错误')
        }

        await prisma.user.update({
            where: { id: userId },
            data: { twoFactorEnabled: true }
        })

        return { success: true }
    },

    /**
     * 关闭 2FA，需要校验当前的有效码
     */
    async disable2FA(userId: string, code: string) {
        const user = await prisma.user.findUnique({ where: { id: userId } })
        if (!user || !user.twoFactorEnabled || !user.twoFactorSecret) {
            throw new BadRequestError('当前未启用 2FA')
        }

        const isValid = authenticator.verify({ token: code, secret: user.twoFactorSecret })
        if (!isValid) {
            throw new UnauthorizedError('验证码错误')
        }

        await prisma.user.update({
            where: { id: userId },
            data: { twoFactorEnabled: false, twoFactorSecret: null }
        })

        return { success: true }
    },

    /**
     * 用户注册
     */
    async register({ email, password, name }: RegisterInput) {
        const existingUser = await prisma.user.findUnique({
            where: { email },
        })

        if (existingUser) {
            // 使用通用错误消息，防止用户枚举攻击
            throw new UnauthorizedError('注册失败，请检查输入信息')
        }

        // 获取 CUSTOMER 角色
        const customerRole = await prisma.role.findUnique({ where: { code: 'CUSTOMER' } })
        if (!customerRole) {
            throw new Error('系统配置错误: CUSTOMER 角色不存在')
        }

        const passwordHash = await bcrypt.hash(password, 12)

        const user = await prisma.user.create({
            data: {
                email,
                name,
                passwordHash,
                roleId: customerRole.id,
            },
            include: { role: true },
        })

        return {
            id: user.id,
            name: user.name,
            email: user.email,
            role: user.role.code,
        }
    },

    /**
     * 刷新 Token
     */
    async refreshToken(refreshToken: string) {
        try {
            const { tokenBlacklist } = await import('../config/redis.js')
            const isBlacklisted = await tokenBlacklist.isBlacklisted(refreshToken)
            if (isBlacklisted) {
                throw new UnauthorizedError('凭证已失效（黑名单拦截），请重新登录')
            }

            // 使用独立的 refreshSecret 验证刷新令牌
            const decoded = jwt.verify(refreshToken, config.jwt.refreshSecret) as any

            if (decoded.type !== 'refresh') {
                throw new UnauthorizedError('无效的刷新令牌')
            }

            const user = await prisma.user.findUnique({
                where: { id: decoded.sub },
                include: { role: true },
            })

            if (!user || user.status !== 'ACTIVE') {
                throw new UnauthorizedError('用户不存在或已被禁用')
            }

            const accessToken = this.generateAccessToken(user)

            return {
                accessToken,
                expiresIn: 900,
            }
        } catch (error) {
            throw new UnauthorizedError('刷新令牌无效或已过期')
        }
    },

    /**
     * 获取当前用户信息
     */
    async getCurrentUser(userId: string) {
        const user = await prisma.user.findUnique({
            where: { id: userId },
            select: {
                id: true,
                email: true,
                name: true,
                roleId: true,
                role: { select: { code: true, name: true } },
                department: true,
                avatarUrl: true,
                status: true,
                twoFactorEnabled: true,
                createdAt: true,
            },
        })

        if (!user) {
            throw new NotFoundError('用户不存在')
        }

        return {
            ...user,
            roleCode: user.role.code,
            roleName: user.role.name,
        }
    },

    /**
     * 生成访问令牌
     */
    generateAccessToken(user: { id: string; email: string; role: { code: string }; roleId: string }) {
        return jwt.sign(
            {
                sub: user.id,
                email: user.email,
                role: user.role.code,
                roleId: user.roleId,
                type: 'access',
            },
            config.jwt.secret,
            { expiresIn: config.jwt.expiresIn as `${number}${'s' | 'm' | 'h' | 'd'}` }
        )
    },

    /**
     * 生成刷新令牌
     */
    generateRefreshToken(user: { id: string }) {
        return jwt.sign(
            {
                sub: user.id,
                type: 'refresh',
            },
            // 使用独立的 refreshSecret（更高安全性）
            config.jwt.refreshSecret,
            { expiresIn: config.jwt.refreshExpiresIn as `${number}${'s' | 'm' | 'h' | 'd'}` }
        )
    },

    /**
     * 验证设置密码 Token
     */
    async validateSetupToken(token: string) {
        const user = await prisma.user.findFirst({
            where: {
                setupToken: token,
                setupTokenExpiry: { gt: new Date() },
            },
        })

        if (!user) {
            throw new UnauthorizedError('链接无效或已过期')
        }

        return {
            valid: true,
            email: user.email,
            name: user.name,
        }
    },

    /**
     * 首次登录设置密码
     */
    async setupPassword(token: string, password: string) {
        const user = await prisma.user.findFirst({
            where: {
                setupToken: token,
                setupTokenExpiry: { gt: new Date() },
            },
        })

        if (!user) {
            throw new UnauthorizedError('链接无效或已过期')
        }

        const passwordHash = await bcrypt.hash(password, 12)

        const updatedUser = await prisma.user.update({
            where: { id: user.id },
            data: {
                passwordHash,
                setupToken: null,
                setupTokenExpiry: null,
            },
            include: { role: true },
        })

        // 自动登录
        const accessToken = this.generateAccessToken(updatedUser)
        const refreshToken = this.generateRefreshToken(updatedUser)

        return {
            success: true,
            message: '密码设置成功',
            accessToken,
            refreshToken,
            tokenType: 'Bearer',
            expiresIn: 900,
            user: {
                id: updatedUser.id,
                name: updatedUser.name,
                email: updatedUser.email,
                role: updatedUser.role,
                avatarUrl: updatedUser.avatarUrl,
            },
        }
    },
}

export default authService
