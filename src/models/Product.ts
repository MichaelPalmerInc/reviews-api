import mongoose, { Model, Document } from 'mongoose';
import { ProductDocument } from '../types';
import productSchema from './schemas/Product';

const Product: Model<ProductDocument> = mongoose.model('Product', productSchema, 'SDCReviews');
export default Product;
