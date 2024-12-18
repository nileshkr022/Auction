import errorHandler from "../middlewares/error.js";
import { User } from "../models/userSchema.js";
import {v2 as cloudinary} from "cloudinary";

export const register = async(req,res,next) => {
    if(!req.files||Object.keys(req.files).length===0){
        return next(new errorHandler("Profile Image required.",400));
    }
    const {profileImage} = req.files;

    const allowedFormats = ["image/png", "image/jpeg", "image/webp"];
    if(!allowedFormats.includes(profileImage.mimetypes)){
        return next(new errorHandler("File format not supported.",400));
    }

    const {
         userName,
         email,
         password,
         phone,
         address,
         role,
         bankAccountNumber,bankAccountName,
         bankName,
         upiNumber,
         payPalemail
        } = req.body;

         if(!userName || !email || !phone|| !password ||  !address || !role){
            return next(new errorHandler("Please fill all details properly",400))
         }
         if(role === "Auctioneer"){
            if(!bankAccountName || !bankAccountNumber || !bankName){
                return next (new errorHandler("Please provide full bank details",400));
            }
            if(!upiNumber){
                return next (new errorHandler("Please provide upi number",400));
            }
            if(!payPalemail){
                return next (new errorHandler("Please provide payPal email",400));
            }
         }

         const isRegistered = await User.findOne({email});
         if(isRegistered){
            return next (new errorHandler("User already exists",400));
         }
         

         const cloudinaryResponse = await cloudinary.uploader.upload(profileImage.tempFilepath,{
            folder: "MERN_AUCTION_PLATFORM_USERS",
         }
        );
        if(!cloudinaryResponse||cloudinaryResponse.error){
            console.error("cloudinary error:",cloudinaryResponse.error || "unknown cloudinary error.");
            return next(new errorHandler("failed to uploaad profile image",500)
        );
        }
        const user = await User.create({
         userName,
         email,
         password,
         phone,
         address,
         role,
         profileImage:{
            public_id:cloudinaryResponse.public_id,
            url: cloudinaryResponse.secure_url,
         },
         paymentMethods:{
            bankTransfer:{
                bankAccountNumber,
                bankAccountName,
                bankName,
            },
            upi:{
                upiNumber,
            },
            paypal:{
                payPalemail,
            },
        },
        });
        res.status(201).json({
            success:true,
            message:"User registered.",
        });

};