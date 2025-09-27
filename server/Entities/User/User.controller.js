// Entities/User/user.controller.js
const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const  { User, UserWaitingRoom, UserNoActive } = require('./User.model');
const Subs = require('../Subs/Subs.model'); // אם צריך לאמת קיום מנוי
                                     // מודל משתמש (mongoose)
const {
  signAccessToken,
  signRefreshToken,
  setRefreshCookie,
  clearRefreshCookie,
  sha256,
  computeAccessExpMsFromNow,
} = require('../../utils/jwt');

const { logWithSource } = require('../../middleware/logger');

// מסיר שדות רגישים
function sanitize(u) {
  if (!u) return u;
  const o = u.toObject ? u.toObject() : u;
  delete o.password;
  delete o.refreshHash;
  return o;
}

function toDate(value) {
  if (!value) return null;
  if (value instanceof Date) return value;
  if (typeof value === 'number') return new Date(value);

  if (typeof value === 'string') {
    const s = value.trim();

    // dd-mm-yyyy או dd/mm/yyyy
    let m = s.match(/^(\d{2})[\/\-](\d{2})[\/\-](\d{4})$/);
    if (m) {
      const [, dd, mm, yyyy] = m.map(Number);
      return new Date(Date.UTC(yyyy, mm - 1, dd)); // UTC כדי להימנע מהפתעות שעון קיץ
    }

    // yyyy-mm-dd (ISO קצר)
    m = s.match(/^(\d{4})-(\d{2})-(\d{2})$/);
    if (m) {
      const [, yyyy, mm, dd] = m.map(Number);
      return new Date(Date.UTC(yyyy, mm - 1, dd));
    }

    const ts = Date.parse(s);
    if (!Number.isNaN(ts)) return new Date(ts);
  }
  return null; // לא תקין
}

const buildData = (body) => ({
  tz: body.tz?.trim(),
  password: body.password || null, // יגובה ב-pre('save') במודל
  firstname: body.firstname,
  lastname: body.lastname,
  birth_date: toDate(body.birth_date || null),
  gender: body.gender,
  phone: body.phone,
  email: body.email?.toLowerCase().trim(),
  city: body.city,
  street: body.street,
  role: body.role,
  // list_class: body.list_class || [],
  // max_class: body.max_class ?? 1,
  wallet: body.wallet ?? 0,
});

/**
 * 
 * @param {*} req:
 *    req.params: {tz} - תעודת זהות של המשתמש
 *    req.body: {from, to} - מחדר לחדר
 *      rooms: ['waiting', 'active', 'noActive']
 *      'waiting' - חדר המתנה
 *      'active' - משתמש פעיל
 *      'noActive' - משתמש לא פעיל (נגמר לו המנוי ולא חידש) 
 * @param {*} res 
 */
const changeRoom = async (req, res) => {
  try {
    const { tz: param } = req.params;
    const { from, to } = req.body || {};
    const ObjectFrom = from === 'waiting' ? UserWaitingRoom : from === 'active' ? User : from === 'noActive' ? UserNoActive : null;
    const ObjectTo = to === 'waiting' ? UserWaitingRoom : to === 'active' ? User : to === 'noActive' ? UserNoActive : null;
    if (!param) return res.status(400).json({ ok: false, message: 'תעודת זיהות חובה' });
    if (!from || !to) return res.status(400).json({ ok: false, message: 'חדר מקור וחדר יעד חובה' });
    if (from === to) return res.status(400).json({ ok: false, message: 'נשלח חדר מקור וחדר יעד אותו חדר' });
    if (!['waiting', 'active', 'noActive'].includes(from) || !['waiting', 'active', 'noActive'].includes(to)) {
      return res.status(400).json({ ok: false, message: 'from and to must be one of waiting, active, noActive' });
    }

    let user = null;
    if (mongoose.Types.ObjectId.isValid(param)) user = await ObjectFrom.findById(param);
    else user = await ObjectFrom.findOne({tz: param});
    if (!user) return res.status(404).json({ ok: false, message: `User not found in ${from} room` });
    const model = buildData(user);
    await ObjectFrom.deleteOne({ _id: user._id });
    const created = await ObjectTo.create({ ...model, createdAt: new Date() });
    return res.status(200).json({ ok: true, user: sanitize(created) });
  }
  catch (error) {
    logWithSource(`err ${error}`.red);
    return res.status(500).json({ ok: false, message: error.message });
  }
}
const register = async (req, res) => {
  try {
    const model = buildData(req.body);
    const exists = await User.findOne({ tz: model.tz });
    if (exists) return res.status(400).json({ message: 'המשתמש קיים' });
    const existsWaitingRoom = await UserWaitingRoom.findOne({ tz: model.tz });
    if (existsWaitingRoom) return res.status(400).json({ message: 'המשתמש מחכה בחדר המתנה' });

    const created = await UserWaitingRoom.create({ ...model, createdAt: new Date() });

  return res.status(200).json({ message: 'המשתמש נרשם לחדר המתנה' });
  } catch (error) {
    logWithSource(`err ${error}`.red);
    return res.status(400).json({ message: error.message });
  }
};

