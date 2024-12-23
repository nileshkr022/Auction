import { User } from "../models/userSchema.js";
import jwt from "jsonwebtoken";
import errorHandler from "./error.js";
import { catchAsyncErrors } from "./catchasyncerrors.js";

export const isAuthenticated = catchAsyncErrors(async(req,res,next) => {
    const token = req.cookies.token;
    if(!token){
        return next(new errorHandler("User not authorized.",400));
    }
    const decoded = jwt.verify(token,process.env.JWT_SECRET_KEY);
    req.user = await User.findById(decoded.id);
    next();               

});

export const isAuthorized = (...roles) => {
    return(req,res,next)=>{
        if(!roles.includes(req.user.role)){
            return next(new errorHandler(`${req.user.role} not allowed to access this rsource. `,403));
        }
        next();
    };
}