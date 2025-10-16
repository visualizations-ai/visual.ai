// server/src/services/auth/validation.service.ts
import { User } from "@/entities/user.entity";
import { Auth } from "@/interfaces/auth.interface";
import { GraphQLError } from "graphql";
import { Repository } from "typeorm";
import validator from 'validator';

export const validateUser = async (
  input: Auth,
  userRepository: Repository<User>,
  type: 'register' | 'login'
): Promise<void> => {

  // Basic input validation
  if (!validator.isEmail(input.email)) {
    throw new GraphQLError('Invalid credentials. Please check your details and try again.');
  }

  if (input.password.length < 7) {
    throw new GraphQLError('Invalid credentials. Please check your details and try again.');
  }

  if (!/(?=.*[a-z])(?=.*\d)/.test(input.password)) {
    throw new GraphQLError('Invalid credentials. Please check your details and try again.');
  }

  // For registration, check if user already exists
  if (type === 'register') {
    const existingUser = await userRepository.findOne({
      where: { email: input.email }
    });
    if (existingUser) {
      // Security: Don't reveal that the email is already registered
      throw new GraphQLError('Registration failed. Please check your details and try again.');
    }
  }
};