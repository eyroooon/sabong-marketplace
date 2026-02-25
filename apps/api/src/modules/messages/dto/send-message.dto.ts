import {
  IsString,
  IsNotEmpty,
  IsOptional,
  IsEnum,
  IsNumber,
  IsUUID,
  Min,
} from "class-validator";

export class StartConversationDto {
  @IsUUID()
  listingId: string;

  @IsUUID()
  sellerId: string;

  @IsString()
  @IsNotEmpty()
  message: string;
}

export class SendMessageDto {
  @IsString()
  @IsNotEmpty()
  content: string;

  @IsEnum(["text", "image", "offer"])
  @IsOptional()
  messageType?: string;

  @IsNumber()
  @IsOptional()
  @Min(1)
  offerAmount?: number;
}
