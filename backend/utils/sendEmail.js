const nodemailer = require("nodemailer");
const axios = require("axios");

const sendEmail = async (options) => {
  if (process.env.RESEND_API_KEY) {
    const fromEmail =
      process.env.EMAIL_FROM || process.env.EMAIL_USER || "onboarding@resend.dev";
    if (!fromEmail) {
      throw new Error("EMAIL_FROM or EMAIL_USER is required to send email");
    }

    try {
      await axios.post(
        "https://api.resend.com/emails",
        {
          from: `MitigatePlus <${fromEmail}>`,
          to: [options.email],
          subject: options.subject,
          html: options.html,
        },
        {
          headers: {
            Authorization: `Bearer ${process.env.RESEND_API_KEY}`,
            "Content-Type": "application/json",
          },
          timeout: 15000,
        },
      );
      return;
    } catch (error) {
      console.error("Resend email error:", {
        status: error.response?.status,
        data: error.response?.data,
        message: error.message,
      });
      error.publicMessage =
        "We could not send the OTP email right now. Please try again in a few minutes.";
      throw error;
    }
  }

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
        "We could not send the OTP email right now. Please try again in a few minutes.";
    } else if (
      error.code === "ETIMEDOUT" ||
      error.code === "ESOCKET" ||
      error.code === "ECONNECTION"
    ) {
      error.publicMessage =
        "The OTP email service timed out. Please try again in a few minutes.";
    }

    throw error;
  }
};

module.exports = sendEmail;
