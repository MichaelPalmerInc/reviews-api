import dataloader from 'dataloader';
import { NewReview, ProductDocument } from '../types';
import Product from '../models/Product';
import { ObjectId } from 'mongodb';

const fetchProduct = async (id: number) => {
  return await Product.findOne({ product_id: id });
};

const fetchReview = async (id: ObjectId | number | string) => {
  if (typeof id === 'number') {
    id = new ObjectId(id.toString().padStart(24, '0'));
  } else if (typeof id === 'string') {
    id = new ObjectId(id);
  }
  const product = await Product.findOne({ 'reviews.review_id': id });
  return product?.reviews.filter((r) => r._id === id)[0];
};

const createLoaders = () => {
  return {
    products: new dataloader((ids: readonly number[]) => Promise.all(ids.map((id) => fetchProduct(id)))),
    reviews: new dataloader((ids: readonly number[]) => Promise.all(ids.map((id) => fetchReview(id)))),
  };
};

export default createLoaders;
