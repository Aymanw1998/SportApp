const {getAll, getOne, postOne, putOne, deleteOne,} = require("./Training.controller");
const { protect, protectRole } = require('../../middleware/authMiddleware');
const express = require('express');
const router = express.Router();

router
    .get("/", protect, getAll)
    .get("/:name", protect, getOne)
    .post("/", protect, protectRole("מנהל"), postOne)
    .put("/:name", protect, protectRole("מנהל"), putOne)
    .delete("/:name", protect, protectRole("מנהל"), deleteOne)

module.exports = router;