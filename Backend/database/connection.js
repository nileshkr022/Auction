import mongoose from "mongoose";

export const connection = ()=>{
    mongoose.connect(process.env.MONGO_URI,{
        dbname: "MERN_AUCTION_PLATFORM"
    }).then(()=>{
        console.log("CONNECTED TO DB");
    }).catch(err=>{
        console.log(`ERROR WHILE CONNECTING ${err}`);
    })
}