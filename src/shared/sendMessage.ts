/* // Your AccountSID and Auth Token from console.twilio.com
import twilio from "twilio";
import config from "../config";

const client = twilio(config.twilio.accountSid, config.twilio.authToken);

export const sendMessage = async (body: string, to: string) => {
  console.log("msg body", body, to);
  try {
    const message = await client.messages.create({
      body,
      to,
      from: config.twilio.twilioPhoneNumber,
    });
    console.log("Message sent:", message.sid);
    console.log(message, "msg");
  } catch (err: any) {
    console.error("Failed to send OTP message:", err.message);
    throw err; // Re-throwing to be handled by your higher-level error handler
  }
}; */

/* // Your AccountSID and Auth Token from console.twilio.com
import twilio from "twilio";
import config from "../config";

const client = twilio(config.twilio.accountSid, config.twilio.authToken);

export const sendMessage = async (body: string, to: string) => {
  console.log("msg body", body, to);
  try {
    const message = await client.messages.create({
      body,
      from: `whatsapp:${config.twilio.twilioPhoneNumber}`, //  Add 'whatsapp:'
      to: `whatsapp:${to}`, //  Add 'whatsapp:' prefix to receiver number
    });

    console.log(" Message sent:", message.sid);
  } catch (err: any) {
    console.error(" Failed to send OTP message:", err.message);
    throw err;
  }
}; */

import twilio from "twilio";
import config from "../config";

const client = twilio(config.twilio.accountSid, config.twilio.authToken);

export const sendMessage = async (otp: string, to: string): Promise<void> => {
  console.log("msg body", otp, to);
  try {
    const message = await client.messages.create({
      from: "whatsapp:+15633636856", // তোমার Twilio WhatsApp number
      to: `whatsapp:${to}`, // যেমন: whatsapp:+8801676797094
      contentSid: "HXc14b0f9ee2e3e80647ae03da52abb81", // তোমার template SID
      contentVariables: JSON.stringify({
        "1": otp, // Template variable অনুযায়ী index পরিবর্তন করো
      }),
    });

    console.log(" WhatsApp OTP sent:", message.sid);
  } catch (err: any) {
    console.error(" Failed to send WhatsApp OTP:", err.message);
  }
};

// import twilio from "twilio";
// import config from "../config";

// const client = twilio(config.twilio.accountSid, config.twilio.authToken);

// export const sendMessage = async (otp: string, to: string): Promise<void> => {
//   // Phone number must start with '+'
//   // if (!to.startsWith("+")) {
//   //   throw new Error(
//   //     "Phone number must be in E.164 format with country code, e.g., +8801676797094"
//   //   );
//   // }

//   console.log("msg body", otp, to);

//   try {
//     const message = await client.messages.create({
//       // from: "whatsapp:+15633636856", // Twilio WhatsApp sandbox/number
//       to: `whatsapp:${to}`,          // Recipient number
//       messagingServiceSid: "MG172dea6f0c8c1f53d8aca67b04f144ce", // Approved template SID
//       contentVariables: JSON.stringify({ "1": otp.toString() }), // Must be string
//     });

//     console.log("✅ WhatsApp OTP sent:", message.sid);
//   } catch (err: any) {
//     console.error(
//       " Failed to send WhatsApp OTP:",
//       err.code || err.message
//     );
//   }
// };




/* const accountSid = "ACa3f63b052ab7dc1507974dfee7baa4db";
const authToken = "de9035a2799fb1e761159db2bf29fa18";
const client = require("twilio")(accountSid, authToken);

const MESSAGING_SERVICE_SID = "MG172dea6f0c8c1f53d8aca67b04f144ce";

export const sendMessage = async (phoneNumber: string, otp: string) => {
  const whatsappTo = `whatsapp:${phoneNumber}`;
  const smsTo = phoneNumber;

  const otpBody = `Your OTP is ${otp}. Please use this code to verify your account. It expires in 10 minutes.`;

  try {
    // Send WhatsApp
    // const whatsappMessage = await client.messages.create({
    //   messagingServiceSid: MESSAGING_SERVICE_SID,
    //   to: whatsappTo,
    //   body: otpBody,
    // });
    const whatsappMessage = await client.messages.create({
  to: `whatsapp:${phoneNumber}`,
  messagingServiceSid: MESSAGING_SERVICE_SID,
  contentSid: TEMPLATE_CONTENT_SID,               // approved template
  contentVariables: JSON.stringify({ "1": otp }), // template placeholders
});
    console.log("✅ WhatsApp OTP sent successfully. SID:", whatsappMessage.sid);
  } catch (error: any) {
    console.error("❌ WhatsApp send failed:", error.message);
  }

  // try {
  //   // Send SMS
  //   const smsMessage = await client.messages.create({
  //     messagingServiceSid: MESSAGING_SERVICE_SID,
  //     to: smsTo,
  //     body: otpBody,
  //   });
  //   console.log("✅ SMS OTP sent successfully. SID:", smsMessage.sid);
  // } catch (error: any) {
  //   console.error("❌ SMS send failed:", error.message);
  // }
};
 */

