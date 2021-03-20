import express from 'express';
import mongoose from 'mongoose';
import { graphql } from 'graphql';
import { graphqlHTTP } from 'express-graphql';

import config from '../config';
import createLoaders from './graphql/dataloader';
import schema from './graphql/schema';
import {
  Characteristic,
  CustomRequest,
  MetaCharacteristics,
  MetaCharacteristicsById,
  MetaRating,
  Rating,
  Review,
} from './types';

const app = express();

const loaderMiddleware = (req: CustomRequest, res: express.Response, next: express.NextFunction) => {
  req.loaders = createLoaders();
  next();
};

app.use(loaderMiddleware);

app.use(
  '/graphql',
  graphqlHTTP({
    schema: schema,
    graphiql: true,
  })
);

app.get('/reviews/', async (req: CustomRequest, res) => {
  const count = parseInt(req.query.count as string) || 5;
  const page = parseInt(req.query.page as string) || 0;
  const sort = req.query.sort || 'relevant';
  const product_id = parseInt(req.query.product_id as string);
  if (isNaN(product_id)) {
    res.status(400);
    res.end();
    return;
  }
  const graphResponse = await graphql(
    schema,
    `{ 
    Reviews(product_id:${product_id},count:${count},page:${page}) { 
      review_id
      rating
      summary
      recommend
      response
      body
      date
      reviewer_name
      helpfulness
      photos {
        id
        url
      }
    }
  }`,
    undefined,
    req
  );
  res.json({
    product: product_id,
    page: page,
    count: count,
    results: graphResponse.data?.Reviews,
  });
});

app.get('/reviews/meta', async (req: CustomRequest, res) => {
  const product_id = parseInt(req.query.product_id as string);
  if (isNaN(product_id)) {
    res.status(400);
    res.end();
    return;
  }
  const graphResponse = await graphql(
    schema,
    `{
      Product(id:${product_id}) {
        characteristics {
          id
          name
        }
        reviews {
          recommend
          rating
          characteristics
        }
      }
    }`,
    undefined,
    req
  );
  const ratings = new Array(5).fill(0);
  const charsById: MetaCharacteristicsById = {};
  const charsByName: MetaCharacteristics = {};
  const numReviews = graphResponse.data?.Product.reviews.length;
  let recommend = 0;
  let noRecommend = 0;
  graphResponse.data?.Product.characteristics.forEach(({ id, name }: Characteristic) => {
    charsById[id] = { name, value: 0 };
  });
  graphResponse.data?.Product.reviews.forEach((review: Review) => {
    ratings[review.rating - 1]++;
    const chars = JSON.parse(review.characteristics ?? '');
    for (const char in chars) {
      charsById[char].value += chars[char];
    }
    if (review.recommend) {
      recommend++;
    } else {
      noRecommend++;
    }
  });

  const metaRatings: any = {};
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
  console.log('Ratings', metaRatings);
  console.log('Chars: ', charsByName);
  console.log('Recommend: ', recommend);
  res.json({
    product_id,
    ratings: metaRatings,
    recommended: {
      true: recommend,
      false: noRecommend
    },
    characteristics: charsByName;
  });
});

app.listen(config.port, () => {
  console.log(`Express listening on port ${config.port}`);
  console.log(`Attempting to connect to mongo@${config.database.mongoUri}`);
  mongoose.set('debug', true);
  mongoose.connect(config.database.mongoUri, { useNewUrlParser: true, useUnifiedTopology: true });
  mongoose.connection.once('open', () => {
    console.log(`Connected to mongo DB ${mongoose.connection.name}@${mongoose.connection.host}`);
  });
});
