import { Test, TestingModule } from "@nestjs/testing";
import { JwtService } from "@nestjs/jwt";
import { ConfigService } from "@nestjs/config";
import {
  ConflictException,
  UnauthorizedException,
} from "@nestjs/common";
import * as bcrypt from "bcrypt";
import { AuthService } from "./auth.service";
import { DRIZZLE } from "../../database/database.module";

/**
 * Drizzle query builder mock.
 * - select/insert/update/delete/from/where/values/set/returning etc. all chain via `this`.
 * - Terminal calls (`limit`, `returning`) pull from the `terminalQueue`.
 * - Each terminal call shifts from the queue; if empty, resolves with `[]`.
 */
function createDbMock() {
  const terminalQueue: any[] = [];

  const builder: any = {
    _queue(...items: any[]) {
      terminalQueue.push(...items);
      return this;
    },
    select: jest.fn().mockReturnThis(),
    from: jest.fn().mockReturnThis(),
    where: jest.fn().mockReturnThis(),
    orderBy: jest.fn().mockReturnThis(),
    innerJoin: jest.fn().mockReturnThis(),
    leftJoin: jest.fn().mockReturnThis(),
    insert: jest.fn().mockReturnThis(),
    values: jest.fn().mockReturnThis(),
    update: jest.fn().mockReturnThis(),
    set: jest.fn().mockReturnThis(),
    delete: jest.fn().mockReturnThis(),
    limit: jest.fn(() => {
      return Promise.resolve(terminalQueue.shift() ?? []);
    }),
    returning: jest.fn(() => {
      return Promise.resolve(terminalQueue.shift() ?? []);
    }),
  };
  return builder;
}

describe("AuthService", () => {
  let service: AuthService;
  let db: ReturnType<typeof createDbMock>;

  beforeEach(async () => {
    db = createDbMock();

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        AuthService,
        { provide: DRIZZLE, useValue: db },
        {
          provide: JwtService,
          useValue: {
            signAsync: jest.fn().mockResolvedValue("mock-jwt-token"),
          },
        },
        {
          provide: ConfigService,
          useValue: {
            get: jest.fn((key: string) => {
              const values: Record<string, string> = {
                JWT_EXPIRES_IN: "15m",
                JWT_REFRESH_EXPIRES_IN: "7d",
                JWT_REFRESH_SECRET: "test-refresh-secret",
              };
              return values[key];
            }),
          },
        },
      ],
    }).compile();

    service = module.get<AuthService>(AuthService);
  });

  describe("register", () => {
    it("hashes password and returns user + tokens", async () => {
      // Queue: [check existing user = empty] then [insert returning = newUser]
      db._queue(
        [], // no existing user
        [
          {
            id: "u1",
            phone: "+639171234567",
            firstName: "Juan",
            lastName: "Dela Cruz",
            role: "buyer",
            passwordHash: "hashed-internally",
          },
        ],
      );

      const result = await service.register({
        phone: "+639171234567",
        firstName: "Juan",
        lastName: "Dela Cruz",
        password: "plain-password-123",
      } as any);

      expect(result.user.phone).toBe("+639171234567");
      expect(result.user.firstName).toBe("Juan");
      expect(result.accessToken).toBe("mock-jwt-token");
      expect(result.refreshToken).toBe("mock-jwt-token");
      // Password/hash never leak in response
      expect((result.user as any).password).toBeUndefined();
      expect((result.user as any).passwordHash).toBeUndefined();
    });

    it("throws ConflictException when phone already registered", async () => {
      db._queue([{ id: "existing", phone: "+639171234567" }]);

      await expect(
        service.register({
          phone: "+639171234567",
          firstName: "Juan",
          lastName: "Dela Cruz",
          password: "pw12345678",
        } as any),
      ).rejects.toThrow(ConflictException);
    });
  });

  describe("login", () => {
    it("throws UnauthorizedException when user does not exist", async () => {
      db._queue([]); // no user found

      await expect(
        service.login({
          phone: "+639170000000",
          password: "whatever",
        } as any),
      ).rejects.toThrow(UnauthorizedException);
    });

    it("throws UnauthorizedException on wrong password", async () => {
      const passwordHash = await bcrypt.hash("correct-password", 10);
      db._queue([
        {
          id: "u1",
          phone: "+639171234567",
          firstName: "Juan",
          lastName: "Dela Cruz",
          role: "buyer",
          isActive: true,
          passwordHash,
          avatarUrl: null,
        },
      ]);

      await expect(
        service.login({
          phone: "+639171234567",
          password: "wrong-password",
        } as any),
      ).rejects.toThrow(UnauthorizedException);
    });
  });
});
