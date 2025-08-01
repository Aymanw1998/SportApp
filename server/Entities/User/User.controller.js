const Schema = require("./User.model");
const jwt = require("jsonwebtoken");

const buildData = (body) => ({
    tz: body.tz,
    username:body.username,
    password: body.password,
    firstname: body.firstname,
    lastname: body.lastname,
    birth_date: body.birth_date,
    gender: body.gender, //{ type: String, enum: ['זכר', "נקיבה"]},
    phone: body.phone,
    email: body.email,
    city: body.city,
    street: body.street,
    role: body.role, //{ type: String, enum: ['מנהל', 'מאמן', 'מתאמן'], required: true },
    list_class: body.list_class || [],
    max_class: body.max_class || 1,
    wallet: body.wallet || 0,
});

// פונקציות יצירת טוקנים
const generateAccessToken = (id) => {
    console.log(process.env.JWT_SECRET.green);
    return jwt.sign({ id }, process.env.JWT_SECRET, { expiresIn: '1d' });
};

const generateRefreshToken = (id) => {
    return jwt.sign({ id }, process.env.JWT_REFRESH_SECRET, { expiresIn: '7d' });
};

// רישום משתמש חדש
const register = async (req, res) => {
    console.log("*********Start Register*************");
    try {
        const model = buildData(req.body);
        const schemaExists = await Schema.findOne({ username: model.username });
        if (schemaExists) return res.status(400).json({ message: 'המשתמש קיים' });

        const schema = await Schema.create({model, created: new Date()});
        const user = await Schema.findOne({ username: model.username });

        const accessToken = generateAccessToken(user._id);
        const refreshToken = generateRefreshToken(user._id);
        user.refreshToken = refreshToken;
        await user.save();

        res
          .cookie('refreshToken', refreshToken, {
              httpOnly: true,
              secure: process.env.NODE_ENV === 'production',
              sameSite: 'Strict',
              maxAge: 7 * 24 * 60 * 60 * 1000,
          })
          .status(201)
          .json({ accessToken, user });

        console.log("*********End Register - Success*************");
    } catch (error) {
        logWithSource(`err ${error}`.red)
        return res.status(400).json({ message: error.message });
    }
};

// התחברות
const login = async (req, res) => {
    console.log("*********Start Login*************");
    const { username, password } = req.body;
    try {
        const user = await Schema.findOne({ username, password });
        if (!user) return res.status(400).json({ message: "אחד הנתונים שגויים" });
        console.log(`user and pass in ok`.green);
        const accessToken = generateAccessToken(user._id);
        const refreshToken = generateRefreshToken(user._id);
        const  expirationTime = Date.now() + 24 * 60* 60* 1000; 
        user.refreshToken = refreshToken;
        await user.save();
        console.log("*********End Login - Success*************");
        return res
          .cookie('refreshToken', refreshToken, {
              httpOnly: true,
              secure: process.env.NODE_ENV === 'production',
              sameSite: 'Strict',
              maxAge: 7 * 24 * 60 * 60 * 1000,
          })
          .status(200)
          .json({ accessToken, user, expirationTime});
    } catch (error) {
        logWithSource(`err ${error}`.red)
        return res.status(400).json({ message: error.message });
    }
};

// רענון access token
const refreshAccessToken = async (req, res) => {
    const token = req.cookies.refreshToken;
    if (!token) return res.status(401).json({ message: 'אין Refresh Token' });

    try {
        const decoded = jwt.verify(token, process.env.JWT_REFRESH_SECRET);
        const user = await Schema.findById(decoded.id);
        if (!user || user.refreshToken !== token)
            return res.status(403).json({ message: 'Token לא תקיף' });

        const newAccessToken = generateAccessToken(user._id);
        res.status(200).json({ accessToken: newAccessToken });
    } catch (err) {
        return res.status(403).json({ message: 'Token לא תקף' });
    }
};

