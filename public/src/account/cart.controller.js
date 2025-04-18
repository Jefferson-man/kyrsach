import { Router } from 'express';
import { CartService } from './cart.service.js';
import { auth } from '../../../middleware/auth.js';

const router = Router();
const cartService = new CartService();

router.post('/add', auth, async (req, res) => {
    try {
        const { productId, quantity = 1 } = req.body;
        
        if (!productId || isNaN(Number(productId))) {
            return res.status(400).json({ 
                success: false,
                message: 'Неверный ID товара' 
            });
        }

        await cartService.addToCart(req.user.id, Number(productId), Number(quantity));
        const cartData = await cartService.getCart(req.user.id);
        
        res.json({
            success: true,
            message: 'Товар добавлен в корзину',
            data: cartData
        });
    } catch (error) {
        console.error('Error:', error);
        
        if (error.message === 'PRODUCT_NOT_FOUND') {
            return res.status(404).json({
                success: false,
                message: 'Товар не найден'
            });
        }
        
        res.status(500).json({
            success: false,
            message: 'Ошибка при добавлении в корзину'
        });
    }
});

router.get('/', auth, async (req, res) => {
    try {
        const cartData = await cartService.getCart(req.user.id);

        if (!cartData || cartData.length === 0) {
            return res.json({ 
                success: true,
                data: { items: [], total: 0 }
            });
        }

        const total = cartData.reduce((sum, item) => sum + (item.product.price * item.quantity), 0);
        
        res.json({
            success: true,
            data: {
                items: cartData,
                total: total
            }
        });
    } catch (error) {
        console.error('Cart error:', error);
        res.status(500).json({ 
            success: false,
            message: 'Ошибка при получении корзины' 
        });
    }
});

router.post('/update', auth, async (req, res) => {
    try {
        const { productId, quantity } = req.body;
        
        if (!productId || isNaN(quantity)) {
            return res.status(400).json({
                success: false,
                message: 'Неверные параметры запроса'
            });
        }

        await cartService.updateCartItem(req.user.id, Number(productId), Number(quantity));
        const cartData = await cartService.getCart(req.user.id);
        const total = cartData.reduce((sum, item) => sum + (item.product.price * item.quantity), 0);

        res.json({
            success: true,
            data: {
                items: cartData,
                total: total
            }
        });
    } catch (error) {
        console.error('Update cart error:', error);
        
        if (error.message === 'ITEM_NOT_FOUND') {
            return res.status(404).json({
                success: false,
                message: 'Товар не найден в корзине'
            });
        }
        
        res.status(500).json({
            success: false,
            message: 'Ошибка при обновлении корзины'
        });
    }
});

router.post('/remove', auth, async (req, res) => {
    try {
        const { productId } = req.body;
        
        if (!productId) {
            return res.status(400).json({
                success: false,
                message: 'Не указан ID товара'
            });
        }

        await cartService.removeFromCart(req.user.id, Number(productId));
        const cartData = await cartService.getCart(req.user.id);
        const total = cartData.reduce((sum, item) => sum + (item.product.price * item.quantity), 0);
        
        res.json({
            success: true,
            data: {
                items: cartData,
                total: total
            },
            message: 'Товар удален из корзины'
        });
    } catch (error) {
        console.error('Remove from cart error:', error);
        res.status(500).json({
            success: false,
            message: 'Ошибка при удалении товара из корзины'
        });
    }
});
router.post('/clear', auth, async (req, res) => {
    try {
        await cartService.clearCart(req.user.id);
        res.json({ success: true });
    } catch (error) {
        res.status(500).json({ success: false, message: 'Ошибка при очистке корзины' });
    }
});
export const cartRouter = router; 