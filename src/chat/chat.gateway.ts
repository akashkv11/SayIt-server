import {
  ConnectedSocket,
  MessageBody,
  SubscribeMessage,
  WebSocketGateway,
  WebSocketServer,
} from '@nestjs/websockets';
import { Server, Socket } from 'socket.io';
import { PrismaService } from 'src/prisma/prisma.service';

@WebSocketGateway({
  cors: {
    origin: 'http://localhost:5173',
    credentials: true,
  },
})
export class ChatGateway {
  @WebSocketServer() server: Server;
  private clients = new Map<string, string>(); // Map of userId -> socketId

  constructor(private prisma: PrismaService) {}

  handleConnection(client: any) {
    console.log('Client connected:', client.id);
  }

  @SubscribeMessage('register')
  registerClient(
    @ConnectedSocket() client: Socket,
    @MessageBody() userId: string,
  ): void {
    this.clients.set(userId, client.id);
    console.log(`Registered client: userId=${userId}, socketId=${client.id}`);
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

  handleDisconnect(client: Socket) {
    const userId = [...this.clients.entries()].find(
      ([, id]) => id === client.id,
    )?.[0];
    if (userId) {
      this.clients.delete(userId);
      console.log(
        `Client disconnected: userId=${userId}, socketId=${client.id}`,
      );
      // Notify other clients about the disconnection
      this.server.emit('user_disconnected', { userId });
    }
  }
  // Listen for incoming messages
  @SubscribeMessage('sendMessage')
  async handleMessage(
    client: Socket,
    payload: { content: string; recipientId: string },
  ): Promise<void> {
    console.log('Message received:', payload);

    // Get the sender's ID from the socket client
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    const senderId = Array.from(this.clients.entries()).find(
      ([, socketId]) => socketId === client.id,
    )?.[0];

    if (!senderId) {
      throw new Error('Sender not found');
    }

    // Store the message in the database
    await this.prisma.message.create({
      data: {
        content: payload.content,
        sender_id: senderId,
        recipient_id: payload.recipientId,
      },
    });

    // Emit the message to the recipient if they are online
    const recipientSocketId = this.clients.get(payload.recipientId);
    if (recipientSocketId) {
      this.server.to(recipientSocketId).emit('message', {
        content: payload.content,
        senderId,
        recipientId: payload.recipientId,
      });
    }
  }

  @SubscribeMessage('sendDirectMessage')
  async sendDirectMessage(
    client: any,
    payload: { recipientId: string; message: string },
  ): Promise<void> {
    const senderId = [...this.clients.entries()].find(
      ([, id]) => id === client.id,
    )?.[0];

    const recipientSocketId = this.clients.get(payload.recipientId);

    // Store the direct message in the database
    await this.prisma.message.create({
      data: {
        content: payload.message,
        sender_id: senderId,
        recipient_id: payload.recipientId,
      },
    });

    if (recipientSocketId) {
      this.server.to(recipientSocketId).emit('receiveDirectMessage', {
        senderId,
        message: payload.message,
      });
      console.log(`Message sent to ${payload.recipientId}: ${payload.message}`);
    } else {
      console.log(`Recipient ${payload.recipientId} not connected`);
    }
  }
}
