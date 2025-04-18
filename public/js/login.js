document.getElementById('login-form')?.addEventListener('submit', function(event) {
    event.preventDefault();

    const username = document.getElementById('username').value;
    const password = document.getElementById('password').value;

    fetch('/api/auth/login', {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
        },
        body: JSON.stringify({ username, password }),
    })
    .then(response => response.json())
    .then(data => {
        if (data.token) {
            localStorage.setItem('token', data.token); // Сохраняем токен
            alert('Успішний вхід!');
            window.location.href = '/profile.html'; // Перенаправляем на профиль
        } else {
            alert('Помилка авторизації: ' + data.message);
        }
    })
    .catch(error => {
        console.error('Помилка:', error);
    });
});