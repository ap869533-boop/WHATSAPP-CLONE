import mongoose from 'mongoose';

const userSchema = new mongoose.Schema({
    phoneNumber: {type: String, required: true, unique: true, sparse: true},
    phoneSuffix: {type: String, required: true, unique: true},
    username: {type: String, required: true},
    email: {type: String, 
            lowercase: true,
            Validate:{
                 validator: function(value) {
                     return /^\w+([.-]?\w+)*@\w+([.-]?\w+)*(\.\w{2,3})+$/.test(value);
                    },
                     message:"Invalid email format"
            },
    },
    emailOtp: {type: String},
    emailOtpExpiry: {type: Date},
    profilePicture: {type: String},
    about: {type: String},
    lastSeen: {type: Date},
    isOnline: {type: Boolean, default: false},
    isVerified: {type: Boolean, default: false},
    agreed:{type: Boolean, default: false}
    
}, {timestamps: true});                               

const User = mongoose.model('User', userSchema);

export default User;