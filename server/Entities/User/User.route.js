const express = require('express');
const router = express.Router();

const {
  getAllU, getOneU, putU, deleteU, postU,
  addSubForUser, removeSubForUser, countWithoutSubsForUser, CheckPasswordisGood, changeRoom
} = require('./User.controller');

// alias
const { requireAuth: protect, requireRole: protectRole } = require('../../middleware/authMiddleware');
const mongoose = require('mongoose');

// ולידציית ObjectId בסיסית לפרמטרים
const requireObjectId = (param) => (req, res, next) => {
  const v = req.params[param];
  if (v && !mongoose.Types.ObjectId.isValid(v)) {
    return res.status(400).json({ code: 'BAD_ID', message: `${param} is not a valid ObjectId` });
  }
  next();
};

router.get('/public/:tz', getOneU);

// כל הנתיבים כאן מוגנים
router.use(protect);

// ספציפיים – לפני /:id
router.post('/addSub/:userId/:subId', addSubForUser);
router.post('/removeSub/:userId', removeSubForUser);
router.post('/countWithoutSubsForUser', countWithoutSubsForUser);

// אדמין
router.get('/', getAllU);
router.get('/:tz', getOneU);
router.post('/', protectRole('מנהל'), postU);
router.put('/:tz', putU);
router.delete('/:tz/:from', protectRole('מנהל'), deleteU);
router.post("/checkPasswordisGood", CheckPasswordisGood);
router.post("/changeStatus/:tz", protectRole('מנהל'), changeRoom);

module.exports = router;
