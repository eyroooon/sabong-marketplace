import { plainToInstance } from "class-transformer";
import {
  IsString,
  IsNotEmpty,
  MinLength,
  IsOptional,
  IsUrl,
  IsInt,
  Min,
  Max,
  IsIn,
  validateSync,
} from "class-validator";

const INSECURE_SECRETS = new Set<string>([
  "dev-secret-change-me",
  "dev-refresh-secret-change-me",
  "change-me",
  "changeme",
  "secret",
  "password",
]);

function isInsecureSecret(value: string): boolean {
  if (!value) return true;
  if (INSECURE_SECRETS.has(value)) return true;
  // Any value starting with "dev-" is considered insecure for production.
  return /^dev-/i.test(value);
}

export class EnvironmentVariables {
  @IsOptional()
  @IsIn(["development", "production", "test", "staging"])
  NODE_ENV?: string;

  @IsString()
  @IsNotEmpty()
  DATABASE_URL!: string;

  @IsString()
  @IsNotEmpty()
  @MinLength(16, { message: "JWT_SECRET must be at least 16 characters long" })
  JWT_SECRET!: string;

  @IsString()
  @IsNotEmpty()
  @MinLength(16, {
    message: "JWT_REFRESH_SECRET must be at least 16 characters long",
  })
  JWT_REFRESH_SECRET!: string;

  @IsOptional()
  @IsString()
  ANTHROPIC_API_KEY?: string;

  @IsString()
  @IsNotEmpty()
  @IsUrl(
    { require_tld: false, require_protocol: true },
    { message: "WEB_URL must be a valid URL" },
  )
  WEB_URL!: string;

  @IsOptional()
  @IsInt()
  @Min(1)
  @Max(65535)
  API_PORT?: number = 3001;
}

export function validateEnv(
  config: Record<string, unknown>,
): EnvironmentVariables {
  const validatedConfig = plainToInstance(EnvironmentVariables, config, {
    enableImplicitConversion: true,
  });

  const errors = validateSync(validatedConfig, {
    skipMissingProperties: false,
    forbidUnknownValues: false,
  });

  if (errors.length > 0) {
    const details = errors
      .map((err) => {
        const constraints = err.constraints
          ? Object.values(err.constraints).join(", ")
          : "invalid value";
        return `  - ${err.property}: ${constraints}`;
      })
      .join("\n");
    throw new Error(
      `Environment validation failed:\n${details}\n` +
        "Please update your .env configuration.",
    );
  }

  const nodeEnv = validatedConfig.NODE_ENV ?? "development";

  if (nodeEnv === "production") {
    const insecureSecrets: string[] = [];
    if (isInsecureSecret(validatedConfig.JWT_SECRET)) {
      insecureSecrets.push("JWT_SECRET");
    }
    if (isInsecureSecret(validatedConfig.JWT_REFRESH_SECRET)) {
      insecureSecrets.push("JWT_REFRESH_SECRET");
    }
    if (insecureSecrets.length > 0) {
      throw new Error(
        `Refusing to start in production: insecure default value detected for: ${insecureSecrets.join(
          ", ",
        )}. ` +
          "Provide a strong, randomly-generated secret (at least 16 characters and not prefixed with 'dev-').",
      );
    }
  }

  if (!validatedConfig.ANTHROPIC_API_KEY) {
    // eslint-disable-next-line no-console
    console.warn(
      "[env] ANTHROPIC_API_KEY is not set - AI chat features will be disabled.",
    );
  }

  return validatedConfig;
}
