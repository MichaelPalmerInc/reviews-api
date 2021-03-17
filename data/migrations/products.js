const { MongoClient } = require("mongodb");
const csv = require("csv-parser");
const fs = require("fs");

const config = require("../../config");
const batchSize = process.env.BATCH_SIZE || 10000;

const client = new MongoClient(config.database.mongoUri, {
  useNewUrlParser: true,
  useUnifiedTopology: true,
});

const parseBoolean = (string) => {
  const cased = string.toLowerCase();
  if (cased === "true" || cased === "1" || cased === "yes") {
    return true;
  } else if (cased == "false" || cased === "0" || cased === "no") {
    return false;
  } else {
    throw new Error(string);
  }
};

(async () => {
  await client.connect();
  console.log("Connected");

  const database = client.db("SDCReviews");
  const SDCReviews = database.collection("SDCReviews");
  SDCReviews.drop();
  SDCReviews.createIndex({ product_id: 1 });
  SDCReviews.createIndex({ "reviews.review_id": 1 });

  console.log("Inserting reviews into collection");
  const start = Date.now();
  let parser = fs.createReadStream(config.migrations.reviews).pipe(csv());
  let count = 0;
  let totalCount = 0;
  let products = {};
  let productsInDB = {};
  for await (const row of parser) {
    const nextReview = {
      review_id: row.id,
      rating: parseInt(row.rating),
      summary: row.summary,
      recommend: parseBoolean(row.recommend),
      response: row.response === "null" ? null : row.response,
      body: row.body,
      date: new Date(row.date),
      reviewer_name: row.reviewer_name,
      reviewer_email: row.reviewer_email,
      helpfulness: parseInt(row.helpfulness),
    };
    products[row.product_id] = products[row.product_id] || {
      product_id: row.product_id,
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
              filter: { product_id: key },
              update: { $push: { reviews: { $each: products[key].reviews } } },
              upsert: true,
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
          filter: { product_id: key },
          update: { $push: { reviews: { $each: products[key].reviews } } },
          upsert: true,
        },
      });
    } else {
      productsInDB[key] = true;
      writes.push({
        insertOne: { document: products[key] },
      });
    }
  }
  const result = await SDCReviews.bulkWrite(writes);
  totalCount += count;
  const end = Date.now();
  console.log(
    `Added ${totalCount} reviews into the database in ${
      Math.round((end - start) / 10) / 100
    }s`
  );

  client.close();
})();
