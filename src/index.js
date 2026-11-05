import dns from 'node:dns';

// Forcing Google DNS breaks private AWS hostnames (DocumentDB, ECS Service Connect),
// so only do it when explicitly asked (e.g. on a local network with SRV lookup issues)
if (process.env.USE_PUBLIC_DNS === 'true') {
  dns.setServers(['8.8.8.8', '8.8.4.4']);
}

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
