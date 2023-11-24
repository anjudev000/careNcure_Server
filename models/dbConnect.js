const mongoose = require('mongoose');
const dotenv = require('dotenv');
dotenv.config();
require('./userModel');


const connectToMongoDB = async()=>{
  try{
    await mongoose.connect(process.env.MONGO_URL);
    console.log("Connected to Database");
  }
  catch(error){
    throw error;
  }
}
module.exports = {connectToMongoDB}