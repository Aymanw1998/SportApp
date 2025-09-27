//server
const Training = require("./Training.model")
const { logWithSource } = require("../../middleware/logger");
const mongoose = require("mongoose");
const buildData = (body) => ({
    name: body.name,
    info: body.info,
});


const getAll = async(req, res) => {
    logWithSource("start-getAll")
    try{
        const schema = await Training.find().sort({name: 1}).lean();
        return res.status(200).json({ok: true, trainings: schema})
    }
    catch(err){
        logWithSource(`err: ${err}`.red)
        return res.status(500).json({ok: false, message: err.message});
    }
}

const getOne = async (req, res) => {
    try{
        logWithSource(req.params);
        const { id } = req.params;
        const findFilter = mongoose.Types.ObjectId.isValid(id)
        ? { _id: id }
        : { name: id };
        const schema = await Training.findOne(findFilter);
        logWithSource("schema", schema);
        res.status(200).json({ok: true, training: schema});
    }
    catch(err){
        logWithSource(`err: ${err}`.red)
        return res.status(500).json({ok: false, message: err.message});
    }
}
const postOne = async(req, res) => {
    try {
        const model = buildData(req.body);
        if (!model.name) {
        return res.status(400).json({ ok: false, message: 'name הוא שדה חובה' });
        }

        const created = await Training.create({ ...model, createdAt: new Date(), });
        return res.status(201).json({ ok: true, training: created });
    } catch (err) {
        logWithSource(`postOne training err: ${err.message}`);
        return res.status(500).json({ ok: false, message: err.message });
    }
};


const putOne = async(req, res) => {
    try {
        const { id } = req.params;

        // מאתרים את הרשומה הקיימת
        const findFilter = mongoose.Types.ObjectId.isValid(id)
        ? { _id: id }
        : { name: id };

        const current = await Training.findOne(findFilter);
        if (!current) return res.status(404).json({ ok: false, message: 'לא נמצא' });

        const patch = buildData(req.body);

        current.name = patch.name ?? current.name;
        current.info = patch.info ?? current.info;
        current.updatedAt = new Date();

        await current.save();
        return res.status(200).json({ ok: true, training: current });
    } catch (err) {
        logWithSource(`putOne training err: ${err.message}`);
        return res.status(500).json({ ok: false, message: err.message });
    }

}
const deleteOne= async(req, res) => {
    try {
        const { id } = req.params;
        const hard = String(req.query.hard || '0') === '1';

        const findFilter = mongoose.Types.ObjectId.isValid(id)
        ? { _id: id }
        : { name: id };

        const training = await Training.findOne(findFilter);
        if (!training) return res.status(404).json({ ok: false, message: 'לא נמצא' });
        
        await Training.deleteOne({ _id: training._id });
        return res.status(200).json({ ok: true, removed: true });
    } catch (err) {
        logWithSource(`deleteOne training err: ${err.message}`);
        return res.status(500).json({ ok: false, message: err.message });
    }

}

module.exports = {getAll, getOne, postOne, putOne, deleteOne,}