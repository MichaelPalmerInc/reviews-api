import express from 'express';
import mongoose from 'mongoose';
import { graphql } from 'graphql';
import { graphqlHTTP } from 'express-graphql';

import config from '../config';
import createLoaders from './graphql/dataloader';
import schema from './graphql/schema';
import { CustomRequest } from './types';

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
  console.log(typeof product_id, product_id);
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

app.listen(config.port, () => {
  console.log(`Express listening on port ${config.port}`);
  console.log(`Attempting to connect to mongo@${config.database.mongoUri}`);
  mongoose.set('debug', true);
  mongoose.connect(config.database.mongoUri, { useNewUrlParser: true, useUnifiedTopology: true });
  mongoose.connection.once('open', () => {
    console.log(`Connected to mongo DB ${mongoose.connection.name}@${mongoose.connection.host}`);
  });
});
