import express from 'express';
import { sendOtp, verifyOtp, updateProfile, logout, checkAuthenticated,getAllUsers} from '../controllers/authController.js';
import authMiddleware from '../middlewares/authMiddleware.js';
import {multerMiddleware} from '../../config/cloudinaryConfig.js';




const router = express.Router();


router.post('/send-otp',sendOtp);
router.post('/verify-otp',verifyOtp);
router.get('/logout',logout);



//*protected routes */

router.put('/update-profile',authMiddleware,multerMiddleware, updateProfile);
router.get('/check-authenticated',authMiddleware, checkAuthenticated);
router.get('/users',authMiddleware, getAllUsers);



export default router;