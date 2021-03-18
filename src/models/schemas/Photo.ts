import { Schema } from 'mongoose';

const photoSchema = new Schema(
  {
    id: Number,
    url: String,
  },
  { _id: false }
);

export default photoSchema;
