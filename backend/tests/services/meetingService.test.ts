import { describe, it, expect, vi, beforeEach } from 'vitest'

// 1. 提升 mock 对象
const prismaMock = vi.hoisted(() => ({
    meetingMinutes: {
        findUnique: vi.fn(),
        upsert: vi.fn(),
    },
    appointment: {
        findUnique: vi.fn(),
        findMany: vi.fn(),
    },
    meetingRoom: {
        findUnique: vi.fn(),
        findMany: vi.fn(),
        create: vi.fn(),
        update: vi.fn(),
        delete: vi.fn(),
    },
    expenseCategoryConfig: {
        findUnique: vi.fn(),
        findMany: vi.fn(),
        create: vi.fn(),
        upsert: vi.fn(),
        update: vi.fn(),
    },
}))

// 2. Mock 模块
vi.mock('../../src/config/index.js', () => ({
    prisma: prismaMock,
}))

// 3. 导入被测模块
import { meetingService } from '../../src/services/meetingService'

describe('MeetingService', () => {
    beforeEach(() => {
        vi.clearAllMocks()
    })

    // ==================== 会议纪要 ====================

    describe('upsertMeetingMinutes', () => {
        it('应创建或更新会议纪要', async () => {
            // 验证预约存在
            prismaMock.appointment.findUnique.mockResolvedValue({
                id: 'apt-1',
                title: '客户讨论',
            })
            const mockMinutes = {
                id: 'mm-1',
                appointmentId: 'apt-1',
                content: '讨论了项目进度',
                actionItems: [{ task: '完成需求文档', assignee: '张三' }],
            }
            prismaMock.meetingMinutes.upsert.mockResolvedValue(mockMinutes)

            const result = await meetingService.upsertMeetingMinutes('apt-1', {
                content: '讨论了项目进度',
                actionItems: [{ task: '完成需求文档', assignee: '张三' }],
            }, 'user-1')

            expect(result.appointmentId).toBe('apt-1')
            expect(prismaMock.meetingMinutes.upsert).toHaveBeenCalledWith(
                expect.objectContaining({
                    where: { appointmentId: 'apt-1' },
                })
            )
        })

        it('预约不存在时应抛出错误', async () => {
            prismaMock.appointment.findUnique.mockResolvedValue(null)

            await expect(meetingService.upsertMeetingMinutes('apt-999', {
                content: '测试内容',
            }, 'user-1')).rejects.toThrow()
        })
    })

    describe('getMeetingMinutes', () => {
        it('应返回指定会议的纪要', async () => {
            const mockMinutes = {
                id: 'mm-1',
                appointmentId: 'apt-1',
                content: '纪要内容',
                recordedBy: { id: 'user-1', name: '张三' },
            }
            prismaMock.meetingMinutes.findUnique.mockResolvedValue(mockMinutes)

            const result = await meetingService.getMeetingMinutes('apt-1')

            expect(result?.content).toBe('纪要内容')
        })

        it('无纪要时应返回 null', async () => {
            prismaMock.meetingMinutes.findUnique.mockResolvedValue(null)

            const result = await meetingService.getMeetingMinutes('apt-999')

            expect(result).toBeNull()
        })
    })

    // ==================== 即将到来的会议 ====================

    describe('getUpcomingMeetings', () => {
        it('应返回未来的会议列表', async () => {
            const mockAppointments = [
                {
                    id: 'apt-1',
                    title: '客户初见会',
                    startTime: new Date('2026-03-20'),
                    customer: { id: 'c-1', companyName: '测试公司' },
                    lead: null,
                    minutes: null,
                },
            ]
            prismaMock.appointment.findMany.mockResolvedValue(mockAppointments)

            const result = await meetingService.getUpcomingMeetings('user-1')

            expect(result).toHaveLength(1)
            expect(result[0].title).toBe('客户初见会')
        })
    })

    // ==================== 会议室管理 ====================

    describe('getMeetingRooms', () => {
        it('应返回活跃的会议室', async () => {
            const mockRooms = [
                { id: 'room-1', name: '大会议室', capacity: 20, isActive: true },
                { id: 'room-2', name: '小会议室', capacity: 6, isActive: true },
            ]
            prismaMock.meetingRoom.findMany.mockResolvedValue(mockRooms)

            const result = await meetingService.getMeetingRooms()

            expect(result).toHaveLength(2)
        })
    })

    describe('createMeetingRoom', () => {
        it('应创建新会议室', async () => {
            const mockRoom = {
                id: 'room-new',
                name: '新会议室',
                capacity: 10,
                isActive: true,
            }
            prismaMock.meetingRoom.create.mockResolvedValue(mockRoom)

            const result = await meetingService.createMeetingRoom({
                name: '新会议室',
                capacity: 10,
            })

            expect(result.name).toBe('新会议室')
        })
    })

    describe('updateMeetingRoom', () => {
        it('应更新会议室信息', async () => {
            prismaMock.meetingRoom.findUnique.mockResolvedValue({ id: 'room-1' })
            prismaMock.meetingRoom.update.mockResolvedValue({
                id: 'room-1',
                name: '已更新会议室',
                capacity: 15,
            })

            const result = await meetingService.updateMeetingRoom('room-1', {
                name: '已更新会议室',
                capacity: 15,
            })

            expect(result.name).toBe('已更新会议室')
        })
    })

    describe('deleteMeetingRoom', () => {
        it('应标记会议室为非活跃', async () => {
            prismaMock.meetingRoom.findUnique.mockResolvedValue({ id: 'room-1' })
            prismaMock.meetingRoom.update.mockResolvedValue({ id: 'room-1', isActive: false })

            await meetingService.deleteMeetingRoom('room-1')

            expect(prismaMock.meetingRoom.update).toHaveBeenCalledWith(
                expect.objectContaining({
                    where: { id: 'room-1' },
                    data: { isActive: false },
                })
            )
        })
    })

    // ==================== 费用类别 ====================

    describe('getExpenseCategoryConfigs', () => {
        it('应返回活跃的费用类别列表', async () => {
            const mockCategories = [
                { id: 'ec-1', code: 'TRANSPORT', name: '交通费', isActive: true },
                { id: 'ec-2', code: 'MEAL', name: '餐费', isActive: true },
            ]
            prismaMock.expenseCategoryConfig.findMany.mockResolvedValue(mockCategories)

            const result = await meetingService.getExpenseCategoryConfigs()

            expect(result).toHaveLength(2)
        })
    })
})
