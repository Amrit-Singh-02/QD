import expressAsyncHandler from "express-async-handler";
import ApiResponse from "../../utils/ApiResponse.util.js";
import CustomError from "../../utils/customError.util.js";
import CategoryModel from "../../models/category.model.js";
import { uploadImage } from "../../utils/cloudinary.util.js";

const getURL = (bufferValue, mimetype) => {
  const b64 = bufferValue.toString("base64");
  const imageURL = `data:${mimetype};base64,${b64}`;
  return imageURL;
};

export const addCategory = expressAsyncHandler(async (req, res, next) => {
  const { name } = req.body;
  if (!name) return next(new CustomError(400, "Category name is required"));
  if (!req.file) {
    return next(new CustomError(400, "Category image is required"));
  }

  const bufferValue = req.file.buffer;
  const imageURL = getURL(bufferValue, req.file.mimetype);
  const uploadedImage = await uploadImage(imageURL);

  const newCategory = await CategoryModel.create({
    name,
    image: uploadedImage.secure_url,
  });

  if (!newCategory) {
    return next(new CustomError(400, "Cannot add category"));
  }

  new ApiResponse(201, "Category Added Successfully", newCategory).send(res);
});

export const updateCategory = expressAsyncHandler(async (req, res, next) => {
  const { id } = req.params;
  const { name } = req.body;
  const categoryId = id || req.body.id;

  if (!categoryId) {
    return next(new CustomError(400, "Category id is required"));
  }

  const updateData = {};
  if (name) updateData.name = name;

  if (req.file) {
    const bufferValue = req.file.buffer;
    const imageURL = getURL(bufferValue, req.file.mimetype);
    const uploadedImage = await uploadImage(imageURL);
    updateData.image = uploadedImage.secure_url;
  }

  if (Object.keys(updateData).length === 0) {
    return next(new CustomError(400, "No fields to update"));
  }

  const updatedCategory = await CategoryModel.findByIdAndUpdate(
    categoryId,
    updateData,
    { new: true, runValidators: true },
  );

  if (!updatedCategory) {
    return next(new CustomError(404, "Category not found"));
  }

  new ApiResponse(200, "Category Updated Successfully", updatedCategory).send(
    res,
  );
});

export const getCategories = expressAsyncHandler(async (req, res, next) => {
  const categories = await CategoryModel.find().sort({ createdAt: -1 });
  if (!categories || categories.length === 0) {
    return next(new CustomError(404, "No categories found"));
  }
  new ApiResponse(200, "Categories fetched successfully", categories).send(res);
});
