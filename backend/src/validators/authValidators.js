import { z } from 'zod';

// Valida el correo y la contraseña del formulario de inicio de sesión.
export const loginSchema = z.object({
  email: z.string({ required_error: 'El correo es obligatorio.' }).trim().min(1, 'El correo es obligatorio.').max(254),
  password: z.string({ required_error: 'La contraseña es obligatoria.' }).min(1, 'La contraseña es obligatoria.').max(200),
});
