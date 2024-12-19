import { catchAsyncErrors } from "../middlewares/catchasyncerrors.js";
import errorHandler from "../middlewares/error.js";
import { User } from "../models/userSchema.js";
import { v2 as cloudinary } from "cloudinary";
import { generateToken } from "../utils/jwttoken.js";

export const register = catchAsyncErrors(async (req, res, next) => {
    // Check if profile image is provided
    if (!req.files || Object.keys(req.files).length === 0) {
        return next(new errorHandler("Profile Image required.", 400));
    }

    const { profileImage } = req.files;

    // Validate the file format
    const allowedFormats = ["image/png", "image/jpeg", "image/webp"];
    if (!allowedFormats.includes(profileImage.mimetype)) {
        return next(new errorHandler("File format not supported.", 400));
    }

    const {
        username,
        email,
        password,
        phone,
        address,
        role,
        bankAccountNumber,
        bankAccountName,
        bankName,
        upiNumber,
        payPalemail
    } = req.body;

    // Ensure required fields are provided
    if (!username || !email || !phone || !password || !address || !role) {
        return next(new errorHandler("Please fill all details properly.", 400));
    }

    // Additional checks for the 'Auctioneer' role
    if (role === "Auctioneer") {
        if (!bankAccountName || !bankAccountNumber || !bankName) {
            return next(new errorHandler("Please provide full bank details.", 400));
        }
        if (!upiNumber) {
            return next(new errorHandler("Please provide UPI number.", 400));
        }
        if (!payPalemail) {
            return next(new errorHandler("Please provide PayPal email.", 400));
        }
    }

    // Check if the user already exists
    const isRegistered = await User.findOne({ email });
    if (isRegistered) {
        return next(new errorHandler("User already exists.", 400));
    }

    // Upload profile image to Cloudinary
    let cloudinaryResponse;
    try {
        cloudinaryResponse = await cloudinary.uploader.upload(profileImage.tempFilePath, {
            folder: "MERN_AUCTION_PLATFORM_USERS",
        });
    } catch (error) {
        console.error("Cloudinary upload error:", error);
        return next(new errorHandler("Failed to upload profile image.", 500));
    }

    // Create a new user in the database
    const user = await User.create({
        username,
        email,
        password,
        phone,
        address,
        role,
        profileImage: {
            public_id: cloudinaryResponse.public_id,
            url: cloudinaryResponse.secure_url,
        },
        paymentMethods: {
            bankTransfer: {
                bankAccountNumber,
                bankAccountName,
                bankName,
            },
            upi: {
                upiNumber,
            },
            paypal: {
                payPalemail,
            },
        },
    });

    // Send a success response
    generateToken(user,"user registered.",201,res);
});

export const login = catchAsyncErrors(async(req,res,next) => {
    const {email,password} = req.body;
    if(!email || !password){
        return next (new errorHandler("Please fill full form."));
    }
    const user = await User.findOne({email}).select("+password");
    if(!user){
        return next(new errorHandler("Invalid Credentials."));
    }
    const isPasswordmatched = await user.comparePassword(password);
    if(!isPasswordmatched){
        return next(new errorHandler("Invalid credentials.",400));
    }
    generateToken(user,"Login Successful.",200,res);
});

export const getProfile = catchAsyncErrors(async(req,res,next) => {
    const user = req.user;
    res.status(200).json({
        success:true,
        user,
    });
});

export const logout = catchAsyncErrors(async(req,res,next) => {
    res.status(200).cookie("token","",{
        expires:new Date(Date.now()),
        httpOnly: true,
    }).json({
        success:true,
        message:"Logout Successful.",
    })
});

export const fetchLeaderBoard = catchAsyncErrors(async(req,res,next) => {

});