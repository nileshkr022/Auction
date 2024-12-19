import {User} from "../models/userSchema.js"
import {Auction} from "../models/auctionSchema.js"
import {catchAsyncErrors} from "../middlewares/catchasyncerrors.js"
import errorHandler from "../middlewares/error.js"
import {v2 as cloudinary} from "cloudinary"

export const addNewAuctionItem = catchAsyncErrors(async(req,res,next) => {
    if (!req.files || Object.keys(req.files).length === 0) {
        return next(new errorHandler("Item Image required.", 400));
    }

    const { image } = req.files;

    // Validate the file format
    const allowedFormats = ["image/png", "image/jpeg", "image/webp"];
    if (!allowedFormats.includes(image.mimetype)) {
        return next(new errorHandler("File format not supported.", 400));
    }

    const  {
        title,
        description,
        category,
        condition,
        startingBid,
        startTime,
        endTime,
    } = req.body;
    if(
        !title ||
        !description ||
        !category ||
        !condition ||
        !startingBid ||
        !startTime ||
        !endTime
    ){
        return next (new errorHandler("Please Provide all details",400));
    }
    if(new Date(startTime)<Date.now()){
        return next (new errorHandler("Auction starting time must be after present time.",400

        )
    );
    }

    if(new Date(startTime)>=new Date(endTime)){
        return next (new errorHandler("Auction ending time must be after starting time.",400

        )
    );
    }

    const alreadyOneAuctionActive = await Auction.find({
        createdBy:req.user._id,
        endTime:{$gt:Date.now()},
    });
    //console.log(alreadyOneAuctionActive);
    if(alreadyOneAuctionActive.length>0){
        return next(new errorHandler("Wait for your running auction to finish."));
    }

    try {
        const cloudinaryResponse = await cloudinary.uploader.upload(image.tempFilePath, {
            folder: "MERN_AUCTION_PLATFORM_AUCTIONS",
        });
        if(!cloudinaryResponse || cloudinaryResponse.error){
            console.error(
                "cloudinary error:",
                cloudinaryResponse.error||"unknown cloudinary error"
            );
            return next(
                new errorHandler("Failed to upload image.",500)
            );
        }
        const auctionItem = await Auction.create({
            title,
            description,
            category,
            condition,
            startingBid,
            startTime,
            endTime,
            image:{
                public_id:cloudinaryResponse.public_id,
                url:cloudinaryResponse.secure_url,
            },
            createdBy:req.user._id,  
        });
        return res.status(201).json({
            success:true,
            message:`Auction item will be listed at ${startTime}`,
            auctionItem
        });
    } catch (error) {
        return next(new errorHandler(error.message||"failed to create auction",500));
    }
    
});