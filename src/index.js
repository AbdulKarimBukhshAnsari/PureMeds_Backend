import dns from 'node:dns';

dns.setServers(['8.8.8.8', '8.8.4.4']);

import 'dotenv/config';
import DB_Connection from './db/index.js';
import app from './app.js';

const PORT = process.env.PORT || 8000;

DB_Connection()
  .then(() => {
    app.listen(PORT, () => {
      console.log(`Application is live on http://localhost:${PORT}`);
    });
  })
  .catch((error) => {
    console.log('Mongo DB connection Failed!!!', error);
  });