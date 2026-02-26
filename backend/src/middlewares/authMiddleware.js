import jwt from 'jsonwebtoken';
import response from '../utils/responseHandler.js';



const authMiddleware = (req, res, next) => {
    const authToken = req.cookies?.auth_token;
    if (!authToken) {
        return response(res,401,"Authentication token missing");
    }
    try {
        const decoded = jwt.verify(authToken, process.env.JWT_SECRET);
        req.user = decoded;
        console.log(req.user);
        next();
    } catch (error) {
        console.error("Error verifying token:", error);
        return response(res,401,"Invalid token or token expired");
    }
}


export default authMiddleware;