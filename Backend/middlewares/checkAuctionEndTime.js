import { Auction } from "../models/auctionSchema.js";
import mongoose from "mongoose";
import { catchAsyncErrors } from "./catchasyncerrors.js";
import errorHandler from "./error.js";

export const checkAuctionEndTime= catchAsyncErrors(async(req,res,next)=>{
    const {id} = req.params;
    if(!mongoose.Types.ObjectId.isValid){
        return next(new errorHandler("Invalid Id format",400));
    }
    const auction = await Auction.findById(id);
    if(!auction){
        return next(new errorHandler("Auction not found",400));
    }
    const now = new Date();
    if(new Date(auction.startTime)>now){
        return next(new errorHandler("Auction not started",400));
    }
    if(new Date(auction.endTime)<now){
        return next(new errorHandler("Auction is ended",400));
    }
    next();

});