import express from 'express';
import { requireAuth } from '../middlewares/authMiddlewares.js';
import { createIaDislike, deleteIaDislike, listIaDislikes } from '../controllers/iaDislikeController.js';

const router = express.Router();

router.get('/', requireAuth, listIaDislikes);
router.post('/', requireAuth, createIaDislike);
router.delete('/:offerId', requireAuth, deleteIaDislike);

export default router;
