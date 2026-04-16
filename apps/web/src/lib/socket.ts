import { io, Socket } from "socket.io-client";

let socket: Socket | null = null;

export function getSocket(): Socket | null {
  return socket;
}

export function connectSocket(token: string): Socket {
  if (socket?.connected) return socket;

  const apiUrl = (
    process.env.NEXT_PUBLIC_API_URL || "http://localhost:3001/api"
  ).replace("/api", "");

  socket = io(`${apiUrl}/chat`, {
    auth: { token },
    transports: ["websocket", "polling"],
  });

  socket.on("connect", () => console.log("Socket connected"));
  socket.on("disconnect", () => console.log("Socket disconnected"));

  return socket;
}

export function disconnectSocket() {
  if (socket) {
    socket.disconnect();
    socket = null;
  }
}
