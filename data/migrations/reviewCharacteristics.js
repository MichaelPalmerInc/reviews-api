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

  console.log("Inserting characteristics into reviews");
  const start = Date.now();
  let parser = fs
    .createReadStream(config.migrations.reviewsCharacteristics)
    .pipe(csv());
  let count = 0;
  let totalCount = 0;
  let reviews = {};
  for await (const row of parser) {
    const review_id = parseInt(row.review_id);
    const characteristic_id = parseInt(row.characteristic_id);
    const value = parseInt(row.value);
    reviews[review_id] = reviews[review_id] || [];
    const obj = {};
    obj[characteristic_id] = value;
    reviews[review_id].push(obj);
    count++;
    if (count >= batchSize) {
      const writes = [];
      for (const review_id in reviews) {
        writes.push({
          updateOne: {
            filter: { "reviews.review_id": parseInt(review_id) },
            update: {
              $push: {
                "reviews.$.characteristics": { $each: reviews[review_id] },
              },
            },
          },
        });
      }
      const result = await SDCReviews.bulkWrite(writes, { ordered: false });
      totalCount += count;
      console.log(totalCount);
      count = 0;
      reviews = {};
    }
  }
  const writes = [];
  for (let review_id in reviews) {
    writes.push({
      updateOne: {
        filter: { "reviews.review_id": parseInt(review_id) },
        update: {
          $push: {
            "reviews.$.characteristics": { $each: reviews[review_id] },
          },
        },
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
