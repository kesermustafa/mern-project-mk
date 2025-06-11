const express = require("express");
const router = express.Router();
const mongoose = require("mongoose");
const Categories = require("../db/models/Categories");
const Response = require("../lib/Response");
const CustomError = require("../lib/Error");
const Enum = require("../config/Enum");
const AuditLogs = require("../lib/AuditLogs");
const logger = require("../lib/logger/LoggerClass");
const auth = require("../lib/auth")();


router.use(auth.authenticate());

router.post("/add", async (req, res, next) => {
  const body = req.body;

  try {
    if (!body.name)
      throw new CustomError(
        Enum.HTTP_CODES.BAD_REQUEST,
        "Validation Error!",
        Enum.MESSAGE.NOT_EMPTY
      );

    // Aynı isimli kategori var mı kontrol et
    const existingCategory = await Categories.findOne({ name: body.name });
    if (existingCategory) {
      throw new CustomError(
        Enum.HTTP_CODES.CONFLICT, // 409
        "Conflict Error!",
        `${Enum.MESSAGE.CONFLICT_CATEGORY} : ${body.name}`
      );
    }

    const category = await Categories.create({
      name: body.name,
      is_active: true,
      created_by: req.user?.id
    });


    AuditLogs.info(req.user?.email, "Categories", "add", category);
    logger.info(req.user?.email, "Categories", "add", category);


    res.json(Response.successResponse(category));
  } catch (error) {
    logger.error(req.user?.email, "Categories", "Add",error.toString());
    res
      .status(error.code || Enum.HTTP_CODES.INT_SERVER_ERROR)
      .json(Response.errorResponse(error));
  }
});

router.get("/", async (req, res, next) => {
  try {
    let categories = await Categories.find({});

    res.json(Response.successResponse(categories));
  } catch (error) {
    res
      .status(error.code || Enum.HTTP_CODES.INT_SERVER_ERROR)
      .json(Response.errorResponse(error));
  }
});

router.patch("/update", async (req, res, next) => {
  const body = req.body;

  try {
    if (!body._id)
      throw new CustomError(
        Enum.HTTP_CODES.CONFLICT, // 409
        "ID not found",
        `${Enum.MESSAGE.ID_NOT_FOUND} : ${body._id}`
      );

    const existingCategory = await Categories.findOne({ name: body.name });
    if (existingCategory && existingCategory._id.toString() !== body._id) {
      throw new CustomError(
        Enum.HTTP_CODES.CONFLICT, // 409
        "Conflict Error!",
        `${Enum.MESSAGE.CONFLICT_CATEGORY} : ${body.name}`
      );
    }

    let updates = {};

    if (body.name) updates.name = body.name;
    if (typeof body.is_active === "boolean") updates.is_active = body.is_active;

    await Categories.updateOne({ _id: body._id }, updates);

    AuditLogs.info(req.user?.email, "Categories", "Update", updates);

    res.json(Response.successResponse(updates));
  } catch (error) {
    res
      .status(error.code || Enum.HTTP_CODES.INT_SERVER_ERROR)
      .json(Response.errorResponse(error));
  }
});

router.delete("/delete/:id", async (req, res, next) => {
  try {
    const categoryId = req.params.id;
    console.log("Gelen ID:", categoryId);

    // ObjectId geçerli mi?
    if (!mongoose.Types.ObjectId.isValid(categoryId)) {
      throw new CustomError(
        Enum.HTTP_CODES.BAD_REQUEST,
        "Invalid ID Format",
        `Provided ID: ${categoryId} is not a valid MongoDB ObjectId`
      );
    }

    const deletedCategory = await Categories.findByIdAndDelete(categoryId);



    if (!deletedCategory) {
      throw new CustomError(
        Enum.HTTP_CODES.NOT_FOUND,
        "Not Found",
        `No category found with id: ${categoryId}`
      );
    }

    res.status(Enum.HTTP_CODES.OK).json(
      Response.successResponse({
        message: "Category deleted successfully",
        deletedCategory
      })
    );

    AuditLogs.info(req.user?.email, "Categories", "Delete", deletedCategory);

  } catch (error) {
    res
      .status(error.code || Enum.HTTP_CODES.INT_SERVER_ERROR)
      .json(Response.errorResponse(error));
  }
});

module.exports = router;
