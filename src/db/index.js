import mongoose from "mongoose";
import { DB_NAME } from "../constants.js";



const DB_Connection = async () => {
    try {
        // dbName is passed as an option so MONGODB_URI can carry query params
        // (DocumentDB needs ?tls=true&replicaSet=rs0&retryWrites=false ...)
        const options = { dbName: DB_NAME };
        if (process.env.MONGODB_TLS_CA_FILE) {
            options.tlsCAFile = process.env.MONGODB_TLS_CA_FILE;
        }
        const dataBaseConnectionInstance = await mongoose.connect(process.env.MONGODB_URI, options)
        console.log(`Successfully Created the Data Base Connection !! DB Host ${dataBaseConnectionInstance.connection.host}`)

    } catch (error) {
        console.log("MongoDb Connection Failed" , error);
        process.exit(1);

    }
}

export default DB_Connection ;
