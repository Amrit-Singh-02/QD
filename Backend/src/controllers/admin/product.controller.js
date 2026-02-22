import expressAsyncHandler from "express-async-handler";
import ApiResponse from "../../utils/ApiResponse.util.js";
import ProductModel from "../../models/product.model.js";
import CustomError from "../../utils/customError.util.js";
import {
  deleteUploadedImage,
  uploadImage,
} from "../../utils/cloudinary.util.js";
import {
  addProductValidator,
  updateProductValidator,
} from "../../validators/product.validator.js";

export const getURL = (bufferValue, mimetype) => {
  const b64 = bufferValue.toString("base64");
  const imageURL = `data:${mimetype};base64,${b64}`;
  return imageURL;
};

export const addProduct = expressAsyncHandler(async (req, res, next) => {
  if (!req.file) {
    return next(new CustomError(400, "Product image is required"));
  }
  const { error, value } = addProductValidator.validate(req.body, {
    abortEarly: false,
  });
  if (error) {
    return next(
      new CustomError(400, error.details.map((ele) => ele.message).join(", "))
    );
  }

  const bufferValue = req.file.buffer;
  const imageURL = getURL(bufferValue, req.file.mimetype);
  const uploadedImage = await uploadImage(imageURL);

  const imgArr = [
    {
      url: uploadedImage.secure_url,
      public_id: uploadedImage.public_id,
      asset_id: uploadedImage.asset_id,
    },
  ];

  const {
    name,
    description,
    price,
    category,
    subCategory,
    brand,
    stocks,
    discount,
  } = value;

  const categoryIds = Array.isArray(category) ? category : [category];
  const subCategoryIds = subCategory
    ? Array.isArray(subCategory)
      ? subCategory
      : [subCategory]
    : [];
  const newProduct = await ProductModel.create({
    name,
    description,
    price,
    images: imgArr,
    category: categoryIds,
    subCategory: subCategoryIds,
    brand,
    stocks,
    discount: discount ?? null,
  });
  if (!newProduct) {
    return next(new CustomError(404, "Cannot add product"));
  }

  new ApiResponse(201, "Product Added Successfully", newProduct).send(res);
});

export const updateProduct = expressAsyncHandler(async (req, res, next) => {
  const { id } = req.params;
  const { error, value } = updateProductValidator.validate(req.body, {
    abortEarly: false,
  });
  if (error) {
    return next(
      new CustomError(400, error.details.map((ele) => ele.message).join(", "))
    );
  }
  const updateData = { ...value };
  if (updateData.category) {
    updateData.category = Array.isArray(updateData.category)
      ? updateData.category
      : [updateData.category];
  }
  if (updateData.subCategory) {
    updateData.subCategory = Array.isArray(updateData.subCategory)
      ? updateData.subCategory
      : [updateData.subCategory];
  }

  const updateProduct = await ProductModel.findByIdAndUpdate(
    id,
    { $set: updateData },
    {
      new: true,
      runValidators: true,
    },
  );
  if (!updateProduct)
    return next(new CustomError(404, "No product found to update"));
  new ApiResponse(200, "Product updated Successfully", updateProduct).send(res);
});

export const deleteProduct = expressAsyncHandler(async (req, res, next) => {
  const { id } = req.params;
  const deletedProduct = await ProductModel.findByIdAndDelete(id, {
    new: true,
  });
  if (!deletedProduct) return next(new CustomError(404, "No product found"));
  new ApiResponse(200, "Product deleted successfully", deletedProduct).send(
    res
  );
});

export const getProducts = expressAsyncHandler(async (req, res, next) => {
  const pageNum = Math.max(1, Number(req.query.page) || 1);
  const limitNum = Math.max(1, Math.min(100, Number(req.query.limit) || 20));
  const skip = (pageNum - 1) * limitNum;

  const [products, total] = await Promise.all([
    ProductModel.find()
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limitNum)
      .select("-__v")
      .lean({ virtuals: true }),
    ProductModel.countDocuments(),
  ]);

  if (!total) {
    return next(new CustomError(404, "No products found, add some"));
  }

  const totalPages = Math.max(Math.ceil(total / limitNum), 1);
  const meta = {
    page: pageNum,
    limit: limitNum,
    totalItems: total,
    totalPages,
    hasNext: pageNum < totalPages,
    hasPrev: pageNum > 1,
  };

  new ApiResponse(200, "fetched products successfully!", products, meta).send(
    res,
  );
});

export const getProduct = expressAsyncHandler(async (req, res, next) => {
  const { id } = req.params;
  const product = await ProductModel.findById(id);
  if (!product) return next(new CustomError(404, "not found anything"));
  new ApiResponse(200, "Found the product", product).send(res);
});

export const updateImage = expressAsyncHandler(async (req, res, next) => {
  const { public_id, productId, id } = req.body;
  const targetId = productId || id;
  if (!targetId) {
    return next(new CustomError(400, "Product id is required"));
  }
  if (!req.file) {
    return next(new CustomError(400, "Product image is required"));
  }
  const bufferValue = req?.file?.buffer;
  const imageURL = getURL(bufferValue, req?.file?.mimetype);

  let existingProduct = await ProductModel.findById(targetId);
  if (!existingProduct) {
    return next(new CustomError(404, "cannot find the product"));
  }

  const resp = await deleteUploadedImage(public_id);

  if (resp.result?.toLowerCase() !== "ok") {
    return next(new CustomError(500, resp.result));
  }

  const uploadedResp = await uploadImage(imageURL);
  const updatedImages = [
    {
      public_id: uploadedResp.public_id,
      url: uploadedResp.secure_url,
      asset_id: uploadedResp.asset_id,
    },
  ];
  existingProduct.images = updatedImages;
  await existingProduct.save();

  new ApiResponse(200, "Image Updated Successfully").send(res);
});

export const deleteImage = expressAsyncHandler(async (req, res, next) => {
  const { public_id, productId } = req.body;
  if (!productId) {
    return next(new CustomError(400, "Product id is required"));
  }

  let existingProduct = await ProductModel.findById(productId);
  if (!existingProduct) return next(new CustomError(404, "Product Not Found"));

  const resp = await deleteUploadedImage(public_id);

  if (resp.result?.toLowerCase() === "ok") {
    existingProduct.images = [];
    await existingProduct.save();
  } else {
    return next(new CustomError(500, resp.result));
  }

  new ApiResponse(200, "Image Deleted Successfully", resp).send(res);
});
