import {
  Injectable,
  ConflictException,
  UnauthorizedException,
  Inject,
} from "@nestjs/common";
import { JwtService } from "@nestjs/jwt";
import { ConfigService } from "@nestjs/config";
import * as bcrypt from "bcrypt";
import { eq } from "drizzle-orm";
import { DRIZZLE } from "../../database/database.module";
import { users } from "../../database/schema";
import { RegisterDto } from "./dto/register.dto";
import { LoginDto } from "./dto/login.dto";

@Injectable()
export class AuthService {
  constructor(
    @Inject(DRIZZLE) private db: any,
    private jwtService: JwtService,
    private config: ConfigService,
  ) {}

  async register(dto: RegisterDto) {
    // Check if phone already exists
    const existing = await this.db
      .select()
      .from(users)
      .where(eq(users.phone, dto.phone))
      .limit(1);

    if (existing.length > 0) {
      throw new ConflictException("Phone number already registered");
    }

    const passwordHash = await bcrypt.hash(dto.password, 10);

    const [user] = await this.db
      .insert(users)
      .values({
        phone: dto.phone,
        firstName: dto.firstName,
        lastName: dto.lastName,
        passwordHash,
        phoneVerified: false,
      })
      .returning();

    const tokens = await this.generateTokens(user.id, user.phone, user.role);

    return {
      user: {
        id: user.id,
        phone: user.phone,
        firstName: user.firstName,
        lastName: user.lastName,
        role: user.role,
      },
      ...tokens,
    };
  }

  async login(dto: LoginDto) {
    const [user] = await this.db
      .select()
      .from(users)
      .where(eq(users.phone, dto.phone))
      .limit(1);

    if (!user) {
      throw new UnauthorizedException("Invalid phone number or password");
    }

    if (!user.isActive) {
      throw new UnauthorizedException("Account is deactivated");
    }

    const passwordValid = await bcrypt.compare(dto.password, user.passwordHash);
    if (!passwordValid) {
      throw new UnauthorizedException("Invalid phone number or password");
    }

    const tokens = await this.generateTokens(user.id, user.phone, user.role);

    return {
      user: {
        id: user.id,
        phone: user.phone,
        firstName: user.firstName,
        lastName: user.lastName,
        role: user.role,
        avatarUrl: user.avatarUrl,
      },
      ...tokens,
    };
  }

  async refreshToken(userId: string) {
    const [user] = await this.db
      .select()
      .from(users)
      .where(eq(users.id, userId))
      .limit(1);

    if (!user || !user.isActive) {
      throw new UnauthorizedException("Invalid user");
    }

    return this.generateTokens(user.id, user.phone, user.role);
  }

  private async generateTokens(
    userId: string,
    phone: string,
    role: string,
  ) {
    const payload = { sub: userId, phone, role };

    const [accessToken, refreshToken] = await Promise.all([
      this.jwtService.signAsync(payload, {
        secret: this.config.get("JWT_SECRET", "dev-secret-change-me"),
        expiresIn: this.config.get("JWT_EXPIRES_IN", "15m"),
      }),
      this.jwtService.signAsync(payload, {
        secret: this.config.get(
          "JWT_REFRESH_SECRET",
          "dev-refresh-secret-change-me",
        ),
        expiresIn: this.config.get("JWT_REFRESH_EXPIRES_IN", "7d"),
      }),
    ]);

    return { accessToken, refreshToken };
  }
}
