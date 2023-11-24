const Doctor = require('../models/doctorModel');
const User = require('../models/userModel');
const Appointment = require('../models/appointmentModel');
const { securePassword } = require('../utils/passwordHashing');
const { sendOtpToMail } = require('../utils/sendotp');
const Otp = require('../models/otpModel');
const passport = require('passport');
const _ = require('lodash');
const random = require('randomstring');
const { sendLinkToDoctorMail } = require('../utils/sendLink');
const cloudinary = require('cloudinary').v2;



const register = async (req, res, next) => {
  try {
    const { fullName, mobile_num, email, password } = req.body;
    const newDoctor = new Doctor({
      fullName,
      mobile_num,
      email,
      password: await securePassword(password)
    });
    //Save the user to the database
    const savedDoctor = await newDoctor.save();
    //send OTP after saving user to database
    const otp = await sendOtpToMail(newDoctor.email);
    //save the otp to database 
    const newOtp = new Otp({
      doctorId: savedDoctor._id,
      otp: otp
    });
    await newOtp.save();
    res.status(201).json(savedDoctor);

  }
  catch (error) {
    if (error.code === 11000) {
      if (error.keyPattern.mobile_num) {
        res.status(422).json(['Duplicate mobile number found']);
      } else if (error.keyPattern.email) {
        res.status(422).json(['Duplicate email found']);
      } else {
        next(error);
      }
    }

  }
}

const otpVerify = async (req, res) => {
  try {
    const email = req.body.email;
    const receivedOTP = req.body.otp;
    const doctor = await Doctor.findOne({ email });
    if (!doctor) {
      return res.status(404).json(['Doctor Not Found']);
    }
    const otpData = await Otp.findOne({ doctorId: doctor._id })
    if (!otpData) {
      return res.status(404).json(['OTP not found']);
    }
    if (otpData.otp != receivedOTP) {
      return res.status(400).json(['Invalid OTP']);
    }
    doctor.isVerified = true;
    await doctor.save();
    res.status(200).json(['OTP Verification Successfull']);
  }
  catch (error) {

  }
}

const login = (req, res, next) => {
  passport.authenticate('doctor', (err, doctor, info) => {
    if (err) {
      return next(err);
    }
    if (!doctor) {
      return res.status(404).json(info);
    }
    return res.status(200).json({ "doctorToken": doctor.generateToken() });
  })(req, res, next);
}

const getHome = async (req, res, next) => {
  try {
    const doctor = await Doctor.findOne({ _id: req._id });
    if (!doctor) {
      return res.status(404).json({ status: false, message: 'No doctor found' });
    }
    else {
      return res.status(200).json({ status: true, doctor: _.pick(doctor, ['fullName']) })
    }
  }
  catch (error) {
    next(error)
  }
}

const getDoctorName = async (req, res, next) => {
  try {
    const doctorId = req.params.doctorId;
    const doctorinfo = await Doctor.findById(doctorId);
    res.status(200).json({ Name: doctorinfo.fullName });
  }
  catch (error) {
    next(error)
  }
}

