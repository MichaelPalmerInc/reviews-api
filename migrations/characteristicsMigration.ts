import { MongoClient } from 'mongodb';
import csv from 'csv-parser';
import fs from 'fs';
import config from '../config';

const batchSize = config.migrations.batchSize;

const client = new MongoClient(config.database.mongoUri, {
  useNewUrlParser: true,
  useUnifiedTopology: true,
});

const characteristicsMigration = async () => {
  await client.connect();
  console.log(`Connected to mongo at ${config.database.mongoUri}`);

  const database = client.db('SDCReviews');
  const SDCReviews = database.collection('SDCReviews');

  console.log('Inserting characteristics into product documents');
  const start = Date.now();
  const parser = fs.createReadStream(config.migrations.characteristics).pipe(csv());
  let count = 0;
  let totalCount = 0;
  let products = {};

  for await (const row of parser) {
    products[row.product_id] = products[row.product_id] || [];
    products[row.product_id].push({ id: parseInt(row.id), name: row.name });
    count++;
    if (count >= batchSize) {
      const writes = [];
      for (const key in products) {
        writes.push({
          updateOne: {
            filter: { product_id: parseInt(key) },
            update: { $push: { characteristics: { $each: products[key] } } },
          },
        });
      }
      await SDCReviews.bulkWrite(writes, { ordered: false });
      totalCount += count;
      console.log(totalCount);
      count = 0;
      products = {};
    }
  }

  const writes = [];
  for (const key in products) {
    writes.push({
      updateOne: {
        filter: { product_id: parseInt(key) },
        update: { $push: { characteristics: { $each: products[key] } } },
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
    await characteristicsMigration();
  })();
}

export default characteristicsMigration;
