import { IsUUID } from "class-validator";

export class FriendActionDto {
  @IsUUID()
  userId!: string;
}
