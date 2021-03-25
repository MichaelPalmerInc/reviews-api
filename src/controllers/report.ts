import { ObjectId } from 'mongodb';
import express from 'express';

const report: express.RequestHandler = async (req, res) => {
  try {
    if (!req.params.reviewId || req.params.reviewId.length !== 24) {
      res.sendStatus(404);
      return;
    }
    const result = await req.app.locals.db
      .collection('SDCReviews')
      .updateOne({ 'reviews._id': new ObjectId(req.params.reviewId) }, { $set: { 'reviews.$.reported': true } });
    if (result.modifiedCount === 1) {
      res.sendStatus(204);
    } else {
      res.sendStatus(404);
    }
  } catch {
    res.sendStatus(500);
  }
};

export default report;
