const router = require("express").Router();
const enrollmentController = require("../controllers/enrollment.controller");
const authMiddleware = require("../middlewares/authMiddleware");

router.get(
  "/my",
  authMiddleware,
  enrollmentController.myEnrollments
);

router.post(
  "/:courseId",
  authMiddleware,
  enrollmentController.enrollCourse
);

router.patch(
  "/:enrollId/complete-lesson",
  authMiddleware,
  enrollmentController.completeLesson
);

module.exports = router;
