import {
  Injectable,
  ConflictException,
  UnauthorizedException,
  BadRequestException,
  NotFoundException,
  Inject,
} from "@nestjs/common";
import { JwtService } from "@nestjs/jwt";
import { ConfigService } from "@nestjs/config";
import * as bcrypt from "bcrypt";
import { and, desc, eq, gt, gte, isNull, sql } from "drizzle-orm";
import { DRIZZLE } from "../../database/database.module";
import { users, otpCodes } from "../../database/schema";
import { RegisterDto } from "./dto/register.dto";
import { LoginDto } from "./dto/login.dto";

type OtpPurpose = "reset" | "verify";

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

  /**
   * Generate a 6-digit OTP, hash it, store it with 10-minute expiry.
   * Enforces rate limit of max 3 requests per phone per hour.
   * In production, sends via SMS; for now, logs to console.
   */
  async sendOtp(phone: string, purpose: OtpPurpose) {
    // Rate limit: max 3 OTPs per phone per hour
    const oneHourAgo = new Date(Date.now() - 60 * 60 * 1000);
    const recent = await this.db
      .select({ count: sql<number>`count(*)::int` })
      .from(otpCodes)
      .where(
        and(
          eq(otpCodes.phone, phone),
          eq(otpCodes.purpose, purpose),
          gte(otpCodes.createdAt, oneHourAgo),
        ),
      );

    const recentCount = Number(recent?.[0]?.count ?? 0);
    if (recentCount >= 3) {
      throw new BadRequestException(
        "Too many OTP requests. Please try again later.",
      );
    }

    // Generate 6-digit code
    const code = String(Math.floor(100000 + Math.random() * 900000));
    const codeHash = await bcrypt.hash(code, 10);
    const expiresAt = new Date(Date.now() + 10 * 60 * 1000); // 10 minutes

    const [inserted] = await this.db
      .insert(otpCodes)
      .values({
        phone,
        code: codeHash,
        purpose,
        expiresAt,
      })
      .returning();

    // TODO: In production, send via Semaphore SMS API
    // For now, log the code for development
    console.log(`SMS SIMULATION: ${phone} -> OTP: ${code}`);

    return {
      otpRef: inserted.id as string,
      expiresIn: 600,
    };
  }

  /**
   * Verify an OTP code. On success, returns a short-lived reset token.
   * Enforces max 3 attempts per OTP record.
   */
  async verifyOtp(phone: string, code: string, purpose: OtpPurpose) {
    const now = new Date();

    const [otp] = await this.db
      .select()
      .from(otpCodes)
      .where(
        and(
          eq(otpCodes.phone, phone),
          eq(otpCodes.purpose, purpose),
          isNull(otpCodes.usedAt),
          gt(otpCodes.expiresAt, now),
        ),
      )
      .orderBy(desc(otpCodes.createdAt))
      .limit(1);

    if (!otp) {
      throw new BadRequestException("Invalid or expired OTP");
    }

    if (otp.attempts >= 3) {
      throw new BadRequestException(
        "Too many failed attempts. Please request a new code.",
      );
    }

    const valid = await bcrypt.compare(code, otp.code);

    if (!valid) {
      await this.db
        .update(otpCodes)
        .set({ attempts: (otp.attempts ?? 0) + 1 })
        .where(eq(otpCodes.id, otp.id));
      throw new BadRequestException("Invalid OTP code");
    }

    // Mark as used
    await this.db
      .update(otpCodes)
      .set({ usedAt: new Date() })
      .where(eq(otpCodes.id, otp.id));

    // Issue short-lived reset token (15 min)
    if (purpose === "reset") {
      const resetToken = await this.jwtService.signAsync(
        { phone, purpose: "reset" },
        {
          secret: `${this.config.get("JWT_SECRET", "dev-secret-change-me")}:reset`,
          expiresIn: "15m",
        },
      );

      return { valid: true, token: resetToken };
    }

    return { valid: true };
  }

  /**
   * Reset the user's password given a valid reset token from verifyOtp.
   */
  async resetPassword(resetToken: string, newPassword: string) {
    let payload: { phone: string; purpose: string };
    try {
      payload = await this.jwtService.verifyAsync(resetToken, {
        secret: `${this.config.get("JWT_SECRET", "dev-secret-change-me")}:reset`,
      });
    } catch {
      throw new UnauthorizedException("Invalid or expired reset token");
    }

    if (payload.purpose !== "reset" || !payload.phone) {
      throw new UnauthorizedException("Invalid reset token");
    }

    const [user] = await this.db
      .select()
      .from(users)
      .where(eq(users.phone, payload.phone))
      .limit(1);

    if (!user) {
      throw new NotFoundException("User not found");
    }

    const passwordHash = await bcrypt.hash(newPassword, 10);

    await this.db
      .update(users)
      .set({ passwordHash, updatedAt: new Date() })
      .where(eq(users.id, user.id));

    return { success: true };
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
