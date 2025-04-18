document.addEventListener('DOMContentLoaded', () => {
    // Створюємо елемент для завантаження хедера
    const headerPlaceholder = document.createElement('div');
    headerPlaceholder.id = 'header-placeholder';

    // Додаємо його на початок body
    document.body.prepend(headerPlaceholder);

    // Завантажуємо хедер з файлу header.html
    fetch('header.html')
        .then(response => response.text())
        .then(data => {
            headerPlaceholder.innerHTML = data;

            // После загрузки хедера вызываем функцию для изменения ссылки на профиль
            updateProfileLink();
            checkUserRole();
            // Добавляем обработчик формы поиска
            const searchForm = document.querySelector('.search-form');
            if (searchForm) {
                searchForm.addEventListener('submit', function(e) {
                    e.preventDefault();
                    const searchInput = this.querySelector('input[type="text"]');
                    const searchTerm = searchInput.value.trim();
                    if (searchTerm) {
                        // Переходим на главную страницу и передаем поисковый запрос
                        window.location.href = `index.html?search=${encodeURIComponent(searchTerm)}`;
                    }
                });
            }
        })
        .catch(error => {
            console.error('Помилка завантаження хедера:', error);
        });
        
    // Добавляем обработчик формы поиска
    const searchForm = document.querySelector('.search-form');
    if (searchForm) {
        searchForm.addEventListener('submit', function(e) {
            e.preventDefault();
            const searchInput = this.querySelector('input[type="text"]');
            const searchTerm = searchInput.value.trim();
            if (searchTerm) {
                // Переходим на главную страницу и передаем поисковый запрос
                window.location.href = `index.html?search=${encodeURIComponent(searchTerm)}`;
            }
        });
    }
});
async function checkUserRole() {
    const token = localStorage.getItem('token');
    const roleNavItem = document.getElementById('role-nav-item');
    
    if (!token || !roleNavItem) return;

    try {
        const response = await fetch('/api/account/profile', {
            headers: { 'Authorization': `Bearer ${token}` }
        });
        
        if (response.ok) {
            const data = await response.json();
            if (data.user && (data.user.role === 'admin' || data.user.role === 'moderator')) {
                roleNavItem.style.display = 'block';
            }
        }
    } catch (error) {
        console.error('Помилка перевірки ролі:', error);
    }
}
// Функция для изменения ссылки на профиль
function updateProfileLink() {
    const token = localStorage.getItem('token');
    const profileLink = document.getElementById('profile-link');

    // Если токен есть, меняем ссылку на профиль
    if (token && profileLink) {
        profileLink.href = 'profile.html'; // Меняем ссылку на профиль
        profileLink.innerHTML = '<img src="/image/user-icon.png" alt="Профіль" class="profile-icon">'; // Оставляем иконку
    } else {
        profileLink.href = 'login.html'; // Оставляем ссылку на страницу входа
        profileLink.innerHTML = '<img src="/image/user-icon.png" alt="Профіль" class="profile-icon">'; // Оставляем иконку
    }

    // Если токена нет, перенаправляем на страницу входа (кроме страниц входа и регистрации)
    //if (!token && !window.location.pathname.includes('login.html') && !window.location.pathname.includes('register.html')) {
    //    window.location.href = '/login.html';
    //}

    // Обработчик для кнопки выхода
    const logoutButton = document.getElementById('logout-button');
    if (logoutButton) {
        logoutButton.addEventListener('click', function() {
            localStorage.removeItem('token'); // Удаляем токен
            window.location.href = '/login.html'; // Перенаправляем на страницу входа
        });
    }
}





