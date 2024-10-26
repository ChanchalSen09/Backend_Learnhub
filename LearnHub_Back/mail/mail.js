const nodemailer = require("nodemailer");
require("dotenv").config();
require("dotenv").config();
const EMAIL_USER = process.env.EMAIL_USER;
const EMAIL_PASS = process.env.EMAIL_PASS;

if (!EMAIL_USER || !EMAIL_PASS) {
  console.error("Email environment variables not set");
  return res.status(500).json({ message: "Email configuration error" });
}


const transporter = nodemailer.createTransport({
  service: "Gmail",
  auth: {
    user: process.env.EMAIL_USER,
    pass: process.env.EMAIL_PASS,
  },
});

const mailService = (to, subject, htmlContent) => {
  const mailOptions = {
    from: `"QuizApp Support" <${process.env.EMAIL_USER}>`,
    to,
    subject,
    html: htmlContent,
  };

  return transporter.sendMail(mailOptions);
};

module.exports = { mailService };
