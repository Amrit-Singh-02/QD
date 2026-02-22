// import dotenv from 'dotenv';
// dotenv.config({quiet:true});

// import nodemailer from 'nodemailer';

// const mailTransport=nodemailer.createTransport({
//     host:process.env.NODEMAILER_HOST,
//     port:process.env.NODEMAILER_PORT,
//     service:process.env.NODEMAILER_SERVICE,
//     secure:process.env.NODEMAILER_SECURE,
//     auth:{
//         user:process.env.NODEMAILER_EMAIL,
//         pass:process.env.NODEMAILER_PASSWORD
//     }
// });

// export default mailTransport

import dotenv from "dotenv";
dotenv.config({quiet:true});

import nodemailer from "nodemailer";

const mailTransport = nodemailer.createTransport({
  service: "gmail",
  auth: {
    user: process.env.NODEMAILER_EMAIL,
    pass: process.env.NODEMAILER_PASSWORD,
  },
  tls: {
    rejectUnauthorized: false,
  },
});

export default mailTransport;
