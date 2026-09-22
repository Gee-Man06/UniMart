const express = require("express");
const ctrl = require("../controllers/orderItemController.js");
const {authenticate, authorize} = require("../middleware/auth.js");
const router = express.Router();

router.get("/", ctrl.listOrderItems);
router.get("/:id", ctrl.getOrderItemById);
router.post("/", authenticate, authorize("buyer", "admin"), ctrl.createOrderItem);
router.put("/:id", authenticate, ctrl.updateOrderItem);
router.delete("/:id", authenticate, ctrl.deleteOrderItem);


module.exports = router;