const login = async (req, res) => {
  logWithSource("login")
  const { tz, password } = req.body || {};
  try {
    if (!tz || !password) return res.status(400).json({ code: 'BAD_INPUT', message: 'ת.ז. וסיסמה חובה' });

    // מאתר את המשתמש לפי שם משתמש בנורמליזציה (lowercase/trim)
    const normTz = String(tz).trim();         // נרמול בסיסי    
    const user = await User.findOne({ tz: normTz });
    const userWaiting = await UserWaitingRoom.findOne({ tz: normTz });
    const userNoActive = await UserNoActive.findOne({ tz: normTz });
    console.log("normTz", normTz);
    console.log("user", user);
    if (!user && !userWaiting && !userNoActive) return res.status(401).json({ code: 'INVALID_CREDENTIALS', message: 'ת.ז. או סיסמה שגויה' });
    if(!user && userWaiting) return res.status(403).json({ code: 'IN_WAITING_ROOM', message: 'המשתמש מחכה לאישור מנהל במערכת' });
    if(!user && userNoActive) return res.status(403).json({ code: 'NO_ACTIVE', message: 'אין לך משתמש פעיל, נא ליצור קשר עם המנהל' });
    
    console.log("login user", user);
    // משווה סיסמה (השוואה לסיסמה המוצפנת במאגר)
    const ok = await bcrypt.compare(password, user.password);
    console.log("login password ok", ok);
    if (!ok) return res.status(401).json({ code: 'INVALID_CREDENTIALS', message: 'ת.ז. או סיסמה שגויה' });

    // יוצר access token קצר-תוקף
    const accessToken = signAccessToken({ id: user._id.toString(), tz: user.tz, role: user.role });

    // יוצר refresh token ארוך-תוקף
    const refreshToken = signRefreshToken({ id: user._id.toString(), tz: user.tz, role: user.role });

        // שומר במסד רק hash של ה-refresh (לא את הטוקן עצמו)
    user.refreshHash = sha256(refreshToken);
    await user.save();

    // מציב את ה-refresh בקוקי HttpOnly (לא נגיש ל-JS בדפדפן)
    setRefreshCookie(res, refreshToken);

    // מחשב זמן תפוגת access כדי להחזיר ללקוח (אופציונלי)
    const expirationTime = computeAccessExpMsFromNow();
    // מחזיר ללקוח: access token + פרטי משתמש ללא שדות רגישים
    const safeUser = user.toObject();
    delete safeUser.password;
    delete safeUser.refreshHash;

    return res.status(200).json({
      ok: true,
      accessToken,
      expirationTime,   // epoch ms – יעזור לקליינט לתזמן רענון
      user: safeUser,
    });
  } catch (error) {
    // שגיאה כללית
    logWithSource({ code: 'SERVER_ERROR', message: error.message })
    return res.status(500).json({ code: 'SERVER_ERROR', message: error.message });
  }
};

const refreshAccessToken = async (req, res) => {
    try {
    // קורא את ה-refresh מתוך cookie HttpOnly
    const token = req.cookies?.refresh;
    if (!token) return res.status(401).json({ code: 'NO_REFRESH', message: 'Missing refresh cookie' });

    // מאמת את ה-refresh token עם הסוד המתאים
    const payload = jwt.verify(token, process.env.JWT_REFRESH_SECRET, {
      algorithms: ['HS256'],
      clockTolerance: 5,
    });

    // מאתר את המשתמש לפי מזהה מתוך ה-refresh
    const user = await User.findById(payload.id);
    if (!user) return res.status(401).json({ code: 'USER_NOT_FOUND', message: 'משתמש לא קיים' });

    // בודק שה-hash של ה-refresh שנשמר במסד תואם לטוקן שב-cookie
    const matches = user.refreshHash && user.refreshHash === sha256(token);
    if (!matches) return res.status(401).json({ code: 'REFRESH_MISMATCH', message: 'Refresh not valid' });

    // *** רוטציה בטוחה (מומלץ): מנפק refresh חדש ***
    const newRefresh = signRefreshToken({ id: user._id.toString(), tz: user.tz, role: user.role });
    user.refreshHash = sha256(newRefresh);
    await user.save();
    setRefreshCookie(res, newRefresh);

    // מנפק access חדש קצר-תוקף
    const accessToken = signAccessToken({ id: user._id.toString(), tz: user.tz, role: user.role });
    const expirationTime = computeAccessExpMsFromNow();

    return res.status(200).json({ ok: true, accessToken, expirationTime });
  } catch (err) {
    logWithSource(`err ${error}`.red);
    // אם התוקף פג/חתימה לא נכונה – החזר שגיאה מתאימה
    if (err.name === 'TokenExpiredError') {
      return res.status(401).json({ code: 'REFRESH_EXPIRED', message: 'Refresh expired' });
    }
    return res.status(401).json({ code: 'REFRESH_FAILED', message: 'Refresh failed' });
  }
};

