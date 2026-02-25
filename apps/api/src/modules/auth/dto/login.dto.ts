import { IsString, IsNotEmpty, Matches } from "class-validator";

export class LoginDto {
  @IsString()
  @Matches(/^\+639\d{9}$/, {
    message: "Must be a valid PH phone number (+639XXXXXXXXX)",
  })
  phone: string;

  @IsString()
  @IsNotEmpty()
  password: string;
}
