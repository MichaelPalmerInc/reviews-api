import express from 'express';
import { Characteristic, MetaCharacteristics, MetaCharacteristicsById, Review } from '../types';

const meta: express.RequestHandler = async (req, res) => {
  const product_id = parseInt(req.query.product_id as string);
  if (isNaN(product_id)) {
    res.sendStatus(400);
    return;
  }
  const product = await req.app.locals.db.collection('SDCReviews').findOne({ product_id });
  if (!product) {
    res.sendStatus(404);
    return;
  }
  const ratings: number[] = new Array(5).fill(0);
  const charsById: MetaCharacteristicsById = {};
  const charsByName: MetaCharacteristics = {};
  const numReviews: number = product.reviews.length;
  let recommend = 0;
  product.characteristics.forEach(({ id, name }: Characteristic) => {
    charsById[id] = { name, value: 0 };
  });
  product.reviews.forEach((review: Review) => {
    ratings[review.rating - 1]++;
    const chars = review.characteristics;
    for (const char in chars) {
      charsById[char].value += chars[char];
    }
    if (review.recommend) recommend++;
  });
  const metaRatings: { [key: number]: number } = {};
  ratings.forEach((rating, i) => {
    if (rating > 0) {
      metaRatings[i + 1] = rating;
    }
  });
  for (const id in charsById) {
    charsByName[charsById[id].name] = {
      id: parseInt(id),
      value: Math.round((charsById[id].value * 10000) / numReviews) / 10000,
    };
  }
  res.json({
    product_id,
    ratings: metaRatings,
    recommended: {
      true: recommend,
      false: numReviews - recommend,
    },
    characteristics: charsByName,
  });
};

export default meta;
