import { catchAsyncErrors } from "../middlewares/catchasyncerrors.js";
import errorHandler from "../middlewares/error.js";
import { User } from "../models/userSchema.js";
import { v2 as cloudinary } from "cloudinary";
import { PaymentProof } from "../models/commissionProofSchema.js";

export const proofOfCommission = catchAsyncErrors(async (req, res, next) => {
    if (!req.files || Object.keys(req.files).length === 0) {
        return next(new errorHandler("Payment Proof Screenshot is required.", 400));
    }

    const { amount, comment } = req.body;
    const user = await User.findById(req.user._id);

    if (!amount || !comment) {
        return next(new errorHandler("Amount and comment are required.", 400));
    }

    if (user.unpaidcomission === 0) {
        return res.status(200).json({
            success: true,
            message: "You don't have any unpaid commission.",
        });
    }

    if (user.unpaidcomission < amount) {
        return next(
            new errorHandler(
                `Amount exceeds unpaid commission balance. Please enter an amount up to ${user.unpaidcomission}.`,
                403
            )
        );
    }

    const proof = req.files.proof; // Access specific file by key (e.g., 'proof')
    const allowedFormats = ["image/png", "image/jpeg", "image/webp"];

    if (!allowedFormats.includes(proof.mimetype)) {
        return next(new errorHandler("File format not supported. Please upload PNG, JPEG, or WEBP.", 400));
    }

    const cloudinaryResponse = await cloudinary.uploader.upload(
        proof.tempFilePath,
        {
          folder: "MERN_AUCTION_PAYMENT_PROOFS",
        }
      );
      if (!cloudinaryResponse || cloudinaryResponse.error) {
        console.error(
          "Cloudinary error:",
          cloudinaryResponse.error || "Unknown cloudinary error."
        );
        return next(new ErrorHandler("Failed to upload payment proof.", 500));
      }

    const commissionProof = await PaymentProof.create({
        userId: req.user._id,
        proof: {
            public_id: cloudinaryResponse.public_id,
            url: cloudinaryResponse.secure_url,
        },
        amount,
        comment,
    });

    res.status(201).json({
        success: true,
        message: "Your Payment Proof has been uploaded. Awaiting review.",
        commissionProof,
    });
});
