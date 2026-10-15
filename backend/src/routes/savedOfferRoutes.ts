import { Router } from "express";
import { requireAuth } from "../middlewares/authMiddlewares.js";
import { listSavedOffers, createSavedOffer, deleteSavedOffer } from "../controllers/savedOfferController.js";

const router = Router();

router.get("/", requireAuth, listSavedOffers);
router.post("/", requireAuth, createSavedOffer);
router.delete("/:offerId", requireAuth, deleteSavedOffer);

export default router;