const logout = async (req, res) => {
try {
    // אם המשתמש מחובר – אפשר לאפס את ה-refreshHash שלו
    const token = req.cookies?.refresh;
    if (token) {
      try {
        const payload = jwt.verify(token, process.env.JWT_REFRESH_SECRET);
        await User.findByIdAndUpdate(payload.id, { $unset: { refreshHash: 1 } });
      } catch { /* מתעלמים – גם אם לא הצליח */ }
    }

    // מנקה את ה-cookie בדפדפן
    clearRefreshCookie(res);

    return res.status(200).json({ ok: true });
  } catch (err) {
    logWithSource(`err ${error}`.red);
    return res.status(500).json({ code: 'SERVER_ERROR', message: err.message });
  }
};

// --- CRUD (כפי שיש לך) ---
const getAllU = async (req, res) => {
  try {
    
    let users = [];
    for(const room of req.body.rooms || ['waiting', 'active', 'noActive']) {
      const Object = room === 'waiting' ? UserWaitingRoom : room === 'active' ? User : room === 'noActive' ? UserNoActive : null;
      const roomUsers = await Object.find().lean();
      users = users.concat(roomUsers.map(u => ({...u, room})));
    }
    
    return res.status(200).json({ ok: true, users: users.map(sanitize) });
  } catch (err) {
    logWithSource(`err ${err}`.red);
    return res.status(500).json({ ok: false, users: [] });
  }
};

const getOneU = async (req, res) => {
  try {
    logWithSource("getOneU", req.params);
    const { tz: param } = req.params;
    let user = null;
    
    if (mongoose.Types.ObjectId.isValid(param)) user = await User.findById(param);
    else user = await User.findOne({tz: param});

    logWithSource("user", user);
    if (!user) user = await User.findOne({ tz: String(param).trim() });
    if (!user) return res.status(404).json({ ok: false, message: 'לא נמצא' });
    return res.status(200).json({ ok: true, user: sanitize(user) });
  } catch (err) {
    logWithSource(`err ${error}`.red);
    return res.status(500).json({ ok: false, message: err.message });
  }
};

const postU = async (req, res) => {
    try {
    const model = buildData(req.body);
    if (!model.tz || !model.password) {
      return res.status(400).json({ ok: false, message: 'tz and password are required' });
    }
    const exists = await User.findOne({ tz: model.tz });
    if (exists) return res.status(409).json({ ok: false, message: 'המשתמש קיים' });

    const created = await User.create({ ...model, createdAt: new Date() });
    return res.status(201).json({ ok: true, user: sanitize(created) });
  } catch (err) {
    logWithSource(`err ${err}`.red);
    return res.status(500).json({ ok: false, message: err.message });
  }
};

//USER{} => {..}
const putU = async (req, res) => {
  try {
    const tz = String(req.params.tz).trim();
    const user = await User.findOne({ tz });
    if (!user) return res.status(404).json({ ok: false, message: 'User not found' });

    const allowed = new Set([
      'password','firstname','lastname','birth_date','gender',
      'phone','email','city','street','role','wallet','list_class','max_class','subs'
    ]);

    const body = req.body ?? {};

    for (const [k, v] of Object.entries(body)) {
      // עדכן רק מפתחות מותרים
      if (!allowed.has(k)) continue;

      // אל תיגע בסיסמה אלא אם נשלח מחרוזת לא ריקה
      if (k === 'password') {
        if (typeof v !== 'string' || v.trim() === '') continue; // דלג אם לא שינו סיסמה
        user.password = v; // ה-pre('save') יעשה hash
        // אופציונלי: user.mustChangePassword = false; // או true לפי הלוגיקה שלך
        continue;
      }

      // מיזוג חלקי למנוי (במקום לדרוס את כל האובייקט)
      if (k === 'subs' && v && typeof v === 'object') {
        user.subs = { ...(user.subs?.toObject?.() ?? user.subs ?? {}), ...v };
        continue;
      }

      // אל תדרוס ערכים קיימים עם undefined
      if (typeof v === 'undefined') continue;

      // הרשה null/"" אם זה רצונך לאפס שדות (מלבד password)
      user.set(k, v);
    }

    await user.save();
    return res.status(200).json({ ok: true, user: sanitize(user) });
  } catch (err) {
    logWithSource(`err ${err}`.red);
    return res.status(500).json({ ok: false, message: err.message });
  }
};


