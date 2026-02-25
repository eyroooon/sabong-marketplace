import {
  IsString,
  IsNotEmpty,
  IsOptional,
  IsEnum,
  IsNumber,
  IsBoolean,
  Min,
  Max,
  MinLength,
  MaxLength,
} from "class-validator";

export class CreateListingDto {
  @IsString()
  @MinLength(5)
  @MaxLength(200)
  title: string;

  @IsString()
  @MinLength(20)
  @MaxLength(5000)
  description: string;

  @IsEnum(["rooster", "hen", "stag", "pullet", "pair", "brood"])
  category: string;

  @IsString() @IsOptional() @MaxLength(100)
  breed?: string;

  @IsString() @IsOptional() @MaxLength(200)
  bloodline?: string;

  @IsNumber() @IsOptional() @Min(0) @Max(120)
  ageMonths?: number;

  @IsNumber() @IsOptional() @Min(0) @Max(20)
  weightKg?: number;

  @IsString() @IsOptional() @MaxLength(50)
  color?: string;

  @IsString() @IsOptional() @MaxLength(50)
  legColor?: string;

  @IsString() @IsOptional() @MaxLength(100)
  fightingStyle?: string;

  @IsString() @IsOptional() @MaxLength(200)
  sireInfo?: string;

  @IsString() @IsOptional() @MaxLength(200)
  damInfo?: string;

  @IsEnum(["vaccinated", "not_vaccinated", "partial"])
  @IsOptional()
  vaccinationStatus?: string;

  @IsNumber() @Min(1) @Max(10000000)
  price: number;

  @IsEnum(["fixed", "negotiable", "auction"])
  @IsOptional()
  priceType?: string;

  @IsNumber() @IsOptional() @Min(1)
  minBid?: number;

  @IsString() @IsNotEmpty()
  locationProvince: string;

  @IsString() @IsNotEmpty()
  locationCity: string;

  @IsBoolean() @IsOptional()
  shippingAvailable?: boolean;

  @IsEnum(["local", "regional", "nationwide"])
  @IsOptional()
  shippingAreas?: string;

  @IsNumber() @IsOptional() @Min(0)
  shippingFee?: number;

  @IsBoolean() @IsOptional()
  meetupAvailable?: boolean;
}
