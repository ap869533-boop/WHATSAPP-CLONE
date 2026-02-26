import twilio from 'twilio';
import dotenv from 'dotenv';
dotenv.config();

const accountSid = process.env.TWILLO_ACCOUNT_SID;
const authToken = process.env.TWILLO_AUTH_TOKEN;
const serviceSid = process.env.TWILLO_SERVICE_SID;

const client = twilio(accountSid, authToken);
const sendOtpToPhone = async (phoneNumber, otp) => {
    try {
       console.log("to phone number", phoneNumber);
       if(!phoneNumber){
        throw new Error("Phone number is required");
       }
       const response = await client.verify.v2.services(serviceSid)
            .verifications
            .create({to: phoneNumber, channel: 'sms'});
       console.log("Twilio response:", response);
       return response; 
    } catch (error) {
        console.error("Error sending OTP:", error);
        throw error;
    }
};

const verifyOtp = async (phoneNumber, otp) => {
    try { console.log("Verifying OTP for phone number:", phoneNumber);
        console.log("OTP to verify:", otp);
        const response = await client.verify.v2.services(serviceSid)
            .verificationChecks
            .create({to: phoneNumber, code: otp});
        console.log("Twilio response:", response);
        return response;
    } catch (error) {
        console.error("Error verifying OTP:", error);
        throw error;
    }
};

export default { sendOtpToPhone, verifyOtp };
