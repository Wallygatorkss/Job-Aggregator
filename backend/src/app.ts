import dotenv from 'dotenv';
import express from 'express';
import authRoutes from './routes/authRoutes.js';
import moderationRoutes from './routes/moderationRoutes.js';
import offerRoutes from './routes/offerRoutes.js';
import detailRoutes from './routes/detailRoutes.js';
import analyticsRoutes from './routes/analyticsRoutes.js';
import applicationRoutes from './routes/applicationRoutes.js';
import savedOfferRoutes from './routes/savedOfferRoutes.js';
import skillRoutes from './routes/skillRoutes.js';
import experienceRoutes from './routes/experienceRoutes.js';
import cvRoutes from './routes/cvRoutes.js';
import iaDislikeRoutes from './routes/iaDislikeRoutes.js';
import { seedSkills } from './services/skillService.js';
import cors from 'cors';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
dotenv.config({ path: path.resolve(__dirname, '../.env') });

const app = express();

const corsOptions = {
  origin: process.env.FRONTEND_URL || 'http://localhost:5173',
  credentials: true,
  methods: ['GET', 'POST', 'PATCH', 'DELETE'],
  allowedHeaders: ['Content-Type', 'Authorization'],
};
app.use(cors(corsOptions));

app.use(express.json({ limit: '5mb' }));

app.use('/api/auth', authRoutes);
app.use('/api/offers', offerRoutes);
app.use('/api/details', detailRoutes);
app.use('/api/moderation', moderationRoutes);
app.use('/api/analytics', analyticsRoutes);
app.use('/api/applications', applicationRoutes);
app.use('/api/saved-offers', savedOfferRoutes);
app.use('/api/skills', skillRoutes);
app.use('/api/experiences', experienceRoutes);
app.use('/api/cv', cvRoutes);
app.use('/api/ia-dislikes', iaDislikeRoutes);

const publicGeneratedDir = path.join(__dirname, '../public/generated_cvs');
app.use('/generated_cvs', express.static(publicGeneratedDir));

const PORT = process.env.PORT || 3000;

app.listen(PORT, async () => {
  console.log(`Server is running on port ${PORT}`);
  
  try {
    await seedSkills();
    console.log('Skills seeded successfully');
  } catch (error) {
    console.error('Error seeding skills:', error);
  }
});

export default app;

