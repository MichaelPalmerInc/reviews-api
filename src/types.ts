import { Document } from 'mongoose';

export type Review = {
  review_id: number;
  rating: number;
  summary: string;
  recommend: boolean;
  response: string | null;
  body: string;
  date: Date;
  reviewer_email: string;
  reviewer_name: string;
  helpfulness: number;
  photos?: {
    id: number;
    url: string;
  }[];
  characteristics?: {
    [key: string]: number;
  };
};

export type Characteristic = {
  id: number;
  name: string;
};

export type Photo = {
  id: number;
  url: string;
};

export interface ProductDocument extends Document {
  product_id: number;
  reviews: Review[];
  characteristics?: Characteristic[];
}
