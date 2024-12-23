import {
  ConnectedSocket,
  MessageBody,
  SubscribeMessage,
  WebSocketGateway,
  WebSocketServer,
} from '@nestjs/websockets';
import { Server, Socket } from 'socket.io';

@WebSocketGateway({
  cors: {
    origin: 'http://localhost:5173',
    credentials: true,
  },
})
export class ChatGateway {
  @WebSocketServer() server: Server;
  private clients = new Map<string, string>(); // Map of userId -> socketId

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

  handleDisconnect(client: any) {
    const userId = [...this.clients.entries()].find(
      ([, id]) => id === client.id,
    )?.[0];
    if (userId) {
      this.clients.delete(userId);
      console.log(
        `Client disconnected: userId=${userId}, socketId=${client.id}`,
      );
    }
  }
  // Listen for incoming messages
  @SubscribeMessage('sendMessage')
  handleMessage(client: Socket, payload: string): void {
    console.log('Message received:', payload);
    this.server.emit('receiveMessage', payload); // Broadcast to all clients
  }

  @SubscribeMessage('sendDirectMessage')
  sendDirectMessage(
    client: any,

    payload: { recipientId: string; message: string },
  ): void {
    const senderId = [...this.clients.entries()].find(
      ([, id]) => id === client.id,
    )?.[0];

    const recipientSocketId = this.clients.get(payload.recipientId);
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
