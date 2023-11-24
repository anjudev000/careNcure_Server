const nodemailer = require('nodemailer');
const dotenv = require('dotenv');
dotenv.config();



const sendApprovalMail = async(email,name,next)=>{
  try{
    const transporter = nodemailer.createTransport({
      host:'smtp.gmail.com',
      port: 587,
      secure:false,
      requireTLS:true,
      auth:{
        user:process.env.EMAIL_USER,
        pass:process.env.EMAIL_PASSWORD
      }
    });
   

    const mailOptions = {
      from : process.env.EMAIL_USER,
      to:email,
      subject: 'CAREnCURE DOCTOR APPROVAL',
      text: `Hello DR. ${name} ! Your profile has been approved. Now you can start to schedule your time and start consulting. Thank you for choosing to be a part of our community. We look forward to your contributions and collaboration within the CAREnCURE platform.`
    }
     await transporter.sendMail(mailOptions);
     
  }
  catch(error){
    // next(error);
    console.log('error',error);
    throw new Error('Failed to send OTP via email.');
  }
}

module.exports ={
  sendApprovalMail
}