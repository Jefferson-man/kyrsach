document.addEventListener('DOMContentLoaded', async () => {
  // DOM Elements
  const categoryForm = document.getElementById('category-form');
  const productForm = document.getElementById('product-form');
  const categorySelect = document.getElementById('product-category');
  const productList = document.getElementById('product-list');
  const categoriesNav = document.getElementById('categories-nav');
  const token = localStorage.getItem('token');
  
  // Переменные для прав доступа
  let isAdmin = false;
  let isModerator = false;
  let isAdminOrModerator = false;
  
  // Добавляем обработку поискового запроса из URL
  const urlParams = new URLSearchParams(window.location.search);
  const searchTerm = urlParams.get('search');

  // Создаем элементы для сортировки
  const sortContainer = document.createElement('div');
  sortContainer.className = 'sort-container';
  sortContainer.innerHTML = `
    <label for="sort-select">Сортувати за:</label>
    <select id="sort-select">
      <option value="">За замовчуванням</option>
      <option value="price-asc">Ціна (за зростанням)</option>
      <option value="price-desc">Ціна (за спаданням)</option>
      <option value="name-asc">Назва (А-Я)</option>
      <option value="name-desc">Назва (Я-А)</option>
    </select>
  `;
  
  // Вставляем блок сортировки перед списком товаров
  productList.parentNode.insertBefore(sortContainer, productList);
  
  const sortSelect = document.getElementById('sort-select');
  let currentProducts = []; // Для хранения текущего списка товаров

  // Проверка прав пользователя
  async function checkAdmin() {
      if (!token) return false;
      
      try {
          const response = await fetch('/api/account/profile', {
              headers: { 
                  'Authorization': `Bearer ${token}`,
                  'Content-Type': 'application/json'
              }
          });
          
          if (!response.ok) {
              console.error('Profile error:', await response.json());
              throw new Error('Ошибка сервера');
          }
          
          const data = await response.json();
          isAdmin = data.user?.role === 'admin';
          isModerator = data.user?.role === 'moderator';
          isAdminOrModerator = isAdmin || isModerator;
          
          return isAdmin;
      } catch (error) {
          console.error('Ошибка проверки прав:', error);
          return false;
      }
  }
  

  // Функция загрузки товаров с учетом поиска
  async function loadProducts() {
    try {
      showLoadingState();
      
      let url = '/api/products';
      if (searchTerm) {
        url += `/search?query=${encodeURIComponent(searchTerm)}`;
      }

      const response = await fetch(url);
      
      if (!response.ok) {
        throw new Error('Ошибка загрузки товаров');
      }

      const result = await response.json();
      
      if (!result.success) {
        throw new Error('Некорректный формат данных');
      }

      renderProducts(result.data);
      
      // Если есть поисковый запрос, показываем его в поле поиска
      if (searchTerm) {
        const searchInput = document.querySelector('.search-form input');
        if (searchInput) {
          searchInput.value = searchTerm;
        }
      }
    } catch (error) {
      console.error('Ошибка загрузки товаров:', error);
      showErrorState();
    } finally {
      hideLoadingState();
    }
  }

  // Загрузка данных
  async function loadInitialData() {
    try {
      showLoadingState();
      
      // Параллельная загрузка категорий и товаров
      const [categoriesResponse, productsPromise] = await Promise.all([
        fetch('/api/products/categories'),
        loadProducts() // Используем новую функцию загрузки товаров
      ]);

      if (!categoriesResponse.ok) {
        throw new Error('Ошибка загрузки категорий');
      }

      const categories = await categoriesResponse.json();

      if (!categories.success) {
        throw new Error('Некорректный формат данных категорий');
      }

      renderCategories(categories.data);
      renderCategoriesMenu(categories.data);
    } catch (error) {
      console.error('Ошибка загрузки данных:', error);
      showErrorState();
    } finally {
      hideLoadingState();
    }
  }

  // Отображение категорий в select
  function renderCategories(categories) {
    categorySelect.innerHTML = '<option value="">Оберіть категорію</option>';
    
    if (!Array.isArray(categories)) {
      console.error('Некорректные данные категорий:', categories);
      return;
    }

    categories.forEach(category => {
      const option = document.createElement('option');
      option.value = category.id;
      option.textContent = category.name;
      categorySelect.appendChild(option);
    });
  }

  // Отображение категорий в навигационном меню с кнопками удаления
  function renderCategoriesMenu(categories) {
    categoriesNav.innerHTML = '';
    
    if (!Array.isArray(categories)) {
      console.error('Некорректные данные категорий для меню:', categories);
      return;
    }

    categories.forEach(category => {
      const li = document.createElement('li');
      const categoryContainer = document.createElement('div');
      categoryContainer.className = 'category-container';
      
      const a = document.createElement('a');
      a.href = `#${category.id}`;
      a.textContent = category.name;
      a.addEventListener('click', (e) => {
        e.preventDefault();
        filterProductsByCategory(category.id);
      });
      
      categoryContainer.appendChild(a);
      
      // Добавляем кнопку удаления только для админа
      if (isAdmin) {
        const deleteBtn = document.createElement('button');
        deleteBtn.className = 'delete-category-btn';
        deleteBtn.innerHTML = '&times;';
        deleteBtn.setAttribute('data-category-id', category.id);
        deleteBtn.setAttribute('title', 'Видалити категорію');
        deleteBtn.addEventListener('click', (e) => {
          e.stopPropagation();
          deleteCategory(category.id);
        });
        categoryContainer.appendChild(deleteBtn);
      }
      
      li.appendChild(categoryContainer);
      categoriesNav.appendChild(li);
    });
  }

  // Фильтрация товаров по категории
  async function filterProductsByCategory(categoryId) {
    try {
      showLoadingState();
      const response = await fetch(`/api/products/category/${categoryId}`);
      
      if (!response.ok) {
        throw new Error('Ошибка загрузки товаров по категории');
      }

      const result = await response.json();
      
      if (!result.success) {
        throw new Error('Некорректный формат данных');
      }

      renderProducts(result.data);
      productList.scrollIntoView({ behavior: 'smooth' });
    } catch (error) {
      console.error('Ошибка фильтрации товаров:', error);
      showErrorState();
    } finally {
      hideLoadingState();
    }
  }

  // Функция сортировки товаров
  function sortProducts(products, sortType) {
    const sortedProducts = [...products];
    
    switch(sortType) {
      case 'price-asc':
        return sortedProducts.sort((a, b) => a.price - b.price);
      case 'price-desc':
        return sortedProducts.sort((a, b) => b.price - a.price);
      case 'name-asc':
        return sortedProducts.sort((a, b) => a.name.localeCompare(b.name));
      case 'name-desc':
        return sortedProducts.sort((a, b) => b.name.localeCompare(a.name));
      default:
        return products;
    }
  }

  // Обработчик изменения сортировки
  function handleSortChange() {
    const sortType = sortSelect.value;
    const sortedProducts = sortProducts(currentProducts, sortType);
    renderProducts(sortedProducts);
  }

  // Отображение товаров с кнопками управления
  function renderProducts(products) {
    productList.innerHTML = '';
    currentProducts = products; // Сохраняем текущий список
    
    if (!Array.isArray(products)) {
      showEmptyState('Не вдалося завантажити товари');
      return;
    }

    if (products.length === 0) {
      showEmptyState('Товари відсутні');
      return;
    }

    const fragment = document.createDocumentFragment();
    
    products.forEach(product => {
      const productCard = document.createElement('div');
      productCard.className = 'product-card';
      productCard.setAttribute('data-id', product.id);
      
      productCard.innerHTML = `
        <img src="${product.image || '/images/default-product.png'}" 
             alt="${product.name}" 
             class="product-image">
        <div class="product-info">
          <h3>${product.name}</h3>
          <p>${product.description}</p>
          <p class="price">${product.price} грн</p>
          <p>Категорія: ${product.category?.name || 'Без категорії'}</p>
          <button class="add-to-cart-btn" data-id="${product.id}">Додати до кошика</button>
          ${isAdminOrModerator ? `<button class="delete-product-btn" data-id="${product.id}">Видалити</button>` : ''}
          ${isAdminOrModerator ? `<button class="edit-product-btn" data-id="${product.id}">Редагувати</button>` : ''}
        </div>
      `;
      fragment.appendChild(productCard);
    });
    
    productList.appendChild(fragment);
    
    // Добавляем обработчики для кнопок
    document.querySelectorAll('.add-to-cart-btn').forEach(btn => {
      btn.addEventListener('click', () => {
        const productId = btn.getAttribute('data-id');
        addToCart(productId);
      });
    });

    if (isAdminOrModerator) {
      document.querySelectorAll('.delete-product-btn').forEach(btn => {
        btn.addEventListener('click', () => {
          const productId = btn.getAttribute('data-id');
          deleteProduct(productId);
        });
      });
    }

    if (isAdminOrModerator) {
      document.querySelectorAll('.edit-product-btn').forEach(btn => {
        btn.addEventListener('click', () => {
          const productId = btn.getAttribute('data-id');
          showEditProductForm(productId);
        });
      });
    }
  }

  // Функция удаления товара
  async function deleteProduct(productId) {
    if (!confirm('Ви впевнені, що хочете видалити цей товар?')) return;

    try {
        const response = await fetch(`/api/products/${productId}`, {
            method: 'DELETE',
            headers: {
                'Authorization': `Bearer ${token}`
            }
        });

        if (!response.ok) {
            throw new Error('Помилка видалення товару');
        }

        showAlert('Товар успішно видалено!');
        await loadInitialData();
    } catch (error) {
        console.error('Помилка видалення товару:', error);
        showAlert(error.message || 'Помилка видалення товару', 'error');
    }
  }

  // Функция удаления категории
  async function deleteCategory(categoryId) {
    if (!confirm('Ви впевнені, що хочете видалити цю категорію? Ця дія незворотня.')) {
      return;
    }

    try {
      const response = await fetch(`/api/products/categories/${categoryId}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || 'Помилка видалення категорії');
      }

      showAlert('Категорію успішно видалено!');
      await loadInitialData();
    } catch (error) {
      console.error('Помилка видалення категорії:', error);
      showAlert(error.message || 'Помилка видалення категорії', 'error');
      
      if (error.message.includes('неможливо видалити категорію, в якій є товари')) {
        // Предлагаем переместить товары в другую категорию
        if (confirm('Хочете перемістити товари цієї категорії до іншої категорії перед видаленням?')) {
          showMoveProductsDialog(categoryId);
        }
      }
    }
  }

  // Диалог перемещения товаров при удалении категории
  function showMoveProductsDialog(categoryIdToDelete) {
    const modal = document.createElement('div');
    modal.className = 'modal';
    
    modal.innerHTML = `
      <div class="modal-content">
        <h2>Перемістити товари</h2>
        <p>Оберіть нову категорію для товарів з категорії, яку ви видаляєте:</p>
        <select id="new-category-select">
          <option value="">-- Оберіть категорію --</option>
        </select>
        <div class="modal-buttons">
          <button id="confirm-move-btn">Підтвердити</button>
          <button class="cancel-btn">Скасувати</button>
        </div>
      </div>
    `;

    document.body.appendChild(modal);
    
    // Заполняем select категориями (кроме удаляемой)
    const select = modal.querySelector('#new-category-select');
    Array.from(categorySelect.options).forEach(option => {
      if (option.value && option.value != categoryIdToDelete) {
        select.appendChild(new Option(option.text, option.value));
      }
    });

    // Обработчики событий
    modal.querySelector('.cancel-btn').addEventListener('click', () => {
      modal.remove();
    });

    modal.querySelector('#confirm-move-btn').addEventListener('click', async () => {
      const newCategoryId = select.value;
      if (!newCategoryId) {
        showAlert('Будь ласка, оберіть категорію', 'error');
        return;
      }

      try {
        // 1. Перемещаем товары
        const moveResponse = await fetch(`/api/products/move-to-category`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${token}`
          },
          body: JSON.stringify({
            fromCategoryId: Number(categoryIdToDelete),
            toCategoryId: Number(newCategoryId)
          })
        });

        if (!moveResponse.ok) {
          throw new Error('Помилка переміщення товарів');
        }

        // 2. Удаляем категорию
        const deleteResponse = await fetch(`/api/products/categories/${categoryIdToDelete}`, {
          method: 'DELETE',
          headers: {
            'Authorization': `Bearer ${token}`
          }
        });

        if (!deleteResponse.ok) {
          throw new Error('Помилка видалення категорії після переміщення товарів');
        }

        showAlert('Товари переміщено та категорію успішно видалено!');
        modal.remove();
        await loadInitialData();
      } catch (error) {
        console.error('Помилка:', error);
        showAlert(error.message || 'Помилка переміщення товарів та видалення категорії', 'error');
      }
    });
  }

  // Функция показа формы редактирования товара
  function showEditProductForm(productId) {
    const product = currentProducts.find(p => p.id == productId);
    if (!product) return;

    // Создаем модальное окно
    const modal = document.createElement('div');
    modal.className = 'modal';
    modal.innerHTML = `
        <div class="modal-content">
            <h2>Редагувати товар</h2>
            <form id="edit-product-form">
                <input type="text" id="edit-product-name" value="${product.name}" required>
                <textarea id="edit-product-description" required>${product.description}</textarea>
                <input type="number" id="edit-product-price" value="${product.price}" required>
                <input type="text" id="edit-product-image" value="${product.image || ''}">
                <select id="edit-product-category" required>
                    ${Array.from(categorySelect.options).map(option => 
                        `<option value="${option.value}" ${option.value == product.categoryId ? 'selected' : ''}>
                            ${option.text}
                        </option>`
                    ).join('')}
                </select>
                <button type="submit">Зберегти зміни</button>
                <button type="button" class="cancel-edit-btn">Скасувати</button>
            </form>
        </div>
    `;

    document.body.appendChild(modal);
    setTimeout(() => modal.classList.add('active'), 10);
    // Обработчики событий
    modal.querySelector('.cancel-edit-btn').addEventListener('click', () => {
        modal.remove();
    });

    modal.querySelector('#edit-product-form').addEventListener('submit', async (e) => {
        e.preventDefault();
        await updateProduct(productId);
        modal.remove();
    });
  }

  // Функция обновления товара
  async function updateProduct(productId) {
    const form = document.getElementById('edit-product-form');
    
    const formData = {
        name: form.elements['edit-product-name'].value.trim(),
        description: form.elements['edit-product-description'].value.trim(),
        price: form.elements['edit-product-price'].value,
        image: form.elements['edit-product-image'].value.trim(),
        categoryId: form.elements['edit-product-category'].value
    };

    try {
        const response = await fetch(`/api/products/${productId}`, {
            method: 'PUT',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${token}`
            },
            body: JSON.stringify(formData)
        });

        if (!response.ok) {
            throw new Error('Помилка оновлення товару');
        }

        showAlert('Товар успішно оновлено!');
        await loadInitialData();
    } catch (error) {
        console.error('Помилка оновлення товару:', error);
        showAlert(error.message || 'Помилка оновлення товару', 'error');
    }
  }

  // Обработчик формы категории
  async function handleCategorySubmit(e) {
    e.preventDefault();
    const form = e.target;
    const submitBtn = form.querySelector('button[type="submit"]');
    const nameInput = form.elements['category-name'];
    const name = nameInput.value.trim();
    
    if (!name) {
      showAlert('Введіть назву категорії', 'error');
      return;
    }

    try {
      submitBtn.disabled = true;
      submitBtn.textContent = 'Додавання...';
      
      const response = await fetch('/api/products/categories', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({ name })
      });

      const result = await response.json();
      
      if (!response.ok) {
        throw new Error(result.message || 'Помилка сервера');
      }

      showAlert(`Категорію "${name}" успішно додано!`);
      nameInput.value = '';
      await loadInitialData();
    } catch (error) {
      console.error('Ошибка добавления категории:', error);
      showAlert(error.message || 'Помилка додавання категорії', 'error');
    } finally {
      submitBtn.disabled = false;
      submitBtn.textContent = 'Додати категорію';
    }
  }

  // Обработчик формы товара
  async function handleProductSubmit(e) {
    e.preventDefault();
    const form = e.target;
    const submitBtn = form.querySelector('button[type="submit"]');
    
    const formData = {
      name: form.elements['product-name'].value.trim(),
      description: form.elements['product-description'].value.trim(),
      price: form.elements['product-price'].value,
      image: form.elements['product-image'].value.trim(),
      categoryId: form.elements['product-category'].value
    };
    
    if (!formData.name || !formData.description || !formData.price || !formData.categoryId) {
      showAlert('Заповніть всі обов\'язкові поля', 'error');
      return;
    }

    try {
      submitBtn.disabled = true;
      submitBtn.textContent = 'Додавання...';
      
      const response = await fetch('/api/products', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify(formData)
      });

      const result = await response.json();
      
      if (!response.ok) {
        throw new Error(result.message || 'Помилка сервера');
      }

      showAlert('Товар успішно додано!');
      form.reset();
      await loadInitialData();
    } catch (error) {
      console.error('Ошибка добавления товара:', error);
      showAlert(error.message || 'Помилка додавання товару', 'error');
    } finally {
      submitBtn.disabled = false;
      submitBtn.textContent = 'Додати товар';
    }
  }

  // Вспомогательные функции UI
  function showLoadingState() {
    productList.innerHTML = '<div class="loading">Завантаження...</div>';
  }

  function hideLoadingState() {
    const loadingElement = document.querySelector('.loading');
    if (loadingElement) loadingElement.remove();
  }

  function showEmptyState(message) {
    productList.innerHTML = `
      <div class="empty-state">
        <p>${message}</p>
        <button class="retry-btn">Спробувати знову</button>
      </div>
    `;
    
    document.querySelector('.retry-btn').addEventListener('click', loadInitialData);
  }

  function showErrorState() {
    showEmptyState('Не вдалося завантажити дані');
  }

  function showAlert(message, type = 'success') {
    const alert = document.createElement('div');
    alert.className = `alert alert-${type}`;
    alert.textContent = message;
    document.body.prepend(alert);
    
    setTimeout(() => {
      alert.remove();
    }, 5000);
  }

  // Функция добавления в корзину
  async function addToCart(productId) {
    const token = localStorage.getItem('token');
    if (!token) {
        if (confirm('Для додавання товарів у кошик потрібно увійти. Перейти на сторінку входу?')) {
            window.location.href = '/login.html';
        }
        return;
    }

    const addButton = document.querySelector(`.add-to-cart-btn[data-id="${productId}"]`);
    const originalText = addButton.textContent;
    addButton.disabled = true;
    addButton.textContent = 'Додається...';

    try {
        const response = await fetch('/api/cart/add', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${token}`,
            },
            body: JSON.stringify({ 
                productId: Number(productId),
                quantity: 1
            }),
        });

        const data = await response.json();

        if (!response.ok) {
            throw new Error(data.message || 'Помилка сервера');
        }

        showAlert('Товар додано до кошика!', 'success');
        updateCartCounter(data.cartCount);

        setTimeout(() => {
            if (confirm('Перейти до кошика?')) {
                window.location.href = '/cart.html';
            }
        }, 1500);
    } catch (error) {
        console.error('Помилка додавання до кошика:', error);
        showAlert(error.message || 'Помилка при додаванні до кошика', 'error');
    } finally {
        addButton.disabled = false;
        addButton.textContent = originalText;
    }
  }

  // Обновление счетчика в корзине
  function updateCartCounter(count) {
    const counter = document.getElementById('cart-counter');
    if (counter) {
        counter.textContent = count;
        counter.style.display = count > 0 ? 'flex' : 'none';
    }
  }
  await checkAdmin();
  if (isAdmin) {
    document.getElementById('add-category-form').style.display = 'block'; // Только для админа
  }
  if (isAdminOrModerator) {
    document.getElementById('add-product-form').style.display = 'block'; // Для админа и модератора
  }
  /*
  // Инициализация
  const adminCheck = await checkAdmin();
  if (adminCheck) {
    document.getElementById('add-category-form').style.display = 'block';
    document.getElementById('add-product-form').style.display = 'block';
  }*/

  // Загрузка данных
  await loadInitialData();

  // Назначение обработчиков
  categoryForm?.addEventListener('submit', handleCategorySubmit);
  productForm?.addEventListener('submit', handleProductSubmit);
  sortSelect?.addEventListener('change', handleSortChange);
});

