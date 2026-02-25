import { z } from "zod";

export const registerSchema = z.object({
  phone: z
    .string()
    .regex(/^\+639\d{9}$/, "Must be a valid PH phone number (+639XXXXXXXXX)"),
  firstName: z.string().min(1).max(100),
  lastName: z.string().min(1).max(100),
  password: z.string().min(8).max(100),
});

export const loginSchema = z.object({
  phone: z
    .string()
    .regex(/^\+639\d{9}$/, "Must be a valid PH phone number (+639XXXXXXXXX)"),
  password: z.string().min(1),
});

export const sendOtpSchema = z.object({
  phone: z
    .string()
    .regex(/^\+639\d{9}$/, "Must be a valid PH phone number (+639XXXXXXXXX)"),
});

export const verifyOtpSchema = z.object({
  phone: z
    .string()
    .regex(/^\+639\d{9}$/, "Must be a valid PH phone number (+639XXXXXXXXX)"),
  otp: z.string().length(6),
  otpRef: z.string().min(1),
});

export type RegisterInput = z.infer<typeof registerSchema>;
export type LoginInput = z.infer<typeof loginSchema>;
export type SendOtpInput = z.infer<typeof sendOtpSchema>;
export type VerifyOtpInput = z.infer<typeof verifyOtpSchema>;
