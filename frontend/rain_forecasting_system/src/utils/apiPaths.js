export const BASE_URL = "http://localhost:8000";
export const API_BASE_URL = "http://localhost:8000/api/v1";

// MQTT Configuration
export const MQTT_CONFIG = {
    BROKER_URL: "test.mosquitto.org",
    PORT: 1883, // For ESP32 devices (raw MQTT)
    WS_PORT: 8080, // For frontend (WebSocket MQTT)
    TOPIC_PREFIX: "rain_forecasting",
    // Function to generate device-specific topic
    getDeviceTopic: (deviceId) => `rain_forecasting/${deviceId}/data`,
    getDeviceConfigTopic: (deviceId) => `rain_forecasting/${deviceId}/config`
};

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
    },
    DEVICES: {
        GET_ALL: "/api/v1/devices",
        REGISTER: "/api/v1/devices",
        GET_BY_ID: "/api/v1/devices", // Append /:id when using
        GET_BY_DEVICE_ID: "/api/v1/devices/deviceId", // Append /:deviceId when using
        UPDATE: "/api/v1/devices", // Append /:id when using
        DELETE: "/api/v1/devices", // Append /:id when using
        DATA_RECEIVED: "/api/v1/devices", // Append /:deviceId/data-received when using
        CHECK_STATUS: "/api/v1/devices" // Append /:deviceId/status when using
    }
};