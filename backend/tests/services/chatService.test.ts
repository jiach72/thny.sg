import { describe, it, expect, vi, beforeEach } from 'vitest'

const prismaMock = vi.hoisted(() => ({
    chatSession: {
        findFirst: vi.fn(),
        findUnique: vi.fn(),
        create: vi.fn(),
        update: vi.fn(),
        findMany: vi.fn(),
    },
    chatMessage: {
        create: vi.fn(),
        findMany: vi.fn(),
        update: vi.fn(),
        count: vi.fn(),
    },
    unrecognizedQuestion: {
        findFirst: vi.fn(),
        findUnique: vi.fn(),
        create: vi.fn(),
        findMany: vi.fn(),
        update: vi.fn(),
    },
    faqItem: {
        findMany: vi.fn(),
    },
    systemSetting: {
        findMany: vi.fn(),
    },
    customer: {
        findFirst: vi.fn(),
    },
}))

const faqServiceMock = vi.hoisted(() => ({
    searchFaqs: vi.fn(),
    incrementViewCount: vi.fn(),
}))

vi.mock('../../src/config/index.js', () => ({
    prisma: prismaMock,
}))

vi.mock('../../src/services/faqService.js', () => ({
    faqService: faqServiceMock,
}))

vi.mock('../../src/config/logger.js', () => ({
    default: { info: vi.fn(), error: vi.fn(), warn: vi.fn() },
}))

vi.mock('../../src/middlewares/errorHandler.js', () => ({
    BadRequestError: class BadRequestError extends Error {
        constructor(msg: string) { super(msg) }
    },
}))

// Mock OpenAI
const mockCreate = vi.fn()
vi.mock('openai', () => ({
    default: vi.fn().mockImplementation(() => ({
        chat: {
            completions: {
                create: mockCreate,
            },
        },
    })),
}))

import { chatService } from '../../src/services/chatService'

