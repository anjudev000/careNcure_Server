const mongoose = require("mongoose");
const dotenv = require('dotenv');
dotenv.config();
const jwt= require('jsonwebtoken');

const adminSchema = new mongoose.Schema({
  email:{
    type : String,
    required: 'Email can\'t be empty',
    unique: true
  },
  password:{
    type:String,
    required: 'Password can\'t be empty'
  },
  commission:{
    type:Number,
    default:0
  },
  compensation:{
    type:Number,
    default:0
  }

})


adminSchema.methods.generateToken = function(){
  const token = jwt.sign({_id:this._id},process.env.JWT_SECRET,{expiresIn:process.env.JWT_EXP});
  return token;
}


module.exports = mongoose.model('Admin',adminSchema);
