import { MongoClient } from 'mongodb';
import csv from 'csv-parser';
import fs from 'fs';
import config from '../config';

const batchSize = process.env.BATCH_SIZE || 100000;

const client = new MongoClient(config.database.mongoUri, {
  useNewUrlParser: true,
  useUnifiedTopology: true,
});

const parseBoolean = (string: string): boolean => {
  const cased = string.toLowerCase();
  return cased === 'true' || cased === '1' || cased === 'yes';
};

const productsMigration = async () => {
  await client.connect();
  console.log('Connected to mongo at: ', config.database.mongoUri);

  const database = client.db('SDCReviews');
  const SDCReviews = database.collection('SDCReviews');
  SDCReviews.drop();
  SDCReviews.createIndex({ product_id: 1 });
  SDCReviews.createIndex({ 'reviews.review_id': 1 });

  console.log('Beginning insertion of reviews into collection');
  console.log('========================================================');
  const start = Date.now();
  const parser = fs.createReadStream(config.migrations.reviews).pipe(csv());
  let count = 0;
  let totalCount = 0;
  let products: ProductDocumentObject = {};
  let productsInDB: { [key: string]: boolean } = {};
  for await (const row of parser) {
    const nextReview: Review = {
      review_id: parseInt(row.id),
      rating: parseInt(row.rating),
      summary: row.summary,
      recommend: parseBoolean(row.recommend),
      response: row.response === 'null' || row.response === '' ? null : row.response,
      body: row.body,
      date: new Date(row.date),
      reviewer_name: row.reviewer_name,
      reviewer_email: row.reviewer_email,
      helpfulness: parseInt(row.helpfulness),
    };
    products[row.product_id] = products[row.product_id] || {
      product_id: parseInt(row.product_id),
      reviews: [],
    };
    products[row.product_id].reviews.push(nextReview);
    count++;
    if (count >= batchSize) {
      const writes = [];
      for (let key in products) {
        if (productsInDB[key]) {
          writes.push({
            updateOne: {
              filter: { product_id: parseInt(key) },
              update: { $push: { reviews: { $each: products[key].reviews } } },
            },
          });
        } else {
          productsInDB[key] = true;
          writes.push({
            insertOne: { document: products[key] },
          });
        }
      }
      const result = await SDCReviews.bulkWrite(writes, { ordered: false });
      totalCount += count;
      console.log(totalCount);
      count = 0;
      products = {};
    }
  }
  const writes = [];
  for (let key in products) {
    if (productsInDB[key]) {
      writes.push({
        updateOne: {
          filter: { product_id: parseInt(key) },
          update: { $push: { reviews: { $each: products[key].reviews } } },
        },
      });
    } else {
      productsInDB[key] = true;
      writes.push({
        insertOne: { document: products[key] },
      });
    }
  }
  const result = await SDCReviews.bulkWrite(writes, { ordered: false });
  totalCount += count;
  const end = Date.now();
  console.log(`Added ${totalCount} reviews into the database in ${Math.round((end - start) / 10) / 100}s`);

  client.close();
};

if (require.main === module) {
  (async () => {
    productsMigration();
  })();
}

export default productsMigration;

type ReviewCsv = {
  id: string;
  product_id: string;
  rating: string;
  date: string;
  summary: string;
  body: string;
  recommend: string;
  reported: string;
  reviewer_name: string;
  reviewer_email: string;
  response: string;
  helpfulness: string;
};

type Review = {
  review_id: number;
  rating: number;
  summary: string;
  recommend: boolean;
  response: string | null;
  body: string;
  date: Date;
  reviewer_name: string;
  reviewer_email: string;
  helpfulness: number;
  photos?: {
    id: number;
    url: string;
  }[];
};

type ProductDocument = {
  product_id: number;
  reviews: Review[];
};

type ProductDocumentObject = {
  [key: string]: ProductDocument;
};
