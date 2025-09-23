// this file is basically
import 'dotenv/config'
import DB_Connection from './db/index.js'
import app from './app.js';

const PORT = process.env.PORT || 8000 ; 


DB_Connection()
.then(()=>{
    app.listen(PORT , () => {
        console.log(`Application is live on http://localhost:${PORT}`)
    })
})
.catch((error) => {
    console.log('Mongo DB connextion Failed!!!' , error);
})