const express = require("express");
const {authenticate, authorize} = require("../middleware/auth.js");
const ctrl = require("../controllers/reviewController.js");
const router = express.Router();

router.get("/", ctrl.listReviews);
router.get("/:id", ctrl.getReviewById0);
router.post("/", authenticate, ctrl.createReview);
router.put("/:id", authenticate, ctrl.updateReview);
router.delete("/:id", authenticate, ctrl.deleteReview);

module.exports = router;