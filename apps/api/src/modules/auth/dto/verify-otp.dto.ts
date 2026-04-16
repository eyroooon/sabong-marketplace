import { IsString, Matches, Length } from "class-validator";

export class VerifyOtpDto {
  @IsString()
  @Matches(/^\+639\d{9}$/, {
    message: "Must be a valid PH phone number (+639XXXXXXXXX)",
  })
  phone: string;

  @IsString()
  @Length(6, 6, { message: "Code must be 6 digits" })
  @Matches(/^\d{6}$/, { message: "Code must be 6 digits" })
  code: string;
}
