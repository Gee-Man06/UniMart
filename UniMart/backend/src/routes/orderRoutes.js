const express = require("express");
const ctrl = require("../controllers/orderController.js");
const {authenticate, authorize} = require("../middleware/auth.js");
const router = express.Router();

router.get("/", ctrl.listOrders);
router.get("/:id", ctrl.getOrderById);
router.post("/", authenticate, authorize("buyer", "admin"), ctrl.createOrder);
router.put("/:id/status",authenticate, authorize("seller", "admin"), ctrl.updateOrderStatus );
router.delete("/:id", authorize("admin"), ctrl.deleteOrder);

module.exports = router;

