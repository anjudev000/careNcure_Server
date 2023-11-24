const Admin = require('../models/adminModel');
const User = require('../models/userModel');
const Doctor = require('../models/doctorModel');
const Appointment = require('../models/appointmentModel');
const dotenv = require('dotenv');
dotenv.config();
const _ = require('lodash');
const { sendApprovalMail } = require('../utils/sendApprovalMail');
const { sendRejectMail } = require('../utils/rejectMail');


const login = async (req, res, next) => {
  try {
    const { email, password } = req.body;
    const adminDetails = await Admin.findOne({ email, password });
    if (!adminDetails) return res.status(401).json({ message: "Invalid Credentials" });
    else return res.status(200).json({ "adminToken": adminDetails.generateToken() });
  }
  catch (error) {
    next(error);
  }
}
const adminProfile = async (req, res, next) => {
  try {
    const admin = await Admin.findOne({ _id: req._id });
    if (!admin) {
      return res.status(404).json({ status: false, message: 'Not Found' });
    } else {
      return res.status(200).json({
        status: true,
        user: _.pick(admin, ['email'])
      })
    }
  }
  catch (error) {
    next(error);
  }
}
// const getName = async(req,res,next)=>{
//   try{
//     const adminId = req.params.adminId;
//     const adminName = await Admin.findById(adminId);
//     res.status(200).json({Name:adminName})
//   }
//   catch(error){
//     next(error);
//   }
// }

const getUserList = async (req, res, next) => {
  try {
    const users = await User.find();
    if (users) return res.status(200).json({ users });
    else return res.status(404).json({ message: "No Users Found" });
  }
  catch (error) {
    next(error);
  }
}

const getDoctors = async (req, res, next) => {
  try {
    const doctors = await Doctor.find({status:"Approved"});
    if (doctors) return res.status(200).json({ doctors });
    else return res.status(404).json({ mesasge: "Doctors not found" });
  }
  catch (error) {
    next(error);
  }
}

const getPendingDoc = async(req,res,next)=>{
  try{
      const doctors = await Doctor.find({status:{$in:["Pending","Rejected"]}});
    if(doctors) return res.status(200).json({doctors});
    else return res.status(404).json({message:"Doctors not found"});
  }
  catch(error){
    console.log(error.message);
    next(error);
  }
}

const blockUnblockUser = async (req, res, next) => {
  try {
    const { userId } = req.params;
    console.log(userId, 456);

    const user = await User.findById(userId);

    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }

    user.isblock = !user.isblock; // Toggle isblock status

    const updatedUser = await user.save();

    return res.status(200).json(updatedUser);
  } catch (error) {
    next(error);
  }
}


const blockUnblockDoctor = async (req, res, next) => {
  try {
    const { doctorId } = req.params;
    const doctor = await Doctor.findById(doctorId);
    if (!doctor) {
      return res.status(404).json({ error: 'Doctor not found' });
    }
    doctor.isblock = !doctor.isblock;

    const updatedDoctor = await doctor.save();
    return res.status(200).json({ updatedDoctor });
  }
  catch (error) {
    next(error);
  }
}

const approveDoctor = async (req, res, next) => {
  try {
    console.log(111222);
    const doctorId = req.params.doctorId;
    const doctor = await Doctor.findById(doctorId)
    if (doctor) {
      const update = await Doctor.updateOne({ _id: doctorId }, { $set: { status: "Approved" } },{runValidators:true});
      //send approval mail
      sendApprovalMail(doctor.email, doctor.fullName);
      return res.status(200).json({ update });
    }
    return res.status(404).json({error:'not found'})
  }
  catch (error) {
    console.log(error.message);
    next(error)
  }
}

const rejectDoctor = async (req, res, next) => {
  try {

    const doctorId = req.params.doctorId;
    const {messageInput} = req.body;
    console.log(134,req.body);
    console.log(133,messageInput);
    const doctor = await Doctor.findById(doctorId);
    if (doctor){
      const update = await Doctor.findByIdAndUpdate({_id: doctorId},{$set:{status:"Rejected"}},{runValidators:true});
      //send rejection mail
      sendRejectMail(doctor.email, doctor.fullName,messageInput);
      return res.status(200).json({ update });
    }
    return res.status(404).json({ error: 'not found' });
    }
  catch (error) {
    console.log(error.message);
    next(error);
  }
}

const getDashboardDetails = async(req,res,next)=>{
  try{
     // Get the total number of appointments
     const totalAppointmentsCount = await Appointment.countDocuments();
   // Get all appointments
   const allAppointments = await Appointment.find();

   // Calculate the total revenue
   const totalRevenue = allAppointments.reduce((sum, appointment) => {
     // Check if the appointment has an amountPaid and is in a valid status
     if (
       appointment.amountPaid &&
       appointment.status !== 'Cancelled' &&
       appointment.status !== 'Scheduled'
     ) {
       sum += appointment.amountPaid;
     }
     return sum;
   }, 0);

      // Calculate the total admin revenue
      const totalAdminRevenue = allAppointments.reduce((sum, appointment) => {
     
        if (
          appointment.adminAmount &&
          appointment.status !== 'Cancelled' &&
          appointment.status !== 'Scheduled'
        ) {
          sum += appointment.adminAmount;
        }
        return sum;
      }, 0);

    // Monthly details
    const currentMonth = new Date().getMonth();
    const monthlyAppointments = allAppointments.filter(appointment => {
      return new Date(appointment.slotBooked).getMonth() === currentMonth;
    });
    console.log(189,monthlyAppointments);
    let monthlyRevenue = 0;
    let monthlyTotalAppointments = 0;
    monthlyAppointments.forEach(appointment => {
      monthlyRevenue += appointment.amountPaid || 0;
      monthlyTotalAppointments++;
    });

     //  for graph data- appointments by month
     let appointmentsByMonth = {};
     const currentYear = new Date().getFullYear();
     for (let month = 0; month < 12; month++) {
       appointmentsByMonth[`${currentYear}-${month + 1}`] = {
         month: `${currentYear}-${month + 1}`,
         noOfAppointments: 0,
         totalAmount: 0
       };
     }
     console.log(447,appointmentsByMonth);
     allAppointments.forEach(appointment => {
      const appointmentYear = new Date(appointment.slotBooked).getFullYear();
         if (currentYear === appointmentYear) {
           const month = new Date(appointment.slotBooked).getMonth() + 1;
           const key = `${currentYear}-${month}`;
           if (!appointmentsByMonth[key]) {
             appointmentsByMonth[key] = { month: key, noOfAppointments: 0, totalAmount: 0 };
           }
           appointmentsByMonth[key].noOfAppointments++;
           appointmentsByMonth[key].totalAmount += appointment.amountPaid|| 0;
         }});

    return res.status(200).json({
      monthlyAppointments: Object.values(appointmentsByMonth),
      monthlyRevenue,
      monthlyTotalAppointments,
      totalAppointmentsCount,
      totalRevenue,
      totalAdminRevenue
    });
    
  }
  catch(error){
    next(error);
  }
}


module.exports = {
  login,
  adminProfile,
  getUserList,
  getDoctors,
  getPendingDoc,
  blockUnblockUser,
  blockUnblockDoctor,
  approveDoctor,
  rejectDoctor,
  getDashboardDetails
}