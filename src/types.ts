import { Document } from 'mongoose';
import express from 'express';
import DataLoader from 'dataloader';

export interface CustomRequest extends express.Request {
  loaders?: Loaders;
}

export type Loaders = {
  products: DataLoader<number, ProductDocument | null, number>;
  reviews: DataLoader<number, Review | undefined, number>;
};

export type Review = {
  review_id: number;
  rating: number;
  summary: string;
  recommend: boolean;
  response: string | null;
  reported?: boolean;
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
