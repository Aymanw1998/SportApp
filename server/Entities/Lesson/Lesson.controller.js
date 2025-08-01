//server
const { logWithSource } = require("../../middleware/logger");
const Schema = require("./Lesson.model")

const buildStudentData = (body) => ({
    name: body.name,
    date: {
        day: body.date.day, //0-sun to 6-sat
        hh: body.date.hh, //0-23
    },
    max_trainees: body.max_trainees || 20, // number maximum for clients in lesson
    num_in_list: body.num_in_list || body.list_trainees?.length, // number clients in lesson
    trainer: body.trainer,
    list_trainees: body.list_trainees || [],
});


const getAll = async(req, res) => {
    console.log("start-getAll")
    try{
        const schema = await Schema.find();
        return schema.length > 0 ? res.status(200).json({schema}) : res.status(404).json([]);
    }
    catch(err){
        logWithSource(`err ${err}`.red)
        return res.status(500).json([]);
    }
}

const getOne = async (req, res) => {
  console.log("start-getOne")
    try{
        console.log(req.params);
        const schema = await Schema.findOne({_id: req.params.id});
        console.log("schema", schema);
        return schema ? res.status(200).json({schema}) : res.status(404).json([]);
    }
    catch(err){
        logWithSource(`err ${err}`.red)
        return res.status(500).json([]);
    }
}
const postOne = async(req, res) => {
    console.log("start-create")
    try{
        console.log("req.body", req.body);
        const model = buildStudentData(req.body) 
        const isFindByDate = await Schema.find({"date.day" : model.date.day, "date.hh": model.date.hh});
        const isFindByDateWithSameTrainer = await Schema.find({"date.day" : model.date.day, "date.hh": model.date.hh, "trainer": model.trainer});

        console.log("schema body", req.body, isFindByDate.length)
        if(isFindByDateWithSameTrainer.length > 0 || (isFindByDate.length > 0 && new Date(isFindDate[0].created).getMonth() === new Date().getMonth())) {
            return res.status(301).json({warning: "קיים שיעור באותו מזהה "});
        }
        const schema = new Schema({...model, created: new Date()});
        console.log("create in database")
        await schema.save();

        const schemaFind = await Schema.find();
        return schemaFind ? res.status(201).json({schema: schemaFind}): res.status(404).json([]);
    }
    catch(err){
        logWithSource(`err ${err}`.red)
        return res.status(500).json([]);
    }
}

const putOne = async(req, res) => {
    console.log("start-update")
    try{
        console.log("the lesson in good", req.body);
        const model = buildStudentData(req.body) 
        const isFindBytz = await Schema.findOne({_id: req.params.id});
        console.log("the lesson in good2", model);
        if(!isFindBytz){
            return res.status(301).json({warning: "לא קיים שיעור באותו מזהה"});
        }
        console.log("the lesson in good", model);
        await Schema.findOneAndUpdate({_id: req.params.id}, {...model, updated: Date.now()})
        
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
        await Schema.findOneAndDelete({_id: req.params.id}); 
        const schemaFind = await Schema.find();
        return schemaFind ? res.status(200).json({schema: schemaFind}): res.status(404).json([]);
    }
    catch(err){
        logWithSource(`err ${err}`.red)
        return res.status(500).json([]);
    }
}

const addToList = async(req, res) => {
    console.log("start-addToList")
    try{
        //params: {id:123}body: {list: []}
        for(let i = 0; i < req.body.list_trainees; i++){
            await Schema.findOneAndUpdate({_id: req.params.id}, {
                $addToSet: {list_client: req.body.list_trainees[i]}, updated: new Date(),
            }); 
        }
        const schemaFind = await Schema.find();
        return schemaFind ? res.status(200).json({schema: schemaFind}): res.status(404).json([]);
    }
    catch(err){
        logWithSource(`err ${err}`.red)
        return res.status(500).json([]);
    }
}

const removeFromList = async(req, res) => {
    console.log("start-removeFromList")
    try{
        //params: {id:123}body: {list: []}
        for(let i = 0; i < req.body.list_trainees; i++){
            await Schema.findOneAndUpdate({_id: req.params.id}, {
                $pull: {list_client: req.body.list_trainees[i]}, updated: new Date(),
            }); 
        }
        const schemaFind = await Schema.find();
        return schemaFind ? res.status(200).json({schema: schemaFind}): res.status(404).json([]);
    }
    catch(err){
        logWithSource(`err ${err}`.red)
        return res.status(500).json([]);
    }
}
module.exports = {getAll, getOne, postOne, putOne, deleteOne, addToList, removeFromList}