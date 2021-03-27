import express from 'express';
import bodyParser from 'body-parser';
import { Review } from '../types';
import newReview from './newReview';
import meta from './meta';
import report from './report';
import helpful from './helpful';

const router = express.Router();

router.post('/', bodyParser.json(), newReview);
router.get('/meta/', meta);
router.put('/:reviewId/helpful', helpful);
router.put('/:reviewId/report', report);
router.get('/', async (req, res) => {
  const count = parseInt(req.query.count as string) || 5;
  const page = parseInt(req.query.page as string) || 1;
  const sort = req.query.sort || 'relevant';
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
  res.json({
    product: product_id,
    page: page,
    count: count,
    results: product.reviews
      .filter((review: Review) => !review.reported)
      .map((review: Review) => ({
        review_id: review._id,
        rating: review.rating,
        summary: review.summary,
        body: review.body,
        recommend: review.recommend,
        response: review.response,
        date: review.date.toISOString(),
        reviewer_name: review.reviewer_name,
        helpfulness: review.helpfulness,
        photos: review.photos?.map((photo) => photo.url),
      }))
      .slice(count * (page - 1), count * page),
  });
});

export default router;
