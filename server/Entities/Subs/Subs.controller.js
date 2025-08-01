//server
const Schema = require("./Subs.model")
const { logWithSource } = require("../../middleware/logger");
const buildStudentData = (body) => ({
    name: body.name,
    months: body.months, // 1,2,3
    times_week: body.times_week, //2,3,4
    price: body.price,
});


const getAll = async(req, res) => {
    console.log("start-getAll")
    try{
        const schema = await Schema.find();
        console.log("schema", schema, schema.length);
        return schema.length > 0 ? res.status(200).json({schema}) : res.status(404).json([]);
    }
    catch(err){
        logWithSource(`err: ${err}`.red)
        return res.status(500).json([]);
    }
}

const getOne = async (req, res) => {
  console.log("start-getOne")
    try{
        console.log(req.params);
        const schema = await Schema.findOne({_id: req.params._id});
        console.log("schema", schema);
        return schema ? res.status(200).json({schema}) : res.status(404).json([]);
    }
    catch(err){
        logWithSource(`err: ${err}`.red)
        return res.status(500).json([]);
    }
}
const postOne = async(req, res) => {
    console.log("start-create")
    try{
        req.body = {...req.body};
        const model = buildStudentData(req.body) 
        logWithSource(req.body);
        const isFindByName = await Schema.find({name: model.name});
        logWithSource(isFindByName);
        if(isFindByName.length > 0){
            return res.status(301).json({warning: "קיים מנוי באותו שם "});
        }
        const schema = new Schema({...model, created: new Date()});
        console.log("create in database")
        await schema.save();

        const schemaFind = await Schema.find();
        return schemaFind ? res.status(201).json({schema: schemaFind}): res.status(404).json([]);
    }
    catch(err){
        logWithSource(`err: ${err}`.red)
        return res.status(500).json([]);
    }
}

const putOne = async(req, res) => {
    console.log("start-update")
    try{
        console.log("the מנוי in good", req.body);
        const model = buildStudentData(req.body) 
        const isFindByName = await Schema.findOne({name: req.model.name});

        if(!isFindByName){
            return res.status(301).json({warning: "לא קיים מנוי באותו שם"});
        }
        console.log("the מנוי in good", model);
        await Schema.findOneAndUpdate({name: req.params.name}, {...model, updated: Date.now()})
        
        const schemaFind = await Schema.find();
        return schemaFind ? res.status(200).json({schema:schemaFind}): res.status(404).json([]);
    }
    catch(err){
        logWithSource(`err: ${err}`.red)
        return res.status(500).json([]);
    }
}
const deleteOne= async(req, res) => {
    console.log("start-delete")
    try{
        await Schema.findOneAndDelete({_id: req.params._id}); 
        const schemaFind = await Schema.find();
        return schemaFind ? res.status(200).json({schema: schemaFind}): res.status(404).json([]);
    }
    catch(err){
        logWithSource(`err: ${err}`.red)
        return res.status(500).json([]);
    }
}

module.exports = {getAll, getOne, postOne, putOne, deleteOne,}