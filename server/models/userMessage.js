import mongoose from "mongoose";

const UserMessageSchema = new mongoose.Schema({
    sender: { 
        ref: 'User', 
        required: true 
    },
    content: { 
        type: String, 
        required: true,
        maxlength: 1000
    },
    roomId: {  
        type: String,
        required: true, 
        index: true 
    },
    messageType: {
        type: String,
        enum: ['text', 'image', 'file'],
        default: 'text'
    }
}, {
    timestamps: true,
});


const Message = mongoose.model('Message', UserMessageSchema);

export default Message;