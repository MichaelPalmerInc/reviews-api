import { Schema } from 'mongoose';
import characteristicSchema from './Characteristic';
import reviewSchema from './Review';

const productSchema = new Schema({
  product_id: Number,
  characteristics: [characteristicSchema],
  reviews: [reviewSchema],
});

export default productSchema;
