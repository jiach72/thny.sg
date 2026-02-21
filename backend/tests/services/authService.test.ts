import { describe, it, expect, vi, beforeEach } from 'vitest'
import bcrypt from 'bcryptjs'

// 1. Hoist the mock object creation
const prismaMock = vi.hoisted(() => {
    const mock = {
        user: {
            findUnique: vi.fn(),
            findFirst: vi.fn(),
            create: vi.fn(),
            update: vi.fn(),
        },
        role: {
            findUnique: vi.fn(),
        },
        $transaction: vi.fn(),
    }
    // Implement transaction to call callback with the mock itself
    mock.$transaction.mockImplementation((cb: any) => cb(mock))
    return mock
})

// 2. Mock the module using the hoisted variable
vi.mock('../../src/config/index.js', () => ({
    prisma: prismaMock,
    config: {
        jwt: {
            secret: 'test-secret',
            refreshSecret: 'test-refresh-secret',
            expiresIn: '15m',
            refreshExpiresIn: '7d',
        },
    },
}))

// 3. Import service AFTER mocking
import { authService } from '../../src/services/authService'

describe('AuthService', () => {
    beforeEach(() => {
        vi.clearAllMocks()
    })

    describe('login', () => {
        it('should login successfully with valid credentials', async () => {
            const mockUser = {
                id: '1',
                email: 'test@example.com',
                name: 'Test User',
                passwordHash: await bcrypt.hash('password123', 10),
                status: 'ACTIVE',
                roleId: 'role-1',
                role: { code: 'USER', name: 'User' },
                avatarUrl: null,
            }

            prismaMock.user.findUnique.mockResolvedValue(mockUser as any)

            const result = await authService.login({
                email: 'test@example.com',
                password: 'password123',
            })

            expect(result).toHaveProperty('accessToken')
            expect(result.user.email).toBe('test@example.com')
        })

        it('should throw error for invalid password', async () => {
            const mockUser = {
                id: '1',
                email: 'test@example.com',
                passwordHash: await bcrypt.hash('password123', 10),
                status: 'ACTIVE',
                role: { code: 'USER' },
            }

            prismaMock.user.findUnique.mockResolvedValue(mockUser as any)

            await expect(authService.login({
                email: 'test@example.com',
                password: 'wrongpassword',
            })).rejects.toThrow('邮箱或密码错误')
        })
    })

    describe('register', () => {
        it('should register successfully', async () => {
            prismaMock.user.findUnique.mockResolvedValue(null)
            prismaMock.role.findUnique.mockResolvedValue({ id: 'role-1', code: 'CUSTOMER' } as any)

            prismaMock.user.create.mockResolvedValue({
                id: '1',
                email: 'new@example.com',
                name: 'New User',
                role: { code: 'CUSTOMER' }
            } as any)

            const result = await authService.register({
                email: 'new@example.com',
                password: 'password123',
                name: 'New User',
            })

            expect(result.email).toBe('new@example.com')
            expect(prismaMock.user.create).toHaveBeenCalled()
        })
    })
})
