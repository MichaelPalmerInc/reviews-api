import { Collection, MongoClient, ObjectId } from 'mongodb';
import csv from 'csv-parser';
import fs from 'fs';
import config from '../../config';
import { Photo, ProductDocument } from '../types';

const batchSize = config.migrations.batchSize;

const client = new MongoClient(config.database.mongoUri, {
  useNewUrlParser: true,
  useUnifiedTopology: true,
});

const reviewPhotoMigration = async () => {
  await client.connect();
  console.log(`Connected to mongo at ${config.database.mongoUri}`);

  const database = client.db('SDCReviews');
  const SDCReviews: Collection<ProductDocument> = database.collection('SDCReviews');

  console.log('Inserting photos into reviews');
  const start = Date.now();
  const parser = fs.createReadStream(config.migrations.reviewsPhotos).pipe(csv());
  let count = 0;
  let totalCount = 0;
  let reviews: { [key: string]: Photo[] } = {};
  for await (const row of parser) {
    const reviewId = row.review_id.padStart(24, '0');
    const id = parseInt(row.id);
    reviews[reviewId] = reviews[reviewId] || [];
    reviews[reviewId].push({ id: id, url: row.url });
    count++;
    if (count >= batchSize) {
      const writes = [];
      for (const reviewId in reviews) {
        writes.push({
          updateOne: {
            filter: { 'reviews._id': new ObjectId(reviewId) },
            update: {
              $push: {
                'reviews.$.photos': { $each: reviews[reviewId] },
              },
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
        filter: { 'reviews._id': new ObjectId(reviewId) },
        update: {
          $push: {
            'reviews.$.photos': { $each: reviews[reviewId] },
          },
        },
      },
    });
  }
  await SDCReviews.bulkWrite(writes, { ordered: false });
  totalCount += count;
  const end = Date.now();
  console.log(`Added ${totalCount} photos into the database in ${Math.round((end - start) / 10) / 100}s`);
  client.close();
};

if (require.main === module) {
  (async () => {
    reviewPhotoMigration();
  })();
}

export default reviewPhotoMigration;
