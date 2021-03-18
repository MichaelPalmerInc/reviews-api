import express from 'express';
import mongoose from 'mongoose';
import Product from './models/Product';

import config from '../config';

const app = express();

app.get('/', (req, res) => {
  Product.findOne({ 'reviews.review_id': 1100 }).then((product) => {
    res.send(product);
  });
});

app.listen(config.port, () => {
  console.log(`Express listening on port ${config.port}`);
  console.log(`Attempting to connect to mongo@${config.database.mongoUri}`);
  mongoose.connect(config.database.mongoUri, { useNewUrlParser: true, useUnifiedTopology: true });
  mongoose.connection.once('open', () => {
    console.log(`Connected to mongo DB ${mongoose.connection.name}@${mongoose.connection.host}`);
  });
});
