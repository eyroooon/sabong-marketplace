import { IsString, Matches } from "class-validator";

export class ForgotPasswordDto {
  @IsString()
  @Matches(/^\+639\d{9}$/, {
    message: "Must be a valid PH phone number (+639XXXXXXXXX)",
  })
  phone: string;
}
