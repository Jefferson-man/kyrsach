document.getElementById('register-form')?.addEventListener('submit', function(event) {
    event.preventDefault();

    const username = document.getElementById('reg-username').value;
    const password = document.getElementById('reg-password').value;

    fetch('/api/auth/register', {
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
            alert('Реєстрація успішна!');
            window.location.href = '/profile.html'; // Перенаправляем на профиль
        } else {
            alert('Помилка реєстрації: ' + data.message);
        }
    })
    .catch(error => {
        console.error('Помилка:', error);
    });
});