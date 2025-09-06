//server
const Subs = require("./Subs.model")
const { logWithSource } = require("../../middleware/logger");
const mongoose = require("mongoose");
const buildData = (body) => ({
    name: body.name,
    months: body.months, // 1,2,3
    times_week: body.times_week, //1,2,3,4
    price: body.price,
});


const getAll = async(req, res) => {
    try {

        // מיון ברירת מחדל: מחיר ואז שם
        const subs = await Subs.find().sort({ price: 1, name: 1 }).lean();

        return res.status(200).json({ ok: true, subs });
    } catch (err) {
        logWithSource("err", err)
        return res.status(500).json({ ok: false, message: err.message });
    }
}

const getOne = async (req, res) => {
    try {
        const { id } = req.params;

        let sub = null;
        if (mongoose.Types.ObjectId.isValid(id)) {
        sub = await Subs.findById(id);
        } else {
        sub = await Subs.findOne({ name: id, isDeleted: false });
        }

        if (!sub) return res.status(404).json({ ok: false, message: 'לא נמצא' });
        return res.status(200).json({ ok: true, sub });
    } catch (err) {
        logWithSource("err", err);
        return res.status(500).json({ ok: false, message: err.message });
    }
};
const postOne = async(req, res) => {
    try {
        const model = buildData(req.body);

        if (!model.name || !model.months || !model.times_week || model.price == null) {
        return res.status(400).json({ ok: false, message: 'שדות חובה חסרים' });
        }

        // בדיקת כפילות בשם (מתעלמים ממחוקים)
        const dup = await Subs.findOne({ name: model.name, isDeleted: false });
        if (dup) {
        return res.status(409).json({ ok: false, code: 'DUP_NAME', message: 'שם מנוי קיים' });
        }

        const created = await Subs.create({ ...model, created: new Date(), isDeleted: false });
        return res.status(201).json({ ok: true, sub: created });
    } catch (err) {
        logWithSource("err", err);
        return res.status(500).json({ ok: false, message: err.message });
    }
};

const putOne = async(req, res) => {
  try {
        console.log("sub_id", req.params);
        const { id } = req.params;
        if (!mongoose.Types.ObjectId.isValid(id))
        return res.status(400).json({ ok: false, message: 'invalid id' });

        const current = await Subs.findById(id);
        if (!current) return res.status(404).json({ ok: false, message: 'לא נמצא' });

        const patch = buildData(req.body);

        // אם שינו שם – ודא שאין כפילות לשם החדש (בפריטים לא מחוקים)
        if (patch.name && patch.name !== current.name) {
        const dup = await Subs.findOne({ name: patch.name, isDeleted: false, _id: { $ne: current._id } });
        if (dup) return res.status(409).json({ ok: false, code: 'DUP_NAME', message: 'שם מנוי קיים' });
        }

        current.name       = patch.name       ?? current.name;
        current.months     = patch.months     ?? current.months;
        current.times_week = patch.times_week ?? current.times_week;
        current.price      = patch.price      ?? current.price;
        current.updated    = new Date();

        await current.save();
        return res.status(200).json({ ok: true, sub: current });
    } catch (err) {
        logWithSource("err", err);
        return res.status(500).json({ ok: false, message: err.message });
    }
};

const deleteOne= async(req, res) => {
    try {
        const { id } = req.params;
        const hard = String(req.query.hard || '0') === '1';

        if (!mongoose.Types.ObjectId.isValid(id))
        return res.status(400).json({ ok: false, message: 'invalid id' });

        const sub = await Subs.findById(id);
        if (!sub) return res.status(404).json({ ok: false, message: 'לא נמצא' });

        await Subs.deleteOne({ _id: id });
        return res.status(200).json({ ok: true, removed: true });
    } catch (err) {
        logWithSource("err", err);
        return res.status(500).json({ ok: false, message: err.message });
    }
}

module.exports = {getAll, getOne, postOne, putOne, deleteOne,}