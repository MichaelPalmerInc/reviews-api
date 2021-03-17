const { MongoClient } = require("mongodb");
const csv = require("csv-parser");
const fs = require("fs");

const config = require("../../config");
const batchSize = process.env.BATCH_SIZE || 10000;

const client = new MongoClient(config.database.mongoUri, {
  useNewUrlParser: true,
  useUnifiedTopology: true,
});

(async () => {
  await client.connect();
  console.log("Connected");

  const database = client.db("SDCReviews");
  const SDCReviews = database.collection("SDCReviews");

  console.log("Inserting characteristics into products");
  const start = Date.now();
  let parser = fs
    .createReadStream(config.migrations.characteristics)
    .pipe(csv());
  let count = 0;
  let totalCount = 0;
  let products = {};
  for await (const row of parser) {
    products[row.product_id] = products[row.product_id] || [];
    products[row.product_id].push({ id: parseInt(row.id), name: row.name });
    count++;
    if (count >= batchSize) {
      const writes = [];
      for (let key in products) {
        writes.push({
          updateOne: {
            filter: { product_id: parseInt(key) },
            update: { $push: { characteristics: { $each: products[key] } } },
          },
        });
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
    writes.push({
      updateOne: {
        filter: { product_id: parseInt(key) },
        update: { $push: { characteristics: { $each: products[key] } } },
      },
    });
  }
  const result = await SDCReviews.bulkWrite(writes, { ordered: false });
  totalCount += count;

  const end = Date.now();
  console.log(
    `Added ${totalCount} characteristics into the database in ${
      Math.round((end - start) / 10) / 100
    }s`
  );

  client.close();
})();
