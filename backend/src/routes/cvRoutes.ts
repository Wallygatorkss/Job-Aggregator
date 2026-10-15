import { Router } from 'express';
import { requireAuth } from '../middlewares/authMiddlewares.js';
import { generateMyCv, getCvTemplate, getSampleCv } from '../controllers/cvController.js';

const router = Router();

router.post('/generate', requireAuth, generateMyCv);
router.get('/template', getCvTemplate);
router.get('/sample', getSampleCv);

export default router;
