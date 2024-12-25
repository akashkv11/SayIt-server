import { Module } from '@nestjs/common';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { ChatGateway } from './chat/chat.gateway';
import { IoAdapter } from '@nestjs/platform-socket.io';
import { PrismaModule } from './prisma/prisma.module';

@Module({
  imports: [PrismaModule],
  controllers: [AppController],
  providers: [
    AppService,
    ChatGateway,
    {
      provide: IoAdapter,
      useValue: new IoAdapter({
        cors: {
          origin: 'http://localhost:5173', // Adjust to match your frontend
          methods: ['GET', 'POST'],
        },
      }),
    },
  ],
})
export class AppModule {}
