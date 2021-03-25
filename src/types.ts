import express from 'express';
import { ObjectId } from 'mongodb';

export type Review = {
  _id: ObjectId;
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

export type MetaCharacteristics = {
  [key: string]: {
    id: number;
    value: number;
  };
};

export type MetaCharacteristicsById = {
  [key: string]: {
    name: string;
    value: number;
  };
};

export enum Rating {
  one = 1,
  two,
  three,
  four,
  five,
}
export type MetaRating = {
  1?: number;
  2?: number;
  3?: number;
  4?: number;
  5?: number;
};

export type NewReview = {
  product_id?: number;
  rating: number;
  summary?: string;
  body: string;
  recommend: boolean;
  name: string;
  email: string;
  photos: string[];
  characteristics: string;
};

export interface ProductDocument extends Document {
  product_id: number;
  reviews: Review[];
  characteristics?: Characteristic[];
  addReview: (review: NewReview) => Promise<ProductDocument>;
}
