import { Schema } from 'mongoose';
import photoSchema from './Photo';

const reviewSchema = new Schema({
  rating: Number,
  summary: String,
  recommend: Boolean,
  reported: Boolean,
  response: String,
  body: String,
  date: Date,
  reviewer_name: String,
  reviewer_email: String,
  helpfulness: Number,
  photos: [photoSchema],
  characteristics: {},
});

export default reviewSchema;
