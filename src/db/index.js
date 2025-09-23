import mongoose from "mongoose";
import { DB_NAME } from "../constants.js";



const DB_Connection = async () => {
    try {
        const dataBaseConnectionInstance = await mongoose.connect(`${process.env.MONGODB_URI}/${DB_NAME}`)
        console.log(`Successfully Created the Data Base Connection !! DB Host ${dataBaseConnectionInstance.connection.host}`)
        
    } catch (error) {
        console.log("MongoDb Connection Failed" , error);
        process.exit(1);
        
    }
}

export default DB_Connection ; 