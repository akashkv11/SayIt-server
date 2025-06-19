// user.module.ts
import { Module, forwardRef } from '@nestjs/common';
import { UserController } from './user.controller';
import { UserService } from './user.service';
import { PrismaModule } from 'src/prisma/prisma.module';
import { AuthModule } from '../auth/auth.module'; // <-- import AuthModule

@Module({
  imports: [
    forwardRef(() => AuthModule), // <-- use forwardRef to avoid circular dependency crash
    PrismaModule,
  ],
  controllers: [UserController],
  providers: [UserService],
  exports: [UserService],
})
export class UserModule {}
