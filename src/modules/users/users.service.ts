import {
  BadRequestException,
  Inject,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { DRIZZLE } from '../../database/drizzle.constants';
import type { DB } from '../../database/database.types';
import { eq } from 'drizzle-orm';
import { users } from './users.schema';
import { CreateUserDto } from './dto/create-user.dto';
import { hash } from '@node-rs/argon2';

@Injectable()
export class UsersService {
  // This service will handle user-related operations, such as creating users,
  // retrieving user information, and managing user authentication.

  constructor(@Inject(DRIZZLE) private db: DB) {}

  async findByUsername(username: string) {
    const user = await this.db.query.users.findFirst({
      where: eq(users.username, username),
    });

    return user;
  }

  async findById(id: string) {
    const user = await this.db.query.users.findFirst({
      where: eq(users.id, id),
    });

    if (!user) throw new NotFoundException(`User with id ${id} not found`);

    return user;
  }

  async create(dto: CreateUserDto) {
    const isExistingUser = await this.findByUsername(dto.username);

    if (isExistingUser)
      throw new BadRequestException(
        `User with username ${dto.username} already exists`,
      );

    const hashedPassword = await hash(dto.password);

    const [user] = await this.db
      .insert(users)
      .values({
        ...dto,
        password: hashedPassword,
      })
      .returning();

    return user;
  }

  async update(id: string, dto: Partial<CreateUserDto>) {
    await this.findById(id);

    const [user] = await this.db
      .update(users)
      .set(dto)
      .where(eq(users.id, id))
      .returning();

    return user;
  }

  async delete(id: string) {
    await this.findById(id);

    const [user] = await this.db
      .delete(users)
      .where(eq(users.id, id))
      .returning();

    return user;
  }
}
