
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

  if (!validator.isEmail(input.email)) {
    throw new GraphQLError('Invalid email format');
  }

  if (input.password.length < 7) {
    throw new GraphQLError('Password must be at least 7 characters.');
  }

  if (!/(?=.*[a-z])(?=.*\d)/.test(input.password)) {
    throw new GraphQLError('Password must contain at least one lowercase letter and one number.');
  }

  if (type === 'register') {
    const existingUser = await userRepository.findOne({
      where: { email: input.email }
    });
    if (existingUser) {
      throw new GraphQLError('Invalid credentials');
    }
  }
};
