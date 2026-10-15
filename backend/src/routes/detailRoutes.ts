import { Router } from "express";
import { getDetailById, getDetails } from "../controllers/detailController.js";

const router = Router();

router.get("/", getDetails);
router.get("/:id", getDetailById);

export default router;