//server
const { logWithSource } = require("../../middleware/logger");
const Lesson = require("./Lesson.model")
const mongoose = require("mongoose");

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


const buildLessonData = (body) => ({
    name: body.name,
    date: {
        day: body.date.day || 1, //1-sun to 7-sat
        hh: body.date.hh || 8, //0-23
        month: body.date.month || new Date().getMonth() + 1,
        year: body.date.year || new Date().getFullYear(),
    },
    max_trainees: body.max_trainees || 20, // number maximum for clients in lesson
    trainer: body.trainer || null,
    list_trainees:   Array.isArray(body.list_trainees) ? body.list_trainees : [],
});


const getAll = async(req, res) => {
    try {
        // תמיכה פילטרים אופציונליים: ?year=2025&month=8 (1..12)
        const { year, month } = req.query;
        let filter = {};
        if (year && month) {
            const y = Number(year), m = Number(month);
            if (!Number.isNaN(y) && !Number.isNaN(m)) {
                const start = new Date(y, m - 1, 1);
                const end   = new Date(y, m, 1);
                filter.created = { $gte: start, $lt: end };
            }
        }
        const lessons = await Lesson.find(filter).populate('trainer', 'tz firstname lastname role').lean();
        return res.status(200).json({ ok: true, lessons });
    } catch (err) {
        logWithSource("err", err);
        return res.status(500).json({ ok: false, message: err.message });
    }
}

const getOne = async (req, res) => {
    try {
        const { id } = req.params;
        if (!mongoose.Types.ObjectId.isValid(id))
        return res.status(400).json({ ok: false, message: 'invalid id' });

        const lesson = await Lesson.findById(id).populate('trainer','tz firstname lastname role');
        if (!lesson) return res.status(404).json({ ok: false, message: 'לא נמצא' });

        lesson.num_in_list = (lesson.list_trainees || []).length;
        return res.status(200).json({ ok: true, lesson });
    } catch (err) {
        logWithSource("err", err);
        return res.status(500).json({ ok: false, message: err.message });
    }
}
const postOne = async(req, res) => {
    try {
        console.log("req.body", req.body);
        const model = buildLessonData(req.body);
        console.log("model", model);
        if (!model?.name || typeof model?.date?.day !== 'number' || typeof model?.date?.hh  !== 'number' || !model?.trainer) {
            return res.status(400).json({ ok: false, message: 'missing required fields' });
        }

        // בדיקת התנגשות בלו״ז – באותו חודש, לאותו מאמן, אותו day/hh
        // const { start, end } = monthRange(new Date());
        const collision = await Lesson.findOne({
            'date.day': model.date.day,
            'date.hh':  model.date.hh,
            "date.month": model.date.month,
            "date.year": model.date.year,
            trainer:    model.trainer,
            createdAt:   new Date(),
        });

        if (collision) {
            return res.status(409).json({ ok: false, code: 'SLOT_TAKEN', message: 'קיים שיעור לאותו מאמן באותה משבצת החודש' });
        }

        const doc = await Lesson.create({ ...model, created: new Date() });
        doc.num_in_list = (doc.list_trainees || []).length;

        return res.status(201).json({ ok: true, lesson: doc });
    } catch (err) {
        logWithSource("err", err);
        return res.status(500).json({ ok: false, message: err.message });
    }
}

