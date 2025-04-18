import { PrismaClient } from '@prisma/client';
const prisma = new PrismaClient();

export class CartService {
    async addToCart(userId, productId, quantity = 1) {
        try {
            const user = await prisma.user.findUnique({
                where: { id: userId },
                select: { id: true }
            });
            if (!user) throw new Error('USER_NOT_FOUND');
        
            return await prisma.$transaction(async (tx) => {
                const product = await tx.product.findUnique({
                    where: { id: productId },
                    select: { id: true }
                });
                if (!product) throw new Error('PRODUCT_NOT_FOUND');
            
                const existingItem = await tx.cart.findFirst({
                    where: { userId, productId }
                });
            
                if (existingItem) {
                    return await tx.cart.update({
                        where: { id: existingItem.id },
                        data: { quantity: existingItem.quantity + quantity },
                        include: { product: true }
                    });
                } else {
                    return await tx.cart.create({
                        data: { userId, productId, quantity },
                        include: { product: true }
                    });
                }
            });
        } catch (error) {
            console.error('Error in addToCart:', error);
            throw error;
        }
    }

    async getCart(userId) {
        try {
            return await prisma.cart.findMany({
                where: { userId },
                include: { 
                    product: {
                        select: {
                            id: true,
                            name: true,
                            description: true,
                            price: true,
                            image: true
                        }
                    }
                }
            });
        } catch (error) {
            console.error('Error getting cart:', error);
            throw error;
        }
    }

    async clearCart(userId) {
        try {
            return await prisma.cart.deleteMany({ where: { userId } });
        } catch (error) {
            console.error('Error clearing cart:', error);
            throw new Error('Не вдалося очистити кошик');
        }
    }

    async updateCartItem(userId, productId, quantity) {
        try {
            const existingItem = await prisma.cart.findFirst({
                where: { userId, productId }
            });
        
            if (!existingItem) throw new Error('ITEM_NOT_FOUND');
        
            return await prisma.cart.update({
                where: { id: existingItem.id },
                data: { quantity },
                include: { product: true }
            });
        } catch (error) {
            console.error('Error updating cart item:', error);
            throw error;
        }
    }

    async removeFromCart(userId, productId) {
        try {
            const existingItem = await prisma.cart.findFirst({
                where: { userId, productId }
            });
        
            if (!existingItem) throw new Error('ITEM_NOT_FOUND');
        
            return await prisma.cart.delete({
                where: { id: existingItem.id }
            });
        } catch (error) {
            console.error('Error removing from cart:', error);
            throw error;
        }
    }
    
}
