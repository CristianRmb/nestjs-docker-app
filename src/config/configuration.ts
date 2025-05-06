import { registerAs } from '@nestjs/config';

export default registerAs('config', () => ({
  jwt: {
    secret: process.env.JWT_SECRET,
    expiresIn: process.env.JWT_EXPIRES_IN || '1h',
  },
  // Add other configurations as needed
}));
