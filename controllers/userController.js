const User = require('../models/userModel');
const Doctor = require('../models/doctorModel');
const Admin = require('../models/adminModel');
const Appointment = require('../models/appointmentModel');
const Otp = require('../models/otpModel');
const { sendOtpToMail } = require('../utils/sendotp');
const { sendLinkToMail } = require('../utils/sendLink');
const passport = require('passport');
const _ = require('lodash');
const random = require('randomstring');
const {securePassword} = require('../utils/passwordHashing');
const cloudinary = require('cloudinary').v2;
const dotenv = require('dotenv');
dotenv.config();
const stripe=require("stripe")(process.env.STRIPE_SECRET_KEY);





const register = async (req, res, next) => {
  try {
    const { fullName, mobile_num, email, password } = req.body;
    console.log("testing line 26", fullName, mobile_num, email, password);
    const newUser = new User({
      fullName,
      mobile_num,
      email,
      password: await securePassword(password)
    });

    // Save the user to the database
    const savedUser = await newUser.save();

    //send OTP after saving user to database
    const otp = await sendOtpToMail(newUser.email);

    //Save otp to the otp schema
    const newOTP = new Otp({
      userId: savedUser._id,
      otp: otp,
      email:savedUser.email
    })
    await newOTP.save();

    res.status(201).json(savedUser);
  } catch (error) {
    console.error(error);
    if (error.code === 11000) {
      if (error.keyPattern.mobile_num) {
        res.status(422).json(['Duplicate mobile number found.']);
      }
      else if (error.keyPattern.email) {
        res.status(422).json(['Duplicate email found.']);
      }
    } else {
      next(error);
    }
  };
}

const resendOTP = async(req,res,next)=>{
  try{
   const {email}=req.body;
    console.log(61,email);
    const otpGenerated = await sendOtpToMail(email);
     console.log(63,otpGenerated);
    let existingOtp = await Otp.findOne({email:email});
    if(existingOtp){
      existingOtp.otp = otpGenerated;
      await existingOtp.save();

    }else{
      const newOTP = new Otp({
        otp:otpGenerated,
        email:email
      })
      await newOTP.save();

    }
    
    return res.status(200).json({message:'OTP send successfully'})
  }
  catch(error){
    console.log(error.message);
    next(error);
  }}
const otpVerification = async (req, res, next) => {
  try {
    const receivedOTP = req.body.otp;
    const email = req.body.email;
    const user = await User.findOne({ email });
    if (!user) {
      return res.status(404).json(['User not Found']);
    }
    // const otpData = await Otp.findOne({ userId: user._id });
    
    const otpData = await Otp.findOne({ email:email });
    console.log("line 73", otpData.otp, receivedOTP);

    if (!otpData) {
      return res.status(404).json(['OTP not found']);
    }
    if (otpData.otp != receivedOTP) {
      return res.status(400).json(['Invalid OTP']);
    }
    user.isVerified = true;
    await user.save();
    res.status(200).json(['OTP Verification Successful'])
  }
  catch (error) {
    next(error)
  }
}


const login = (req, res, next) => {
  console.log("inside login controller");
  passport.authenticate('user', (err, user, info) => {
    if (err) {
      return next(err);
    }
    if (!user) {
      return res.status(404).json(info);
    }

    // Assuming user.generateToken() is a valid method
    return res.status(200).json({ "userToken": user.generateToken() });
  })(req, res, next);
};

const userHome = async (req, res, next) => {
  try {
    const user = await User.findOne({ _id: req._id });
    if (!user) {
      return res.status(404).json({ status: false, message: 'User not found' });
    }
    else {
      return res.status(200).json({
        status: true,
        user: _.pick(user, ['fullName'])
      })
    }
  }
  catch (error) {
    next(error);
  }
}

const getUserInfo = async (req, res, next) => {
  try {
    const userId = req.params.userId;
    const userInfo = await User.findById(userId);
    res.status(200).json({ Name: userInfo.fullName })
  }
  catch (error) {
    next(error)
  }
}

