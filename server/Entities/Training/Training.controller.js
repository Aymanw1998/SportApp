//server
const Schema = require("./Training.model")
const { logWithSource } = require("../../middleware/logger");
const buildStudentData = (body) => ({
    name: body.name,
    info: body.info,
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
        const schema = await Schema.findOne({name: req.params.name});
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
        const isFindByName = await Schema.find({name: model.name});
        if(isFindByName.length > 0){
            return res.status(301).json({warning: "קיים אימון באותו שם "});
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
        console.log("the אימון in good", req.body);
        const model = buildStudentData(req.body) 
        const isFindByName = await Schema.findOne({name: req.params.name});

        if(!isFindByName){
            return res.status(301).json({warning: "לא קיים אימון באותו שם"});
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
        await Schema.findOneAndDelete({name: req.params.name}); 
        const schemaFind = await Schema.find();
        return schemaFind ? res.status(200).json({schema: schemaFind}): res.status(404).json([]);
    }
    catch(err){
        logWithSource(`err: ${err}`.red)
        return res.status(500).json([]);
    }
}

module.exports = {getAll, getOne, postOne, putOne, deleteOne,}