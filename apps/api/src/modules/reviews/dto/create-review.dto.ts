import {
  IsUUID,
  IsInt,
  Min,
  Max,
  IsOptional,
  IsString,
  MaxLength,
} from "class-validator";

export class CreateReviewDto {
  @IsUUID()
  orderId: string;

  @IsInt()
  @Min(1)
  @Max(5)
  rating: number;

  @IsString()
  @IsOptional()
  @MaxLength(200)
  title?: string;

  @IsString()
  @IsOptional()
  @MaxLength(2000)
  comment?: string;

  @IsInt()
  @IsOptional()
  @Min(1)
  @Max(5)
  accuracyRating?: number;

  @IsInt()
  @IsOptional()
  @Min(1)
  @Max(5)
  communicationRating?: number;

  @IsInt()
  @IsOptional()
  @Min(1)
  @Max(5)
  shippingRating?: number;
}

export class RespondToReviewDto {
  @IsString()
  @MaxLength(2000)
  response: string;
}
