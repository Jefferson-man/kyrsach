import { Router } from 'express';
import { PrismaClient } from '@prisma/client';
import { auth } from '../../../middleware/auth.js';
import bcrypt from 'bcrypt';
import jwt from 'jsonwebtoken';
import 'dotenv/config';

const prisma = new PrismaClient();
const router = Router();
const jwtSecret = process.env.JWT_SECRET; // Секретный ключ для JWT

// Регистрация пользователя
router.post('/register', async (req, res) => {
    const { username, password } = req.body;

    try {
        // Хешируем пароль
        const hashedPassword = await bcrypt.hash(password, 10);

        // Создаем пользователя в базе данных
        const user = await prisma.user.create({
            data: {
                username,
                password: hashedPassword,
                role: 'client', // По умолчанию роль "client"
            },
        });

        // Генерируем токен для автоматического входа после регистрации
        const token = jwt.sign({ userId: user.id, role: user.role }, jwtSecret, { expiresIn: '1h' });

        res.status(201).json({ message: 'Користувач зареєстрований', token });
    } catch (error) {
        res.status(400).json({ message: 'Помилка реєстрації: ' + error.message });
    }
});

// Вход пользователя
router.post('/login', async (req, res) => {
    const { username, password } = req.body;

    try {
        // Ищем пользователя в базе данных
        const user = await prisma.user.findUnique({ where: { username } });

        if (!user) {
            throw new Error('Користувача не знайдено');
        }

        // Проверяем пароль
        const validPassword = await bcrypt.compare(password, user.password);
        if (!validPassword) {
            throw new Error('Невірний пароль');
        }

        // Генерируем токен
        const token = jwt.sign({ userId: user.id, role: user.role }, jwtSecret, { expiresIn: '1h' });

        res.json({ message: 'Успішний вхід', token });
    } catch (error) {
        res.status(400).json({ message: 'Помилка авторизації: ' + error.message });
    }
});
// Получение данных профиля
router.get('/profile', auth, async (req, res) => {
    try {
        const user = await prisma.user.findUnique({
            where: { id: req.user.id },
            select: {
                id: true,
                username: true,
                role: true,
                createdAt: true,
                avatar: true
            }
        });

        if (!user) {
            return res.status(404).json({
                success: false,
                message: 'Користувача не знайдено'
            });
        }

        res.json({
            success: true,
            user
        });
    } catch (error) {
        console.error('Помилка завантаження профілю:', error);
        res.status(500).json({
            success: false,
            message: 'Помилка сервера при завантаженні профілю'
        });
    }
});
// Обновление профиля пользователя
router.put('/profile', auth, async (req, res) => {
    try {
        const { username, password } = req.body;

        // Проверка что есть данные для обновления
        if (!username && !password) {
            return res.status(400).json({
                success: false,
                message: 'Вкажіть новий логін або пароль'
            });
        }

        const updateData = {};
        
        // Обновление username если указан
        if (username) {
            // Проверка на уникальность username
            const existingUser = await prisma.user.findFirst({
                where: {
                    username,
                    NOT: { id: req.user.id }
                }
            });

            if (existingUser) {
                return res.status(400).json({
                    success: false,
                    message: 'Цей логін вже зайнятий'
                });
            }
            updateData.username = username;
        }

        // Обновление password если указан
        if (password) {
            updateData.password = await bcrypt.hash(password, 10);
        }

        // Выполняем обновление
        const updatedUser = await prisma.user.update({
            where: { id: req.user.id },
            data: updateData,
            select: {
                id: true,
                username: true,
                role: true,
                avatar: true
            }
        });

        res.json({
            success: true,
            message: 'Профіль оновлено',
            user: updatedUser
        });

    } catch (error) {
        console.error('Помилка оновлення профілю:', error);
        res.status(500).json({
            success: false,
            message: 'Помилка сервера'
        });
    }
    
});


// Изменение роли пользователя (доступно только администратору)
router.put('/profile/role', async (req, res) => {
    const token = req.headers.authorization?.split(' ')[1]; // Получаем токен из заголовка

    if (!token) {
        return res.status(401).json({ message: 'Токен відсутній' });
    }

    try {
        // Проверяем токен
        const decoded = jwt.verify(token, jwtSecret);

        // Проверяем, что текущий пользователь — администратор
        if (decoded.role !== 'admin') {
            return res.status(403).json({ message: 'Доступ заборонено' });
        }

        const { userId, newRole } = req.body;

        // Обновляем роль пользователя
        const updatedUser = await prisma.user.update({
            where: { id: userId },
            data: { role: newRole },
        });

        res.json({ message: 'Роль користувача оновлено', user: updatedUser });
    } catch (error) {
        res.status(400).json({ message: 'Помилка оновлення ролі: ' + error.message });
    }
});
// Загрузка аватарки
router.post('/upload-avatar', auth, async (req, res) => {
    try {
        const { avatar } = req.body;
        
        if (!avatar) {
            return res.status(400).json({
                success: false,
                message: 'Фото відсутнє'
            });
        }

        const updatedUser = await prisma.user.update({
            where: { id: req.user.id },
            data: { avatar },
            select: {
                id: true,
                username: true,
                avatar: true
            }
        });

        res.json({
            success: true,
            message: 'Аватар оновлено',
            user: updatedUser
        });

    } catch (error) {
        console.error('Помилка оновлення аватара:', error);
        res.status(500).json({
            success: false,
            message: 'Помилка сервера'
        });
    }
});
export default router;