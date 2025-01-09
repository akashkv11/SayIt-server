import { Module } from '@nestjs/common';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { ChatGateway } from './chat/chat.gateway';
import { IoAdapter } from '@nestjs/platform-socket.io';
import { PrismaModule } from './prisma/prisma.module';
import { UserModule } from './user/user.module';
import { AuthModule } from './auth/auth.module';
import { ConfigModule } from '@nestjs/config';
import { JwtModule } from '@nestjs/jwt';

@Module({
  imports: [
    PrismaModule,
    UserModule,
    AuthModule,
    ConfigModule.forRoot({
      isGlobal: true, // Loads .env globally
    }),
    JwtModule,
  ],
  controllers: [AppController],
  providers: [
    AppService,
    ChatGateway,
    {
      provide: IoAdapter,
      useValue: new IoAdapter({
        cors: {
          origin: 'http://localhost:5173',
          methods: ['GET', 'POST'],
        },
      }),
    },
  ],
})
export class AppModule {}
