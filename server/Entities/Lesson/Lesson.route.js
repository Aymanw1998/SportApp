const {getAll, getOne, postOne, putOne, deleteOne, addToList, removeFromList} = require("./Lesson.controller");
const { protect, protectRole } = require('../../middleware/authMiddleware');
const express = require('express');
const router = express.Router();

router
    .get("/", protect, getAll)
    .get("/:id", protect, getOne)
    .post("/", protect, protectRole("מנהל"), postOne)
    .put("/:id", protect, protectRole("מנהל"), putOne)
    .delete("/:id", protect, protectRole("מנהל"), deleteOne)
    .post("/addToList/:id", protect, addToList)
    .post("/removeFromList", protect, removeFromList);

module.exports = router;