// התנתקות
const logout = async (req, res) => {
    const token = req.cookies.refreshToken;
    if (token) {
        const user = await Schema.findOne({ refreshToken: token });
        if (user) {
            user.refreshToken = null;
            await user.save();
        }
        res.clearCookie('refreshToken', { httpOnly: true, sameSite: 'Strict' });
    }
    res.status(200).json({ message: 'יציאה מהמערכת' });
};

// פונקציות CRUD נוספות:
const getAllU = async (req, res) => {
    try {
        const users = await Schema.find();
        return res.status(200).json(users);
    } catch (err) {
        logWithSource(`err ${err}`.red)
        return res.status(500).json([]);
    }
};

const getOneU = async (req, res) => {
    try {
        const user = await Schema.findOne({tz: req.params.id});
        const user2 = await Schema.findOne({_id: req.params.id});
        if(user2) return res.status(200).json(user2);
        if(user) return res.status(200).json(user);
    } catch (err) {
        logWithSource(`err ${err}`.red)
        return res.status(500).json([]);
    }
};

const postU = async(req, res) => {
    try{
        console.log("body", req.body);
        const model = buildData(req.body);
        const schemaExists = await Schema.findOne({ username: model.username });
        if (schemaExists) return res.status(400).json({ message: 'המשתמש קיים' });
        const schema = await Schema.create({...model, created: new Date()});
        const users = await Schema.find();
        return res.status(200).json(users);

    }catch(err) {
        logWithSource(`err ${err}`.red)
        return res.status(500).json([]);    
    }
}
const putU = async (req, res) => {
    try {
        const { id } = req.params;
        const model = buildData(req.body);
        const updated = await Schema.findOneAndUpdate({tz: id}, {...model, update: new Date()}, { new: true });
        const all = await Schema.find();
        return res.status(200).json({ users: all });
    } catch (err) {
        logWithSource(`err ${err}`.red)
        return res.status(500).json([]);
    }
};

const deleteU = async (req, res) => {
    try {
        const { id } = req.params;
        await Schema.findOneAndDelete({tz: id});
        const all = await Schema.find();
        return res.status(200).json({ users: all });
    } catch (err) {
        logWithSource(`err ${err}`.red)
        return res.status(500).json([]);
    }
};

const getme = async (req, res) => {
    try {
        const me = await Schema.findById(req._id);
        return res.status(200).json({ schema: me });
    } catch (err) {
        logWithSource(`err ${err}`.red)
        return res.status(500).json([]);
    }
}

const addSubForUser = async(req, res) => {
    try{
        const {subId} = req.params;
        const subs = {
                type: subId, 
                start: {
                    day: new Date().getDate(),
                    month: new Date().getMonth(),
                    year: new Date().getFullYear(),
                }
        }
        const updated = await Schema.findOneAndUpdate({tz: req.user.tz}, {subs: subs, active: 0,update: new Date()}, { new: true });
        return res.status(200).json(updated);

    } catch(err) {
        logWithSource(`err ${err}`.red)
        return res.status(500).json([]);
    }
}

const removeSubForUser = async(req, res) => {
    try{
        const subs = {
                type: "", 
                start: {
                    day: 0,
                    month: 0,
                    year: 0,
                }
        }
        const updated = await Schema.findOneAndUpdate({tz: req.user.tz}, {subs: subs, active: 0,update: new Date()}, { new: true });
        return res.status(200).json({ user: updated });

    } catch(err) {
        logWithSource(`err ${err}`.red)
        return res.status(500).json([]);
    }
}

const countWithoutSubsForUser = async(req, res) => {
    try{
        const updated = await Schema.findOneAndUpdate({tz: req.user.tz}, {active: userInfo.active + 1,update: new Date()}, { new: true });
        if(updated.active >= 3) {
            //send user to table not actives;
        }
        return res.status(200).json({ user: updated });

    } catch(err) {
        logWithSource(`err ${err}`.red)
        return res.status(500).json([]);
    }
}

module.exports = {
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
};
