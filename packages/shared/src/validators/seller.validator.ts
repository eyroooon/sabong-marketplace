import { z } from "zod";

export const registerSellerSchema = z.object({
  farmName: z.string().min(2).max(200),
  businessType: z
    .enum(["individual", "registered_farm", "corporation"])
    .default("individual"),
  description: z.string().max(2000).optional(),
  farmProvince: z.string().min(1).max(100),
  farmCity: z.string().min(1).max(100),
  farmBarangay: z.string().max(100).optional(),
  facebookUrl: z.string().url().optional().or(z.literal("")),
  youtubeUrl: z.string().url().optional().or(z.literal("")),
  tiktokUrl: z.string().url().optional().or(z.literal("")),
});

export const updateSellerSchema = registerSellerSchema.partial();

export type RegisterSellerInput = z.infer<typeof registerSellerSchema>;
export type UpdateSellerInput = z.infer<typeof updateSellerSchema>;
