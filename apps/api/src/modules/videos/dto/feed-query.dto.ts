import { IsString, IsEnum, IsOptional, IsNumber, Min, Max } from "class-validator";

export class FeedQueryDto {
  @IsEnum(["marketplace", "community"])
  @IsOptional()
  type?: string;

  @IsString()
  @IsOptional()
  cursor?: string;

  @IsNumber()
  @IsOptional()
  @Min(1)
  @Max(20)
  limit?: number;
}
