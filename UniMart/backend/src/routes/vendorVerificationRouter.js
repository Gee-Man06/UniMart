const express = require("express");
const ctrl = require("../controllers/vendorVerification.js");
const {authenticate, authorize} = require("../middleware/auth.js");

const router = express.Router();

router.get("/",authenticate, authorize("admin"), ctrl.listVerifications);
router.get("/:id",authenticate, authorize("admin"), ctrl.getVerificationById);
router.post("/",authenticate,authorize("admin"), ctrl.createVerification);
router.put("/:id", authenticate, authorize("admin"), ctrl.updateVerification);
router.delete("/:id", authenticate, authorize("admin"), ctrl.deleteVerification);

module.exports = router;