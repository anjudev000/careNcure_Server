const mongoose = require('mongoose');
const jwt = require('jsonwebtoken');
const dotenv = require('dotenv');
dotenv.config();

const doctorSchema = new mongoose.Schema(
  {
    fullName:{
      type:String,
      required:true
    },
    mobile_num:{
      type:String,
      required: true,
      unique: true
    },
    email:{
      type:String,
      required:true,
      unique:true
    },
    password:{
      type:String,
      required:true,
      minlength:[6,'Password must be atleast 6 characters long']
    },
    profilePic: {
      type: String,
      default:'https://mdbcdn.b-cdn.net/img/Photos/new-templates/bootstrap-chat/ava1-bg.webp'
  },
  RegnNumber:{
    type:String
  },
    education:[
      {
        degree:{
          type:String
        },
        college:{
          type:String
        },
        graduation_year:{
          type:String
        }
      }
    ],
    experience:[{
      hospital:{
        type:String
      },
      term:{
        type:Number
      }
    }],
    description:{
      type:String
    },
    specialization:{
      type:String
    },
    fee:{
      type:Number
    },
    wallet:{
      type:Number,
      default:0
   },
    compensation:{
      type:Number,
      default:0
    },
    slots:[
      {
        date:{
          type:String
        },
        timeslots:{
          type:Array
        }
      }
    ],
    bookedSlots:[
      {
        date:{
          type:String
        },
        timeslots:{
          type:Array
        }
      }
    ],
    isblock:{
      type:Boolean,
      default:false
    },
    isVerified:{
      type:Boolean,
      default:false
    },
    status:{
      type:String,
      enum:['Pending','Approved','Rejected'],
      default:'Pending'
    },
    otp:{
      type:mongoose.Schema.Types.ObjectId,
      ref:'OTP'
    },
    token:{
      type:String,
      default:''
    }
  });

  // Custom validation for email
doctorSchema.path('email').validate((val) => {
  emailRegex = /^(([^<>()\[\]\\.,;:\s@"]+(\.[^<>()\[\]\\.,;:\s@"]+)*)|(".+"))@((\[[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\])|(([a-zA-Z\-0-9]+\.)+[a-zA-Z]{2,}))$/;
  return emailRegex.test(val);
}, 'Invalid e-mail.');
// //Phone number validation regular expression
const phoneRegex = /^[0-9]{10}$/; 
doctorSchema.path('mobile_num').validate((val) => {
  return phoneRegex.test(val);
}, 'Invalid phone number.');

doctorSchema.methods.generateToken = function(){
  const token = jwt.sign({_id:this._id},process.env.JWT_SECRET,{expiresIn:process.env.JWT_EXP});
  return token;
}


module.exports = mongoose.model('Doctor',doctorSchema);