import { JwtService } from '@nestjs/jwt';
import {
  ConnectedSocket,
  MessageBody,
  OnGatewayConnection,
  OnGatewayDisconnect,
  SubscribeMessage,
  WebSocketGateway,
  WebSocketServer,
  WsException,
} from '@nestjs/websockets';
import { Server, Socket } from 'socket.io';
import { PrismaService } from 'src/prisma/prisma.service';

@WebSocketGateway({
  cors: {
    origin: 'http://localhost:5173',
    credentials: true,
  },
})
export class ChatGateway implements OnGatewayConnection, OnGatewayDisconnect {
  @WebSocketServer() server: Server;
  private clients = new Map<string, string>(); // userId -> socketId

  constructor(
    private jwtService: JwtService,
    private prisma: PrismaService,
  ) {}

  handleConnection(client: Socket) {
    const token = client.handshake.auth?.token?.split(' ')[1];

    if (!token) {
      client.disconnect();
      throw new WsException('Authorization token missing');
    }

    try {
      const decoded = this.jwtService.verify(token, {
        secret: process.env.JWT_SECRET,
      });

      client.data.user = decoded;
      const userId = decoded.sub;

      this.clients.set(userId, client.id);
      console.log(`Client connected: userId=${userId}, socketId=${client.id}`);
    } catch (err) {
      client.disconnect();
      throw new WsException('Invalid or expired token');
    }
  }

  handleDisconnect(client: Socket) {
    const userId = [...this.clients.entries()].find(
      ([, socketId]) => socketId === client.id,
    )?.[0];

    if (userId) {
      this.clients.delete(userId);
      console.log(
        `Client disconnected: userId=${userId}, socketId=${client.id}`,
      );
      this.server.emit('user_disconnected', { userId });
    }
  }

  @SubscribeMessage('sendMessage')
  async handleMessage(
    @ConnectedSocket() client: Socket,
    @MessageBody()
    payload: { content: string; recipientId: string },
  ): Promise<void> {
    const senderId = client.data.user?.sub;

    if (!senderId) {
      throw new WsException('Sender not identified');
    }

    // Store the message
    const message = await this.prisma.message.create({
      data: {
        content: payload.content,
        sender_id: senderId,
        recipient_id: payload.recipientId,
      },
    });

    // Emit to recipient
    const recipientSocketId = this.clients.get(payload.recipientId);
    if (recipientSocketId) {
      this.server.to(recipientSocketId).emit('receiveMessage', {
        content: payload.content,
        senderId,
        recipientId: payload.recipientId,
      });
    }

    // Optional: Emit back to sender as confirmation
    client.emit('messageSent', {
      content: payload.content,
      recipientId: payload.recipientId,
      timestamp: message.created_at,
    });
  }

  @SubscribeMessage('disconnect_user')
  async disconnectUser(
    @ConnectedSocket() client: Socket,
    @MessageBody() userId: string,
  ): Promise<void> {
    this.clients.delete(userId);
    client.disconnect();
    console.log(`User manually disconnected: userId=${userId}`);
  }
}
