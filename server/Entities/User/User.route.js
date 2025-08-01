const express = require('express');
const router = express.Router();
const {getAllU, getOneU, putU, deleteU, postU, addSubForUser, removeSubForUser, countWithoutSubsForUser,} = require('./User.controller');

const { protect, protectRole } = require('../../middleware/authMiddleware');

// ---------- Protected Routes ----------
router.get('/', protect, protectRole("מנהל"), getAllU);
router.get('/:id', protect, getOneU);
router.post('/', protect, protectRole("מנהל"), postU);
router.post('/addSub/:subId', protect, addSubForUser);
router.post('/removeSub/', protect, removeSubForUser);
router.post('/countWithoutSubsForUser/', protect, countWithoutSubsForUser);
router.put('/:id', protect, putU);
router.delete('/:id', protect, protectRole("מנהל"), deleteU);

module.exports = router;
