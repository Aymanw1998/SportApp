const jwt = require('jsonwebtoken');
const User = require('../Entities/User/User.model');
const { logWithSource } = require('./logger');
// Middleware להגנה על נתיבים עם Access Token
const protect = async (req, res, next) => {
  const authHeader = req.headers.authorization;
  let token;

  if (authHeader && authHeader.startsWith('Bearer')) {
    token = authHeader.split(' ')[1];
  }

  if (!token) {
    return res.status(401).json({ message: 'אין הרשאה Access Token' });
  }

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    req.user = await User.findById(decoded.id).select('-password');

    if (!req.user) {
      return res.status(401).json({ message: 'המשתמש אינו קיים' });
    }

    next();
  } catch (error) {
    logWithSource(`err: ${err}`.red)
    console.log("***** Error in protect *******", error);
    return res.status(401).json({ message: 'הטוקן לא תקף' });
  }
};

// Middleware לבדוק תפקיד
const protectRole = (role) => {
  return (req, res, next) => {
    if (!req.user || req.user.role !== role) {
      return res.status(403).json({ message: 'אין הרשאה' });
    }
    next();
  };
};

module.exports = { protect, protectRole };
