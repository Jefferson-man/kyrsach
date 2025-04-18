import jwt from 'jsonwebtoken';
import 'dotenv/config';

const jwtSecret = process.env.JWT_SECRET;

// Основная middleware аутентификации
export const auth = (req, res, next) => {
    const token = req.headers.authorization?.split(' ')[1];
    
    if (!token) {
        return res.status(401).json({ message: 'Токен отсутствует' });
    }

    try {
        const decoded = jwt.verify(token, jwtSecret);
        req.user = { 
            id: decoded.userId, 
            role: decoded.role 
        };
        next();
    } catch (error) {
        res.status(401).json({ message: 'Неверный токен' });
    }
};
// Добавим проверку прав модератора
export const isModerator = (req, res, next) => {
    if (req.user?.role !== 'moderator' && req.user?.role !== 'admin') {
        return res.status(403).json({ message: 'Доступ запрещён' });
    }
    next();
};

// Обновим проверку админа
export const isAdmin = (req, res, next) => {
    if (req.user?.role !== 'admin') {
        return res.status(403).json({ message: 'Только для администратора' });
    }
    next();
};