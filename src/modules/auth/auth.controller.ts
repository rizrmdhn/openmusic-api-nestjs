import {
  Body,
  Controller,
  Delete,
  HttpCode,
  HttpStatus,
  Post,
  Put,
} from '@nestjs/common';
import { AuthService } from './auth.service';
import { LoginDto } from './dto/login.dto';
import { RefreshDto } from './dto/refresh.dto';

@Controller('authentications')
export class AuthController {
  constructor(private readonly authService: AuthService) {}

  @Post()
  @HttpCode(HttpStatus.CREATED)
  async login(@Body() dto: LoginDto) {
    const token = await this.authService.login(dto);
    return {
      data: token,
    };
  }

  @Put()
  @HttpCode(HttpStatus.OK)
  async refreshToken(@Body() dto: RefreshDto) {
    const token = await this.authService.refresh(dto);
    return {
      data: token,
    };
  }

  @Delete()
  @HttpCode(HttpStatus.OK)
  async logout(@Body() dto: RefreshDto) {
    await this.authService.logout(dto);
    return {
      message: 'Logged out successfully',
    };
  }
}
