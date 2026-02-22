import expressAsyncHandler from "express-async-handler";
import mailTransport from "../config/nodemailer.config.js";

export const sendEmail=expressAsyncHandler(async(to,subject,html)=>{
    const info=await mailTransport.sendMail({
        from:process.env.NODEMAILER_EMAIL,
        to,
        subject,
        html
    })
    

})