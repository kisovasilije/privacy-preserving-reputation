import { z } from 'zod';

export const registrationSchema = z.object({
  email: z.email().trim(),
  username: z.string().trim().min(3).max(32),
  password: z.string().min(3).max(128),
});

export type RegistrationRequest = z.infer<typeof registrationSchema>;
