import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Param,
  Delete,
  UseGuards,
} from '@nestjs/common';
import { UserService } from './user.service';
import { Prisma } from '@prisma/client';
import { AuthGuard } from '../auth/auth.guard';
import { UserDto } from './dto/user.dto';
import { GetUser } from 'src/common/decorators/user-decorator';

@Controller('users')
export class UserController {
  constructor(private readonly userService: UserService) {}

  @Post('signup')
  create(@Body() createUserDto: UserDto) {
    return this.userService.create(createUserDto);
  }

  @UseGuards(AuthGuard)
  @Get()
  findAll(
    @GetUser('id') currentUser: string, // Get the current user's ID
  ) {
    return this.userService.findAll(currentUser);
  }

  @UseGuards(AuthGuard)
  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.userService.findOne(id);
  }

  @UseGuards(AuthGuard)
  @Patch(':id')
  update(
    @Param('id') id: string,
    @Body() updateUserDto: Prisma.UserUpdateInput,
  ) {
    return this.userService.update(id, updateUserDto);
  }

  @UseGuards(AuthGuard)
  @Delete(':id')
  remove(@Param('id') id: string) {
    return this.userService.remove(id);
  }

  @UseGuards(AuthGuard)
  @Get('messages/:targetUser')
  getMessages(
    @Param('targetUser') targetUser: string,
    @GetUser('currentUserId') currentUserId: string,
  ) {
    return this.userService.getUserChats(currentUserId, targetUser);
  }
}
