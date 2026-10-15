import { Router } from "express";
import { listOffers, listCities, deleteOffer, updateOffer } from "../controllers/offerController.js";
import { isAdmin } from "../middlewares/authMiddlewares.js";

const router = Router();

router.get("/cities", listCities);
router.get("/", listOffers);
router.delete("/:id", isAdmin, deleteOffer);
router.patch("/:id", isAdmin, updateOffer);

export default router;