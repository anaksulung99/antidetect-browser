import * as z from "zod";
import { toTypedSchema } from "@vee-validate/zod";

/**
 * Authentication Schemas
 */
export const loginSchema = z.object({
  email: z
    .string()
    .min(1, "Email is required")
    .email("Please enter a valid email address"),
  password: z.string().min(6, "Password is required"),
});
