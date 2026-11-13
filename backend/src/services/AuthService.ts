import 'dotenv/config';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { UserRepository } from '../repositories/index.js';
import { withWriteLock } from '../config/database.js';
import { UnauthorizedError, NotFoundError, ConflictError } from '../errors/AppError.js';

const JWT_SECRET = process.env.JWT_SECRET || 'default-secret';

export class AuthService {
  constructor(private readonly userRepo: UserRepository = new UserRepository()) {}

  async authenticate(email: string, password: string) {
    const user = await this.userRepo.findByEmail(email);
    if (!user) {
      throw new UnauthorizedError('Credenciais inválidas');
    }

    const passwordMatch = await bcrypt.compare(password, user.password);
    if (!passwordMatch) {
      throw new UnauthorizedError('Credenciais inválidas');
    }

    const token = jwt.sign(
      {
        userId: user.id,
        name: user.name,
        email: user.email,
        role: user.role,
      },
      JWT_SECRET,
      { expiresIn: '8h' }
    );

    return {
      token,
      user: {
        id: user.id,
        name: user.name,
        email: user.email,
        role: user.role,
      },
    };
  }

  async getProfile(userId: string) {
    const user = await this.userRepo.findById(userId);
    if (!user) {
      throw new NotFoundError('Usuário não encontrado');
    }

    return {
      id: user.id,
      name: user.name,
      email: user.email,
      role: user.role,
    };
  }

  async getPatients() {
    return this.userRepo.listPatients();
  }

  async registerPatient(name: string, email: string, password = '123456') {
    const hashedPassword = await bcrypt.hash(password, 10);

    return withWriteLock(async () => {
      const existing = await this.userRepo.findByEmail(email);
      if (existing) {
        throw new ConflictError('Já existe um usuário cadastrado com este e-mail');
      }

      return this.userRepo.createPatient({
        name,
        email,
        password: hashedPassword,
      });
    });
  }
}
