import bcrypt from "bcrypt";
import mongoose from "mongoose";
import jwt from "jsonwebtoken";

const userSchema = new mongoose.Schema({
    username:{
        type:String,
        minlength: [3,"username must contain atleast 3 characters"],
        maxlength: [40, "username cannot exceed 40 characters"],
    },
    password:{
        type:String,
        select:false,
        minlength: [8,"password must contain atleast 8 characters"],
        maxlength: [32, "password cannot exceed 32 characters"],
    },
    email:String,
    address:String,
    phone:{
        type:String,
        minlength: [10,"phone number must contain atleast 10 digits"],
        maxlength: [10, "phone number must contain atleast 10 digits"],
    },
    profileImage:{
        public_id:{
            type:String,
            required:true,
        },
        url:{
            type:String,
            required:true,
        }
    },
    paymentMethods:{
        bankTransfer:{
            bankAccountNumber:String,
            bankAccountName:String,
            bankName:String,
        },
        upi:{
            upiNumber:String,
        },
        paypal:{
            payPalemail:String,
        },
    },
    role:{
        type:String,
        enum:["Auctioneer","Bidder","Super Admin"],
    },
    unpaidcomission:{
        type:Number,
        default:0,

    },
    auctionWon:{
        type:Number,
        default:0,
    },
    moneySpent:{
        type:Number,
        default:0,
    },
    createdAt:{
        type:Date,
        default:Date.now,
    },
});

userSchema.pre("save",async function(next){
    if(!this.isModified("password")){
        next()
    }
    this.password = await bcrypt.hash(this.password,10);
})

userSchema.methods.comparePassword = async function(enteredPassword){
    return await bcrypt.compare(enteredPassword,this.password);
};

userSchema.methods.generateJsonWebToken = function(){
    return jwt.sign({id:this._id}, process.env.JWT_SECRET_KEY,{
        expiresIn: process.env.JWT_EXPIRE,
    });
}

export const User = mongoose.model("User",userSchema);