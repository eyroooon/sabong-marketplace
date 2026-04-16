import { IsEnum } from "class-validator";

export class UpgradePlanDto {
  @IsEnum(["free", "basic", "pro"], {
    message: "plan must be one of: free, basic, pro",
  })
  plan: "free" | "basic" | "pro";
}
