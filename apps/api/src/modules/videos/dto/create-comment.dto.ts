import { IsString, IsOptional, IsUUID, MinLength, MaxLength } from "class-validator";

export class CreateCommentDto {
  @IsString()
  @MinLength(1)
  @MaxLength(1000)
  content!: string;

  @IsOptional()
  @IsUUID()
  parentId?: string;
}
