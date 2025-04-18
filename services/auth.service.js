import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcrypt';
import jwt from 'jsonwebtoken';
import 'dotenv/config';

const prisma = new PrismaClient();
const jwtSecret = process.env.JWT_SECRET;

export class AuthService {
    // Регистрация пользователя
    async registerUser(username, password) {
        const hashedPassword = await bcrypt.hash(password, 10); // Хешируем пароль
        const user = await prisma.user.create({
            data: {
                username,
                password: hashedPassword,
                role: 'client', // Роль по умолчанию
            },
        });
        return user;
    }

    // Авторизация пользователя
    async loginUser(username, password) {
        const user = await prisma.user.findUnique({ where: { username } });
        if (!user) {
            throw new Error('Користувача не знайдено');
        }

        const validPassword = await bcrypt.compare(password, user.password);
        if (!validPassword) {
            throw new Error('Невірний пароль');
        }

        const token = jwt.sign({ userId: user.id, role: user.role }, jwtSecret, { expiresIn: '1h' });
        return token;
    }

    // Получение пользователя по ID
    async getUserById(userId) {
        return await prisma.user.findUnique({ where: { id: userId } });
    }
}