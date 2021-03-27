import express from 'express';
import { MongoClient } from 'mongodb';
import router from './controllers';

import config from '../config';

const app = express();

app.use('/reviews', router);

console.log('I assume this works');
console.log(config.database.mongoUri);
MongoClient.connect(config.database.mongoUri, { useNewUrlParser: true, useUnifiedTopology: true, poolSize: 300 })
  .then((client) => {
    console.log(`Connected to the mongo database at ${config.database.mongoUri}`);
    app.locals.db = client.db();
    app.listen(config.port, () => {
      console.log(`Express listening on port ${config.port}`);
    });
  })
  .catch((err) => {
    console.error(err);
    process.exit(1);
  });
