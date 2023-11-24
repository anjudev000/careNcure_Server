const jwt = require('jsonwebtoken');
const dotenv = require('dotenv');
dotenv.config();

const verifyJwtToken = async(req,res,next)=>{
  
    let token;
    if ('authorization' in req.headers) {
      token = req.headers['authorization'].split(' ')[1];
      console.log(token,25);
      if(!token){
        return res.status(403).send({auth:false, message:'No Token Provided'});
      }
      else{
        try{
          console.log('line 26');
          const decoded = jwt.verify(token,process.env.JWT_SECRET);
        console.log(decoded,27);
          req._id = decoded._id;
          next();
        }
        catch(error){
          return res.status(500).send({auth:false,message:'Token authentication failed'})
        }
      }
     

  }
  
}

module.exports = {
  verifyJwtToken
}

