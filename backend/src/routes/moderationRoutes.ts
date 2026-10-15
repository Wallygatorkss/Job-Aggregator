
import { Router } from 'express';
import { banUser, deleteJob, patchJob } from '../controllers/moderationController.js';
import { isAdmin } from '../middlewares/authMiddlewares.js';
const router = Router();

router.delete('/jobs/:id', isAdmin, deleteJob);
router.patch('/jobs/:id', isAdmin, patchJob);
router.delete('/users/:id', isAdmin, banUser);

export default router;
