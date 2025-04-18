import { Router } from 'express';
import { AuthService } from '../services/auth.service.js';
import { auth } from '../middleware/auth.js'; // Используем правильный путь

const router = Router();
const authService = new AuthService();

// Регистрация
router.post('/register', async (req, res) => {
    const { username, password } = req.body;
    try {
        const user = await authService.registerUser(username, password);
        const token = await authService.loginUser(username, password); // Автоматический вход после регистрации
        res.status(201).json({ message: 'Користувач зареєстрований', token });
    } catch (error) {
        res.status(400).json({ message: error.message });
    }
});

// Авторизация
router.post('/login', async (req, res) => {
    const { username, password } = req.body;
    try {
        const token = await authService.loginUser(username, password);
        res.json({ message: 'Успішний вхід', token });
    } catch (error) {
        res.status(400).json({ message: error.message });
    }
});

// Защищенный маршрут (пример)
router.get('/profile', auth, async (req, res) => {
    const { userId } = req;
    try {
        const user = await authService.getUserById(userId);
        res.json({ user });
    } catch (error) {
        res.status(400).json({ message: error.message });
    }
});

export const authRouter = router;