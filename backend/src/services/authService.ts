import bcrypt from 'bcryptjs'
import jwt from 'jsonwebtoken'
import { prisma, config } from '../config'
import { UnauthorizedError, NotFoundError } from '../middlewares'

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
     * 用户注册
     */
    async register({ email, password, name }: RegisterInput) {
        const existingUser = await prisma.user.findUnique({
            where: { email },
        })

        if (existingUser) {
            throw new UnauthorizedError('该邮箱已被注册')
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
            const decoded = jwt.verify(refreshToken, config.jwt.secret) as {
                sub: string
                type: string
            }

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
            config.jwt.secret,
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
