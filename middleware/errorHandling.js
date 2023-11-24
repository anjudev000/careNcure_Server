const notFound = (req,res,next)=>{
  const error = new Error(`Not Found - ${req.originalUrl}`);
  next(error);
};

const errorHandler = (err,req,res,next)=>{
const statuscode = res.statusCode === 200?500:res.statusCode;
res.status(statuscode).json({
  error:{
    status:statuscode,
    message:err.message
  }
})
};

module.exports = {
  notFound,
  errorHandler
}