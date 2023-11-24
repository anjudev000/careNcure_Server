const mongoose = require('mongoose');


const otpSchema = new mongoose.Schema({
  userId:{
    type: mongoose.Schema.Types.ObjectId,
    ref:'User',
  },
  doctorId:{
    type:mongoose.Schema.Types.ObjectId,
    ref:'Doctor',
  },
   otp:{
    type:Number,
    required:true
  },
  email:{
    type:String
 },
  createdAt: {
    type: Date,
    default: Date.now,
    expires: 120, // OTPs will expire after 120 seconds
  }
})

module.exports = mongoose.model('OTP',otpSchema);