const forgotSendLink = async (req, res, next) => {
  try {
    const email = req.body.email;
    const doctor = await Doctor.findOne({ email: email });
    if (doctor) {
      let randomString = random.generate();
      const updatedData = await Doctor.updateOne({ email: email }, { $set: { token: randomString } });
      sendLinkToDoctorMail(doctor.email, doctor.fullName, randomString);
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
    const doctorId = req.body.doctorId;
    const newPassword = req.body.newPassword;
    const hashedPassword = await securePassword(newPassword);
    await Doctor.findByIdAndUpdate({ _id: doctorId }, { $set: { password: hashedPassword, token: '' } });
    res.status(200).json({ message: 'Password changed successfully' });

  }
  catch (error) {
    next(error);
  }
}

const getIdFromToken = async (req, res, next) => {
  try {
    const token = req.params.token;
    const doctorData = await Doctor.findOne({ token: token });
    if (doctorData) {
      const doctorId = doctorData._id;
      return res.status(200).json({ doctorId: doctorId });
    }
    else
      return res.status(404).json({ message: 'Invalid Token' });
  }
  catch (error) {
    next(error);
  }
}

const profileDetails = async (req, res, next) => {
  try {
    const doctor = await Doctor.findById({ _id: req.params.doctorId })
    if (doctor) {
      res.status(200).json({ doctorData: doctor });
    } else {
      console.log('Something went wrong');
    }
  }
  catch (error) {
    next(error)
  }
}

const updateprofile = async (req, res, next) => {
  try {
    const doctorId = req.params.doctorId;
    const updateFields = req.body;
    console.log(17888, updateFields);
    if (req.file) {
      const result = await cloudinary.uploader.upload(req.file.path, {
        folder: 'careNcure_doctor_uploads',
        resource_type: 'auto',
        allowed_formats: ['jpg', 'png'],
        transformation: [{
          width: "auto",
          crop: "scale"
        }]
      });
      updateFields.profilePic = result.secure_url
    }
    const updateData = await Doctor.findByIdAndUpdate(doctorId, updateFields, { new: true });
    if (!updateData) {
      return res.status(404).json({ message: 'Doctor Not Found' });
    }
    return res.status(200).json({ updateData });
  }
  catch (error) {
    console.log(19555, error.message);
    next(error);
  }
}



const addTimeSlot = async (req, res, next) => {
  try {
    const { doctorId } = req.params;
    const doctor = await Doctor.findById(doctorId);
    if (!doctor) {
      return res.status(404).json({ message: 'Not Found' });
    }
    const slotsToAdd = req.body;
    for (const slot of slotsToAdd) {
      const { date, timeslots } = slot;
      const dateExist = doctor.slots.find((dateExist) => dateExist.date === date);
      if (dateExist) {
        dateExist.timeslots = slot.timeslots;
      } else {
        doctor.slots.push({ date, timeslots });
      }
    }
    await doctor.save();
    return res.status(200).json({ message: 'Slots added successfully', doctorData: doctor });
  } catch (error) {
    next(error);
  }
};


const getAvailableSlot = async (req, res, next) => {
  try {

    const { doctorId, date } = req.params;
    const doctor = await Doctor.findById(doctorId);
    if (!doctor) return res.status(404).json({ message: 'not found' });
    else {
      slotdata = doctor.slots.find(slot => slot.date === date);
      if (slotdata) return res.status(200).json({ slotsForDate: slotdata.timeslots });
      return res.json({ slotsForDate: [] })
    }
  } catch (error) {
    console.log(error.message);
    next(error);
  }
}

const bookedSlots = async (req, res, next) => {
  try {
    const { doctorId, date } = req.params;
    const doctor = await Doctor.findById(doctorId);
    if (!doctor) return res.status(404).json({ message: 'Not found' });
    else {
      bookedData = doctor.bookedSlots.find(slot => slot.date === date);
      if (bookedData) return res.status(200).json({ slotsForDate: bookedData.timeslots });
      return res.json({ slotsForDate: [] })
    }
  }
  catch (error) {
    console.log(error.message);
    next(error)
  }
}

const getDocStatus = async (req, res, next) => {
  try {

    const { doctorId } = req.params;
    const doctor = await Doctor.findById(doctorId);
    if (!doctor) return res.status(404).json({ message: 'Doctor not found' });
    const docstatus = doctor.status;
    return res.status(200).json({ docstatus });
  }
  catch (error) {
    next(error)
  }
}

const getAppoitmentList = async (req, res, next) => {
  try {
    const { doctorId } = req.params;
    const appointemnts = await Appointment.find({ doctorId: doctorId })
      .sort({ createdAt: -1 })
      .populate("userId")
      .populate("doctorId")
      .exec();
    if (!appointemnts) return res.status(404).json({ message: 'No Appointments Scheduled' });
    return res.status(200).json({ appointments: appointemnts })
  } catch (error) {
    console.log('error in getting appointment list: ', error.message);
    next(error);
  }
}

const cancelAppoitment = async (req, res, next) => {
  try {
    const { id } = req.params;
    const appointment = await Appointment.findById(id);
    if (!appointment) return res.status(400).json({ error: 'Appointment not found' });
    let userRefund = appointment.amountPaid;
    const user = await User.findById(appointment.userId);
    if (user) {
      let prev = user.wallet;
      console.log(prev);
      user.wallet += userRefund;
      console.log(460, user.wallet);
      await user.save();
    }
    const doctor = await Doctor.findById(appointment.doctorId);
    if (doctor) {

      const slot = appointment.slotBooked;
      let parts = slot.split(' ');
      let datepart = parts[0] + ' ' + parts[1] + ' ' + parts[2];
      let timepart = parts[3];
      const slotIndex = doctor.slots.findIndex((item) => item.date === datepart);
      if (slotIndex !== -1) {
        doctor.slots[slotIndex].timeslots.push(timepart);
        await doctor.save();
      }
    }
    appointment.status = "Cancelled";
    await appointment.save();
    return res.status(200).json({ message: 'BOOKING CANCELLED' })
  }
  catch (error) {
    console.log('error in doctor cancel:', error.message);
    next(error);
  }
}

const confirmAppointment = async (req, res, next) => {
  try {
    const { id } = req.params;
    const appointment = await Appointment.findById(id);
    if (appointment) {
      appointment.status = 'Confirmed';
      await appointment.save();
      return res.status(200).json({ message: 'Appointment is confirmed' });
    } else {
      return res.status(404).json({ message: 'Not Found' })
    }

  } catch (error) {
    console.log('Error in confirm appointmnet:', error.message);
    next(error);
  }
}

const endAppointment = async (req, res, next) => {
  try {
    const { id } = req.params;
    const updateAppointment = await Appointment.findById(id);
    if (!updateAppointment) return res.status(404).json({ message: 'Appointment not found' });

    const doctorFees = (updateAppointment.amountPaid * 80) / 100;
    const adminCommision = updateAppointment.amountPaid - doctorFees;

    await Appointment.findByIdAndUpdate(
      id,
      { status: 'Completed', adminAmount: adminCommision },
      { new: true }
    );
    const docId = updateAppointment.doctorId;
    const doctor = await Doctor.findById(docId);

    if (!doctor) return res.status(404).json({ message: 'Doctor Not Found' });
    const amount = doctor.wallet + doctorFees;
    console.log('Amount for doctor:', amount);
    await Doctor.findByIdAndUpdate(docId, { wallet: amount }, { new: true });
    return res.status(200).json({ message: 'Appointment Ended' });
  } catch (error) {
    console.log('Error in ending Appointmnet');
    next(error);
  }
}

const prescription = async (req, res, next) => {
  try {
    const { id } = req.params;
    const { diagnosis, medicines, advice } = req.body;
    const appointment = await Appointment.findById(id)
    if (!appointment) return res.status(404).json({ message: 'Appointment not Found' });
    const updatedAppointment = await Appointment.findByIdAndUpdate(id, {
      diagnosis,
      prescription: medicines,
      advice
    })
    return res.status(200).json({ updatedAppointment, message: "prescription updated" });
  } catch (error) {
    console.log('Error occured in generting prescription', error.message);
    next(error);
  }
}

const getDashboardData = async (req, res, next) => {
  try {
    const { doctorId } = req.params;
    const appointments = await Appointment.find({ doctorId: doctorId });
    const doctor = await Doctor.findById(doctorId);
    // Annual details
    const annualAppointments = appointments.filter(appointment => {
      const appointmentYear = new Date(appointment.slotBooked).getFullYear();
      return appointmentYear === new Date().getFullYear();
    });
    let annualRevenue = 0;
    let annualTotalAppointments = 0;
    annualAppointments.forEach(appointment => {
      annualRevenue += doctor.wallet || 0;
      annualTotalAppointments++;
    });

    // Monthly details
    const currentMonth = new Date().getMonth();
    const monthlyAppointments = appointments.filter(appointment => {
      return new Date(appointment.slotBooked).getMonth() === currentMonth;
    });
    console.log(419,monthlyAppointments);
    let monthlyRevenue = 0;
    let monthlyTotalAppointments = 0;
    monthlyAppointments.forEach(appointment => {
      monthlyRevenue += appointment.amountPaid || 0;
      monthlyTotalAppointments++;
    });

    // Weekly details
    const lastWeekDate = new Date();
    lastWeekDate.setDate(new Date().getDate() - 7);
    const weeklyAppointments = appointments.filter(appointment => new Date(appointment.slotBooked) > lastWeekDate);
    let weeklyRevenue = 0;
    let weeklyTotalAppointments = 0;
    weeklyAppointments.forEach(appointment => {
      weeklyRevenue += appointment.amountPaid || 0;
      weeklyTotalAppointments++;
    });
    // Additional logic for appointments by month
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
    appointments.forEach(appointment => {
      if(appointment.doctorId.toString() === doctor._id.toString()){
        const appointmentYear = new Date(appointment.slotBooked).getFullYear();
        if (currentYear === appointmentYear) {
          const month = new Date(appointment.slotBooked).getMonth() + 1;
          const key = `${currentYear}-${month}`;
          if (!appointmentsByMonth[key]) {
            appointmentsByMonth[key] = { month: key, noOfAppointments: 0, totalAmount: 0 };
          }
          appointmentsByMonth[key].noOfAppointments++;
          appointmentsByMonth[key].totalAmount += appointment.amountPaid|| 0;
        }
      }
    
    });
    console.log(463,appointmentsByMonth);

    res.status(200).json({
      monthlyAppointments: Object.values(appointmentsByMonth),
      weeklyAppointments,
      weeklyRevenue,
      weeklyTotalAppointments,
      monthlyRevenue,
      monthlyTotalAppointments,
      annualAppointments,
      annualRevenue,
      annualTotalAppointments
    });
  } catch (error) {
    console.log('error in dashboard data',error.message);
    next(error);
  }
};


module.exports = {
  register,
  otpVerify,
  login,
  getHome,
  getDoctorName,
  forgotSendLink,
  updatePassword,
  getIdFromToken,
  profileDetails,
  updateprofile,
  addTimeSlot,
  getAvailableSlot,
  getDocStatus,
  bookedSlots,
  getAppoitmentList,
  cancelAppoitment,
  confirmAppointment,
  endAppointment,
  prescription,
  getDashboardData
}