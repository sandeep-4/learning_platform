const express = require("express");
const {
  register,
  login,
  logout,
  currentUser,
  forgotPassword,
  resetPassword,
} = require("../controllers/auth");
const { requiireSignIn } = require("../middlewares");
const router = express.Router();

router.post("/register", register);
router.post("/login", login);
router.get("/logout", logout);
router.get("/current-user", requiireSignIn, currentUser);
router.post("/forgot-password", forgotPassword);
router.post("/reset-password", resetPassword);

module.exports = router;
