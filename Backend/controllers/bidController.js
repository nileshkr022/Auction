import { catchAsyncErrors } from "../middlewares/catchasyncerrors.js";
import errorHandler from "../middlewares/error.js";
import { Auction } from "../models/auctionSchema.js";
import { Bid } from "../models/bidSchema.js";
import { User } from "../models/userSchema.js";

export const placeBid = catchAsyncErrors(async (req, res, next) => {
    const { id } = req.params; // Auction item ID
    const auctionItem = await Auction.findById(id);

    if (!auctionItem) {
        return next(new errorHandler("Auction item not found", 404));
    }

    const { amount } = req.body;

    if (!amount) {
        return next(new errorHandler("Please place your bid", 404));
    }
    if (amount <= auctionItem.currentBid) {
        return next(new errorHandler("Bid amount must be higher than current bid", 404));
    }
    if (amount < auctionItem.startingBid) {
        return next(new errorHandler("Bid amount must be higher than starting bid", 404));
    }

    try {
        const existingBid = await Bid.findOne({
            "bidder.id": req.user._id,
            auctionItem: auctionItem._id,
        });

        const existingBidInAuction = auctionItem.bids.find(
            (bid) => bid.userId.toString() === req.user._id.toString()
        );

        if (existingBidInAuction && existingBid) {
            existingBidInAuction.amount = amount;
            existingBid.amount = amount;
            await existingBid.save();
            auctionItem.currentBid = amount;
        } else {
            const bidderDetails = await User.findById(req.user._id);

            if (!bidderDetails) {
                return next(new errorHandler("Bidder details not found", 404));
            }

            const bid = await Bid.create({
                amount,
                bidder: {
                    id: bidderDetails._id, // Ensure this matches the schema
                    userName: bidderDetails.username,
                    profileImage: bidderDetails.profileImage,
                },
                auctionItem: auctionItem._id,
            });

            auctionItem.bids.push({
                userId: req.user._id,
                userName: bidderDetails.username,
                profileImage: bidderDetails.profileImage?.url,
                amount,
            });

            auctionItem.currentBid = amount; // Update the current bid
        }

        await auctionItem.save();

        res.status(201).json({
            success: true,
            message: "Bid placed.",
            currentBid: auctionItem.currentBid,
        });
    } catch (error) {
        return next(new errorHandler(error.message || "Bid not placed", 500));
    }
});
