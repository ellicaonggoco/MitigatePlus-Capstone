const nodemailer = require("nodemailer");

const sendEmail = async (options) => {
  const transporter = nodemailer.createTransport({
    service: "gmail",
    connectionTimeout: 5000,
    greetingTimeout: 5000,
    socketTimeout: 7000,
    auth: {
      user: process.env.EMAIL_USER,
      pass: process.env.EMAIL_PASS,
    },
  });

  const mailOptions = {
    from: `MitigatePlus <${process.env.EMAIL_USER}>`,
    to: options.email,
    subject: options.subject,
    html: options.html,
  };

  // Optional: skip actual sending in development
  if (process.env.NODE_ENV === "development") {
    console.log(`📧 DEV MODE – Email not sent to ${options.email}`);
    return;
  }

  await transporter.sendMail(mailOptions);
};

module.exports = sendEmail;
