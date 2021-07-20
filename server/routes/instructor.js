const express = require("express");
const {
  makeInstructor,
  getAccountStatus,
  currentInstructor,
  instructorCourses,
  studentCount,
  instructorBalance,
  instructorPayoutSettings,
} = require("../controllers/instructor");
const { requiireSignIn } = require("../middlewares");
const router = express.Router();

router.post("/make-instructor", requiireSignIn, makeInstructor);
router.post("/get-account-status", requiireSignIn, getAccountStatus);
router.get("/current-instructor", requiireSignIn, currentInstructor);

router.get("/instructor-courses", requiireSignIn, instructorCourses);
router.post("/instructor/student-count", requiireSignIn, studentCount);
router.get("/instructor/balance", requiireSignIn, instructorBalance);
router.get(
  "/instructor/payout-settings",
  requiireSignIn,
  instructorPayoutSettings
);

module.exports = router;
