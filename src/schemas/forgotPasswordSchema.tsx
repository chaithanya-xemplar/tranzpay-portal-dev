import { z } from "zod";

export const forgotPasswordSchema = z.object({
  email: z.string().email({ message: "Valid email is required" }),
  username: z.string().min(1, { message: "Username is required" }),
});

export type ForgotPasswordFormData = z.infer<typeof forgotPasswordSchema>;