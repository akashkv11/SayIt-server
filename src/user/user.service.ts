import {
  ConflictException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { Prisma, User } from '@prisma/client';
import * as bcrypt from 'bcrypt';
import { PrismaService } from '../prisma/prisma.service';
import { UserDto } from './dto/user.dto';

@Injectable()
export class UserService {
  constructor(private prisma: PrismaService) {}

  async create(data: UserDto): Promise<{ user: Omit<User, 'password'> }> {
    const existingUser = await this.prisma.user.findFirst({
      where: { OR: [{ username: data.username }, { email: data.email }] },
    });

    if (existingUser) {
      throw new ConflictException('Username or email already exists');
    }

    const hashedPassword = await bcrypt.hash(data.password, 10);
    const user = await this.prisma.user.create({
      data: { ...data, password: hashedPassword },
    });

    const payload = { sub: user.id, email: user.email };
    delete user.password;

    return { user };
  }

  async findAll(currentUser: string): Promise<Omit<User, 'password'>[]> {
    const users = await this.prisma.user.findMany({
      where: { id: { not: currentUser } },
    });
    return users.map((user) => {
      delete user.password;
      return user;
    });
  }

  async findOne(id: string): Promise<Omit<User, 'password'>> {
    const user = await this.prisma.user.findUnique({ where: { id } });

    if (!user) {
      throw new NotFoundException('User not found');
    }

    delete user.password;
    return user;
  }

  async update(
    id: string,
    data: Prisma.UserUpdateInput,
  ): Promise<Omit<User, 'password'>> {
    const user = await this.prisma.user.update({ where: { id }, data });

    delete user.password;
    return user;
  }

  async remove(id: string): Promise<void> {
    await this.prisma.user.delete({ where: { id } });
  }
}
