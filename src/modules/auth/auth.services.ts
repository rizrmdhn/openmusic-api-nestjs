import {
  BadRequestException,
  Inject,
  Injectable,
  UnauthorizedException,
} from '@nestjs/common';
import { env } from '../../config/env';
import { UsersService } from '../users/users.services';
import { verify as argonVerify } from '@node-rs/argon2';
import { jwtVerify, SignJWT } from 'jose';
import { User } from '../users/users.schema';
import { LoginDto } from './dto/login.dto';
import { RefreshDto } from './dto/refresh.dto';
import { DRIZZLE } from '../../database/drizzle.constants';
import type { DB } from '../../database/database.types';
import { refreshToken } from './auth.schema';
import { eq } from 'drizzle-orm/sql/expressions/conditions';

export interface AccessTokenPayload {
  userId: string;
  username: string;
}

export interface RefreshTokenPayload {
  userId: string;
  username: string;
}

@Injectable()
export class AuthService {
  /**
   * TextEncoder converts the secret string into a Uint8Array,
   * which is the format jose expects for HMAC keys.
   */
  private readonly accessSecret = new TextEncoder().encode(
    env.JWT_ACCESS_SECRET,
  );
  private readonly refreshSecret = new TextEncoder().encode(
    env.JWT_REFRESH_SECRET,
  );

  constructor(
    @Inject(DRIZZLE) private db: DB,
    private readonly usersService: UsersService,
  ) {}

  async login(dto: LoginDto) {
    const user = await this.usersService.findByUsername(dto.username);

    if (!user) throw new UnauthorizedException('Invalid credentials');

    const isValid = await argonVerify(user.password, dto.password);
    if (!isValid) throw new UnauthorizedException('Invalid credentials');

    const token = await this.generateTokenPair(user);

    await this.saveRefreshToken(token.refreshToken);

    return token;
  }

  /**
   * Issue a new token pair using a valid refresh token.
   *
   * Flow:
   * 1. Verify the refresh token signature and expiry.
   * 2. Load the user from the DB to confirm they still exist.
   * 3. Return a new access + refresh token pair (token rotation).
   *
   * Token rotation means every refresh invalidates the old refresh token
   * and issues a new one, limiting the damage of a leaked refresh token.
   */
  async refresh(dto: RefreshDto) {
    const existingToken = await this.db.query.refreshToken.findFirst({
      where: eq(refreshToken.token, dto.refreshToken),
    });

    if (!existingToken) throw new BadRequestException('Invalid refresh token');

    const payload = await this.verifyRefreshToken(dto.refreshToken);
    const user = await this.usersService.findById(payload.userId);
    if (!user) throw new UnauthorizedException('User no longer exists');

    const token = await this.generateTokenPair(user);

    // Invalidate the old refresh token and save the new one
    await Promise.all([
      this.removeRefreshToken(dto.refreshToken),
      this.saveRefreshToken(token.refreshToken),
    ]);

    return token;
  }

  async logout(dto: RefreshDto) {
    const isExistingToken = await this.db.query.refreshToken.findFirst({
      where: eq(refreshToken.token, dto.refreshToken),
    });

    if (!isExistingToken)
      throw new BadRequestException('Invalid refresh token');

    await this.removeRefreshToken(dto.refreshToken);
  }

  async saveRefreshToken(token: string) {
    await this.db.insert(refreshToken).values({ token });
  }

  async removeRefreshToken(token: string) {
    await this.db.delete(refreshToken).where(eq(refreshToken.token, token));
  }

  /**
   * Verify an access token and return its decoded payload.
   * Called by JwtGuard on every protected route.
   *
   * @throws UnauthorizedException if the token is missing, malformed, or expired.
   */
  async verifyAccessToken(token: string): Promise<AccessTokenPayload> {
    try {
      const { payload } = await jwtVerify(token, this.accessSecret);
      return {
        userId: payload.userId as string,
        username: payload.username as string,
        ...payload,
      };
    } catch {
      throw new UnauthorizedException('Invalid or expired access token');
    }
  }

  /**
   * Sign a short-lived access token (15 minutes).
   *
   * Contains the user ID (sub) and email so controllers can use them
   * without an extra database lookup on every request.
   *
   * alg: HS256 — HMAC with SHA-256, a symmetric signing algorithm.
   * setIssuedAt() — stamps the token with the current time (iat claim).
   */
  private signAccessToken(user: Pick<User, 'id' | 'username'>) {
    return new SignJWT({
      userId: user.id,
      username: user.username,
    })
      .setProtectedHeader({ alg: 'HS256' })
      .setSubject(String(user.id))
      .setIssuedAt()
      .setExpirationTime('15m')
      .sign(this.accessSecret);
  }

  /**
   * Sign a long-lived refresh token (7 days).
   *
   * Only stores the user ID — kept minimal because this token lives longer
   * and should expose as little data as possible if intercepted.
   */
  private signRefreshToken(user: Pick<User, 'id' | 'username'>) {
    return new SignJWT({
      userId: user.id,
      username: user.username,
    })
      .setProtectedHeader({ alg: 'HS256' })
      .setSubject(String(user.id))
      .setIssuedAt()
      .setExpirationTime('7d')
      .sign(this.refreshSecret);
  }

  /**
   * Verify a refresh token's signature and expiry.
   *
   * @throws UnauthorizedException if the token is invalid or expired.
   */
  private async verifyRefreshToken(
    token: string,
  ): Promise<RefreshTokenPayload> {
    try {
      const { payload } = await jwtVerify(token, this.refreshSecret);
      return {
        userId: payload.userId as string,
        username: payload.username as string,
        ...payload,
      };
    } catch {
      throw new UnauthorizedException('Invalid or expired refresh token');
    }
  }

  /**
   * Create both tokens concurrently and return them together.
   * Using Promise.all here avoids signing them sequentially (saves ~few ms).
   */
  private async generateTokenPair(user: User) {
    const [accessToken, refreshToken] = await Promise.all([
      this.signAccessToken(user),
      this.signRefreshToken(user),
    ]);
    return { accessToken, refreshToken };
  }
}
