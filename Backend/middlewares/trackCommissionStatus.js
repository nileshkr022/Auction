import {User} from "../models/userSchema.js";
import {catchAsyncErrors} from "../middlewares/catchasyncerrors.js";
import errorHandler from "../middlewares/error.js";

export const trackCommissionStatus = catchAsyncErrors(async(req,res,next)=>{
    const user = await User.findById(req.user._id);
    if(user.unpaidcomission>0){
        return next(new errorHandler("You have unpaid commission. Please pay them before posting new auction.",403));
    }
    next();
});