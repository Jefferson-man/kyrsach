document.addEventListener('DOMContentLoaded', async function() {
    const token = localStorage.getItem('token');
    if (!token) {
        window.location.href = '/login.html';
        return;
    }

    try {
        // 1. Проверяем права пользователя
        const userResponse = await fetch('/api/account/profile', {
            headers: { 'Authorization': `Bearer ${token}` }
        });
        
        if (!userResponse.ok) {
            throw new Error('Не вдалося отримати дані користувача');
        }
        
        const userData = await userResponse.json();
        
        if (userData.user.role !== 'admin' && userData.user.role !== 'moderator') {
            alert('Доступ заборонено. Тільки адміністратор або модератор може переглядати цю сторінку.');
            window.location.href = '/index.html';
            return;
        }

        // 2. Загружаем список пользователей из вашего API (не из Prisma Studio напрямую)
        const usersResponse = await fetch('/api/user', {
            headers: { 'Authorization': `Bearer ${token}` }
        });
        
        if (!usersResponse.ok) {
            throw new Error('Не вдалося завантажити список користувачів');
        }
        
        const users = await usersResponse.json();
        renderUsersTable(users);

    } catch (error) {
        console.error('Помилка:', error);
        alert(error.message);
        window.location.href = '/index.html';
    }

    function renderUsersTable(users) {
        const tableBody = document.getElementById('users-table-body');
        tableBody.innerHTML = '';

        users.forEach(user => {
            const row = document.createElement('tr');
            
            row.innerHTML = `
                <td>${user.id}</td>
                <td>${user.username || user.name || 'Немає даних'}</td>
                <td>${user.email || 'Немає даних'}</td>
                <td>${translateRole(user.role)}</td>
                <td>
                    <select class="role-select" data-user-id="${user.id}">
                        <option value="client" ${user.role === 'client' ? 'selected' : ''}>Клієнт</option>
                        <option value="moderator" ${user.role === 'moderator' ? 'selected' : ''}>Модератор</option>
                        <option value="admin" ${user.role === 'admin' ? 'selected' : ''}>Адміністратор</option>
                    </select>
                </td>
                <td>
                    <button class="save-btn" data-user-id="${user.id}">Зберегти</button>
                </td>
            `;
            
            tableBody.appendChild(row);
        });

        // Обработчики для кнопок сохранения
        document.querySelectorAll('.save-btn').forEach(btn => {
            btn.addEventListener('click', async function() {
                const userId = this.dataset.userId;
                const select = document.querySelector(`.role-select[data-user-id="${userId}"]`);
                const newRole = select.value;
                
                try {
                    const response = await fetch(`/api/users/${userId}/role`, {
                        method: 'PUT',
                        headers: {
                            'Content-Type': 'application/json',
                            'Authorization': `Bearer ${token}`
                        },
                        body: JSON.stringify({ role: newRole })
                    });
                    
                    if (response.ok) {
                        alert('Роль успішно змінена!');
                        const updatedUser = await response.json();
                        // Обновляем строку в таблице
                        const roleCell = this.closest('tr').querySelector('td:nth-child(4)');
                        roleCell.textContent = translateRole(updatedUser.role);
                    } else {
                        const errorData = await response.json();
                        throw new Error(errorData.message || 'Помилка зміни ролі');
                    }
                } catch (error) {
                    console.error('Помилка:', error);
                    alert('Не вдалося змінити роль: ' + error.message);
                }
            });
        });
    }

    function translateRole(role) {
        switch(role) {
            case 'admin': return 'Адміністратор';
            case 'moderator': return 'Модератор';
            case 'client': return 'Клієнт';
            default: return role;
        }
    }
});