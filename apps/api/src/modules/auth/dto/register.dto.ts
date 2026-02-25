import { IsString, IsNotEmpty, MinLength, Matches } from "class-validator";

export class RegisterDto {
  @IsString()
  @Matches(/^\+639\d{9}$/, {
    message: "Must be a valid PH phone number (+639XXXXXXXXX)",
  })
  phone: string;

  @IsString()
  @IsNotEmpty()
  firstName: string;

  @IsString()
  @IsNotEmpty()
  lastName: string;

  @IsString()
  @MinLength(8)
  password: string;
}
