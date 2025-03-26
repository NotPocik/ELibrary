const API_URL = 'http://localhost:8000';

document.addEventListener("DOMContentLoaded", function() {
    const isAuthorized = !!localStorage.getItem("access_token");
    document.getElementById("profile-link").classList.toggle("hidden", !isAuthorized);
    document.getElementById("logout-link").classList.toggle("hidden", !isAuthorized);
    document.getElementById("login-link").classList.toggle("hidden", isAuthorized);
});





document.addEventListener('DOMContentLoaded', async () => {
    const genresContainer = document.getElementById('genres-container');
    const genreInput = document.getElementById('genre-input');
    const addGenreButton = document.getElementById('add-genre-button');
    const searchForm = document.getElementById('search-form');
    const suggestions = document.getElementById('suggestions');
    const searchResults = document.getElementById('search-results');

    let genresList = [];

        // Загрузка всех жанров с сервера при загрузке страницы
    async function fetchGenres() {
        try {
            const response = await fetch(`${API_URL}/genres`);
            if (!response.ok) throw new Error('Ошибка загрузки жанров');
            const genres = await response.json();
            genresList = genres.map(genre => genre.name);
        } catch (error) {
            console.error('Не удалось загрузить жанры:', error);
        }
    }

    await fetchGenres();

    // Обновление подсказок
    function updateSuggestions(input) {
        suggestions.innerHTML = '';
        if (!input) {
            suggestions.style.display = 'none'; // Скрываем, если ввода нет
            return;
        }

        const filteredGenres = genresList.filter((genre) =>
            genre.toLowerCase().includes(input.toLowerCase())
        );

        if (filteredGenres.length === 0) {
            suggestions.style.display = 'none'; // Скрываем, если нет совпадений
            return;
        }

        filteredGenres.forEach((genre) => {
            const suggestion = document.createElement('div');
            suggestion.textContent = genre;
            suggestion.addEventListener('click', () => {
                genreInput.value = genre;
                suggestions.innerHTML = '';
                suggestions.style.display = 'none';
            });
            suggestions.appendChild(suggestion);
        });

        suggestions.style.display = 'block'; // Показываем список, если есть совпадения
    }

    // Обработка ввода жанра
    genreInput.addEventListener('input', (event) => {
        const input = event.target.value.trim();
        updateSuggestions(input);
    });


    // Добавление жанра в список
    addGenreButton.addEventListener('click', () => {
        const genre = genreInput.value.trim();
        if (genre && genresList.includes(genre)) {
            const genreTag = document.createElement('div');
            genreTag.classList.add('genre-tag');
            genreTag.textContent = genre;

            const removeButton = document.createElement('button');
            removeButton.classList.add('remove-genre');
            removeButton.textContent = '×';
            removeButton.addEventListener('click', () => genresContainer.removeChild(genreTag));

            genreTag.appendChild(removeButton);
            genresContainer.appendChild(genreTag);
            genreInput.value = '';
            suggestions.innerHTML = '';
        }
    });

    // Закрытие подсказок при клике вне контейнера
    document.addEventListener('click', (event) => {
        if (!event.target.closest('.add-genre')) {
            suggestions.innerHTML = '';
        }
    });

    // Поиск книг
    searchForm.addEventListener('submit', async (event) => {
        event.preventDefault();
        searchResults.innerHTML = '';

        const name = document.getElementById('name').value.trim();
        const author = document.getElementById('author').value.trim();
        const series = document.getElementById('series').value.trim();

        // Собираем жанры
        const genres = Array.from(genresContainer.children).map(
            (genreTag) => genreTag.textContent.replace('×', '').trim()
        );

        // Формируем параметры запроса
        const params = new URLSearchParams();
        if (name) params.append('name', name);
        if (author) params.append('author', author);
        if (series) params.append('series', series);
        genres.forEach((genre) => params.append('genres', genre));

        try {
            const response = await fetch(`${API_URL}/books/search?${params.toString()}`);
            if (!response.ok) throw new Error('Ошибка при поиске');

            const books = await response.json();

            if (books.length == undefined) {
                searchResults.innerHTML = '<p>Книг не найдено</p>';
                return;
            }

            books.forEach((book) => {
                const bookElement = document.createElement('div');
                bookElement.classList.add('book');
                bookElement.innerHTML = `
                    <a href="/book/${book.bookid}" class="book-link">
                        <h3>${book.name}</h3>
                        <p>${book.description || ''}</p>
                        <p class="rating">Рейтинг: ${book.rating?.toFixed(2)} ★</p>
                        <p>Скачивания: ${book.downloadcount || 0}</p>
                    </a>
                `;
                searchResults.appendChild(bookElement);
            });
        } catch (error) {
            console.error(error);
            searchResults.innerHTML = '<p>Произошла ошибка при поиске.</p>';
        }
    });
});




// Отображение уведомления
function showNotification(message) {
    const notificationContainer = document.getElementById('notifications-container');
    const notification = document.createElement('div');
    notification.className = 'notification';
    notification.textContent = message;

    notificationContainer.appendChild(notification);

    // Удаляем уведомление через 3 секунды
    setTimeout(() => {
        notification.remove();
    }, 3000);
}

function showErrorNotification(message) {
    const notificationContainer = document.getElementById('notifications-container');
    const notification = document.createElement('div');
    notification.className = 'error-notification';
    notification.textContent = message;

    notificationContainer.appendChild(notification);

    // Удаляем уведомление через 3 секунды
    setTimeout(() => {
        notification.remove();
    }, 3000);
}



async function logout() {
    localStorage.removeItem("access_token");
    localStorage.removeItem("role");
    window.location.href = "/search_book";
}

function login() {
    window.location.href = "/auth";
}