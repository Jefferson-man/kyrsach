import { Router } from 'express';
import { ProductService } from './product.service.js';
import { auth } from '../../../middleware/auth.js';
import { isAdmin, isModerator, isAdminOrModerator } from './roleMiddleware.js';

const router = Router();
const productService = new ProductService();

// Получение всех категорий (доступно всем)
router.get('/categories', async (req, res) => {
  try {
    const categories = await productService.getCategories();
    res.json({ 
      success: true, 
      data: categories 
    });
  } catch (error) {
    console.error('Error getting categories:', error);
    res.status(500).json({ 
      success: false, 
      message: 'Не вдалося отримати категорії' 
    });
  }
});

// Добавление новой категории (только админ)
router.post('/categories', auth, isAdmin, async (req, res) => {
  const { name } = req.body;
  
  if (!name || typeof name !== 'string' || name.trim().length === 0) {
    return res.status(400).json({
      success: false,
      message: 'Назва категорії обов\'язкова'
    });
  }

  try {
    const category = await productService.addCategory(name.trim());
    res.status(201).json({
      success: true,
      message: 'Категорію успішно додано',
      data: category
    });
  } catch (error) {
    console.error('Error adding category:', error);
    
    if (error.message === 'CATEGORY_EXISTS') {
      return res.status(409).json({
        success: false,
        message: 'Категорія з такою назвою вже існує'
      });
    }
    
    res.status(500).json({
      success: false,
      message: 'Внутрішня помилка сервера'
    });
  }
});

// Получение всех товаров (доступно всем)
router.get('/', async (req, res) => {
  try {
    const products = await productService.getProducts();
    res.json({ 
      success: true, 
      data: products 
    });
  } catch (error) {
    console.error('Error getting products:', error);
    res.status(500).json({ 
      success: false, 
      message: 'Не вдалося отримати товари' 
    });
  }
});

// Добавление товара (админ и модератор)
router.post('/', auth, isAdminOrModerator, async (req, res) => {
  const { name, description, price, image, categoryId } = req.body;

  if (!name || !description || !price || !categoryId) {
    return res.status(400).json({
      success: false,
      message: 'Всі обов\'язкові поля повинні бути заповнені'
    });
  }

  try {
    const product = await productService.addProduct({
      name: name.trim(),
      description: description.trim(),
      price,
      image,
      categoryId
    });
    
    res.status(201).json({
      success: true,
      message: 'Товар успішно додано',
      data: product
    });
  } catch (error) {
    console.error('Error adding product:', error);
    
    if (error.message === 'CATEGORY_NOT_FOUND') {
      return res.status(404).json({
        success: false,
        message: 'Обраної категорії не існує'
      });
    }
    
    res.status(500).json({
      success: false,
      message: 'Помилка при додаванні товару'
    });
  }
});

// Получение товаров по категории (доступно всем)
router.get('/category/:categoryId', async (req, res) => {
  try {
    const products = await productService.getProductsByCategory(req.params.categoryId);
    res.json({ 
      success: true, 
      data: products 
    });
  } catch (error) {
    console.error('Error getting products by category:', error);
    res.status(500).json({ 
      success: false, 
      message: 'Не вдалося отримати товари за категорією' 
    });
  }
});

// Поиск товаров (доступно всем)
router.get('/search', async (req, res) => {
  const { query } = req.query;
  
  if (!query || typeof query !== 'string' || query.trim().length === 0) {
    return res.status(400).json({
      success: false,
      message: 'Пошуковий запит обов\'язковий'
    });
  }

  try {
    const products = await productService.searchProducts(query.trim());
    res.json({ 
      success: true, 
      data: products 
    });
  } catch (error) {
    console.error('Error searching products:', error);
    res.status(500).json({ 
      success: false, 
      message: 'Не вдалося виконати пошук товарів' 
    });
  }
});

// Обновление товара (админ и модератор)
router.put('/:productId', auth, isAdminOrModerator, async (req, res) => {
  const { productId } = req.params;
  const { name, description, price, image, categoryId } = req.body;

  try {
    const product = await productService.updateProduct(productId, {
      name,
      description,
      price,
      image,
      categoryId
    });
    
    res.json({
      success: true,
      message: 'Товар успішно оновлено',
      data: product
    });
  } catch (error) {
    console.error('Error updating product:', error);
    
    if (error.message === 'PRODUCT_NOT_FOUND') {
      return res.status(404).json({
        success: false,
        message: 'Товар не знайдено'
      });
    }
    
    if (error.message === 'CATEGORY_NOT_FOUND') {
      return res.status(404).json({
        success: false,
        message: 'Обраної категорії не існує'
      });
    }
    
    res.status(500).json({
      success: false,
      message: 'Помилка при оновленні товару'
    });
  }
});

// Удаление товара (только админ)
router.delete('/:productId', auth, isAdminOrModerator, async (req, res) => {
  const { productId } = req.params;

  try {
    await productService.deleteProduct(productId);
    res.json({
      success: true,
      message: 'Товар успішно видалено'
    });
  } catch (error) {
    console.error('Error deleting product:', error);
    res.status(500).json({
      success: false,
      message: 'Помилка при видаленні товару'
    });
  }
});

// Удаление категории (только админ)
router.delete('/categories/:categoryId', auth, isAdmin, async (req, res) => {
  const { categoryId } = req.params;

  try {
    await productService.deleteCategory(categoryId);
    res.json({
      success: true,
      message: 'Категорію успішно видалено'
    });
  } catch (error) {
    console.error('Помилка видалення категорії:', error);
    
    if (error.message === 'CATEGORY_NOT_EMPTY') {
      return res.status(400).json({
        success: false,
        message: 'Неможливо видалити категорію, в якій є товари'
      });
    }
    
    if (error.message === 'CATEGORY_NOT_FOUND') {
      return res.status(404).json({
        success: false,
        message: 'Категорію не знайдено'
      });
    }
    
    res.status(500).json({
      success: false,
      message: 'Помилка при видаленні категорії'
    });
  }
});

// Перемещение товаров между категориями (только админ)
router.post('/move-to-category', auth, isAdmin, async (req, res) => {
  const { fromCategoryId, toCategoryId } = req.body;

  if (!fromCategoryId || !toCategoryId) {
    return res.status(400).json({
      success: false,
      message: 'Необхідно вказати обидві категорії'
    });
  }

  try {
    const fromCategory = await prisma.category.findUnique({
      where: { id: Number(fromCategoryId) }
    });
    const toCategory = await prisma.category.findUnique({
      where: { id: Number(toCategoryId) }
    });

    if (!fromCategory || !toCategory) {
      return res.status(404).json({
        success: false,
        message: 'Одну з категорій не знайдено'
      });
    }

    await prisma.product.updateMany({
      where: { categoryId: Number(fromCategoryId) },
      data: { categoryId: Number(toCategoryId) }
    });

    res.json({
      success: true,
      message: 'Товари успішно переміщено'
    });
  } catch (error) {
    console.error('Error moving products:', error);
    res.status(500).json({
      success: false,
      message: 'Помилка переміщення товарів'
    });
  }
});

export const productRouter = router;