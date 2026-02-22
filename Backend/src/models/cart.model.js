import mongoose from 'mongoose';
const cartSchema=new mongoose.Schema({
    productId:{
      type:mongoose.Schema.ObjectId,
      ref:'Product',
    },
    quantity:{
      type:Number,
      default:1,
    },
    userId:{
      type:mongoose.Schema.ObjectId,
      ref:"User"
    }
},{timestamps:true}
);
cartSchema.index({ userId: 1, productId: 1 }, { unique: true });
cartSchema.index({ userId: 1, createdAt: -1 });
const cartModel=mongoose.model('Cart',cartSchema);
export default cartModel;