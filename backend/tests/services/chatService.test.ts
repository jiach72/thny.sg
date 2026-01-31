import { describe, it, expect, vi, beforeEach } from 'vitest'

// 1. Hoist the mock object creation
const prismaMock = vi.hoisted(() => ({
    chatSession: {
        findFirst: vi.fn(),
        findUnique: vi.fn(),
        create: vi.fn(),
        update: vi.fn(),
    },
    chatMessage: {
        create: vi.fn(),
        findMany: vi.fn(),
        update: vi.fn(),
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
}))

const faqServiceMock = vi.hoisted(() => ({
    searchFaqs: vi.fn(),
}))

// 2. Mock the modules using the hoisted variables
vi.mock('../../src/config/index.js', () => ({
    prisma: prismaMock,
}))

vi.mock('../../src/services/faqService.js', () => ({
    faqService: faqServiceMock,
}))

// Mock OpenAI - we don't want to make real API calls in tests
vi.mock('openai', () => ({
    default: vi.fn().mockImplementation(() => ({
        chat: {
            completions: {
                create: vi.fn().mockResolvedValue({
                    choices: [{ message: { content: '这是一个测试回复。' } }],
                }),
            },
        },
    })),
}))

// 3. Import service AFTER mocking
import { chatService } from '../../src/services/chatService'

describe('ChatService', () => {
    beforeEach(() => {
        vi.clearAllMocks()
        // Reset environment variable for OpenAI
        vi.stubEnv('OPENAI_API_KEY', 'test-api-key')
    })

    describe('getOrCreateSession', () => {
        it('should return existing session if found', async () => {
            const mockSession = {
                id: 'session-1',
                visitorId: 'visitor-123',
                status: 'active',
            }

            prismaMock.chatSession.findFirst.mockResolvedValue(mockSession as any)

            const result = await chatService.getOrCreateSession('visitor-123')

            expect(result.id).toBe('session-1')
            expect(prismaMock.chatSession.create).not.toHaveBeenCalled()
        })

        it('should create new session if none exists', async () => {
            prismaMock.chatSession.findFirst.mockResolvedValue(null)
            prismaMock.chatSession.create.mockResolvedValue({
                id: 'new-session',
                visitorId: 'visitor-new',
                status: 'active',
            } as any)

            const result = await chatService.getOrCreateSession('visitor-new', 'Test User', 'test@example.com')

            expect(result.id).toBe('new-session')
            expect(prismaMock.chatSession.create).toHaveBeenCalledWith(
                expect.objectContaining({
                    data: expect.objectContaining({
                        visitorId: 'visitor-new',
                        visitorName: 'Test User',
                        visitorEmail: 'test@example.com',
                    }),
                })
            )
        })
    })

    describe('getSessionHistory', () => {
        it('should return messages for a session', async () => {
            const mockMessages = [
                { id: 'msg-1', content: '你好', role: 'user' },
                { id: 'msg-2', content: '您好！有什么可以帮助您的？', role: 'assistant' },
            ]

            prismaMock.chatMessage.findMany.mockResolvedValue(mockMessages as any)

            const result = await chatService.getSessionHistory('session-1')

            expect(result).toHaveLength(2)
            expect(prismaMock.chatMessage.findMany).toHaveBeenCalledWith(
                expect.objectContaining({
                    where: { sessionId: 'session-1' },
                })
            )
        })
    })

    describe('closeSession', () => {
        it('should update session status to closed', async () => {
            prismaMock.chatSession.update.mockResolvedValue({
                id: 'session-1',
                status: 'closed',
                closedAt: new Date(),
            } as any)

            const result = await chatService.closeSession('session-1')

            expect(result.status).toBe('closed')
            expect(prismaMock.chatSession.update).toHaveBeenCalledWith(
                expect.objectContaining({
                    where: { id: 'session-1' },
                    data: expect.objectContaining({
                        status: 'closed',
                    }),
                })
            )
        })
    })

    describe('markMessageHelpful', () => {
        it('should update message with helpfulness feedback', async () => {
            prismaMock.chatMessage.update.mockResolvedValue({
                id: 'msg-1',
                isHelpful: true,
            } as any)

            await chatService.markMessageHelpful('msg-1', true)

            expect(prismaMock.chatMessage.update).toHaveBeenCalledWith({
                where: { id: 'msg-1' },
                data: { isHelpful: true },
            })
        })
    })

    describe('recordUnrecognizedQuestion', () => {
        it('should create unrecognized question record', async () => {
            prismaMock.unrecognizedQuestion.create.mockResolvedValue({
                id: 'uq-1',
                question: '这是什么？',
                status: 'pending',
            } as any)

            await chatService.recordUnrecognizedQuestion('这是什么？', 'session-1')

            expect(prismaMock.unrecognizedQuestion.create).toHaveBeenCalledWith(
                expect.objectContaining({
                    data: expect.objectContaining({
                        question: '这是什么？',
                        sessionId: 'session-1',
                    }),
                })
            )
        })
    })

    describe('getUnrecognizedQuestions', () => {
        it('should return pending unrecognized questions by default', async () => {
            const mockQuestions = [
                { id: 'uq-1', question: '问题1', status: 'pending' },
                { id: 'uq-2', question: '问题2', status: 'pending' },
            ]

            prismaMock.unrecognizedQuestion.findMany.mockResolvedValue(mockQuestions as any)

            const result = await chatService.getUnrecognizedQuestions()

            expect(result).toHaveLength(2)
            expect(prismaMock.unrecognizedQuestion.findMany).toHaveBeenCalledWith(
                expect.objectContaining({
                    where: { status: 'pending' },
                })
            )
        })
    })
})
