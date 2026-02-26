import multer from 'multer';
import { v2 as cloudinary } from 'cloudinary';
import fs from 'fs';
import dotenv from 'dotenv';


dotenv.config();



cloudinary.config({
    cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
    api_key: process.env.CLOUDINARY_API_KEY,
    api_secret: process.env.CLOUDINARY_API_SECRET
});

const uploadFileToCloudinary = async (file) => {
    const options = {
        resource_type: file.mimetype.startsWith('video/') ? 'video' : 'image',
    }

    return new Promise((resolve, reject) => {
        const uploader = file.mimetype.startsWith('video/') ? cloudinary.uploader.upload_large : cloudinary.uploader.upload;
        uploader(file.path, options, (error, result) => {
            fs.unlinkSync(file.path, () => {})
            if (error) return reject(error);
            resolve(result);
        });
    });};


   const multerMiddleware = multer({ dest: 'uploads/' }).single('media'); 


export {uploadFileToCloudinary, multerMiddleware };



