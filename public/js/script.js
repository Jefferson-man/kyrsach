function addToCart(productId) {
    const token = localStorage.getItem('token');
    if (!token) {
        if (confirm('Для додавання товарів у кошик потрібно увійти. Перейти на сторінку входу?')) {
            window.location.href = '/login.html';
        }
        return;
    }

    const addButton = document.querySelector(`.add-to-cart-btn[data-id="${productId}"]`);
    const originalText = addButton?.textContent;
    if (addButton) {
        addButton.disabled = true;
        addButton.textContent = 'Додається...';
    }

    fetch('/api/cart/add', {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${token}`,
        },
        body: JSON.stringify({ productId: Number(productId), quantity: 1 }),
    })
    .then(response => {
        if (!response.ok) {
            return response.json().then(err => { throw err; });
        }
        return response.json();
    })
    .then(data => {
        if (data.success) {
            alert('Товар додано до кошика!');
            // Обновляем счетчик корзины
            if (data.data?.cartCount !== undefined) {
                updateCartCounter(data.data.cartCount);
            }
        } else {
            alert('Помилка: ' + data.message);
        }
    })
    .catch(error => {
        console.error('Помилка:', error);
        alert('Не вдалося додати товар до кошика: ' + (error.message || 'Невідома помилка'));
    })
    .finally(() => {
        if (addButton) {
            addButton.disabled = false;
            addButton.textContent = originalText;
        }
    });
}

function updateCartCounter(count) {
    const counter = document.getElementById('cart-counter');
    if (counter) {
        counter.textContent = count;
        counter.style.display = count > 0 ? 'inline' : 'none';
    }
}

// Пример функции для оформления заказа
function checkout() {
    const token = localStorage.getItem('token');
    if (!token) {
        alert('Будь ласка, увійдіть в систему, щоб оформити замовлення.');
        window.location.href = '/login.html';
        return;
    }

    fetch('/api/cart/checkout', {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${token}`,
        },
    })
    .then(response => response.json())
    .then(data => {
        if (data.success) {
            alert('Замовлення оформлено!');
            window.location.href = '/profile.html';
        } else {
            alert('Помилка: ' + data.message);
        }
    })
    .catch(error => {
        console.error('Помилка:', error);
    });
}

document.addEventListener('DOMContentLoaded', function() {
    const roleForm = document.getElementById('role-form');
    const token = localStorage.getItem('token');

    // Проверка, что пользователь — администратор
    if (token) {
        fetch('/api/account/profile', {
            headers: {
                'Authorization': `Bearer ${token}`,
            },
        })
        .then(response => response.json())
        .then(data => {
            if (data.user.role !== 'admin') {
                // Если пользователь не администратор, скрываем форму
                document.getElementById('change-role-form').style.display = 'none';
                alert('Доступ заборонено. Тільки адміністратор може змінювати ролі.');
            }
        })
        .catch(error => {
            console.error('Помилка отримання профілю:', error);
        });
    } else {
        // Если токена нет, перенаправляем на страницу входа
        window.location.href = '/login.html';
    }

    // Обработчик для формы изменения роли
    roleForm.addEventListener('submit', function(event) {
        event.preventDefault();

        const userId = document.getElementById('user-id').value;
        const newRole = document.getElementById('new-role').value;

        fetch('/api/account/profile/role', {
            method: 'PUT',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${token}`,
            },
            body: JSON.stringify({ userId, newRole }),
        })
        .then(response => response.json())
        .then(data => {
            if (data.message) {
                alert(data.message); // Показываем сообщение об успешном изменении роли
            } else {
                alert('Помилка: ' + data.message);
            }
        })
        .catch(error => {
            console.error('Помилка оновлення ролі:', error);
            alert('Сталася помилка при оновленні ролі.');
        });
    });
});
// Получение списка всех пользователей (только для админов/модераторов)
router.get('/api/users', auth, isAdminOrModerator, async (req, res) => {
    try {
        const users = await prisma.user.findMany({
            select: {
                id: true,
                username: true,
                email: true,
                role: true,
                createdAt: true,
                updatedAt: true
            }
        });
        res.json(users);
    } catch (error) {
        console.error('Error fetching users:', error);
        res.status(500).json({ message: 'Помилка отримання списку користувачів' });
    }
});

// Изменение роли пользователя (только для админов)
router.put('/api/users/:userId/role', auth, isAdmin, async (req, res) => {
    try {
        const { userId } = req.params;
        const { role } = req.body;

        const updatedUser = await prisma.user.update({
            where: { id: Number(userId) },
            data: { role },
            select: {
                id: true,
                username: true,
                email: true,
                role: true
            }
        });

        res.json(updatedUser);
    } catch (error) {
        console.error('Error updating user role:', error);
        res.status(500).json({ message: 'Помилка оновлення ролі користувача' });
    }
});