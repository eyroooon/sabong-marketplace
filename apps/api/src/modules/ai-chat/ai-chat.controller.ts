import {
  Controller,
  Post,
  Get,
  Body,
  Res,
  Req,
  HttpCode,
  HttpException,
  HttpStatus,
} from "@nestjs/common";
import { Request, Response } from "express";
import { JwtService } from "@nestjs/jwt";
import { ConfigService } from "@nestjs/config";
import { AiChatService } from "./ai-chat.service";
import { AiChatRateLimiter } from "./rate-limiter.service";

@Controller("ai-chat")
export class AiChatController {
  constructor(
    private readonly aiChatService: AiChatService,
    private readonly rateLimiter: AiChatRateLimiter,
    private readonly jwtService: JwtService,
    private readonly config: ConfigService,
  ) {}

  private extractUser(req: Request): { userId: string | null; role: string | null } {
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith("Bearer ")) {
      return { userId: null, role: null };
    }
    const token = authHeader.substring(7);
    try {
      const secret = this.config.get<string>("JWT_SECRET", "dev-secret-change-me");
      const payload = this.jwtService.verify(token, { secret });
      return { userId: payload.sub, role: payload.role };
    } catch {
      return { userId: null, role: null };
    }
  }

  private getClientIp(req: Request): string {
    return (
      (req.headers["x-forwarded-for"] as string)?.split(",")[0]?.trim() ||
      req.ip ||
      req.socket?.remoteAddress ||
      "unknown"
    );
  }

  @Get("quota")
  getQuota(@Req() req: Request) {
    const { userId, role } = this.extractUser(req);
    const ip = this.getClientIp(req);
    const usage = this.rateLimiter.getUsage(userId, role, ip);
    return {
      ...usage,
      isGuest: !userId,
      isUnlimited: usage.limit === -1,
    };
  }

  @Post()
  @HttpCode(200)
  async chat(
    @Body() body: { messages: Array<{ role: string; content: string }> },
    @Req() req: Request,
    @Res() res: Response,
  ) {
    const { userId, role } = this.extractUser(req);
    const ip = this.getClientIp(req);

    // Check rate limit
    const check = this.rateLimiter.check(userId, role, ip);

    if (!check.allowed) {
      const isGuest = !userId;
      throw new HttpException(
        {
          statusCode: HttpStatus.TOO_MANY_REQUESTS,
          error: "Too Many Requests",
          message: isGuest
            ? `Daily chat limit reached (${check.limit} messages). Sign in for more messages per day, or come back tomorrow.`
            : `Daily chat limit reached (${check.limit} messages). Limit resets at midnight.`,
          remaining: 0,
          limit: check.limit,
          resetAt: check.resetAt,
        },
        HttpStatus.TOO_MANY_REQUESTS,
      );
    }

    res.setHeader("Content-Type", "text/event-stream");
    res.setHeader("Cache-Control", "no-cache");
    res.setHeader("Connection", "keep-alive");
    res.setHeader("Access-Control-Allow-Origin", process.env.WEB_URL || "http://localhost:3000");
    res.setHeader("Access-Control-Allow-Credentials", "true");
    res.setHeader("X-RateLimit-Limit", String(check.limit));
    res.setHeader("X-RateLimit-Remaining", String(check.remaining - 1));
    res.setHeader("X-RateLimit-Reset", String(check.resetAt));

    // Increment usage before streaming (so concurrent requests are counted)
    this.rateLimiter.increment(userId, ip);

    try {
      for await (const chunk of this.aiChatService.streamChat(body.messages || [])) {
        res.write(`data: ${JSON.stringify({ text: chunk })}\n\n`);
      }
      // Send updated quota with DONE
      const updatedUsage = this.rateLimiter.getUsage(userId, role, ip);
      res.write(`data: ${JSON.stringify({ quota: updatedUsage })}\n\n`);
      res.write(`data: [DONE]\n\n`);
    } catch (error: any) {
      console.error("AI chat error:", error?.message || error);
      res.write(
        `data: ${JSON.stringify({
          error: error?.message || "Failed to generate response",
        })}\n\n`,
      );
    }

    res.end();
  }

  @Post("generate-description")
  @HttpCode(200)
  async generateDescription(
    @Body()
    body: {
      title: string;
      breed?: string;
      bloodline?: string;
      category?: string;
      ageMonths?: number;
      weightKg?: string | number;
      color?: string;
      legColor?: string;
      fightingStyle?: string;
      sireInfo?: string;
      damInfo?: string;
      price?: string | number;
    },
    @Req() req: Request,
  ) {
    const { userId, role } = this.extractUser(req);
    const ip = this.getClientIp(req);
    const check = this.rateLimiter.check(userId, role, ip);
    if (!check.allowed) {
      throw new HttpException(
        {
          statusCode: HttpStatus.TOO_MANY_REQUESTS,
          error: "Too Many Requests",
          message: `Daily AI quota reached (${check.limit} generations).`,
        },
        HttpStatus.TOO_MANY_REQUESTS,
      );
    }
    this.rateLimiter.increment(userId, ip);
    const description = await this.aiChatService.generateListingDescription(body);
    return { description };
  }
}
