const express = require("express");
const ctrl = require("../controllers/notificationController.js");
const { authenticate, authorize } = require("../middleware/auth");

const router = express.Router();

router.get("/", authenticate, ctrl.listNotifications);
router.get("/:id", authenticate, ctrl.getNotificationById);
router.post("/", authenticate, authorize("admin"), ctrl.createNotification);
router.put("/:id", authenticate, ctrl.updateNotification);
router.delete("/:id", authenticate, ctrl.deleteNotification);

module.exports = router;