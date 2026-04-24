import {
  IsEnum,
  IsOptional,
  IsString,
  MaxLength,
  MinLength,
} from "class-validator";

export class CreateGroupDto {
  @IsString()
  @MinLength(3)
  @MaxLength(120)
  name!: string;

  @IsOptional()
  @IsString()
  @MaxLength(2000)
  description?: string;

  @IsEnum(["regional", "bloodline", "topic", "general"])
  category!: "regional" | "bloodline" | "topic" | "general";

  @IsOptional()
  @IsEnum(["public", "private", "secret"])
  type?: "public" | "private" | "secret";

  @IsOptional()
  @IsString()
  @MaxLength(8)
  iconEmoji?: string;

  @IsOptional()
  @IsString()
  coverImageUrl?: string;
}
