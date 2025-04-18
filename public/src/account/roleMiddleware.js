export const isAdmin = (req, res, next) => {
    if (req.user?.role !== 'admin') {
        return res.status(403).json({ message: 'Требуются права администратора' });
    }
    next();
};

export const isModerator = (req, res, next) => {
    if (req.user?.role !== 'moderator') {
        return res.status(403).json({ message: 'Требуются права модератора' });
    }
    next();
};

export const isAdminOrModerator = (req, res, next) => {
    if (req.user?.role !== 'admin' && req.user?.role !== 'moderator') {
        return res.status(403).json({ message: 'Требуются права администратора или модератора' });
    }
    next();
};