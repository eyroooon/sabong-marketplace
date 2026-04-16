import {
  IsString,
  IsEnum,
  IsOptional,
  IsUUID,
  MinLength,
  MaxLength,
} from "class-validator";

export class CreateVideoDto {
  @IsString()
  @MinLength(1)
  @MaxLength(500)
  caption: string;

  @IsEnum(["marketplace", "community"])
  type: string;

  @IsString()
  @IsOptional()
  @IsUUID()
  listingId?: string;
}