describe('ChatService', () => {
    beforeEach(() => {
        vi.clearAllMocks()
        vi.stubEnv('OPENAI_API_KEY', 'test-api-key')
    })

    describe('getOrCreateSession', () => {
        it('有 visitorId 时应返回现有活跃会话', async () => {
            prismaMock.chatSession.findFirst.mockResolvedValue({
                id: 'session-1', visitorId: 'visitor-123', status: 'active',
            })

            const result = await chatService.getOrCreateSession('visitor-123')
            expect(result.id).toBe('session-1')
            expect(prismaMock.chatSession.create).not.toHaveBeenCalled()
        })

        it('无现有会话时应创建新会话', async () => {
            prismaMock.chatSession.findFirst.mockResolvedValue(null)
            prismaMock.chatSession.create.mockResolvedValue({
                id: 'new-session', visitorId: 'visitor-new', status: 'active',
            })

            const result = await chatService.getOrCreateSession('visitor-new', 'Test User', 'test@example.com')
            expect(result.id).toBe('new-session')
            expect(prismaMock.chatSession.create).toHaveBeenCalledWith(
                expect.objectContaining({
                    data: expect.objectContaining({
                        visitorId: 'visitor-new',
                        visitorName: 'Test User',
                        visitorEmail: 'test@example.com',
                        source: 'website',
                        status: 'active',
                    }),
                })
            )
        })

        it('无 visitorId 时应直接创建新会话', async () => {
            prismaMock.chatSession.create.mockResolvedValue({
                id: 'new-session', status: 'active',
            })

            const result = await chatService.getOrCreateSession()
            expect(result.id).toBe('new-session')
            expect(prismaMock.chatSession.findFirst).not.toHaveBeenCalled()
        })
    })

    describe('sendMessage', () => {
        const mockSession = { id: 'session-1', status: 'active' }

        it('有 sessionId 时应使用现有会话', async () => {
            prismaMock.chatSession.findUnique.mockResolvedValue(mockSession as any)
            faqServiceMock.searchFaqs.mockResolvedValue([])
            prismaMock.systemSetting.findMany.mockResolvedValue([
                { key: 'AI_API_KEY', value: 'test-key' },
            ])
            prismaMock.chatMessage.findMany.mockResolvedValue([])
            mockCreate.mockResolvedValue({
                choices: [{ message: { content: 'AI回复' } }],
                usage: { prompt_tokens: 10, completion_tokens: 20 },
            })
            prismaMock.chatMessage.create.mockResolvedValue({ id: 'msg-1' } as any)

            const result = await chatService.sendMessage({
                sessionId: 'session-1',
                message: '你好',
            })

            expect(prismaMock.chatSession.findUnique).toHaveBeenCalledWith({
                where: { id: 'session-1' },
            })
            expect(result.sessionId).toBe('session-1')
        })

        it('sessionId 无效时应创建新会话', async () => {
            prismaMock.chatSession.findUnique.mockResolvedValue(null)
            prismaMock.chatSession.findFirst.mockResolvedValue(null)
            prismaMock.chatSession.create.mockResolvedValue({ id: 'new-session', status: 'active' })
            faqServiceMock.searchFaqs.mockResolvedValue([])
            prismaMock.systemSetting.findMany.mockResolvedValue([
                { key: 'AI_API_KEY', value: 'test-key' },
            ])
            prismaMock.chatMessage.findMany.mockResolvedValue([])
            mockCreate.mockResolvedValue({
                choices: [{ message: { content: 'AI回复' } }],
                usage: { prompt_tokens: 10, completion_tokens: 20 },
            })
            prismaMock.chatMessage.create.mockResolvedValue({ id: 'msg-1' } as any)

            const result = await chatService.sendMessage({
                sessionId: 'invalid-id',
                message: '你好',
                visitorId: 'v-1',
            })

            expect(result.sessionId).toBe('new-session')
        })

        it('高匹配度 FAQ 应直接返回答案', async () => {
            prismaMock.chatSession.findUnique.mockResolvedValue(mockSession as any)
            faqServiceMock.searchFaqs.mockResolvedValue([
                { id: 'faq-1', score: 20, question: '公司注册', answer: '注册流程如下...', questionEn: 'Registration', answerEn: 'Process...' },
            ])
            prismaMock.chatMessage.create.mockResolvedValue({ id: 'msg-1' } as any)

            const result = await chatService.sendMessage({
                sessionId: 'session-1',
                message: '如何注册公司？',
            })

            expect(result.isAiGenerated).toBe(false)
            expect(result.message).toBe('注册流程如下...')
            expect(faqServiceMock.incrementViewCount).toHaveBeenCalledWith('faq-1')
        })

        it('英文 locale 应返回英文 FAQ 答案', async () => {
            prismaMock.chatSession.findUnique.mockResolvedValue(mockSession as any)
            faqServiceMock.searchFaqs.mockResolvedValue([
                { id: 'faq-1', score: 20, question: '公司注册', answer: '注册流程如下...', questionEn: 'Registration', answerEn: 'The process is...' },
                { id: 'faq-2', score: 18, question: '费用', answer: '费用如下...', questionEn: 'Fees', answerEn: 'Fees are...' },
            ])
            prismaMock.chatMessage.create.mockResolvedValue({ id: 'msg-1' } as any)

            const result = await chatService.sendMessage({
                sessionId: 'session-1',
                message: 'How to register?',
                locale: 'en',
            })

            expect(result.message).toBe('The process is...')
            // suggestedFaqs 是 matchedFaqs.slice(1, 4)，即从第二个 FAQ 开始
            expect(result.suggestedFaqs?.[0]?.question).toBe('Fees')
        })

        it('AI 生成回复成功时应返回 AI 答案', async () => {
            prismaMock.chatSession.findUnique.mockResolvedValue(mockSession as any)
            faqServiceMock.searchFaqs.mockResolvedValue([])
            prismaMock.systemSetting.findMany.mockResolvedValue([
                { key: 'AI_API_KEY', value: 'test-key' },
            ])
            prismaMock.chatMessage.findMany.mockResolvedValue([])
            mockCreate.mockResolvedValue({
                choices: [{ message: { content: 'AI生成回复' } }],
                usage: { prompt_tokens: 10, completion_tokens: 20 },
            })
            prismaMock.chatMessage.create.mockResolvedValue({ id: 'msg-1' } as any)

            const result = await chatService.sendMessage({
                sessionId: 'session-1',
                message: '你好',
            })

            expect(result.isAiGenerated).toBe(true)
            expect(result.message).toBe('AI生成回复')
        })

        it('AI API 失败时应降级到默认消息', async () => {
            prismaMock.chatSession.findUnique.mockResolvedValue(mockSession as any)
            faqServiceMock.searchFaqs.mockResolvedValue([])
            prismaMock.systemSetting.findMany.mockResolvedValue([
                { key: 'AI_API_KEY', value: 'test-key' },
            ])
            prismaMock.chatMessage.findMany.mockResolvedValue([])
            mockCreate.mockRejectedValue(new Error('API error'))
            prismaMock.chatMessage.create.mockResolvedValue({ id: 'msg-1' } as any)

            const result = await chatService.sendMessage({
                sessionId: 'session-1',
                message: '你好',
            })

            expect(result.isAiGenerated).toBe(false)
            expect(result.message).toContain('admin@thny.sg')
        })

        it('无 AI API Key 时应降级', async () => {
            prismaMock.chatSession.findUnique.mockResolvedValue(mockSession as any)
            faqServiceMock.searchFaqs.mockResolvedValue([])
            prismaMock.systemSetting.findMany.mockResolvedValue([])
            delete process.env.OPENAI_API_KEY
            prismaMock.chatMessage.create.mockResolvedValue({ id: 'msg-1' } as any)

            const result = await chatService.sendMessage({
                sessionId: 'session-1',
                message: '你好',
            })

            expect(result.isAiGenerated).toBe(false)
            vi.stubEnv('OPENAI_API_KEY', 'test-api-key')
        })

        it('AI 无回复内容时应使用默认消息', async () => {
            prismaMock.chatSession.findUnique.mockResolvedValue(mockSession as any)
            faqServiceMock.searchFaqs.mockResolvedValue([])
            prismaMock.systemSetting.findMany.mockResolvedValue([
                { key: 'AI_API_KEY', value: 'test-key' },
            ])
            prismaMock.chatMessage.findMany.mockResolvedValue([])
            mockCreate.mockResolvedValue({
                choices: [{ message: { content: null } }],
                usage: { prompt_tokens: 10, completion_tokens: 20 },
            })
            prismaMock.chatMessage.create.mockResolvedValue({ id: 'msg-1' } as any)

            const result = await chatService.sendMessage({
                sessionId: 'session-1',
                message: '你好',
            })

            expect(result.message).toContain('稍后重试')
        })

        it('无 FAQ 匹配时应记录未识别问题', async () => {
            prismaMock.chatSession.findUnique.mockResolvedValue(mockSession as any)
            faqServiceMock.searchFaqs.mockResolvedValue([])
            prismaMock.systemSetting.findMany.mockResolvedValue([
                { key: 'AI_API_KEY', value: 'test-key' },
            ])
            prismaMock.chatMessage.findMany.mockResolvedValue([])
            mockCreate.mockResolvedValue({
                choices: [{ message: { content: 'AI回复' } }],
                usage: { prompt_tokens: 10, completion_tokens: 20 },
            })
            prismaMock.chatMessage.create.mockResolvedValue({ id: 'msg-1' } as any)
            prismaMock.unrecognizedQuestion.findFirst.mockResolvedValue(null)
            prismaMock.unrecognizedQuestion.create.mockResolvedValue({ id: 'uq-1' })

            await chatService.sendMessage({
                sessionId: 'session-1',
                message: '未知问题',
            })

            // 等待异步记录
            await new Promise(r => setTimeout(r, 10))
            expect(prismaMock.unrecognizedQuestion.create).toHaveBeenCalled()
        })

        it('低分 FAQ 匹配应使用 AI 生成回复', async () => {
            prismaMock.chatSession.findUnique.mockResolvedValue(mockSession as any)
            faqServiceMock.searchFaqs.mockResolvedValue([
                { id: 'faq-1', score: 5, question: 'Q', answer: 'A', questionEn: null, answerEn: null },
            ])
            prismaMock.systemSetting.findMany.mockResolvedValue([
                { key: 'AI_API_KEY', value: 'test-key' },
            ])
            prismaMock.chatMessage.findMany.mockResolvedValue([])
            mockCreate.mockResolvedValue({
                choices: [{ message: { content: 'AI回复' } }],
                usage: { prompt_tokens: 10, completion_tokens: 20 },
            })
            prismaMock.chatMessage.create.mockResolvedValue({ id: 'msg-1' } as any)

            const result = await chatService.sendMessage({
                sessionId: 'session-1',
                message: '你好',
            })

            expect(result.isAiGenerated).toBe(true)
        })

        it('英文降级消息应使用英文', async () => {
            prismaMock.chatSession.findUnique.mockResolvedValue(mockSession as any)
            faqServiceMock.searchFaqs.mockResolvedValue([])
            prismaMock.systemSetting.findMany.mockResolvedValue([])
            delete process.env.OPENAI_API_KEY
            prismaMock.chatMessage.create.mockResolvedValue({ id: 'msg-1' } as any)

            const result = await chatService.sendMessage({
                sessionId: 'session-1',
                message: 'Hello',
                locale: 'en',
            })

            expect(result.message).toContain('admin@thny.sg')
            expect(result.message).not.toContain('抱歉')
            vi.stubEnv('OPENAI_API_KEY', 'test-api-key')
        })
    })

    describe('getSessionHistory', () => {
        it('应返回会话消息列表', async () => {
            const mockMessages = [
                { id: 'msg-1', content: '你好', role: 'user' },
                { id: 'msg-2', content: '您好！', role: 'assistant' },
            ]
            prismaMock.chatMessage.findMany.mockResolvedValue(mockMessages as any)

            const result = await chatService.getSessionHistory('session-1')
            expect(result).toHaveLength(2)
        })
    })

    describe('closeSession', () => {
        it('应关闭会话', async () => {
            prismaMock.chatSession.update.mockResolvedValue({
                id: 'session-1', status: 'closed', closedAt: new Date(),
            })

            const result = await chatService.closeSession('session-1')
            expect(result.status).toBe('closed')
        })
    })

    describe('markMessageHelpful', () => {
        it('应更新消息有帮助标记', async () => {
            prismaMock.chatMessage.update.mockResolvedValue({
                id: 'msg-1', isHelpful: true,
            })

            await chatService.markMessageHelpful('msg-1', true)
            expect(prismaMock.chatMessage.update).toHaveBeenCalledWith({
                where: { id: 'msg-1' },
                data: { isHelpful: true },
            })
        })
    })

    describe('recordUnrecognizedQuestion', () => {
        it('已存在的问题应增加频次', async () => {
            prismaMock.unrecognizedQuestion.findFirst.mockResolvedValue({
                id: 'uq-1', frequency: 5,
            })
            prismaMock.unrecognizedQuestion.update.mockResolvedValue({
                id: 'uq-1', frequency: 6,
            })

            await chatService.recordUnrecognizedQuestion('什么是VCC？', 'session-1')
            expect(prismaMock.unrecognizedQuestion.update).toHaveBeenCalledWith({
                where: { id: 'uq-1' },
                data: { frequency: { increment: 1 } },
            })
        })

        it('不存在的问题应创建新记录', async () => {
            prismaMock.unrecognizedQuestion.findFirst.mockResolvedValue(null)
            prismaMock.unrecognizedQuestion.create.mockResolvedValue({
                id: 'uq-new', question: '什么是VCC？',
            })

            await chatService.recordUnrecognizedQuestion('什么是VCC？', 'session-1')
            expect(prismaMock.unrecognizedQuestion.create).toHaveBeenCalledWith(
                expect.objectContaining({
                    data: expect.objectContaining({
                        question: '什么是VCC？',
                        sessionId: 'session-1',
                    }),
                })
            )
        })
    })

    describe('getUnrecognizedQuestions', () => {
        it('应返回指定状态的问题列表', async () => {
            prismaMock.unrecognizedQuestion.findMany.mockResolvedValue([
                { id: 'uq-1', question: 'Q1', status: 'pending' },
            ])

            const result = await chatService.getUnrecognizedQuestions('pending')
            expect(result).toHaveLength(1)
            expect(prismaMock.unrecognizedQuestion.findMany).toHaveBeenCalledWith(
                expect.objectContaining({ where: { status: 'pending' } })
            )
        })
    })

    describe('getCustomerRooms', () => {
        it('用户无关联客户时应返回空数组', async () => {
            prismaMock.customer.findFirst.mockResolvedValue(null)

            const result = await chatService.getCustomerRooms('user-1')
            expect(result).toEqual([])
        })

        it('有关联客户时应返回聊天房间', async () => {
            prismaMock.customer.findFirst.mockResolvedValue({ id: 'cust-1' })
            prismaMock.chatSession.findMany.mockResolvedValue([
                { id: 'room-1', status: 'active' },
            ])

            const result = await chatService.getCustomerRooms('user-1')
            expect(result).toHaveLength(1)
        })
    })

    describe('getRoomMessages', () => {
        it('无 userId 时应直接查询消息', async () => {
            prismaMock.chatMessage.findMany.mockResolvedValue([
                { id: 'msg-1', content: '你好', role: 'user' },
            ])
            prismaMock.chatMessage.count.mockResolvedValue(1)

            const result = await chatService.getRoomMessages('room-1', 1, 30)
            expect(result.messages).toHaveLength(1)
            expect(result.total).toBe(1)
        })

        it('userId 验证不通过时应抛出错误', async () => {
            prismaMock.chatSession.findUnique.mockResolvedValue({
                id: 'room-1', visitorId: 'other-user', source: 'portal',
            })

            await expect(
                chatService.getRoomMessages('room-1', 1, 30, 'user-1')
            ).rejects.toThrow('无权访问此聊天房间')
        })

        it('房间不存在时应抛出错误', async () => {
            prismaMock.chatSession.findUnique.mockResolvedValue(null)

            await expect(
                chatService.getRoomMessages('room-1', 1, 30, 'user-1')
            ).rejects.toThrow('无权访问此聊天房间')
        })

        it('应正确分页', async () => {
            prismaMock.chatMessage.findMany.mockResolvedValue([])
            prismaMock.chatMessage.count.mockResolvedValue(50)

            const result = await chatService.getRoomMessages('room-1', 2, 10)
            expect(result.page).toBe(2)
            expect(result.limit).toBe(10)
            expect(result.totalPages).toBe(5)
        })
    })

    describe('sendPortalMessage', () => {
        it('房间不存在时应抛出错误', async () => {
            prismaMock.chatSession.findUnique.mockResolvedValue(null)

            await expect(
                chatService.sendPortalMessage('room-1', 'user-1', 'Hello')
            ).rejects.toThrow('聊天房间不存在')
        })

        it('非房间所有者应抛出错误', async () => {
            prismaMock.chatSession.findUnique.mockResolvedValue({
                id: 'room-1', visitorId: 'owner', source: 'portal',
            })

            await expect(
                chatService.sendPortalMessage('room-1', 'other-user', 'Hello')
            ).rejects.toThrow('无权在此聊天房间发送消息')
        })

        it('房间所有者应能发送消息', async () => {
            prismaMock.chatSession.findUnique.mockResolvedValue({
                id: 'room-1', visitorId: 'user-1', source: 'portal',
            })
            prismaMock.chatMessage.create.mockResolvedValue({
                id: 'msg-1', content: 'Hello', role: 'user',
            })

            const result = await chatService.sendPortalMessage('room-1', 'user-1', 'Hello')
            expect(prismaMock.chatMessage.create).toHaveBeenCalledWith({
                data: {
                    sessionId: 'room-1',
                    content: 'Hello',
                    role: 'user',
                },
            })
        })
    })
})
