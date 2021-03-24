import mongoose, { Model } from 'mongoose';
import { ProductDocument, Review, ReviewDocument } from '../types';
import productSchema from './schemas/Product';

export interface ProductModel extends Model<ProductDocument> {
  findReview: (reviewId: string) => Promise<ReviewDocument>;
  markReviewHelpful: (reviewId: string) => Promise<boolean>;
  reportReview: (reviewId: string) => Promise<boolean>;
}

const Product = mongoose.model<ProductDocument, ProductModel>('Product', productSchema, 'SDCReviews');
export default Product;
