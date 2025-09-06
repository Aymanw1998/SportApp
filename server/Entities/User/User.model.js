const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');

const UserSchema = new mongoose.Schema(
  {
    tz: { type: String, required: true, trim: true, unique: true, index: true},
    password: { type: String, required: ()=>{return this.isNew}}, // שמור hashed
    mustChangePassword: { type: Boolean, default: false },
    role: { type: String, enum: ['מנהל', 'מאמן', 'מתאמן'], default: 'מתאמן' },

    firstname: { type: String, trim: true },
    lastname: { type: String, trim: true },
    birth_date: { type: Date, trim: true }, // אם תרצה תאריך אמיתי: Date
    gender: { type: String, enum: ['זכר', 'נקבה'], default: undefined },
    phone: { type: String, trim: true },
    email: { type: String, trim: true, lowercase: true, match: [/^\S+@\S+\.\S+$/, 'Invalid email'], },
    city: { type: String, trim: true },
    street: { type: String, trim: true },

    wallet: { type: Number, default: 0 },

    subs: {
      id: {type: mongoose.Schema.Types.ObjectId, ref: 'Subs', default: null,},
      start: {
        day: { type: Number, default: 0 },
        month: { type: Number, default: 0 },
        year: { type: Number, default: 0 },
      },
    },

    active: { type: Boolean, default: true },
    refreshHash: {
      type: String,
      default: null,
      select: false, // אל תוציא החוצה
    },
  },
  {
    timestamps: true, // מוסיף createdAt, updatedAt אוטומטית
  } 
);

// השוואת סיסמה
UserSchema.methods.comparePassword = function (plain) {
  return bcrypt.compare(plain, this.password);
};


// האשים סיסמה לפני שמירה (אם שונתה)
UserSchema.pre('save', async function (next) {
  if (!this.isModified('password')) return next();
  const salt = await bcrypt.genSalt(10);
  this.password = await bcrypt.hash(this.password, salt);
  next();
})

// hashing גם בעדכונים (findOneAndUpdate / updateOne)
UserSchema.pre(['findOneAndUpdate', 'updateOne'], async function (next) {
  const update = this.getUpdate() || {};
  console.log("update", update);
  // תמיכה בשני פורמטים של עדכון
  const pwd = update.password || (update.$set && update.$set.password);
  console.log("pwd", pwd);
  // אם לא שולחים סיסמה – לא נוגעים
  if (pwd == null || pwd === '') {
    if (update.password) delete update.password;
    if (update.$set) delete update.$set.password;
    return next();
  }

  const salt = await bcrypt.genSalt(10);
  const hash = await bcrypt.hash(pwd, salt);
  if (update.password) update.password = hash;
  if (update.$set)     update.$set.password = hash;

  next();
});


const User = mongoose.model('Users', UserSchema);
module.exports = User;
