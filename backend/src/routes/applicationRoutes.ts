import { Router } from "express";
import { createApplication, listApplications } from "../controllers/applicationController.js";
import { requireAuth } from "../middlewares/authMiddlewares.js";

const router = Router();

router.get("/", requireAuth, listApplications);
router.post("/", requireAuth, createApplication);

export default router;
