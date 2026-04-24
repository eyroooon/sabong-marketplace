import {
  IsString,
  IsNotEmpty,
  IsOptional,
  IsEnum,
  IsNumber,
  IsUUID,
  IsArray,
  ArrayMaxSize,
  ArrayMinSize,
  MaxLength,
  MinLength,
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
  @IsOptional()
  content?: string;

  @IsEnum([
    "text",
    "image",
    "video",
    "voice",
    "offer",
    "listing_share",
    "reel_share",
  ])
  @IsOptional()
  messageType?: string;

  @IsNumber()
  @IsOptional()
  @Min(1)
  offerAmount?: number;

  @IsString()
  @IsOptional()
  mediaUrl?: string;

  @IsNumber()
  @IsOptional()
  @Min(0)
  mediaDurationMs?: number;

  @IsNumber()
  @IsOptional()
  mediaWidth?: number;

  @IsNumber()
  @IsOptional()
  mediaHeight?: number;

  @IsUUID()
  @IsOptional()
  replyToMessageId?: string;

  @IsUUID()
  @IsOptional()
  attachedListingId?: string;

  @IsUUID()
  @IsOptional()
  attachedVideoId?: string;
}

export class CreateDmDto {
  @IsUUID()
  otherUserId: string;
}

export class CreateGroupDto {
  @IsString()
  @MinLength(1)
  @MaxLength(100)
  title: string;

  @IsArray()
  @ArrayMinSize(1)
  @ArrayMaxSize(29)
  @IsUUID("4", { each: true })
  memberUserIds: string[];
}

export class ReactionDto {
  @IsString()
  @MinLength(1)
  @MaxLength(8)
  emoji: string;
}

export class AddMembersDto {
  @IsArray()
  @ArrayMinSize(1)
  @IsUUID("4", { each: true })
  userIds: string[];
}
