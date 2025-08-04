import { useContext, useEffect } from "react";
import { UserContext } from "../context/userContext";
import { useNavigate } from "react-router-dom";
import axiosInstance from "../utils/axiosInstance";
import { API_PATHS } from "../utils/apiPaths";

export const useUserAuth = () => {
    const { user, updateUser, clearUser, isLoading } = useContext(UserContext);
    const navigate = useNavigate();

    useEffect(() => {
        // Don't fetch if we already have a user or if we're already loading
        if (user) return;

        let isMounted = true;

        const fetchUserInfo = async () => {
            try {
                const response = await axiosInstance.get(API_PATHS.AUTH.GET_USER_INFO);

                if (isMounted && response.data) {
                    updateUser(response.data);
                }
            } catch (error) {
                console.error("Failed to fetch user info:", error);
                if (isMounted) {
                    clearUser();
                    navigate("/login");
                }
            }
        };
        
        fetchUserInfo();
        
        return () => {
            isMounted = false;
        };
    }, [updateUser, clearUser, navigate, user]);

    return { user, isLoading };
};