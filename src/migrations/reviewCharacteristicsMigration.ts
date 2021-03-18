import { Collection, MongoClient } from 'mongodb';
import csv from 'csv-parser';
import fs from 'fs';
import config from '../../config';
import { ProductDocument } from '../types';

const batchSize = config.migrations.batchSize;

const client = new MongoClient(config.database.mongoUri, {
  useNewUrlParser: true,
  useUnifiedTopology: true,
});

const reviewCharacteristicsMigration = async () => {
  await client.connect();
  console.log(`Connected to mongo at ${config.database.mongoUri}`);

  const database = client.db('SDCReviews');
  const SDCReviews: Collection<ProductDocument> = database.collection('SDCReviews');

  console.log('Inserting characteristics into reviews');
  const start = Date.now();
  const parser = fs.createReadStream(config.migrations.reviewsCharacteristics).pipe(csv());
  let count = 0;
  let totalCount = 0;
  let reviews: { [key: string]: { [key: string]: number } } = {};
  for await (const row of parser) {
    const reviewId = parseInt(row.review_id);
    const characteristicId = parseInt(row.characteristic_id);
    const value = parseInt(row.value);
    reviews[reviewId] = reviews[reviewId] || {};
    reviews[reviewId][characteristicId] = value;
    count++;
    if (count >= batchSize) {
      const writes = [];
      for (const reviewId in reviews) {
        writes.push({
          updateOne: {
            filter: { 'reviews.review_id': parseInt(reviewId) },
            update: {
              $set: { 'reviews.$.characteristics': reviews[reviewId] },
            },
          },
        });
      }
      await SDCReviews.bulkWrite(writes, { ordered: false });
      totalCount += count;
      console.log(totalCount);
      count = 0;
      reviews = {};
    }
  }
  const writes = [];
  for (const reviewId in reviews) {
    writes.push({
      updateOne: {
        filter: { 'reviews.review_id': parseInt(reviewId) },
        update: {
          $set: {
            'reviews.$.characteristics': reviews[reviewId],
          },
        },
      },
    });
  }
  await SDCReviews.bulkWrite(writes, { ordered: false });
  totalCount += count;
  const end = Date.now();
  console.log(`Added ${totalCount} characteristics into the database in ${Math.round((end - start) / 10) / 100}s`);

  client.close();
};

if (require.main === module) {
  (async () => {
    reviewCharacteristicsMigration();
  })();
}

export default reviewCharacteristicsMigration;
