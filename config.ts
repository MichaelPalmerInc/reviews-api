import path from 'path';
import dotenv from 'dotenv';

dotenv.config();

const dataDir = process.env.DATA_DIR || 'data/';
export default {
  database: {
    mongoUri: process.env.MONGO_URI || 'mongodb://localhost/',
  },
  migrations: {
    reviews: path.join(process.cwd(), dataDir, 'reviews.csv'),
    reviewsPhotos: path.join(process.cwd(), dataDir, 'reviews_photos.csv'),
    characteristics: path.join(process.cwd(), dataDir, 'characteristics.csv'),
    reviewsCharacteristics: path.join(process.cwd(), dataDir, 'characteristic_reviews.csv'),
    batchSize: process.env.BATCH_SIZE || 1000,
  },
  port: process.env.NODE_PORT || process.env.PORT || 3000,
};
