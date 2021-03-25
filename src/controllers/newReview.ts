import { ObjectId } from 'mongodb';
import express from 'express';

const newReview: express.RequestHandler = async (req, res) => {
  const { product_id, rating, summary, body, recommend, name, email, photos, characteristics } = req.body;
  if (!product_id || !rating || !body || recommend === undefined || !name || !email || !photos || !characteristics) {
    return res.sendStatus(400);
  }
  const product = await req.app.locals.db.collection('SDCReviews').findOneAndUpdate(
    { product_id },
    {
      $push: {
        reviews: {
          _id: new ObjectId(),
          rating,
          summary: summary || '',
          body,
          recommend,
          response: null,
          reported: false,
          date: new Date(),
          reviewer_email: email,
          reviewer_name: name,
          helpfulness: 0,
          photos: photos.map((url: string, index: number) => ({ id: index, url })),
          characteristics,
        },
      },
    },
    { returnOriginal: false }
  );
  res.sendStatus(200);
};

export default newReview;
