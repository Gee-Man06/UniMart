const express = require('express');
const ctrl = require("../controllers/productController.js");
const {authenticate, authorize} = require("../middleware/auth.js");

const router = express.Router();

router.get("/", ctrl.listProducts);
router.get("/:id", authenticate, ctrl.getProductById);
router.post("/", authenticate, authorize("seller", "admin"), ctrl.createProduct);
router.put("/:id", authenticate, ctrl.updateProduct );
router.delete("/:id", authenticate, ctrl.deleteProduct);

module.exports = router;