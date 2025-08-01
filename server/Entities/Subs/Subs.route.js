const {getAll, getOne, postOne, putOne, deleteOne,} = require("./Subs.controller");
const { protect, protectRole } = require('../../middleware/authMiddleware');
const express = require('express');
const router = express.Router();

router
    .get("/", protect, getAll)
    .get("/:_id", protect, getOne)
    .post("/", protect, protectRole("מנהל"), postOne)
    .put("/:_id", protect, protectRole("מנהל"), putOne)
    .delete("/:_id", protect, protectRole("מנהל"), deleteOne)

module.exports = router;