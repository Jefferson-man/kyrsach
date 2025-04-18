import 'dotenv/config';
import express from 'express';
import cors from 'cors';
import { authRouter } from './routes/auth.js';
import accountRouter from './public/src/account/account.controller.js'; 
import { productRouter } from './public/src/account/product.controller.js';
import { PrismaClient } from '@prisma/client';
import { cartRouter } from './public/src/account/cart.controller.js';
const prisma = new PrismaClient();
const app = express();
async function main() {
    // Middleware
    app.use(cors());
    app.use(express.json());
    app.use(express.static('public'));

    // Routes
    app.use('/api/auth', authRouter);
    app.use('/api/account', accountRouter);
    app.use('/api/products', productRouter);
    app.use('/api/cart', cartRouter);

    // 404 Handler
    app.all('*', (req, res) => {
        res.status(404).json({ message: 'Not Found' });
    });

    // Start Server
    app.listen(3000, () => {
        console.log('Сервер запущено на http://localhost:3000');
    });
}

main();