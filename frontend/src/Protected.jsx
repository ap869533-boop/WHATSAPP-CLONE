
import { useLocation } from "react-router-dom";
import { useEffect, useState } from "react";
import userUserStore from "./store/useUserStore.js";
import { Navigate, Outlet } from "react-router-dom";
import Loader from "./utills/loader.jsx";

export const ProtectedRout = () => {
    const lcation = useLocation();
    const [ischecking, setIschecking] = useState(true);
    const {isAuthenticated,setUser,checkAuth,clearUser} = userUserStore();   


     useEffect(() => {
        const verifyAuth = async () => {
            try {
               const result = await checkAuth();
               if (result?.isAuthenticated) {
                setUser(result.user);
               }else{
                  clearUser();
               }
            } catch (error) {
                console.error("Error checking authentication:", error);
                clearUser();
            } finally {
                setIschecking(false);
            }
        };
        verifyAuth();
    }, [setUser,clearUser]);

    if (ischecking) {
        return <Loader/>
    }

        if (!isAuthenticated) {
            return <Navigate to="/user-login" state={{ from: lcation }} replace />;
        }

     // user is auth- render the protected route 
        return <Outlet />;  
}

export const PublicRoute = () => {
    const isAuthenticated = userUserStore( state => state.isAuthenticated);
    if (isAuthenticated) {
        return <Navigate to="/" replace />;
    }
    return <Outlet />;
}


