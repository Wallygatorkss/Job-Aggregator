import { Router } from 'express';
import { login, register, me, updateProfileMedia, updateProfile, changePassword } from '../controllers/authController.js';
import { requireAuth, loginLimiter, registerLimiter, mediaUploadLimiter } from '../middlewares/authMiddlewares.js';


const router = Router();

router.post('/login', loginLimiter, login);
router.post('/register', registerLimiter, register);
router.get('/me', requireAuth, me);
router.patch('/me', requireAuth, updateProfile);
router.patch('/me/password', requireAuth, changePassword);
router.patch('/me/media', requireAuth, mediaUploadLimiter, updateProfileMedia);

export default router;
