const path = require("path");

//All filepaths should be absolute.

module.exports = {
  database: {
    mongoUri: "FULL_MONGO_URL_INCLUDING_DB_AND_USERNAME/PASSWORD",
  },
  migrations: {
    reviews: path(__dirname, "data/reviews.csv"),
    reviewsPhotos: path(__dirname, "data/reviews_photos.csv"),
    characteristics: path(__dirname, "data/characteristics.csv"),
    reviewsCharacteristics: path(__dirname, "data/characteristic_reviews.csv"),
  },
};
