import express from 'express';
import {createStatus,getStatuses,viewStatus, deleteStatus} from '../controllers/statusConroller.js';
import authMiddleware from '../middlewares/authMiddleware.js';
import {multerMiddleware} from '../../config/cloudinaryConfig.js';




const router = express.Router();


router.post('/create-status',authMiddleware,multerMiddleware, createStatus);
router.get('/statuses',authMiddleware, getStatuses);
router.put('/view-status/:statusId',authMiddleware, viewStatus);
router.delete('/delete-status/:statusId',authMiddleware, deleteStatus);


export default router;