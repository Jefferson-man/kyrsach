import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

export class ProductService {
  async getCategories() {
    try {
      return await prisma.category.findMany({
        orderBy: { name: 'asc' }
      });
    } catch (error) {
      console.error('Error fetching categories:', error);
      throw new Error('Не вдалося завантажити категорії');
    }
  }

  async addCategory(name) {
    try {
      return await prisma.$transaction(async (tx) => {
        // Проверяем, существует ли категория с таким именем (без учета регистра)
        const existingCategory = await tx.category.findFirst({
          where: { 
            name: { 
              equals: name, 
              mode: 'insensitive' 
            } 
          }
        });

        if (existingCategory) {
          throw new Error('CATEGORY_EXISTS');
        }

        // Создаем новую категорию
        return await tx.category.create({
          data: { name }
        });
      });
    } catch (error) {
      console.error('Error adding category:', error);
      throw error;
    }
  }

  async getProducts() {
    try {
      return await prisma.product.findMany({
        include: { category: true },
        orderBy: { createdAt: 'desc' }
      });
    } catch (error) {
      console.error('Error fetching products:', error);
      throw new Error('Не вдалося завантажити товари');
    }
  }

  async addProduct(productData) {
    try {
      return await prisma.$transaction(async (tx) => {
        // Проверяем существование категории
        const category = await tx.category.findUnique({
          where: { id: Number(productData.categoryId) }
        });

        if (!category) {
          throw new Error('CATEGORY_NOT_FOUND');
        }

        // Создаем новый товар
        return await tx.product.create({
          data: {
            name: productData.name,
            description: productData.description,
            price: parseFloat(productData.price),
            image: productData.image || null,
            categoryId: Number(productData.categoryId)
          },
          include: { category: true }
        });
      });
    } catch (error) {
      console.error('Error adding product:', error);
      throw error;
    }
  }

  async getProductsByCategory(categoryId) {
    try {
      return await prisma.product.findMany({
        where: { categoryId: Number(categoryId) },
        include: { category: true },
        orderBy: { createdAt: 'desc' }
      });
    } catch (error) {
      console.error('Error fetching products by category:', error);
      throw new Error('Не вдалося завантажити товари за категорією');
    }
  }
  async searchProducts(query) {
    try {
      return await prisma.product.findMany({
        where: {
          OR: [
            { 
              name: { 
                contains: query,
                mode: 'insensitive' 
              } 
            },
            { 
              description: { 
                contains: query,
                mode: 'insensitive' 
              } 
            }
          ]
        },
        include: { category: true },
        orderBy: { createdAt: 'desc' }
      });
    } catch (error) {
      console.error('Error searching products:', error);
      throw new Error('Не вдалося виконати пошук товарів');
    }
  }
  async updateProduct(productId, productData) {
    try {
      return await prisma.$transaction(async (tx) => {
        // Проверяем существование товара
        const existingProduct = await tx.product.findUnique({
          where: { id: Number(productId) }
        });

        if (!existingProduct) {
          throw new Error('PRODUCT_NOT_FOUND');
        }

        // Если меняется категория, проверяем её существование
        if (productData.categoryId) {
          const category = await tx.category.findUnique({
            where: { id: Number(productData.categoryId) }
          });

          if (!category) {
            throw new Error('CATEGORY_NOT_FOUND');
          }
        }

        // Обновляем товар
        return await tx.product.update({
          where: { id: Number(productId) },
          data: {
            name: productData.name?.trim(),
            description: productData.description?.trim(),
            price: productData.price ? parseFloat(productData.price) : undefined,
            image: productData.image || undefined,
            categoryId: productData.categoryId ? Number(productData.categoryId) : undefined
          },
          include: { category: true }
        });
      });
    } catch (error) {
      console.error('Error updating product:', error);
      throw error;
    }
  }

  async deleteProduct(productId) {
    try {
      return await prisma.product.delete({
        where: { id: Number(productId) }
      });
    } catch (error) {
      console.error('Error deleting product:', error);
      throw error;
    }
  }

  async deleteCategory(categoryId) {
    try {
      return await prisma.$transaction(async (tx) => {
        // Проверяем, есть ли товары в этой категории
        const productsInCategory = await tx.product.count({
          where: { categoryId: Number(categoryId) }
        });

        if (productsInCategory > 0) {
          throw new Error('CATEGORY_NOT_EMPTY');
        }

        // Удаляем категорию
        return await tx.category.delete({
          where: { id: Number(categoryId) }
        });
      });
    } catch (error) {
      console.error('Error deleting category:', error);
      throw error;
    }
  }

  async moveProductsToCategory(fromCategoryId, toCategoryId) {
    try {
      return await prisma.$transaction(async (tx) => {
        // Проверяем существование категорий
        const fromCategory = await tx.category.findUnique({
          where: { id: Number(fromCategoryId) }
        });
        const toCategory = await tx.category.findUnique({
          where: { id: Number(toCategoryId) }
        });

        if (!fromCategory || !toCategory) {
          throw new Error('CATEGORY_NOT_FOUND');
        }

        // Обновляем товары
        await tx.product.updateMany({
          where: { categoryId: Number(fromCategoryId) },
          data: { categoryId: Number(toCategoryId) }
        });

        return { count: await tx.product.count({ where: { categoryId: Number(fromCategoryId) } }) };
      });
    } catch (error) {
      console.error('Error moving products:', error);
      throw error;
    }
  }
  
}
