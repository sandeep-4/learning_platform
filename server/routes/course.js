const express = require("express");
const router = express.Router();
const formidable = require("express-formidable");

const {
  courses,
  uploadImage,
  removeImage,
  create,
  update,
  read,
  uploadVideo,
  removeVideo,
  publishCourse,
  unpublishCourse,
  addLesson,
  updateLesson,
  removeLesson,
  checkEnrollment,
  paidEnrollment,
  stripeSuccess,
  freeEnrollment,
  userCourses,
  markCompleted,
  listCompleted,
  markInComplete,
} = require("../controllers/course");
const { requiireSignIn, IsInstructor, isEnrolled } = require("../middlewares");

router.get("/courses", courses);

router.post("/course/upload-image", uploadImage);
router.post("/course/remove-image", removeImage);

router.post("/course", requiireSignIn, IsInstructor, create);
router.put("/course/:slug", requiireSignIn, update);
router.get("/course/:slug", read);
router.post(
  "/course/video-upload/:instructorId",
  requiireSignIn,
  formidable(),
  uploadVideo
);
router.post("/course/video-remove.:instructorId", requiireSignIn, removeVideo);

//publish
router.put("/course/publish/:courseId", requiireSignIn, publishCourse);
router.put("/course/unpublish/:courseId", requiireSignIn, unpublishCourse);

router.post("/course/lesson/:slug/:instructorId", requiireSignIn, addLesson);
router.put("/course/lesson/:slug/:instructorId", requiireSignIn, updateLesson);
router.put("/course/:slug/:lessonId", requiireSignIn, removeLesson);

router.get("/check-enrollment/:courseId", requiireSignIn, checkEnrollment);

// enrollment
router.post("/free-enrollment/:courseId", requiireSignIn, freeEnrollment);
router.post("/paid-enrollment/:courseId", requiireSignIn, paidEnrollment);
router.get("/stripe-success/:courseId", requiireSignIn, stripeSuccess);

router.get("/user-courses", requiireSignIn, userCourses);
router.get("/user/course/:slug", requiireSignIn, isEnrolled, read);

// markcompleted
router.post("/mark-completed", requiireSignIn, markCompleted);
router.post("/list-completed", requiireSignIn, listCompleted);
router.post("/mark-incomplete", requiireSignIn, markInComplete);

module.exports = router;
