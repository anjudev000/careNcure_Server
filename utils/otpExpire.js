
const User = require('../models/userModel');

const clearExiredOtp = async(email)=>{
try{
const user = await User.findOne({email});
if(user){
  user.otp = undefined;
  user.save();
  console.log(`Expired OTP cleared for user: ${user.email}`);
}
}
catch(error){
console.log('error in clearing the otp:', error);
}
  
};

module.exports = {
  clearExiredOtp
}