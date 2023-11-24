const nodemailer = require('nodemailer');
const dotenv = require('dotenv');
dotenv.config();



const sendRejectMail = async(email,name,msg,next)=>{
  try{
    console.log('inside mailfuntionality',msg);
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
      subject: 'CAREnCURE REJECTION MAIL',
      text: `HELLO DR. ${name} ! ${msg}`
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
  sendRejectMail
}