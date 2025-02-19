import { z } from 'zod';

const urlRegex = /^(https?:\/\/)?([\da-z.-]+)\.([a-z.]{2,6})([/\w .-]*)*\/?$/;

export const authValidation = {
  signIn: z.object({
    email: z.string().email('Please enter a valid email'),
    password: z.string().min(1, 'Password is required'),
  }),

  signUp: z.object({
    email: z.string().email('Please enter a valid email'),
    password: z.string()
      .min(8, 'Password must be at least 8 characters')
      .regex(/[A-Z]/, 'Password must contain at least one uppercase letter')
      .regex(/[a-z]/, 'Password must contain at least one lowercase letter')
      .regex(/[0-9]/, 'Password must contain at least one number')
      .regex(/[^A-Za-z0-9]/, 'Password must contain at least one special character'),
    full_name: z.string().min(2, 'Name must be at least 2 characters'),
  }),

  profile: z.object({
    full_name: z.string().min(2, 'Name must be at least 2 characters'),
    bio: z.string().min(50, 'Bio must be at least 50 characters').optional(),
    interests: z.array(z.string()).optional(),
    languages: z.array(z.string()).optional(),
    instagram: z.string()
      .transform(val => val.replace('@', ''))
      .optional(),
    linkedin: z.string()
      .transform(val => {
        if (!val) return val;
        return val.startsWith('http') ? val : `https://linkedin.com/in/${val}`;
      })
      .optional(),
    website: z.string()
      .transform(val => {
        if (!val) return val;
        if (urlRegex.test(val)) {
          return val.startsWith('http') ? val : `https://${val}`;
        }
        return val;
      })
      .optional()
      .refine(val => !val || urlRegex.test(val), {
        message: 'Please enter a valid URL'
      }),
  }),
};

export type SignInValidation = z.infer<typeof authValidation.signIn>;
export type SignUpValidation = z.infer<typeof authValidation.signUp>;
export type ProfileValidation = z.infer<typeof authValidation.profile>;