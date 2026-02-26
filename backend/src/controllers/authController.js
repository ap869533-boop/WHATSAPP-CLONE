import otpGenerate  from '../utils/otpGenerator.js';
import User from '../models/User.js';
import sendOtpToEmail  from '../services/emailService.js';
import response  from '../utils/responseHandler.js';
import generateToken from '../utils/generateToken.js';
import twilloService from '../services/twilloService.js';
import Conversation from '../models/Conversation.js';
import express from 'express';



const sendOtp = async(req, res) => {
    const {phoneNumber,phoneSuffix,email} = req.body || {};
    const otp = otpGenerate();
    const expiry = Date.now() + 300*1000;
    let user ;
    try {
        if(email){
            user = await User.findOne({email});
            if(!user){
                user = new User({email})
            }
            user.emailOtp = otp;
            user.emailOtpExpiry = expiry;
            await user.save();
            await sendOtpToEmail(email, otp);
            return response(res,200,"OTP sent to email",{email});
         }else{
         if(!phoneNumber || !phoneSuffix){
            return response(res,400,"Phone number and suffix are required");
         }
        }
         const fullPhoneNumber = `+${phoneSuffix}${phoneNumber}`;
         user = await User.findOne({phoneNumber});
            if(!user){
                user = new User({phoneNumber,phoneSuffix})
            }

            await twilloService.sendOtpToPhone(fullPhoneNumber);
            await user.save();
     

       return response(res,200,"OTP sent successfully",user);
    } catch (error) {
       console.error("Error sending OTP:", error);
       return response(res,500,"Internal server error");
    }
}


const verifyOtp = async(req, res) => {
    const {email, otp, phoneNumber, phoneSuffix} = req.body;
        try {
            let user;
        if(email){
           user = await User.findOne({email});
            if(!user){
                return response(res,404,"User not found");
           }
           const now = new Date();
           if (!user.emailOtp || String(user.emailOtp) !== String(otp) || !user.emailOtpExpiry || now.getTime() > user.emailOtpExpiry) {
               return response(res,400,"Invalid or expired OTP");
          }
             user.isVerified = true;
             user.emailOtp = null;
             user.emailOtpExpiry = null;
             await user.save();

    } else {
        if(!phoneNumber || !phoneSuffix){
            return response(res,400,"Phone number and suffix are required");
         }
        const fullPhoneNumber = `+${phoneSuffix}${phoneNumber}`;
        user = await User.findOne({phoneNumber});
        if(!user){
            return response(res,404,"User not found");
        }
        const result = await twilloService.verifyOtp(fullPhoneNumber, otp);
        if(result.status !== "approved"){
            return response(res,400,"Invalid OTP");
        }
        user.isVerified = true;
        await user.save();
        return response(res,200,"OTP verified successfully");
    
    };

    const token = generateToken(user?._id);
    res.cookie('auth_token', token, {
        httpOnly: true,
        maxAge: 365*24*60*60*1000, // 1 year
    });

    return response(res,200,"OTP verified successfully",{user,token});
}catch (error) {
    console.error("Error verifying OTP:", error);
    return response(res,500,"Internal server error");
}} 

const updateProfile = async(req, res) => {
    const userId = req.user.userId;
    const {username,agreed,about} = req.body;

    try {
        const user = await User.findById(userId);
        const file = req.file;
        if(file){
            const uploadResult = await uploadFileToCloudinary(file);
            user.profilePicture = uploadResult?.secure_url;
        }else if(req.body.profilePicture) {
            user.profilePicture = req.body.profilePicture;
        }

        if(username) user.username = username;
        if(about) user.about = about;
        if(agreed) user.agreed = agreed;
        await user.save();

        return response(res,200,"Profile updated successfully",user);
    }catch (error) {
        console.error("Error updating profile:", error);
        return response(res,500,"Internal server error");
    }
}


const checkAuthenticated = async(req, res) => {
    try {
        const userId = req.user.userId;
        if(!userId){
            return response(res,404,"User not authenticated");
        }
        const user = await User.findById(userId);
        if(!user){
            return response(res,404,"User not found");
        }
        return response(res,200,"User authenticated and allow to use whatsapp",user);
    } catch (error) {
        console.log("Error checking authentication:", error);
        return response(res,500,"Internal server error");
    }
}


const getAllUsers = async(req, res) => {
    const loggedInUser = req.user.userId;
    try {
       const users = await User.find({_id: {$ne: loggedInUser}}).select(
        'username profilePicture lastSeen isOnline about phoneNumber phoneSuffix'
       ).lean();

      const usersWithConversation = await Promise.all(users.map( async(user) => {
            const conversation = await Conversation.findOne({
                participants: {$all: [loggedInUser, user?._id]}
            }).populate({
                path: 'lastMessage',
                select: 'content createdAt sender receiver'
            }).lean();
            return {...user, conversation: conversation || 0};
        }));

       return response(res,200,"Users fetched successfully",usersWithConversation); 
    } catch (error) {
        console.error("Error fetching users:", error);
        return response(res,500,"Internal server error");
    }
}


 const logout = (req, res) => {
   try {
       res.cookie("auth_token", "",{expires: new Date(0)});
       return response(res,200,"Logged out successfully");
   } catch (error) {
         console.error("Error logging out:", error);
         return response(res,500,"Internal server error");      
   } 
 }   


export {sendOtp, verifyOtp, updateProfile, logout, checkAuthenticated, getAllUsers};