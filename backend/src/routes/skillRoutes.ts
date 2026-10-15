import { Router } from 'express';
import * as SkillController from '../controllers/skillController.js';
import { requireAuth } from '../middlewares/authMiddlewares.js';

const router = Router();

router.get('/', SkillController.getAllSkills);

router.get('/user', requireAuth, SkillController.getUserSkills);

router.patch('/user', requireAuth, SkillController.updateUserSkills);

export default router;
