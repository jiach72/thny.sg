import { describe, it, expect, vi, beforeEach } from 'vitest'

const prismaMock = vi.hoisted(() => ({
    appointment: {
        findMany: vi.fn(),
        findUnique: vi.fn(),
        findFirst: vi.fn(),
        create: vi.fn(),
        update: vi.fn(),
        delete: vi.fn(),
        count: vi.fn(),
    },
}))

vi.mock('../../src/config/index.js', () => ({
    prisma: prismaMock,
}))

vi.mock('../../src/config/logger.js', () => ({
    default: { info: vi.fn(), error: vi.fn(), warn: vi.fn() },
}))

import { appointmentService } from '../../src/services/appointmentService.js'

describe('AppointmentService', () => {
    beforeEach(() => {
        vi.clearAllMocks()
    })

    describe('getAppointments', () => {
        it('应返回分页预约列表', async () => {
            const mockAppointments = [{ id: '1', title: 'Meeting' }]
            prismaMock.appointment.findMany.mockResolvedValue(mockAppointments)
            prismaMock.appointment.count.mockResolvedValue(1)

            const result = await appointmentService.getAppointments(
                { userId: 'u1' },
                { page: 1, limit: 10 }
            )

            expect(result.data).toEqual(mockAppointments)
            expect(result.pagination.total).toBe(1)
        })

        it('应支持日期范围筛选', async () => {
            prismaMock.appointment.findMany.mockResolvedValue([])
            prismaMock.appointment.count.mockResolvedValue(0)

            await appointmentService.getAppointments(
                { startDate: '2024-01-01', endDate: '2024-12-31' },
                { page: 1, limit: 10 }
            )

            expect(prismaMock.appointment.findMany).toHaveBeenCalled()
        })

        it('应支持状态和客户筛选', async () => {
            prismaMock.appointment.findMany.mockResolvedValue([])
            prismaMock.appointment.count.mockResolvedValue(0)

            await appointmentService.getAppointments(
                { status: 'SCHEDULED', customerId: 'c1', leadId: 'l1' },
                { page: 1, limit: 10 }
            )

            expect(prismaMock.appointment.findMany).toHaveBeenCalled()
        })
    })

    describe('getAppointmentById', () => {
        it('应返回预约详情', async () => {
            const mockAppt = { id: '1', title: 'Meeting', user: {}, customer: {}, lead: {} }
            prismaMock.appointment.findUnique.mockResolvedValue(mockAppt)

            const result = await appointmentService.getAppointmentById('1')
            expect(result).toEqual(mockAppt)
        })

        it('应在预约不存在时抛出 NotFoundError', async () => {
            prismaMock.appointment.findUnique.mockResolvedValue(null)

            await expect(appointmentService.getAppointmentById('nonexistent'))
                .rejects.toThrow('预约不存在')
        })
    })

    describe('checkConflict', () => {
        it('应在无冲突时正常返回', async () => {
            prismaMock.appointment.findFirst.mockResolvedValue(null)

            await expect(
                appointmentService.checkConflict('u1', new Date('2024-01-01T10:00'), new Date('2024-01-01T11:00'))
            ).resolves.toBeUndefined()
        })

        it('应在有冲突时抛出 ConflictError', async () => {
            prismaMock.appointment.findFirst.mockResolvedValue({ id: '2', title: 'Existing' })

            await expect(
                appointmentService.checkConflict('u1', new Date('2024-01-01T10:00'), new Date('2024-01-01T11:00'))
            ).rejects.toThrow('预约时间冲突')
        })

        it('应支持排除ID和客户ID条件', async () => {
            prismaMock.appointment.findFirst.mockResolvedValue(null)

            await appointmentService.checkConflict(
                'u1',
                new Date('2024-01-01T10:00'),
                new Date('2024-01-01T11:00'),
                'exclude-id',
                'customer-id'
            )

            expect(prismaMock.appointment.findFirst).toHaveBeenCalled()
        })
    })

    describe('createAppointment', () => {
        it('应在时间无效时抛出 BusinessLogicError', async () => {
            await expect(
                appointmentService.createAppointment({
                    title: 'Test',
                    startTime: '2024-01-01T11:00',
                    endTime: '2024-01-01T10:00',
                    userId: 'u1',
                })
            ).rejects.toThrow('开始时间必须早于结束时间')
        })

        it('应成功创建预约', async () => {
            prismaMock.appointment.findFirst.mockResolvedValue(null)
            const mockCreated = { id: '1', title: 'Test' }
            prismaMock.appointment.create.mockResolvedValue(mockCreated)

            const result = await appointmentService.createAppointment({
                title: 'Test',
                startTime: '2024-01-01T10:00',
                endTime: '2024-01-01T11:00',
                userId: 'u1',
            })

            expect(result).toEqual(mockCreated)
        })
    })

    describe('updateAppointment', () => {
        it('应在预约不存在时抛出 NotFoundError', async () => {
            prismaMock.appointment.findUnique.mockResolvedValue(null)

            await expect(
                appointmentService.updateAppointment('nonexistent', { title: 'Updated' })
            ).rejects.toThrow('预约不存在')
        })

        it('应在时间无效时抛出 BusinessLogicError', async () => {
            prismaMock.appointment.findUnique.mockResolvedValue({
                id: '1', startTime: new Date('2024-01-01T10:00'), endTime: new Date('2024-01-01T11:00'),
                status: 'SCHEDULED', userId: 'u1', customerId: null,
            })

            await expect(
                appointmentService.updateAppointment('1', {
                    startTime: '2024-01-01T12:00',
                    endTime: '2024-01-01T11:00',
                })
            ).rejects.toThrow('开始时间必须早于结束时间')
        })

        it('应成功更新预约', async () => {
            prismaMock.appointment.findUnique.mockResolvedValue({
                id: '1', startTime: new Date('2024-01-01T10:00'), endTime: new Date('2024-01-01T11:00'),
                status: 'SCHEDULED', userId: 'u1', customerId: null,
            })
            prismaMock.appointment.findFirst.mockResolvedValue(null)
            const mockUpdated = { id: '1', title: 'Updated' }
            prismaMock.appointment.update.mockResolvedValue(mockUpdated)

            const result = await appointmentService.updateAppointment('1', { title: 'Updated' })
            expect(result).toEqual(mockUpdated)
        })

        it('当状态为SCHEDULED且时间/用户变化时进行冲突检测', async () => {
            prismaMock.appointment.findUnique.mockResolvedValue({
                id: '1', startTime: new Date('2024-01-01T10:00'), endTime: new Date('2024-01-01T11:00'),
                status: 'SCHEDULED', userId: 'u1', customerId: null,
            })
            prismaMock.appointment.findFirst.mockResolvedValue(null)
            prismaMock.appointment.update.mockResolvedValue({ id: '1' })

            await appointmentService.updateAppointment('1', { startTime: '2024-01-01T09:00' })
            expect(prismaMock.appointment.findFirst).toHaveBeenCalled()
        })
    })

    describe('deleteAppointment', () => {
        it('应在预约不存在时抛出 NotFoundError', async () => {
            prismaMock.appointment.findUnique.mockResolvedValue(null)

            await expect(appointmentService.deleteAppointment('nonexistent'))
                .rejects.toThrow('预约不存在')
        })

        it('应成功删除预约', async () => {
            prismaMock.appointment.findUnique.mockResolvedValue({ id: '1' })
            prismaMock.appointment.delete.mockResolvedValue({ id: '1' })

            const result = await appointmentService.deleteAppointment('1')
            expect(result.success).toBe(true)
        })
    })
})
