const express = require('express');
const ctrl = require('../controllers/userController');
const { authenticate, authorize} = require('../middleware/auth.js');

const router = express.Router();

router.post("/signup", ctrl.register);
router.post("/signin", ctrl.login);
router.get("/me",authenticate, ctrl.getMe);
router.get("/", authenticate, authorize("admin"), ctrl.listUsers);
router.get("/:id", authenticate, ctrl.getUserById);
router.put("/:id", authenticate, ctrl.updateUser);
router.delete("/:id", authenticate, ctrl.deleteUser);

module.exports = router;