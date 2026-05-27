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

  try {
    await transporter.sendMail(mailOptions);
  } catch (error) {
    console.error("Email send error:", {
      code: error.code,
      command: error.command,
      responseCode: error.responseCode,
      response: error.response,
    });

    if (error.code === "EAUTH" || error.responseCode === 535) {
      error.publicMessage =
        "Gmail rejected EMAIL_USER or EMAIL_PASS. Use the same Gmail account that generated the App Password.";
    } else if (
      error.code === "ETIMEDOUT" ||
      error.code === "ESOCKET" ||
      error.code === "ECONNECTION"
    ) {
      error.publicMessage =
        "Email service timed out. Please redeploy and try again, or check Gmail SMTP access.";
    }

    throw error;
  }
};

module.exports = sendEmail;
