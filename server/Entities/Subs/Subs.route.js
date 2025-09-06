const express = require('express');
const router = express.Router();

const { getAll, getOne, postOne, putOne, deleteOne } = require('./Subs.controller');

// alias כדי לשמור על protect/protectRole
const { requireAuth: protect, requireRole: protectRole } = require('../../middleware/authMiddleware');

router.get('/public', getAll);

// כל הראוטים כאן דורשים התחברות
router.use(protect);

// מחוברים: צפייה
router.get('/', getAll);

// טיפ: עדיף אחיד ':id'. אם ה-Controller שלך מצפה ל'._id',
// תשאיר '/:_id' כאן או תעדכן את ה-Controller לקבל גם וגם (ראה הערה למטה).
router.get('/:id', getOne);

// מכאן—מנהל בלבד
router.use(protectRole('מנהל'));
router.post('/', postOne);
router.put('/:id', putOne);
router.delete('/:id', deleteOne);

module.exports = router;
