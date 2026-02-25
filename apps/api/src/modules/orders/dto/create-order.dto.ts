import {
  IsString,
  IsNotEmpty,
  IsEnum,
  IsOptional,
  IsUUID,
} from "class-validator";

export class CreateOrderDto {
  @IsUUID()
  listingId: string;

  @IsEnum(["meetup", "shipping"])
  deliveryMethod: string;

  @IsString()
  @IsOptional()
  deliveryAddress?: string;

  @IsEnum(["gcash", "maya", "card", "bank_transfer", "otc_cash"])
  paymentMethod: string;

  @IsString()
  @IsOptional()
  buyerNotes?: string;
}

export class UpdateOrderStatusDto {
  @IsString()
  @IsOptional()
  trackingNumber?: string;

  @IsString()
  @IsOptional()
  shippingProvider?: string;

  @IsString()
  @IsOptional()
  cancelReason?: string;

  @IsString()
  @IsOptional()
  sellerNotes?: string;
}