const forgetSendLink = async (req, res, next) => {
  try {
    const email = req.body.email;
    const user = await User.findOne({ email: email });
    if (user) {
      let randomString = random.generate();
      const updateUser = await User.updateOne({ email: email }, { $set: { token: randomString } });
      sendLinkToMail(user.email, user.fullName, randomString);
      res.status(200).json({ message: 'Link is send to your mail to reset password' });
    } else {
      res.status(400).json({ message: 'Invalid Email' });
    }
  }
  catch (error) {
    next(error);
  }
}

const updatePassword = async (req, res, next) => {
  try {
    const userId = req.body.userId;
    const newPassword = req.body.newPassword;
    console.log('new password is:', newPassword);
    const hashedPassword = await securePassword(newPassword);
    console.log('hashedPassword is:', hashedPassword);
    const updateUser = await User.findByIdAndUpdate({ _id: userId }, { $set: { password: hashedPassword, token: '' } });
    res.status(200).json({ message: 'Password changed successfully' });

  }
  catch (error) {
    next(error);
  }
}

const getUserIdfromToken = async (req, res, next) => {
  try {
    const token = req.params.token
    const user = await User.findOne({ token: token });
    if (user) {
      res.status(200).json({ userId: user._id });
    }
    else {
      res.status(404).json({ message: 'Invalid Token!' })
    }
  }
  catch (error) {
    next(error);
  }
}

const profileDetails = async(req,res,next)=>{
  try{
    const user = await User.findById({_id:req.params.userId})
    if(user){
      res.status(200).json({userData:user});
    }else{
      console.log('Something went wrong!');
    }
  }
  catch(error){
    next(error);
  }
}

const updateProfile = async(req,res,next)=>{
  try{
    
    const userId= req.params.userId;
    const updateFields = req.body;
    console.log(195,updateFields);
  if(req.file){
    //upload the file to cloudinary
  
    const result = await cloudinary.uploader.upload(req.file.path,{
      folder: 'careNcure_Uploads',
      resource_type: 'auto',
      allowed_formats: ['jpg', 'png'],
       transformation: [{  width: "auto",
       crop: "scale" }]
    });
    
    //update the userprofile with cloudinary url
    updateFields.profilePic = result.secure_url
  }
    const updatedUser = await User.findByIdAndUpdate(userId,updateFields,{new:true});
  
    if(!updatedUser){
       return res.status(404).json({ message: 'User not found' });
    }return res.status(200).json({updatedUser})
  }
  catch(error){
    console.log(216,error.message);
    next(error);
  }
}

const getDoctor = async(req,res,next)=>{
  try{
    const { deptName } = req.params;
    const doctors = await Doctor.find({specialization:deptName});
    if(doctors.length>0){
      return res.status(200).json({doctors});
    }else{
      return res.status(404).json({message:`Doctors not found in ${deptName} department!`});
    }

  }
  catch(error){
    console.log(error.message,235);
    next(error);
  }
}

