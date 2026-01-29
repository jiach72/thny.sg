import { Router } from 'express'
import { authMiddleware } from '../middlewares/index.js'
import { customerService } from '../services/customerService.js'

const router = Router()

router.use(authMiddleware)

// 获取客户选项列表
router.get('/options', async (req, res, next) => {
    try {
        const { search } = req.query as { search?: string }
        const customers = await customerService.getConnectList(search)
        res.json(customers)
    } catch (error) {
        next(error)
    }
})

export default router
