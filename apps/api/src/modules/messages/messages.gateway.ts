import {
  WebSocketGateway,
  WebSocketServer,
  SubscribeMessage,
  OnGatewayConnection,
  OnGatewayDisconnect,
} from "@nestjs/websockets";
import { Server, Socket } from "socket.io";
import { JwtService } from "@nestjs/jwt";
import { ConfigService } from "@nestjs/config";

@WebSocketGateway({
  cors: {
    origin: process.env.WEB_URL || "http://localhost:3000",
    credentials: true,
  },
  namespace: "/chat",
})
export class MessagesGateway
  implements OnGatewayConnection, OnGatewayDisconnect
{
  @WebSocketServer() server: Server;

  private userSockets = new Map<string, string[]>(); // userId -> socketId[]

  constructor(
    private jwtService: JwtService,
    private configService: ConfigService,
  ) {}

  async handleConnection(client: Socket) {
    try {
      const token =
        client.handshake.auth?.token ||
        client.handshake.headers?.authorization?.replace("Bearer ", "");
      if (!token) {
        client.disconnect();
        return;
      }

      const payload = this.jwtService.verify(token, {
        secret: this.configService.get("JWT_SECRET", "dev-secret-change-me"),
      });

      const userId = payload.sub;
      client.data.userId = userId;

      // Track user sockets
      const sockets = this.userSockets.get(userId) || [];
      sockets.push(client.id);
      this.userSockets.set(userId, sockets);

      // Join user's room
      client.join(`user:${userId}`);
      console.log(`User ${userId} connected to chat`);
    } catch {
      client.disconnect();
    }
  }

  handleDisconnect(client: Socket) {
    const userId = client.data.userId;
    if (userId) {
      const sockets = (this.userSockets.get(userId) || []).filter(
        (id) => id !== client.id,
      );
      if (sockets.length === 0) this.userSockets.delete(userId);
      else this.userSockets.set(userId, sockets);
    }
  }

  @SubscribeMessage("joinConversation")
  handleJoinConversation(client: Socket, conversationId: string) {
    client.join(`conversation:${conversationId}`);
  }

  @SubscribeMessage("leaveConversation")
  handleLeaveConversation(client: Socket, conversationId: string) {
    client.leave(`conversation:${conversationId}`);
  }

  // Called from the messages service when a new message is sent
  sendMessageToConversation(conversationId: string, message: any) {
    this.server
      .to(`conversation:${conversationId}`)
      .emit("newMessage", message);
  }

  // Called from the messages service to notify about new conversations or updates
  sendToUser(userId: string, event: string, data: any) {
    this.server.to(`user:${userId}`).emit(event, data);
  }
}
