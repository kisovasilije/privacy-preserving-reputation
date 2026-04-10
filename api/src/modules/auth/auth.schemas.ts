import { z } from 'zod';

export const registrationSchema = z
  .object({
    email: z.email().trim(),
    username: z.string().trim().min(3).max(32),
    password: z.string().min(3).max(128),
    confirmPassword: z.string().min(3).max(128),
  })
  .refine(data => data.password === data.confirmPassword, {
    path: ['confirmPassword'],
    message: 'Passwords do not match',
  });

export type RegistrationRequest = z.infer<typeof registrationSchema>;

export const authenticationSchema = z.object({
  username: z.string().trim().min(3).max(32),
  password: z.string().min(3).max(128),
});

export type AuthenticationRequest = z.infer<typeof authenticationSchema>;
