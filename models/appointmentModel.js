const mongoose = require("mongoose");

const appointmentSchema = new mongoose.Schema({
    userId:{
        type:mongoose.SchemaTypes.ObjectId,
        ref:'User',
        required:true
    },
    doctorId:{
        type:mongoose.SchemaTypes.ObjectId,
        ref:'Doctor',
        required:true
    },
    slotBooked:{
        type:String
    },
    status: {
        type: String,
        enum:['Scheduled','Cancelled','Completed','Confirmed'],
        default: "Scheduled",
      },
      appointmentId:{
        type:Number
      },
      paymentMode:{
        type:[String],
      },
      amountPaid:{
        type:Number,
      },
      adminAmount:{
        type:Number,
      },
      paymentStatus:{
        type:String
      },
      diagnosis:{
        type:String
      },
      prescription:[
        {
          medicine:{type:String},
          dosage:{type:String},
        }
      ],
      advice:{type:String}

  }, {
    timestamps: true,

});

module.exports = mongoose.model('Appointment',appointmentSchema);
