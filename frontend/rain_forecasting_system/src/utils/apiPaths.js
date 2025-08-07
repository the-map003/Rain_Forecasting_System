export const BASE_URL = "http://localhost:8000";

export const API_PATHS = {
    AUTH: {
        LOGIN: "/api/v1/auth/login",
        REGISTER: "/api/v1/auth/signup",
        GET_USER_INFO: "/api/v1/auth/getUser",
        ADMIN_REGISTER: "/api/v1/auth/admin/register",
        CHANGE_PASSWORD: "/api/v1/auth/change-password"
    },
    USERS: {
        GET_ALL: "/api/v1/users",
        GET_BY_ID: "/api/v1/users", // Append /:id when using
        UPDATE: "/api/v1/users", // Append /:id when using
        DELETE: "/api/v1/users", // Append /:id when using
        GET_BY_DATE_RANGE: "/api/v1/users/reports/date-range"
    }
};