// Глобальные обработчики
document.addEventListener('click', function(e) {
  if (e.target.classList.contains('add-to-cart-btn')) {
      const productId = e.target.getAttribute('data-id');
      addToCart(productId);
  }
});

async function deleteCategory(categoryId) {
  if (!confirm('Ви впевнені, що хочете видалити цю категорію? Ця дія незворотня.')) {
    return;
  }

  try {
    const response = await fetch(`/api/products/categories/${categoryId}`, {
      method: 'DELETE',
      headers: {
        'Authorization': `Bearer ${token}`
      }
    });

    const result = await response.json();

    if (!response.ok) {
      throw new Error(result.message || 'Помилка видалення категорії');
    }

    showAlert('Категорію успішно видалено!');
    await loadInitialData();
  } catch (error) {
    console.error('Помилка видалення категорії:', error);
    
    if (error.message.includes('неможливо видалити категорію')) {
      // Пропонуємо перемістити товари
      if (confirm(`${error.message}. Хочете перемістити товари цієї категорії до іншої категорії перед видаленням?`)) {
        showMoveProductsDialog(categoryId);
      }
    } else if (error.message.includes('не знайдено')) {
      showAlert(error.message, 'error');
    } else {
      showAlert('Помилка при видаленні категорії', 'error');
    }
  }
}