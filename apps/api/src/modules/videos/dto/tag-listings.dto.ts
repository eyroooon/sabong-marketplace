import { IsArray, IsUUID, ArrayMaxSize } from "class-validator";

export class TagListingsDto {
  @IsArray()
  @ArrayMaxSize(5)
  @IsUUID("4", { each: true })
  listingIds!: string[];
}