const createAppointment = async(metadata,paymentdata,req,res)=>{
  const {userId,doctorId,slotBooked,slotDate,slotTime} = metadata;
  try{
    const appointment = new Appointment({
      userId,
      doctorId,
      slotBooked,
      appointmentId:Math.floor(Math.random() * 1000000 + 1),
      paymentMode:paymentdata.payment_method_types,
      paymentStatus:paymentdata.status,
      amountPaid:paymentdata.amount_received/100
    });
    appointment.save();
   const doctor = await Doctor.findById(doctorId);
   if(!doctor) return res.status(404).json({error: 'Doctor not found'});

  const bookedSlot = doctor.slots.find((slot) => {
    return slot.date === slotDate && slot.timeslots.includes(slotTime);
  });
  
  if (!bookedSlot) return res.status(404).json({ error: 'Slot not found' });
  
  // Find the index of the specific time slot in doctor's slots
  const slotIndex = doctor.slots.findIndex((slot) => {
    return slot.date === slotDate && slot.timeslots.includes(slotTime);
  });
  
  if (slotIndex !== -1) {
    // Remove the specific time slot from the doctor's slots
    doctor.slots[slotIndex].timeslots = doctor.slots[slotIndex].timeslots.filter((slot) => slot !== slotTime);
  
    // If there are no more timeslots for that date, remove the entire slot
    if (doctor.slots[slotIndex].timeslots.length === 0) {
      doctor.slots.splice(slotIndex, 1);
    }
  
    // Add the specific time slot to the bookedSlots array
    // doctor.bookedSlots.push({
    //   date: bookedSlot.date,
    //   timeslots: [slotTime], // Only add the specific time slot
    // });
    
    const dateExist = doctor.bookedSlots.find((dateExist)=>dateExist.date === bookedSlot.date);
    if(dateExist){
      dateExist.timeslots.push(slotTime);
    }else{
      doctor.bookedSlots.push({
        date: bookedSlot.date,
         timeslots: [slotTime],
      })
    }
    await doctor.save();
  }
  res.status(200).json({message:'Appointment created successfully'})
   
  }
  catch(error){
    console.log('inside createAppointmnt',error.message);
    next(error);
   }
}

const stripeSession = async(req,res,next)=>{
  try{
    const {doctorData,userId,slot} = req.body;
    console.log(3199,doctorData,userId,slot);
    const slotString = `${slot.date} ${slot.time}`;

    const existingAppointment = await Appointment.findOne({slot:slotString});
    if(existingAppointment) return res.status(409).json({message:'Appointmnet exist'});

    const customer = await stripe.customers.create({
      metadata:{
        userId:userId,
        doctorId:doctorData.doctorId,
        slotBooked:slotString,
        slotDate:slot.date,
        slotTime:slot.time
      }
    });

    const session = await stripe.checkout.sessions.create({
      line_items:[
        {
          price_data:{
            currency:"inr",
            product_data:{
              name: `Dr.${doctorData.fullName}`,
            },
            unit_amount:`${doctorData?.fee * 100}`,
          },
          quantity:1,
        },
      ],
      customer:customer.id,
      mode:"payment",
      success_url: "http://localhost:4200/booking-success",
      cancel_url:"http://localhost:4200/payment-failed"
    });
    res.status(200).json(session);

  }
  catch(error){
    console.log(error.message);
    next(error);
  }
}

const webhooks = async(req,res)=>{
  console.log('inside webhook');
  let endpointSecret;
  // endpointSecret =process.env.STRIPE_WEBHOOK_KEY;
  const payload = req.body;
  console.log(366,payload);
  const sig = req.headers['stripe-signature'];
  console.log(369,sig);
  let data;
  let eventType;
  if(endpointSecret){
    let event;

    try {
      event = stripe.webhooks.constructEvent(payload, sig, endpointSecret);
      console.log(324,'webhooks verified');
    } catch (err) {
      console.log(32666,err.message);
      res.status(400).json({success:true});
      return;
    }
  }else{
      data = req.body.data.object;
      eventType=req.body.type

    if(eventType === "payment_intent.succeeded"){
      stripe.customers.retrieve(data.customer).then((customer)=>{
        createAppointment(customer.metadata, data, req,res);
      })
    }
  }

  
  
  // response.send().end();

}

const getBookingList = async(req,res,next)=>{
  try{
    const {userId} = req.params;
    const bookings = await Appointment.find({userId:userId})
    .sort({createdAt:-1})
    .populate("userId")
    .populate("doctorId")
    .exec();
    if(!bookings) return res.status(404).json({message:'No Bookings Available'});

    return res.status(200).json({bookings:bookings})

  }
  catch(error){
    console.log(error.message);
    next(error);
  }
}

