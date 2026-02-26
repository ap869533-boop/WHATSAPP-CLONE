import express from 'express';
import { sendMessage,getConversations,getMessages,markAsRead,deleteMessage} from '../controllers/chatConroller.js';
import authMiddleware from '../middlewares/authMiddleware.js';
import {multerMiddleware} from '../../config/cloudinaryConfig.js';




const router = express.Router();


router.post('/send-message',authMiddleware,multerMiddleware, sendMessage);
router.get('/conversations',authMiddleware, getConversations);
router.get('/conversations/:conversationId/messages',authMiddleware, getMessages);
router.put('/messages/read',authMiddleware, markAsRead);
router.delete('/messages/:messageId',authMiddleware, deleteMessage);

export default router;