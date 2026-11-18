// service to handle course-related operations

const Course = require("../models/Course");
const Enrollment = require("../models/Enrollment");

/** Public view: hide videos, prompts, and quiz answers */
const sanitizeCourse = (course) => {
  const obj = course.toObject ? course.toObject() : { ...course };

  if (Array.isArray(obj.syllabus)) {
    obj.syllabus = obj.syllabus.map((mod) => ({
      _id: mod._id,
      title: mod.title,
      lessons: (mod.lessons || []).map((lesson) => ({
        _id: lesson._id,
        title: lesson.title,
        hasQuiz: Array.isArray(lesson.quiz) && lesson.quiz.length > 0,
        hasAssignment: Boolean(lesson.assignmentPrompt),
        quizCount: Array.isArray(lesson.quiz) ? lesson.quiz.length : 0,
      })),
    }));
  }

  return obj;
};

const getCourses = async (query) => {
  const {
    page = 1,
    limit = 8,
    search = "",
    sort = "",
    category,
    tags,
  } = query;

  const pageNum = Math.max(1, parseInt(page, 10) || 1);
  const limitNum = Math.min(100, Math.max(1, parseInt(limit, 10) || 8));

  const filter = {};

  if (search && typeof search === "string") {
    const escaped = search.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
    filter.$or = [
      { title: { $regex: escaped, $options: "i" } },
      { instructorName: { $regex: escaped, $options: "i" } },
    ];
  }

  if (category && typeof category === "string") {
    filter.category = category;
  }

  if (tags && typeof tags === "string") {
    const tagArray = tags.split(",").map((t) => t.trim()).filter(Boolean);
    if (tagArray.length > 0) {
      filter.tags = { $in: tagArray };
    }
  }

  let sortObj = {};
  if (sort === "price_asc") sortObj.price = 1;
  if (sort === "price_desc") sortObj.price = -1;

  const skip = (pageNum - 1) * limitNum;

  const [courses, total] = await Promise.all([
    Course.find(filter).sort(sortObj).skip(skip).limit(limitNum),
    Course.countDocuments(filter),
  ]);

  return {
    courses: courses.map(sanitizeCourse),
    total,
    page: pageNum,
    totalPages: Math.ceil(total / limitNum),
  };
};

const getCourseById = async (id, user = null) => {
  const course = await Course.findById(id);
  if (!course) throw new Error("Course not found");

  if (user?.role === "admin") {
    return course;
  }

  if (user?.id) {
    const enrollment = await Enrollment.findOne({
      student: user.id,
      course: id,
    }).select("_id");
    if (enrollment) {
      return course;
    }
  }

  return sanitizeCourse(course);
};

module.exports = { getCourses, getCourseById, sanitizeCourse };
