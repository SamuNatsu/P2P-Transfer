/// Config module
import dotenv from 'dotenv';

/* Get config */
dotenv.config();

/* SSL */
export const SSL: boolean = process.env.SSL === 'true';
export const SSL_CERT: string = process.env.SSL_CERT ?? '';
export const SSL_KEY: string = process.env.SSL_KEY ?? '';

/* Port */
export const PORT: number = parseInt(process.env.PORT ?? '3000');
