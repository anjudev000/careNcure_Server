const User = require('../models/userModel');

const isBlocked = async(req,res,next)=>{
    try{
        const user = await User.findById({_id:req._id})
            if(user.isblock){
                return res.status(403).json({message:'You are blocked by admin'});
            }else{
                next();
            }
        
    }catch(error){
        console.log('Error in userBlock Middleware:',error.message);
        next(error);
    }
}

module.exports = isBlocked