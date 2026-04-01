import bcrypt from "bcryptjs";

const PASSWORD_ROUNDS = 12;

export const hashPassword = async (password: string) => {
  return await bcrypt.hash(password, PASSWORD_ROUNDS);
};

export const verifyPassword = async (
  password: string,
  passwordHash: string
) => {
  return await bcrypt.compare(password, passwordHash);
};
