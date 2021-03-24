import { ObjectId } from 'bson';
import { Model, Schema } from 'mongoose';
import { ProductDocument, Review, ReviewDocument } from '../../types';
import Product, { ProductModel } from '../Product';
import characteristicSchema from './Characteristic';
import reviewSchema from './Review';

const productSchema = new Schema<ProductDocument>({
  product_id: Number,
  characteristics: [characteristicSchema],
  reviews: [reviewSchema],
});

productSchema.methods.addReview = function (this: ProductDocument, review) {
  console.log(review.characteristics);
  this.reviews.push({
    _id: new ObjectId(),
    rating: review.rating,
    summary: review.summary || '',
    body: review.body,
    recommend: review.recommend,
    response: null,
    reported: false,
    date: new Date(),
    reviewer_email: review.email,
    reviewer_name: review.name,
    helpfulness: 0,
    photos: review.photos.map((url: string, index: number) => ({ id: index, url: url })),
    characteristics: review.characteristics,
  });
  return this.save();
};

productSchema.statics.findReview = async function (
  this: Model<ProductDocument>,
  reviewId: string
): Promise<Review | undefined> {
  return (await this.findOne({ 'reviews._id': new ObjectId(reviewId) }, { 'reviews.$': 1 }))?.reviews[0];
};

productSchema.statics.markReviewHelpful = async function (
  this: Model<ProductDocument>,
  reviewId: string
): Promise<boolean> {
  try {
    const result = await this.findOneAndUpdate(
      { 'reviews._id': new ObjectId(reviewId) },
      { $inc: { 'reviews.$.helpfulness': 1 } }
    );
    console.log('$inc:', result);
    return true;
  } catch {
    return false;
  }
};

productSchema.statics.reportReview = async function (this: Model<ProductDocument>, reviewId: string): Promise<boolean> {
  try {
    const result = await this.findOneAndUpdate(
      { 'reviews._id': new ObjectId(reviewId) },
      { $set: { 'reviews.$.reported': true } }
    );
    console.log('reported: ', result);
    return true;
  } catch {
    return false;
  }
};
export default productSchema;
