import { z } from "zod";

export const loginSchema = z.object({
  email: z.string().email("Enter a valid email"),
  password: z.string().min(1, "Password is required"),
});

export const createAdminSchema = z.object({
  name: z.string().min(2, "Name is too short"),
  email: z.string().email("Enter a valid email"),
  password: z.string().min(6, "Password must be at least 6 characters"),
});

export const updateAdminSchema = z.object({
  id: z.string().min(1),
  name: z.string().min(2, "Name is too short"),
  email: z.string().email("Enter a valid email"),
  status: z.enum(["ACTIVE", "SUSPENDED"]),
});

export const resetAdminPasswordSchema = z.object({
  id: z.string().min(1),
  password: z.string().min(6, "Password must be at least 6 characters"),
});

export const createClientSchema = z.object({
  name: z.string().min(2, "Name is too short"),
  email: z.string().email("Enter a valid email"),
  password: z.string().min(6, "Password must be at least 6 characters"),
  initialBalance: z.coerce.number().min(0, "Cannot be negative").default(0),
});

export const fundWalletSchema = z.object({
  clientId: z.string().min(1),
  amount: z.coerce.number().positive("Amount must be greater than 0"),
  description: z.string().max(140).optional(),
});

export const createPayeeSchema = z.object({
  clientId: z.string().min(1),
  name: z.string().min(2, "Payee name is too short"),
  bankName: z.string().min(2, "Bank name is required"),
  accountNumber: z
    .string()
    .min(4, "Account number is too short")
    .max(34, "Account number is too long"),
});

export const transferSchema = z.object({
  payeeId: z.string().min(1, "Choose a payee"),
  amount: z.coerce.number().positive("Amount must be greater than 0"),
  description: z.string().max(140).optional(),
});

export const unlockSchema = z.object({
  clientId: z.string().min(1),
  // "reset" zeroes the count; "extend" raises the limit by `by`.
  mode: z.enum(["reset", "extend"]),
  by: z.coerce.number().int().min(1).max(100).default(4),
});

export type LoginInput = z.infer<typeof loginSchema>;
export type CreateAdminInput = z.infer<typeof createAdminSchema>;
export type CreateClientInput = z.infer<typeof createClientSchema>;
export type FundWalletInput = z.infer<typeof fundWalletSchema>;
export type CreatePayeeInput = z.infer<typeof createPayeeSchema>;
export type TransferInput = z.infer<typeof transferSchema>;
export type UnlockInput = z.infer<typeof unlockSchema>;
