import os from 'os'
import fs from 'fs'
import nodemailer from 'nodemailer'
import { config } from '../src/config/index.js'
import logger from '../src/config/logger.js'

// 阈值配置
const MEMORY_WARNING_THRESHOLD_PERCENT = 10 // 剩余少于 10%
const DISK_WARNING_THRESHOLD_PERCENT = 10   // 剩余少于 10% (对于简单挂载点探测)

// 初始化邮件发送器，复用系统已有配置
const transporter = nodemailer.createTransport(config.smtp)

async function getDiskUsageInfo(): Promise<{ free: number, total: number, path: string }> {
    return new Promise((resolve) => {
        // 由于跨平台的 fs.statfs 是 Node 19.6.0+
        if (fs.statfs) {
            fs.statfs('/', (err, stats) => {
                if (err) {
                    resolve({ free: 0, total: 1, path: '/' })
                } else {
                    const free = stats.bavail * stats.bsize
                    const total = stats.blocks * stats.bsize
                    resolve({ free, total, path: '/' })
                }
            })
        } else {
            resolve({ free: 1, total: 1, path: 'Mock' })
        }
    })
}

async function runHealthCheck() {
    try {
        logger.info('开始执行机器与服务健康自检巡航（Health Check）...')
        const alerts: string[] = []

        // 1. 内存自检
        const totalMem = os.totalmem()
        const freeMem = os.freemem()
        const freeMemPercent = (freeMem / totalMem) * 100

        if (freeMemPercent < MEMORY_WARNING_THRESHOLD_PERCENT) {
            alerts.push(`⚠️ 内存告警：当前系统剩余内存不足！仅剩 ${(freeMem / 1024 / 1024).toFixed(2)} MB (${freeMemPercent.toFixed(1)}%)`)
        }

        // 2. 磁盘自检
        const diskInfo = await getDiskUsageInfo()
        const freeDiskPercent = (diskInfo.free / diskInfo.total) * 100

        if (freeDiskPercent < DISK_WARNING_THRESHOLD_PERCENT) {
            alerts.push(`📀 磁盘告警：根目录 [${diskInfo.path}] 空间不足！仅剩 ${(diskInfo.free / 1024 / 1024 / 1024).toFixed(2)} GB (${freeDiskPercent.toFixed(1)}%)`)
        }

        // 如果存在告警，发送告警邮件
        if (alerts.length > 0) {
            logger.error(`存在系统维度隐患，准备触发告警通知：\n${alerts.join('\n')}`)

            // 发信给系统配置里的全局接收者或管理员
            const mailOptions = {
                from: `"TongHai CRM 监控" <${config.smtp.user}>`,
                to: process.env.ADMIN_EMAIL || config.smtp.user,  // 如果无 admin 配置直接发给发件人自己
                subject: '🚨 [TongHai CRM 警报] 系统服务器资源受限告警',
                html: `
                    <h2>系统服务器资源存在耗尽风险！</h2>
                    <p>监控脚本侦测到以下风险，请立即登入服务器排查 <b>${os.hostname()}</b> 并视情况清理资源：</p>
                    <ul>
                        ${alerts.map(a => `<li style="color:red;"><b>${a}</b></li>`).join('')}
                    </ul>
                    <p><small>本邮件由 TongHai CRM Health Monitor 自动触发。</small></p>
                `
            }

            await transporter.sendMail(mailOptions)
            logger.info('✅ 预警救援邮件已成功发送。')
        } else {
            logger.info('一切运作正常：内存与磁盘十分充裕。')
        }
    } catch (err) {
        logger.error('机器自检巡航出错:', err)
    }
}

// 支持直接运行该脚本进行主动探测
if (import.meta.url === `file://${process.argv[1]}`) {
    runHealthCheck().then(() => process.exit(0))
}

export { runHealthCheck }
