import mongoose from "mongoose";

const messageSchema = new mongoose.Schema({
    sender: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    conversation: { type: mongoose.Schema.Types.ObjectId, ref: 'Conversation', required: true },
    recever: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    content: { type: String, required: true },
    imageOrVideoUrl: { type: String },
    contentType: { type: String, enum: ['text', 'image', 'video']},
    reactions: [{ 
        user: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
        emoji:String 
    }],
    messageStatus: { type: String,default: 'sent' },
   
}, { timestamps: true });

const Message = mongoose.model('Message', messageSchema);

export default Message;