const nodemailer = require('nodemailer');
const dotenv = require('dotenv');
dotenv.config();

const sendLinkToMail = async(email,name,token,next)=>{
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
     from: process.env.EMAIL_USER,
     to:email,
     subject:'Link to Reset Your Password',
     html: '<p>Hii ' + name + ',<a href="https://carencuresite.netlify.app/user-reset-password?token=' + token + '">Click here</a>  to reset your password</p>'

  }
  await transporter.sendMail(mailOptions);
  
}
catch(error){
next(error);
}
}

const sendLinkToDoctorMail = async(email,name,token,next)=>{
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
       from: process.env.EMAIL_USER,
       to:email,
       subject:'Link to Reset Your Password',
       html: '<p>Hii  Dr.' + name + ',<a href="https://carencuresite.netlify.app/doctor-reset-password?token=' + token + '">Click here</a>  to reset your password</p>'
  
    }
    await transporter.sendMail(mailOptions);
    
  }
  catch(error){
  next(error);
  }
  }


module.exports = {
  sendLinkToMail,
  sendLinkToDoctorMail
}
