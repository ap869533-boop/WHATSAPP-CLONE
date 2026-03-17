import axiosInstance from "./url.service";




const sendOtp = async (phoneNumber,phoneSuffix,email) => {
    try {
        const response = await axiosInstance.post('/auth/send-otp', {
            phoneNumber,
            phoneSuffix,
            email
        });
        return response.data;
    } catch (error) {
        console.error('Error sending OTP:', error);
        throw error;
    }
}

const verifyOtp = async (phoneNumber,phoneSuffix,otp,email) => {
    try {
        const response = await axiosInstance.post('/auth/verify-otp', {
            phoneNumber,
            phoneSuffix,
            otp,
            email
        });
        return response.data;
    } catch (error) {
        console.error('Error verifying OTP:', error);
        throw error;
    }
}

const updateUserProfile = async (updateData) => {
    try {
        const response = await axiosInstance.put('/auth/update-profile', updateData);
        return response.data;
    } catch (error) {
        console.error('Error updating user profile:', error);
        throw error;
    }
}


const checkUserAuth = async () => {
    try {
        const response = await axiosInstance.get('/auth/check-auth');
        if (response.data.status ==='success') {
            return {isAuthenticated: true,user: response?.data?.data};
        }
        else if (response.data.status === 'error') {
            return {isAuthenticated: false};
        }
    } catch (error) {
        console.error('Error checking user authentication:', error);
        throw error;
    }
}

const logoutUser = async () => {
    try {
        const response = await axiosInstance.post('/auth/logout');
        return response.data;
    } catch (error) {
        console.error('Error logging out user:', error);
        throw error;
    }
}


const getAllUsers = async () => {
    try {
        const response = await axiosInstance.get('/auth/users');
        return response.data;
    } catch (error) {
        console.error('Error getting all users:', error);
        throw error;
    }
}


export { sendOtp, verifyOtp, updateUserProfile, checkUserAuth, logoutUser, getAllUsers };