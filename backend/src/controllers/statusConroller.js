import Status from "../models/Status.js";
import { uploadFileToCloudinary } from "../../config/cloudinaryConfig.js"
import response from "../utils/responseHandler.js"
import Message from "../models/Message.js";


const createStatus = async (req, res) => {
    try {
        const { content, contentType } = req.body;
        const userId = req.user.userId;
        const file = req.file;

        let mediaUrl = null;
        let finalContentType = contentType || 'text';

        if (file) {
            const uploadFile = await uploadFileToCloudinary(file);

            if (!uploadFile?.secure_url) {
                return response(res, 400, "File upload failed");
            }
            mediaUrl = uploadFile.secure_url;

            if (file.mimetype.startsWith('image')) {
                finalContentType = 'image';
            } else if (file.mimetype.startsWith('video')) {
                finalContentType = 'video';
            } else {
                return response(res, 400, "unsupported file type");
            }
        } else if (content?.trim()) {
            finalContentType = 'text';
        } else {
            return response(res, 400, "status content is required")
        }


        const expiresAt = new Date(Date.now() + 24 * 60 * 60 * 1000);

        const newStatus = new Status({
            user: userId,
            content: mediaUrl || content,
            contentType: finalContentType,
            expiresAt
        });

        await newStatus.save();

        const populatedStatus = await Status.findOne(newStatus?._id)
            .populate('user', 'username profilePicture')
            .populate('viewers', 'username profilePicture');

        // emit socket event 
        if (req.io && req.socketUserMap) {
            // Brodcast to all connecting users except the creator
            for (const [connectedUserId, socketId] of req.socketUserMap) {
                if (connectedUserId !== userId) {
                    req.io.to(socketId).emit("new_status", populatedStatus)
                }
            }
        }

        return response(res, 201, "Status created successfully", populatedStatus);

    } catch (error) {
        console.error(error);
        return response(res, 500, "Internal server error");
    }
}

//* get all status */

const getStatuses = async (req, res) => {
    try {
        const statuses = await Status.find({
            expiresAt: { $gt: new Date() }
        }).populate("user", "username profilePicture")
            .populate("viewers", "username profilePicture").sort({ createdAt: -1 });
        return response(res, 200, "Statuses fetched successfully", statuses);
    } catch (error) {
        console.error(error);
        return response(res, 500, "Internal server error");
    }

}


//* all view status users */

const viewStatus = async (req, res) => {
    try {
        const { statusId } = req.params;
        const userId = req.user.userId;

        const status = await Status.findById(statusId);
        if (!status) {
            return response(res, 404, "Status not found");
        }
        if (!status.viewers.includes(userId)) {
            status.viewers.push(userId);
            await status.save();


            const updatedStatus = await Status.findById(statusId)
                .populate("viewers", "username profilePicture")
                .populate("user", "username profilePicture");

            // emit socket event

            if (req.io && req.socketUserMap) {
                const statusOwnerSocketId = req.socketUserMap.get(status.user._id.toString())
                if (statusOwnerSocketId) {
                    const viewData = {
                        statusId,
                        viewerId: userId,
                        totalViewers: updatedStatus.viewers.length,
                        viewers: updatedStatus.viewers
                    }

                    req.io.to(statusOwnerSocketId).emit("status_viewed", viewData)
                } else {
                    console.log("status Owner are not connected")
                }
            }

        } else {
            console.log("You have already viewed this status");
        }
        return response(res, 200, "Status viewed successfully");
    } catch (error) {
        console.error(error);
        return response(res, 500, "Internal server error");
    }
}


const deleteStatus = async (req, res) => {
    try {
        const { statusId } = req.params;
        const userId = req.user.userId;
        const status = await Status.findById(statusId);
        if (!status) {
            return response(res, 404, "Status not found");
        };

        if (status.user.toString() !== userId) {
            return response(res, 403, "You are not authorized to delete this status");
        }
        await Status.deleteOne();

        // emit socket event
        if (req.io && req.socketUserMap) {
            for (const [connectedUserId, socketId] of req.socketUserMap) {
                if (connectedUserId !== userId) {
                    req.io.to(socketId).emit("status_deleted", statusId)
                }
            }
        }

        return response(res, 200, "Status deleted successfully");
    } catch (error) {
        console.error(error);
        return response(res, 500, "Internal server error");
    }
}

export { createStatus, getStatuses, viewStatus, deleteStatus }