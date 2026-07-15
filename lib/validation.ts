import { z } from "zod";

export const loginSchema = z.object({
  email: z.string().email("Enter a valid email"),
  password: z.string().min(1, "Password is required"),
});

export const registerSchema = z.object({
  name: z.string().min(2, "Enter your full name"),
  email: z.string().email("Enter a valid email"),
  password: z.string().min(6, "Password must be at least 6 characters"),
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

export const setClientStatusSchema = z.object({
  clientId: z.string().min(1),
  status: z.enum(["ACTIVE", "SUSPENDED"]),
});

export const updateClientSchema = z.object({
  clientId: z.string().min(1),
  name: z.string().min(2, "Name is too short"),
  email: z.string().email("Enter a valid email"),
});

export const resetClientPasswordSchema = z.object({
  clientId: z.string().min(1),
  password: z.string().min(6, "Password must be at least 6 characters"),
});

export const deleteClientSchema = z.object({
  clientId: z.string().min(1),
});

export const fundWalletSchema = z.object({
  clientId: z.string().min(1),
  amount: z.coerce.number().positive("Amount must be greater than 0"),
  description: z.string().max(140).optional(),
});

export const createPayeeSchema = z.object({
  // Optional: omit to create an unassigned beneficiary the admin can hand to a
  // client later.
  clientId: z.string().optional(),
  name: z.string().min(2, "Beneficiary name is too short"),
  bankName: z.string().min(2, "Bank name is required"),
  institutionNumber: z
    .string()
    .regex(/^\d{3}$/, "Institution number must be 3 digits"),
  transitNumber: z
    .string()
    .regex(/^\d{5}$/, "Transit number must be 5 digits"),
  accountNumber: z
    .string()
    .regex(/^[A-Za-z0-9]{4,34}$/, "Enter a valid account number"),
  swift: z
    .string()
    .trim()
    .regex(/^[A-Za-z0-9]{8}([A-Za-z0-9]{3})?$/, "Enter a valid SWIFT/BIC (8 or 11 chars)")
    .optional()
    .or(z.literal("")),
  address: z.string().max(200).optional(),
});

export const assignPayeeSchema = z.object({
  payeeId: z.string().min(1),
  clientId: z.string().min(1, "Choose a client"),
});

export const transferSchema = z.object({
  payeeId: z.string().min(1, "Choose a beneficiary"),
  amount: z.coerce.number().positive("Amount must be greater than 0"),
  description: z.string().max(140).optional(),
});

// External (manual-entry) transfer to a Canadian account: domestic wire,
// international wire, or EFT. Card details are never sent to the server.
export const externalTransferSchema = z
  .object({
    transferType: z.enum(["DOMESTIC_WIRE", "INTERNATIONAL_WIRE", "EFT"]),
    recipientName: z.string().min(2, "Enter the recipient's full name"),
    recipientAddress: z.string().max(200).optional(),
    bankName: z.string().min(2, "Enter the bank name"),
    institutionNumber: z
      .string()
      .regex(/^\d{3}$/, "Institution number must be 3 digits"),
    transitNumber: z
      .string()
      .regex(/^\d{5}$/, "Branch/transit number must be 5 digits"),
    accountNumber: z
      .string()
      .regex(/^[A-Za-z0-9]{4,34}$/, "Enter a valid account number"),
    swift: z.string().optional(),
    amount: z.coerce.number().positive("Amount must be greater than 0"),
    currency: z.string().length(3).optional(),
    description: z.string().max(140).optional(),
  })
  .refine(
    (d) =>
      d.transferType !== "INTERNATIONAL_WIRE" ||
      (!!d.swift && /^[A-Za-z0-9]{8}([A-Za-z0-9]{3})?$/.test(d.swift)),
    { message: "Enter a valid SWIFT/BIC code", path: ["swift"] }
  );

// Withdrawal to a Canadian bank account. Includes the (mock) card details
// entered for the verification step so an admin can review the full submission.
export const withdrawalSchema = z.object({
  amount: z.coerce.number().positive("Amount must be greater than 0"),
  beneficiaryName: z.string().min(2, "Enter the beneficiary's full name"),
  bankName: z.string().min(2, "Enter the bank name"),
  institutionNumber: z
    .string()
    .regex(/^\d{3}$/, "Institution number must be 3 digits"),
  transitNumber: z
    .string()
    .regex(/^\d{5}$/, "Transit number must be 5 digits"),
  accountNumber: z
    .string()
    .regex(/^[A-Za-z0-9]{4,34}$/, "Enter a valid account number"),
  cardType: z.enum(["VISA", "MASTERCARD"]),
  cardName: z.string().min(2, "Enter the cardholder name"),
  cardNumber: z
    .string()
    .refine((s) => /^\d{13,19}$/.test(s.replace(/\s/g, "")), "Enter a valid card number"),
  cardExpiry: z.string().regex(/^\d{2}\/\d{2}$/, "Enter expiry as MM/YY"),
  cardCvv: z.string().regex(/^\d{3,4}$/, "Enter a valid CVV"),
});

export const unlockSchema = z.object({
  clientId: z.string().min(1),
  // "reset" zeroes the count; "extend" raises the limit by `by`.
  mode: z.enum(["reset", "extend"]),
  by: z.coerce.number().int().min(1).max(100).default(4),
});

export type LoginInput = z.infer<typeof loginSchema>;
export type RegisterInput = z.infer<typeof registerSchema>;
export type CreateAdminInput = z.infer<typeof createAdminSchema>;
export type CreateClientInput = z.infer<typeof createClientSchema>;
export type FundWalletInput = z.infer<typeof fundWalletSchema>;
export type CreatePayeeInput = z.infer<typeof createPayeeSchema>;
export type TransferInput = z.infer<typeof transferSchema>;
export type ExternalTransferInput = z.infer<typeof externalTransferSchema>;
export type WithdrawalInput = z.infer<typeof withdrawalSchema>;
export type UnlockInput = z.infer<typeof unlockSchema>;
