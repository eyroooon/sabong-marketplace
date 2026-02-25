import {
  IsString,
  IsNotEmpty,
  IsOptional,
  IsEnum,
  MaxLength,
  IsUrl,
} from "class-validator";

export class RegisterSellerDto {
  @IsString()
  @IsNotEmpty()
  @MaxLength(200)
  farmName: string;

  @IsEnum(["individual", "registered_farm", "corporation"])
  @IsOptional()
  businessType?: string;

  @IsString()
  @IsOptional()
  @MaxLength(2000)
  description?: string;

  @IsString()
  @IsNotEmpty()
  farmProvince: string;

  @IsString()
  @IsNotEmpty()
  farmCity: string;

  @IsString()
  @IsOptional()
  farmBarangay?: string;

  @IsUrl({}, { message: "Must be a valid URL" })
  @IsOptional()
  facebookUrl?: string;

  @IsUrl({}, { message: "Must be a valid URL" })
  @IsOptional()
  youtubeUrl?: string;

  @IsUrl({}, { message: "Must be a valid URL" })
  @IsOptional()
  tiktokUrl?: string;
}
