import { v2 as cloudinary } from "cloudinary";
import fs from "fs"

cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET, 
});

const uploadOnCloudinary = async (localFilePath) => {
    try {
        console.log("Local Path" ,localFilePath)
        if(!localFilePath) return null
        const response = await cloudinary.uploader.upload(localFilePath , {
            resource_type : "auto"
        })
        fs.unlinkSync(localFilePath);
        return response ; // we can get the response URL which we will save into our DataBase so that we can aceess it later on 
        
    } catch (error) {
        fs.unlinkSync(localFilePath)
        return null ;
    
    }
}

export {uploadOnCloudinary} 