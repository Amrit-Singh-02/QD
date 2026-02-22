
import mongoose from "mongoose";

const productSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: true,
    },
    description: {
      type: String,
      required: true,
    },
    price: {
      type: Number,
      required: true,
    },
    discount : {
        type : Number,
        default : null
    },
    images: [
      {
        url: {
          type: String,
          required: true,
        },
        asset_id: {
          type: String,
          required: true,
        },
        public_id: {
          type: String,
          required: true,
        },
        _id: false,
      },
    ],
    category : [
        {
            type : mongoose.Schema.ObjectId,
            ref : 'category'
        }
    ],
    subCategory : [
        {
            type : mongoose.Schema.ObjectId,
            ref : 'subCategory'
        }
    ],
    brand: {
      type: String,
      required: true,
    },
    stocks: {
      type: Number,
      required: true,
    },
  },
  {
    timestamps: true,
    timeseries: true,
    toJSON:{
      transform(doc,ret){
        delete ret .__v;
        ret.id=ret._id;
        delete ret._id
      }
    },
    toObject:{
      transform(doc,ret){
        delete ret.__v;
        ret.id=ret._id;
        delete ret._id;
      }
    }
  }
);

productSchema.index({ name: "text", brand: "text", description: "text" });
productSchema.index({ price: 1 });
productSchema.index({ discount: 1 });
productSchema.index({ createdAt: -1 });

const ProductModel = mongoose.model("Product", productSchema);
export default ProductModel;