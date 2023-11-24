const express = require('express');
const doctorRoute = express.Router();
const doctorController = require('../controllers/doctorController');
const jwtHelper = require('../middleware/jwtHelper');
const isDoctorBlocked = require('../middleware/checkDoctorBlock');
const multer = require('multer');
const cloudinary = require('cloudinary').v2;
const { CloudinaryStorage } = require('multer-storage-cloudinary');



cloudinary.config({
    cloud_name: process.env.CLOUD_NAME,
    api_key: process.env.CLOUDINARY_API_KEY,
    api_secret: process.env.CLOUDINARY_API_SECRET
  });
  
const storage = new CloudinaryStorage({
    cloudinary:cloudinary,
    params:{
        folder: 'careNcure_doctor_uploads',
        resource_type: 'auto',
        allowed_formats: ['jpg', 'png'], 
        transformation: [{  width: "auto",
        crop: "scale" }
    ]
    }
});

const upload = multer({storage:storage});


doctorRoute.post('/doctor-register',doctorController.register);
doctorRoute.post('/doctor-otp-verify',doctorController.otpVerify);
doctorRoute.post('/authenticate-doctor',doctorController.login);
doctorRoute.get('/doctor-home',jwtHelper.verifyJwtToken,doctorController.getHome);
doctorRoute.get('/doctor-info/:doctorId',doctorController.getDoctorName);
doctorRoute.post('/doctor-forgot-password',doctorController.forgotSendLink);
doctorRoute.post('/doctor-updateNewPassword',doctorController.updatePassword);
doctorRoute.get('/getDoctorId/:token',doctorController.getIdFromToken);
doctorRoute.get('/doctor-Profile-Details/:doctorId',jwtHelper.verifyJwtToken,isDoctorBlocked,doctorController.profileDetails);
doctorRoute.put('/update-doc-profile/:doctorId',jwtHelper.verifyJwtToken,isDoctorBlocked,upload.single('profilePic'),doctorController.updateprofile);
doctorRoute.post('/add-time-slots/:doctorId',jwtHelper.verifyJwtToken,isDoctorBlocked,doctorController.addTimeSlot);
doctorRoute.get('/available-slots/:doctorId/:date',jwtHelper.verifyJwtToken,isDoctorBlocked,doctorController.getAvailableSlot);
doctorRoute.get('/booked-slots/:doctorId/:date',jwtHelper.verifyJwtToken,isDoctorBlocked,doctorController.bookedSlots);
doctorRoute.get('/getStatus/:doctorId',jwtHelper.verifyJwtToken,isDoctorBlocked,doctorController.getDocStatus);
doctorRoute.get('/doctor-appointemnts/:doctorId',jwtHelper.verifyJwtToken,isDoctorBlocked,doctorController.getAppoitmentList);
doctorRoute.patch('/cancel-booking/:id',jwtHelper.verifyJwtToken,isDoctorBlocked,doctorController.cancelAppoitment);
doctorRoute.patch('/confirm-booking/:id',jwtHelper.verifyJwtToken,isDoctorBlocked,doctorController.confirmAppointment);
doctorRoute.put('/appointment-completed/:id',jwtHelper.verifyJwtToken,isDoctorBlocked,doctorController.endAppointment);
doctorRoute.put('/generate-prescription/:id',jwtHelper.verifyJwtToken,isDoctorBlocked,doctorController.prescription);
doctorRoute.get('/dashboard-data/:doctorId',doctorController.getDashboardData);


module.exports = doctorRoute;