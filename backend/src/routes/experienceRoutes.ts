import { Router } from 'express';
import {
  createMyExperience,
  deleteMyExperience,
  listMyExperiences,
  updateMyExperience,
} from '../controllers/experienceController.js';
import { requireAuth } from '../middlewares/authMiddlewares.js';

const router = Router();

router.get('/me', requireAuth, listMyExperiences);
router.post('/me', requireAuth, createMyExperience);
router.patch('/:id', requireAuth, updateMyExperience);
router.delete('/:id', requireAuth, deleteMyExperience);

export default router;