const cancelBooking  = async(req,res,next)=>{
  try{
    const {id} = req.params;
    const appointment = await Appointment.findById(id);
    if(!appointment) return res.status(400).json({error: 'Appointment not found'});

    const currentDate = new Date();
    const appointmentDate = new Date(appointment.slotBooked);
    const timeDifference = appointmentDate - currentDate;

    let userRefund,adminRefund,doctorRefund;
   
    if(appointmentDate.toDateString() === currentDate.toDateString() && timeDifference < 2 * 60 * 60 * 1000){
      console.log('inside less than 2 hour block');
      userRefund = 0.6  * appointment.amountPaid;
      console.log(445,userRefund);
      adminRefund = 0.2 * appointment.amountPaid;
      doctorRefund = 0.2 * appointment.amountPaid;
    }else{
      console.log('inside more than 2 hour block');
      userRefund = 0.9  * appointment.amountPaid;
      console.log(451,userRefund);

      adminRefund = 0.1 * appointment.amountPaid;

    }

    const user = await User.findById(appointment.userId);
    if(user){
      let prev = user.wallet;
      console.log(prev);
      user.wallet += userRefund;
      console.log(460,user.wallet);
      await user.save();
    }
    const admin = await Admin.findOne();
    if(admin){
      admin.compensation += adminRefund;
      await admin.save();
    }
    const doctor = await Doctor.findById(appointment.doctorId);
    if(doctor){
      console.log('doctor refund amount is:',doctorRefund);
      if(doctorRefund){
        doctor.compensation += doctorRefund;
      }
      const slot = appointment.slotBooked;
      let parts = slot.split(' ');
      let datepart = parts[0]+' '+parts[1]+' '+parts[2];
      let timepart = parts[3];
      const slotIndex = doctor.slots.findIndex((item)=>item.date === datepart);
      if(slotIndex!== -1){
        doctor.slots[slotIndex].timeslots.push(timepart);
        await doctor.save();
      }
    }
    appointment.status = "Cancelled";
    await appointment.save();
    res.status(200).json({message:'BOOKING CANCELLED, AMOUNT HAS BEEN CREDITED TO YOUR WALLET'})
  }
  catch(error){
    console.log('error in cancelling: ',error.message);
    next(error);
  }
}

const walletAmount = async(req,res,next)=>{
  try{
    const {userId} = req.params;
    const user = await User.findById(userId);
    if(!user) return res.status(404).json({message:'User not found'});
    else return res.status(200).json({userWalletAmount : user.wallet})

  }catch(error){
    console.log(error.message);
    next(error)
  }
}

const deductWallet = async(req,res)=>{
  try{
    const {userId,deductionAmount} = req.body;
    const user = await User.findById(userId);
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }
    if (user.wallet < deductionAmount) {
      return res.status(400).json({ message: 'Insufficient wallet balance' });
    }
    user.wallet -= deductionAmount;
    await user.save();
    return res.status(200).json({ message: 'Deduction successful' });
  }
  catch(error){
    console.log(error.message);
    next(error);
  }
}

const getPrescription = async(req,res,next)=>{
  try{
    const {id} = req.params;
    const appointment = await Appointment.findById(id);
    if(!appointment) return res.status(404).json({message:'Appointment Not Found'});

    const { diagnosis, advice, prescription } = appointment;

    res.status(200).json({ 
      diagnosis,
      advice,
      prescription,
    });

  }catch(error){
    console.log(error.message);
    next(error);
  }
}

module.exports = {
  register,
  otpVerification,
  login,
  userHome,
  getUserInfo,
  forgetSendLink,
  updatePassword,
  getUserIdfromToken,
  profileDetails,
  updateProfile,
  getDoctor,
  resendOTP,
  createAppointment,
  stripeSession,
  webhooks,
  getBookingList,
  cancelBooking,
  walletAmount,
  deductWallet,
  getPrescription
}