const express = require('express');
const router = express.Router();

const { getAll, getOne, postOne, putOne, deleteOne } = require('./Training.controller');

// alias כדי לשמור על protect/protectRole
const { requireAuth: protect, requireRole: protectRole } = require('../../middleware/authMiddleware');

// כל הנתיבים כאן מוגנים (מחייבים התחברות)
router.use(protect);

// קריאה/צפייה לכל משתמש מחובר
router.get('/', getAll);
router.get('/:id', getOne);

// מכאן והלאה – למנהלים בלבד
router.use(protectRole('מנהל'));
router.post('/', postOne);
router.put('/:id', putOne);
router.delete('/:id', deleteOne);

module.exports = router;
