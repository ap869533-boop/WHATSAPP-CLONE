import {Server} from "socket.io";
import User from "../models/User.js";
import Message from "../models/Message.js";




// map to store online users = userId: socketId 

const onlineUsers = new Map();

// Map to track typing status = userId: {conversation}: boolean 

const typingUsers = new Map();

const initializeSocket = (server) => {
    const io = new Server(server, {
        cors: {
            origin: process.env.FRONTEND_URL,
            Credentials: true,
            methods: ["GET", "POST", "PUT", "DELETE", "OPTIONS"],
        },
        pingTimeout: 60000, // Disconnect interective users or sockets after 60s  
    });

    // when a new socket connection is established
    io.on("connection", (socket) => {
        console.log("User connected", socket.id);
        let userId = null;


        // handle user connection and mark them as online in db
        socket.on("user_connected", async (connectingUserId) => {
            try {
                userId = connectingUserId;
                onlineUsers.set(userId, socket.id);
                socket.join(userId); // join persnal room for direct emit 

                // update user status in db 
                await User.findByIdAndUpdate(userId, {
                    isOnline: true,
                    lastSeen: Date.now(),
                });

                // notify all user that this user is now online
                io.emit("user_status", { userId, isOnline: true });
            } catch (error) {
                console.error("Error handling user connection:", error);
            }
        });
        // Return online status of requested user
        socket.on("get_user_status", (requestedUserId, callback) => {
            const isOnline = onlineUsers.has(requestedUserId);
            callback({
                userId: requestedUserId,
                isOnline,
                lastSeen: isOnline ? new Date() : null,

            });

        });
        // forword Message to receiver if online
        socket.on("send_message", async (message) => {
            try {
                const receiverSocketId = onlineUsers.get(message.receiver?._id);
                if (receiverSocketId) {
                    io.to(receiverSocketId).emit("receive_message", message);
                }
            } catch (error) {
                console.error("Error sending message:", error);
                socket.emit("message_error", { error: "Failed to send message" });
            }
        });

        //update message as read and notify Sender

        socket.on("message_read", async ({ messageIds, senderId }) => {
            try {
                await Message.updateMany(
                    { _id: { $in: messageIds } },
                    { $set: { messageStatus: "read" } }
                )

                const senderSocketId = onlineUsers.get(senderId);
                if (senderSocketId) {
                    messageIds.forEach((messageId) => {
                        io.to(senderSocketId).emit("message_status_updated", {
                            messageId,
                            messageStatus: "read",
                        });
                    });
                }

            } catch (error) {
                console.error("Error updating message read status:", error);
            }
        })


        // Handle typing start event and auto-stop after 3s
        socket.on("typing_start", ({ conversationId, receiverId }) => {
            if (!userId || !conversationId || !receiverId) return;

            if (!typingUsers.has(userId)) typingUsers.set(userId, {})

            const userTyping = typingUsers.get(userId);

            userTyping[conversationId] = true;

            // clear any exiting timeout 

            if (userTyping[`${conversationId}_timeout`]) {
                clearTimeout(userTyping[`${conversationId}_timeout`]);
            }
            // auto stop after 3s
            userTyping[`${conversationId}_timeout`] = setTimeout(() => {
                userTyping[conversationId] = false;
                socket.to(receiverId).emit("user_typing", {
                    userId,
                    conversationId,
                    isTyping: false,

                });
            }, 3000);

            //Notify reciver
            socket.to(receiverId).emit("user_typing", {
                userId,
                conversationId,
                isTyping: true,
            });
        });
        // Handle typing stop event
        socket.on("typing_stop", ({ conversationId, receiverId }) => {
            if (!userId || !conversationId || !receiverId) return;

            if (!typingUsers.has(userId)) {
                const userTyping = typingUsers.get(userId);
                userTyping[conversationId] = false;

                if (userTyping[`${conversationId}_timeout`]) {
                    clearTimeout(userTyping[`${conversationId}_timeout`]);
                    delete userTyping[`${conversationId}_timeout`]
                }
            };
            socket.to(receiverId).emit("user_typing", {
                userId,
                conversationId,
                isTyping: false,
            })
        });
        // Add or update reactions 
        socket.on("add_reaction", async ({ messageId, emoji, userId, reactonUserId }) => {
            try {
                const message = await Message.findById(messageId);
                if (!message) return;


                const exitingIndex = message.reactions.findIndex(
                    (r) => r.user.toString() === reactonUserId
                );

                if (exitingIndex > -1) {
                    const exiting = message.reactions(exitingIndex)
                    if (exiting.emoji === emoji) {
                        // remove same reaction
                        message.reactions.splice(exitingIndex, 1);
                    } else {
                        // change emoji
                        message.reactions[exitingIndex].emoji = emoji;
                    }
                } else {
                    message.reactions.push({ user: reactionUserId, emoji })
                }

                await message.save();

                const populatedMessage = await Message.findOne(message?._id)
                    .populate("sender", "username profilePicture")
                    .populate("receiver", "username profilePicture")
                    .populate("reactions.user", "username");

                const reactionUpdated = {
                    messageId,
                    reaction: populatedMessage.reactions,
                }

                const senderSocket = onlineUsers.get(populatedMessage.sender._id.toString());
                const receiverSocket = onlineUsers.get(populatedMessage.receiver?._id.toString())

                if (senderSocket) {
                    io.to(senderSocket).emit("reaction_update", reactionUpdated);
                }
                if (receiverSocket) {
                    io.to(receiverSocket).emit("reaction_update", reactionUpdated);
                }


            } catch (error) {
                console.log("Error handling reaction:", error);

            }
        });

        // handle disconnection and mark user offline

        const handleDisconnect = async () => {
            if (!userId) return;


            try {
                onlineUsers.delete(userId);
                // Clear all typing timeout

                if (typingUsers.has(userId)) {
                    const userTyping = typingUsers.get(userId);
                    object.keys(userTyping).forEach((key) => {
                        if (key.endWith("_timeout")) clearTimeout(userTyping[key]);

                    });

                    typingUsers.delete(userId);
                }
                // db update

                await User.findByIdAndUpdate(userId, {
                    isOnline: false,
                    lastSeen: new Date(),
                });


                io.emit("user_status", {
                    userId,
                    isOnline: false,
                    lastSeen: new Date(),
                });

                socket.leave(userId);
                console.log(`user ${userId} disconnected`)

            } catch (error) {
                console.error("Error handling disconnection:", error);

            }

        }

        // disconnect event 

        socket.on("disconnect", handleDisconnect)
    });

    // attach the online user map to the socket server for external user

    io.socketUserMap = onlineUsers;

    return io;
}

export { initializeSocket };