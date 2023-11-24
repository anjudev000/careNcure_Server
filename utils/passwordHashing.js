const bcrypt = require('bcryptjs');


const securePassword = async(password,next)=>{
  try{
    const hashedPassword = await bcrypt.hash(password,10);
    return hashedPassword;
  }
  catch(error){
    next(error);
  }
}

module.exports = {
  securePassword
}