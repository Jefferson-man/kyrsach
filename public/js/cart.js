document.addEventListener('DOMContentLoaded', function() {
    const token = localStorage.getItem('token');
    if (!token) {
        alert('Пожалуйста, войдите в систему');
        window.location.href = '/login.html';
        return;
    }
  
    const cartContainer = document.getElementById('cart-items');
    const totalElement = document.getElementById('total-price');
    const checkoutBtn = document.getElementById('checkout-btn');
  
    function updateCartCounter(count) {
        const counter = document.getElementById('cart-counter');
        if (counter) {
            counter.textContent = count;
            counter.style.display = count > 0 ? 'inline-block' : 'none';
        }
    }
  
    async function loadCart() {
        try {
            const response = await fetch('/api/cart', {
                headers: { 'Authorization': `Bearer ${token}` }
            });
            
            if (!response.ok) {
                const errorData = await response.json();
                throw new Error(errorData.message || 'Ошибка загрузки');
            }
            
            const result = await response.json();
            
            if (!result.success) {
                throw new Error(result.message || 'Некорректные данные');
            }
            
            if (!result.data?.items || result.data.items.length === 0) {
                cartContainer.innerHTML = '<div class="empty-cart">Корзина пуста</div>';
                totalElement.textContent = 'Итого: 0 грн';
                updateCartCounter(0);
                return;
            }
            
            renderCart(result.data.items);
            totalElement.textContent = `Итого: ${result.data.total} грн`;
            updateCartCounter(result.data.items.length);
        } catch (error) {
            console.error('Cart load error:', error);
            cartContainer.innerHTML = `<div class="error">${error.message}</div>`;
        }
    }
  
    function renderCart(items) {
        cartContainer.innerHTML = items.map(item => `
            <div class="cart-item" data-id="${item.product.id}">
                <img src="${item.product.image || '/images/default.jpg'}" alt="${item.product.name}">
                <div class="cart-item-info">
                    <h3>${item.product.name}</h3>
                    <div class="quantity-controls">
                        <button class="quantity-btn minus" data-id="${item.product.id}">-</button>
                        <input type="number" value="${item.quantity}" min="1" class="quantity-input" data-id="${item.product.id}">
                        <button class="quantity-btn plus" data-id="${item.product.id}">+</button>
                    </div>
                    <p>${item.product.price} грн × ${item.quantity} = ${item.product.price * item.quantity} грн</p>
                    <button class="remove-btn" data-id="${item.product.id}">
                        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor">
                            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"/>
                        </svg>
                    </button>
                </div>
            </div>
        `).join('');
    
        // Обработчики изменения количества
        document.querySelectorAll('.quantity-btn').forEach(btn => {
            btn.addEventListener('click', async () => {
                const productId = btn.dataset.id;
                const input = document.querySelector(`.quantity-input[data-id="${productId}"]`);
                let quantity = parseInt(input.value);
                
                if(btn.classList.contains('plus')) {
                    quantity++;
                } else {
                    quantity = Math.max(1, quantity - 1);
                }
        
                await updateCartItem(productId, quantity);
                input.value = quantity;
                loadCart();
            });
        });
    
        // Обработчик прямого ввода количества
        document.querySelectorAll('.quantity-input').forEach(input => {
            input.addEventListener('change', async () => {
                const productId = input.dataset.id;
                const quantity = Math.max(1, parseInt(input.value) || 1);
                await updateCartItem(productId, quantity);
                loadCart();
            });
        });
    
        // Обработчик удаления
        document.querySelectorAll('.remove-btn').forEach(btn => {
            btn.addEventListener('click', async (e) => {
                e.stopPropagation();
                const cartItem = btn.closest('.cart-item');
                const productId = cartItem.dataset.id;
                
                if (confirm('Вы уверены, что хотите удалить этот товар из корзины?')) {
                    try {
                        btn.disabled = true;
                        btn.innerHTML = `<span class="loading-spinner"></span>`;
                        
                        const response = await fetch('/api/cart/remove', {
                            method: 'POST',
                            headers: {
                                'Content-Type': 'application/json',
                                'Authorization': `Bearer ${token}`
                            },
                            body: JSON.stringify({ productId: Number(productId) })
                        });
  
                        if (!response.ok) throw new Error('Ошибка удаления');
                        
                        const result = await response.json();
                        if (result.success) {
                            cartItem.classList.add('removing');
                            setTimeout(() => loadCart(), 300);
                        }
                    } catch (error) {
                        console.error('Remove error:', error);
                        btn.disabled = false;
                        btn.innerHTML = `<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor">
                            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"/>
                        </svg>`;
                        alert('Не удалось удалить товар: ' + error.message);
                    }
                }
            });
        });
    }
    
    async function updateCartItem(productId, quantity) {
        try {
            const response = await fetch('/api/cart/update', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`
                },
                body: JSON.stringify({ 
                    productId: Number(productId), 
                    quantity: Number(quantity) 
                })
            });
            
            if (!response.ok) {
                const errorData = await response.json();
                throw new Error(errorData.message || 'Ошибка обновления');
            }
            
            return await response.json();
        } catch (error) {
            console.error('Update cart error:', error);
            alert('Ошибка при обновлении количества: ' + error.message);
            throw error;
        }
    }
  
    // Упрощенный обработчик оформления заказа
    checkoutBtn.addEventListener('click', async () => {
        try {
            // Очищаем корзину
            cartContainer.innerHTML = '<div class="empty-cart">Корзина пуста</div>';
            totalElement.textContent = 'Итого: 0 грн';
            updateCartCounter(0);
            
            // Просто показываем сообщение об успешном оформлении
            alert('Заказ успешно оформлен!');
            
            // Опционально: можно отправить запрос на сервер для очистки корзины
            await fetch('/api/cart/clear', {
                method: 'POST',
                headers: { 'Authorization': `Bearer ${token}` }
            });
            
        } catch (error) {
            console.error('Error:', error);
            alert('Ошибка при оформлении заказа');
        }
    });
  
    loadCart();
  });