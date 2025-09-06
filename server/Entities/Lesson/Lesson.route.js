// Entities/Lesson/Lesson.route.js
const express = require('express');
const router = express.Router();

const {
  getAll,
  getOne,
  postOne,
  putOne,
  deleteOne,
  addToList,
  removeFromList,
} = require('./Lesson.controller');

// alias כדי לשמור על protect/protectRole
const { requireAuth: protect, requireRole: protectRole } = require('../..//middleware/authMiddleware');

// הגנה בסיסית לכל הראוטים תחת /api/lesson
router.use(protect);

// פתוח לכל משתמש מחובר
router.get('/', getAll);
router.get('/:id', getOne);

// פעולות שקשורות לרשימות/שיבוצים (מחוברים בלבד)
router.post('/addToList/:id', addToList);
router.post('/removeFromList/:id', removeFromList);

// מכאן והלאה — מנהל בלבד
// router.use(protectRole('מנהל'));

router.post('/', postOne);
router.put('/:id', putOne);
router.delete('/:id', deleteOne);

module.exports = router;
