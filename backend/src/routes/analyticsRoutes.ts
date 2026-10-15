
import { Router } from 'express';
import { listUsers, getStats, getCharts, getPublicStats } from '../controllers/analyticsController.js';
import { isAdmin } from '../middlewares/authMiddlewares.js';
const router = Router();

router.get('/public-stats', getPublicStats);
router.get('/users', isAdmin, listUsers);
router.get('/stats', isAdmin, getStats);
router.get('/charts', isAdmin, getCharts);
export default router;
