document.addEventListener('DOMContentLoaded', function() {
    const token = localStorage.getItem('token');
    if (!token) {
        window.location.href = '/login.html';
        return;
    }

    // Загрузка данных профиля
    function loadProfile() {
        fetch('/api/account/profile', {
            headers: {
                'Authorization': `Bearer ${token}`
            }
        })
        .then(response => {
            if (!response.ok) throw new Error('Помилка завантаження');
            return response.json();
        })
        .then(data => {
            if (data.success && data.user) {
                // Обновляем данные на странице
                document.getElementById('user-name').textContent = data.user.username;
                document.getElementById('new-username').value = data.user.username;
                document.getElementById('avatar').src = data.user.avatar || '/images/default-avatar.png';
            }
        })
        .catch(error => {
            console.error('Помилка:', error);
            alert('Не вдалося завантажити профіль');
        });
    }

    // Обработчик формы
    document.getElementById('profile-form').addEventListener('submit', function(e) {
        e.preventDefault();
        
        const newUsername = document.getElementById('new-username').value.trim();
        const newPassword = document.getElementById('new-password').value.trim();

        if (!newUsername && !newPassword) {
            alert('Введіть новий логін або пароль');
            return;
        }

        fetch('/api/account/profile', {
            method: 'PUT',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${token}`
            },
            body: JSON.stringify({
                username: newUsername,
                password: newPassword
            })
        })
        .then(response => {
            if (!response.ok) throw new Error('Помилка оновлення');
            return response.json();
        })
        .then(data => {
            if (data.success) {
                alert('Профіль оновлено!');
                // Обновляем данные
                document.getElementById('user-name').textContent = data.user.username;
                document.getElementById('new-password').value = '';
                loadProfile(); // Перезагружаем профиль
            }
        })
        .catch(error => {
            console.error('Помилка:', error);
            alert(error.message || 'Помилка оновлення профілю');
        });
    });

    // Кнопка выхода
    document.getElementById('logout-button').addEventListener('click', () => {
        localStorage.removeItem('token');
        window.location.href = '/login.html';
    });

    // Первоначальная загрузка
    loadProfile();
});


