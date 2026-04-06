import { io } from "socket.io-client";
import { getRealtimeBaseUrl } from "../api/axios";

let socketInstance = null;

export const getRealtimeSocket = () => {
  if (!socketInstance) {
    socketInstance = io(getRealtimeBaseUrl(), {
      autoConnect: false,
      withCredentials: true,
      transports: ["websocket"],
      reconnection: true,
      reconnectionAttempts: Infinity,
      reconnectionDelay: 1000,
      reconnectionDelayMax: 5000,
      timeout: 10000,
    });
  }

  return socketInstance;
};

export const getRealtimeSocketForRole = (preferredRole) => {
  const socket = getRealtimeSocket();
  const normalizedRole = String(preferredRole || "").toLowerCase();
  const roleChanged = socket.auth?.preferredRole !== normalizedRole;

  socket.auth = {
    ...(socket.auth || {}),
    preferredRole: normalizedRole,
  };

  if (roleChanged && socket.connected) {
    socket.disconnect();
  }

  return socket;
};
