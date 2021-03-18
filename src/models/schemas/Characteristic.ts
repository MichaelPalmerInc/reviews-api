import { Schema } from 'mongoose';

const characteristicSchema: Schema = new Schema(
  {
    id: Number,
    name: String,
  },
  { _id: false }
);

export default characteristicSchema;
