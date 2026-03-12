import { Body, Controller, Post } from '@nestjs/common';
import { UsersService } from './users.services';
import { CreateUserDto } from './dto/create-user.dto';

@Controller('users')
export class UsersController {
  constructor(private readonly usersService: UsersService) {}

  @Post()
  async create(@Body() dto: CreateUserDto) {
    const user = await this.usersService.create(dto);
    return {
      data: {
        userId: user.id,
        user,
      },
    };
  }
}
