import expressAsyncHandler from "express-async-handler";
import ApiResponse from "../../utils/ApiResponse.util.js";
import CustomError from "../../utils/customError.util.js";
import SubCategoryModel from "../../models/subCategory.model.js";
import { uploadImage } from "../../utils/cloudinary.util.js";

const getURL = (bufferValue, mimetype) => {
  const b64 = bufferValue.toString("base64");
  const imageURL = `data:${mimetype};base64,${b64}`;
  return imageURL;
};

export const addSubCategory = expressAsyncHandler(async (req, res, next) => {
  const { name, category } = req.body;
  if (!name) return next(new CustomError(400, "Subcategory name is required"));
  if (!category) {
    return next(new CustomError(400, "Category id is required"));
  }
  if (!req.file) {
    return next(new CustomError(400, "Subcategory image is required"));
  }

  const bufferValue = req.file.buffer;
  const imageURL = getURL(bufferValue, req.file.mimetype);
  const uploadedImage = await uploadImage(imageURL);

  const categoryIds = Array.isArray(category) ? category : [category];

  const newSubCategory = await SubCategoryModel.create({
    name,
    image: uploadedImage.secure_url,
    category: categoryIds,
  });

  if (!newSubCategory) {
    return next(new CustomError(400, "Cannot add subcategory"));
  }

  new ApiResponse(201, "Subcategory Added Successfully", newSubCategory).send(
    res,
  );
});

export const updateSubCategory = expressAsyncHandler(async (req, res, next) => {
  const { id } = req.params;
  const { name, category } = req.body;
  const subCategoryId = id || req.body.id;

  if (!subCategoryId) {
    return next(new CustomError(400, "Subcategory id is required"));
  }

  const updateData = {};
  if (name) updateData.name = name;
  if (category) {
    updateData.category = Array.isArray(category) ? category : [category];
  }

  if (req.file) {
    const bufferValue = req.file.buffer;
    const imageURL = getURL(bufferValue, req.file.mimetype);
    const uploadedImage = await uploadImage(imageURL);
    updateData.image = uploadedImage.secure_url;
  }

  if (Object.keys(updateData).length === 0) {
    return next(new CustomError(400, "No fields to update"));
  }

  const updatedSubCategory = await SubCategoryModel.findByIdAndUpdate(
    subCategoryId,
    updateData,
    { new: true, runValidators: true },
  );

  if (!updatedSubCategory) {
    return next(new CustomError(404, "Subcategory not found"));
  }

  new ApiResponse(
    200,
    "Subcategory Updated Successfully",
    updatedSubCategory,
  ).send(res);
});

export const deleteSubCategory = expressAsyncHandler(async (req, res, next) => {
  const { id } = req.params;
  const subCategoryId = id || req.body.id;
  if (!subCategoryId) {
    return next(new CustomError(400, "Subcategory id is required"));
  }

  const deletedSubCategory = await SubCategoryModel.findByIdAndDelete(
    subCategoryId,
  );

  if (!deletedSubCategory) {
    return next(new CustomError(404, "Subcategory not found"));
  }

  new ApiResponse(
    200,
    "Subcategory deleted successfully",
    deletedSubCategory,
  ).send(res);
});

export const getSubCategories = expressAsyncHandler(async (req, res, next) => {
  const { categoryId } = req.query;
  const filter = {};
  if (categoryId) {
    filter.category = categoryId;
  }

  const subCategories = await SubCategoryModel.find(filter).sort({
    createdAt: -1,
  });

  if (!subCategories || subCategories.length === 0) {
    return next(new CustomError(404, "No subcategories found"));
  }

  new ApiResponse(
    200,
    "Subcategories fetched successfully",
    subCategories,
  ).send(res);
});
