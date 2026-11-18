const mongoose = require("mongoose");
const Enrollment = require("../models/Enrollment");
const Course = require("../models/Course");

const enrollCourse = async (studentId, courseId, batchId = null) => {
  const course = await Course.findById(courseId);
  if (!course) throw new Error("Course not found");

  let resolvedBatchId = null;
  if (batchId !== null && batchId !== undefined && batchId !== "") {
    if (!mongoose.Types.ObjectId.isValid(batchId)) {
      throw new Error("Invalid batch selected");
    }
    const batch = course.batches?.id(batchId);
    if (!batch) {
      throw new Error("Batch not found in this course");
    }
    resolvedBatchId = batch._id;
  }

  let enrollment = await Enrollment.findOne({
    student: studentId,
    course: courseId,
  });

  if (enrollment) {
    throw new Error("Already enrolled in this course");
  }

  enrollment = await Enrollment.create({
    student: studentId,
    course: courseId,
    batchId: resolvedBatchId,
    progress: { completedLessons: [], percent: 0 },
  });

  return enrollment;
};

const getMyEnrollments = async (studentId) => {
  return Enrollment.find({ student: studentId })
    .populate("course", "title instructorName price category tags")
    .sort({ createdAt: -1 });
};

const lessonBelongsToCourse = (course, lessonId) => {
  if (!course?.syllabus) return false;
  for (const mod of course.syllabus) {
    for (const lesson of mod.lessons || []) {
      if (String(lesson._id) === String(lessonId)) return true;
    }
  }
  return false;
};

const completeLesson = async (enrollId, lessonId, studentId = null) => {
  const enrollment = await Enrollment.findById(enrollId);
  if (!enrollment) throw new Error("Enrollment not found");

  if (studentId && String(enrollment.student) !== String(studentId)) {
    throw new Error("Not authorized to update this enrollment");
  }

  if (!lessonId || !mongoose.Types.ObjectId.isValid(lessonId)) {
    throw new Error("Valid lessonId is required");
  }

  const course = await Course.findById(enrollment.course);
  if (!course) {
    throw new Error("Course no longer exists for this enrollment");
  }

  if (!lessonBelongsToCourse(course, lessonId)) {
    throw new Error("Lesson does not belong to this course");
  }

  const alreadyDone = enrollment.progress.completedLessons
    .map(String)
    .includes(String(lessonId));

  if (!alreadyDone) {
    enrollment.progress.completedLessons.push(lessonId);
  }

  const totalLessons = course.syllabus.reduce(
    (sum, mod) => sum + (mod.lessons?.length || 0),
    0
  );

  const completed = enrollment.progress.completedLessons.length;
  const rawPercent =
    totalLessons === 0 ? 0 : Math.round((completed / totalLessons) * 100);
  enrollment.progress.percent = Math.min(100, Math.max(0, rawPercent));

  await enrollment.save();
  return enrollment;
};

module.exports = { enrollCourse, getMyEnrollments, completeLesson };