const deleteU = async (req, res) => {
  try {
    if (!req.params.tz) return res.status(400).json({ ok: false, message: 'tz is required' });
    console.log("delete user", req);
    const Object = req.params.from === 'waiting' ? UserWaitingRoom : req.body.from === 'noActive' ? UserNoActive : User

    const deleted = await Object.findOneAndDelete({ tz: String(req.params.tz).trim() });
    if (!deleted) return res.status(404).json({ ok: false, message: 'User not found' });
        return res.status(200).json({ ok: true, removed: true });
  } catch (err) {
    logWithSource(`err ${error}`.red);
    return res.status(500).json({ ok: false, message: err.message });
  }
};

const getme = async (req, res) => {
  try {
    // req.user מולא במידלוור authRequired
    const user = await User.findById(req.user.id).lean();
    if (!user) return res.status(401).json({ code: 'USER_NOT_FOUND' });

    return res.status(200).json({ ok: true, user: sanitize(user) });
  } catch (err) {
    logWithSource({ code: 'SERVER_ERROR', message: err.message })
    return res.status(500).json({ code: 'SERVER_ERROR', message: err.message });
  }
};

const addSubForUser = async (req, res) => {
  try {
    const {userId, subId} = req.params;
    const {start, end} = req.body;
    //Sub exist
    const sub = await Subs.findById(subId);
    if(!sub) return res.status(404).json({ok: false, message: 'Subscription not found'});

    //user exist

    let user = await User.findById(userId);
    if(!user) user = await User.findOne({tz: userId});
    if(!user) return res.status(404).json({ok: false, message: 'User not found'})
    
    const now = new Date();
    user.subs = {
      id: sub._id,
      start: new Date(start),
      end: new Date(end),
    }
    user.active = 0;
    user.updatedAt = now;
    await user.save();
    
    return res.status(200).json({ok: true, user: sanitize(user)});
  } catch (err) { logWithSource(`err ${err}`.red); return res.status(500).json({ok: false, message: err.message}); }
};

const removeSubForUser = async (req, res) => {
  try {
    const {userId} = req.params;
    let user = await User.findById(userId);
    if(!user) user = await User.findOne({tz: userId});
    if(!user) return res.status(404).json({ok: false, message: 'User not found'})
    
    console.log(user);
    user.subs.id = null;
    user.subs.start = null;
    user.subs.end= null;
    user.active = 0;
    user.updatedAt = new Date();
    console.log(user);
    await user.save();

    return res.status(200).json({ ok: true, user: sanitize(user) });
  } catch (err) { logWithSource(`err ${err}`.red); return res.status(500).json({ok: false, message: err.message}); }
};

const countWithoutSubsForUser = async (req, res) => {
  try {
    const current = await User.findOne({ tz: req.user.tz }).select('active');
    const nextActive = (current?.active || 0) + 1;
    const updated = await User.findOneAndUpdate(
      { tz: req.user.tz },
      { active: nextActive, updatedAt: new Date() },
      { new: true }
    );
    return res.status(200).json({ ok: true, user: sanitize(updated) });
  } catch (err) { logWithSource(`err ${err}`.red); return res.status(500).json({ok: false, message: err.message}); }
};


const CheckPasswordisGood = async (req, res) => {
    const { tz, password } = req.body || {};
    console.log("CheckPasswordisGood", req.body);
  try {
    if (!tz || !password) return res.status(400).json({ code: 'BAD_INPUT', message: 'Tz and password are required' });

    // מאתר את המשתמש לפי שם משתמש בנורמליזציה (lowercase/trim)
    const normTz = String(tz).trim();         // נרמול בסיסי    
    const user = await User.findOne({ tz: normTz });
    console.log("normTz", normTz);
    console.log("user", user);
    if (!user) return res.status(401).json({ code: 'INVALID_CREDENTIALS', message: 'Invalid tz or password' });
    console.log("login user", user);
    // משווה סיסמה (השוואה לסיסמה המוצפנת במאגר)
    const ok = await bcrypt.compare(password, user.password);
    console.log("login password ok", ok);
    if (!ok) return res.status(300).json({ok: false, PasswordCorrect: false });

    return res.status(200).json({ ok: true,  PasswordCorrect: true});
  } catch (error) {
    // שגיאה כללית
    logWithSource({ code: 'SERVER_ERROR', message: error.message })
    return res.status(500).json({ ok: false, code: 'SERVER_ERROR', message: error.message });
  }

}
module.exports = {
  CheckPasswordisGood,
  register,
  login,
  refreshAccessToken,
  logout,
  getme,
  getAllU,
  getOneU,
  postU,
  putU,
  deleteU,
  addSubForUser,
  removeSubForUser,
  countWithoutSubsForUser,
  changeRoom
};
