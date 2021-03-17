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

  console.log("Inserting photos into reviews");
  const start = Date.now();
  let parser = fs.createReadStream(config.migrations.reviewsPhotos).pipe(csv());
  let count = 0;
  let totalCount = 0;
  let reviews = {};
  for await (const row of parser) {
    const review_id = parseInt(row.review_id);
    const id = parseInt(row.id);
    reviews[review_id] = reviews[review_id] || [];
    reviews[review_id].push({ id, url: row.url });
    count++;
    if (count >= batchSize) {
      const writes = [];
      for (const review_id in reviews) {
        writes.push({
          updateOne: {
            filter: { "reviews.review_id": parseInt(review_id) },
            update: {
              $push: {
                "reviews.$.photos": { $each: reviews[review_id] },
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
  for (const review_id in reviews) {
    writes.push({
      updateOne: {
        filter: { "reviews.review_id": parseInt(review_id) },
        update: {
          $push: {
            "reviews.$.photos": { $each: reviews[review_id] },
          },
        },
      },
    });
  }
  const result = await SDCReviews.bulkWrite(writes, { ordered: false });
  totalCount += count;

  const end = Date.now();
  console.log(
    `Added ${totalCount} photos into the database in ${
      Math.round((end - start) / 10) / 100
    }s`
  );

  client.close();
})();
