// Entities/User/user.route.js
const express = require('express');
const router = express.Router();
const cookieParser = require("cookie-parser")
const {
  register,
  login,
  refreshAccessToken,
  logout,
  getme,
} = require('./User.controller'); // שים לב לאותיות קטנות/גדולות במערכת קבצים לינוקס

const { requireAuth, requireRole } = require('../../middleware/authMiddleware'); // לא authMiddleware

// ---------- Public ----------
router.post('/register', register);

// התחברות – מחזיר access + מציב refresh בקוקי
router.post('/login', login);

// יציאה – מנקה הקוקי ומבטל refresh במסד
router.post('/logout', requireAuth, logout);

// ---------- Protected ----------
// יציאה – מנקה הקוקי ומבטל refresh במסד
router.get('/me', requireAuth, getme);

// דוגמה להגנת תפקיד
router.get('/admin/ping', requireAuth, requireRole('מנהל'), (req, res) => res.json({ ok: true }));


router.use(cookieParser());
// רענון – קורא מה-cookie, מנפיק access חדש, מסובב refresh
router.post('/refresh', refreshAccessToken);

module.exports = router;
