import dataloader from 'dataloader';
import { ProductDocument } from '../types';
import Product from '../models/Product';

const fetchProduct = async (id: number) => {
  return await Product.findOne({ product_id: id });
};

const fetchReview = async (id: number) => {
  const product = await Product.findOne({ 'reviews.review_id': id });
  return product?.reviews.filter((r) => r.review_id === id)[0];
};

const createLoaders = () => {
  return {
    products: new dataloader((ids: readonly number[]) => Promise.all(ids.map((id) => fetchProduct(id)))),
    reviews: new dataloader((ids: readonly number[]) => Promise.all(ids.map((id) => fetchReview(id)))),
  };
};

export default createLoaders;