const putOne = async(req, res) => {
    try {
        console.log("update lesson")
        const { id } = req.params;
        console.log(req.params, req.body);
        if (!mongoose.Types.ObjectId.isValid(id))
            return res.status(400).json({ ok: false, message: 'invalid id' });

        const current = await Lesson.findById(id);
        console.log("current", current);
        if (!current) return res.status(404).json({ ok: false, message: 'לא נמצא' });

        // מאחדים נתונים קיימים עם נכנסים
        const next = buildLessonData({ ...current.toObject(), ...req.body });
        console.log("next", next);
        // אם שונה day/hh/trainer – בדוק התנגשות
        const changedSlot = next.date.day !== current.date.day || next.date.hh  !== current.date.hh  || String(next.trainer) !== String(current.trainer);
        console.log("changedSlot", changedSlot);
        if (changedSlot) {
            // const { start, end } = monthRange(current.created || new Date());
            const collision = await Lesson.findOne({
                _id: { $ne: current._id },
                'date.day': next.date.day,
                'date.hh' : next.date.hh,
                trainer:   next.trainer,
                updatedAt: new Date(),
            });
            console.log("collision", collision);
            if (collision) {
                return res.status(409).json({ ok: false, code: 'SLOT_TAKEN', message: 'משבצת תפוסה לאותו מאמן' });
            }
        }

        current.name          = next.name;
        current.date.day      = next.date.day;
        current.date.hh       = next.date.hh;
        current.date.month    = next.date.month;
        current.date.year     = next.date.year; 
        current.max_trainees  = next.max_trainees;
        current.trainer       = next.trainer;
        current.list_trainees = next.list_trainees;
        current.updatedAt       = new Date();

        // ודא שלא עוברים קיבולת
        if (current.list_trainees.length > current.max_trainees) {
            return res.status(400).json({ ok: false, code: 'OVER_CAPACITY', message: 'יותר ממשתתפים מהקיבולת' });
        }
        console.log("current", current);
        await current.save();
        return res.status(200).json({ ok: true, lesson: current });
    } catch (err) {
        logWithSource("err", err);
        return res.status(500).json({ ok: false, message: err.message });
    }
}
const deleteOne= async(req, res) => {
    try {
        console.log("params", req.params)
        const { id } = req.params;
        if (!mongoose.Types.ObjectId.isValid(id))
            return res.status(400).json({ ok: false, message: 'invalid id' });

        const deleted = await Lesson.findOneAndDelete({ _id: id });
        console.log("deleted", deleted);
        if (!deleted) return res.status(404).json({ ok: false, message: 'לא נמצא' });

        return res.status(200).json({ ok: true, removed: true });
    } catch (err) {
        logWithSource("err", err);
        return res.status(500).json({ ok: false, message: err.message });
    }
}

const addToList = async(req, res) => {
    try {
        const { id } = req.params;
        const trainees = Array.isArray(req.body?.list_trainees) ? req.body.list_trainees : [];
        if (!trainees.length) return res.status(400).json({ ok: false, message: 'list_trainees is empty' });

        const lesson = await Lesson.findById(id);
        if (!lesson) return res.status(404).json({ ok: false, message: 'לא נמצא' });

        // מסננים כפולים/קיימים
        const set = new Set((lesson.list_trainees || []).map(String));
        const toAdd = trainees.filter(t => !set.has(String(t)));

        // קיבולת
        if (lesson.list_trainees.length + toAdd.length > lesson.max_trainees) {
        return res.status(400).json({ ok: false, code: 'OVER_CAPACITY', message: 'אין מקום פנוי' });
        }
        

        lesson.list_trainees.push(...toAdd);
        lesson.updated = new Date();
        await lesson.save();

        lesson.num_in_list = lesson.list_trainees.length;
        return res.status(200).json({ ok: true, lesson });
    } catch (err) {
        logWithSource("err", err);
        return res.status(500).json({ ok: false, message: err.message });
    }
}

const removeFromList = async(req, res) => {
    try {
        const { id } = req.params;
        const trainees = Array.isArray(req.body?.list_trainees) ? req.body.list_trainees : [];
        if (!trainees.length) return res.status(400).json({ ok: false, message: 'list_trainees is empty' });

        const lesson = await Lesson.findById(id);
        if (!lesson) return res.status(404).json({ ok: false, message: 'לא נמצא' });

        const removeSet = new Set(trainees.map(String));
        lesson.list_trainees = (lesson.list_trainees || []).filter(t => !removeSet.has(String(t)));
        lesson.updated = new Date();
        await lesson.save();

        return res.status(200).json({ ok: true, lesson });
    } catch (err) {
        logWithSource("err", err);
        return res.status(500).json({ ok: false, message: err.message });
    }
}

const clear = async(req, res, next) => {
    try {
        const deleted = await Lesson.de({ _id: id });
        if (!deleted) return res.status(404).json({ ok: false, message: 'לא נמצא' });

        return res.status(200).json({ ok: true, lesson: deleted });
    } catch (err) {
        logWithSource("err", err);
        return res.status(500).json({ ok: false, message: err.message });
    }
}
module.exports = {getAll, getOne, postOne, putOne, deleteOne, addToList, removeFromList}