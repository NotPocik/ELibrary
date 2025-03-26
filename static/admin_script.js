const API_URL = 'http://localhost:8000';

let genresList = []; // Здесь будет список жанров с сервера

document.addEventListener("DOMContentLoaded", async function () {
// Проверяем наличие токена в localStorage
const token = localStorage.getItem("access_token");

if (!token) {
    window.location.href = "/";
    return;
}

try {
    // Проверяем токен на сервере
    const response = await fetch(`${API_URL}/users/me`, {
        method: "GET",
        headers: {
            "Authorization": `Bearer ${token}`,
        },
    });

    if (!response.ok) {
        window.location.href = "/";
        return;
    }

    const data = await response.json();
    if (data.usertype !== "Admin") {
        window.location.href = "/";
        return;
    }

    // Загружаем данные для админской панели
    loadAdminData();
} catch (error) {
    console.error("Ошибка при проверке токена:", error);
    window.location.href = "/";
}


    const genresContainer = document.getElementById('book-genres-container');
    const genreInput = document.getElementById('book-genre-input');
    const addGenreButton = document.getElementById('add-book-genre-button');
    const suggestions = document.getElementById('book-genre-suggestions');

    const editGenresContainer = document.getElementById('edit-book-genres-container');
    const editGenreInput = document.getElementById('edit-book-genre-input');
    const editAddGenreButton = document.getElementById('edit-add-book-genre-button');
    const editSuggestions = document.getElementById('edit-book-genre-suggestions');
    

    // Загрузка жанров с сервера
    async function fetchGenres() {
        try {
            const response = await fetch(`${API_URL}/genres`);
            if (!response.ok) throw new Error('Ошибка загрузки жанров');
            const genres = await response.json();
            genresList = genres.map(genre => genre.name);
        } catch (error) {
            console.error('Ошибка загрузки жанров:', error);
        }
    }

    // Фильтрация подсказок
    function updateSuggestions(input) {
        suggestions.innerHTML = '';
        if (!input) {
            suggestions.style.display = 'none';
            return;
        }

        const filteredGenres = genresList.filter((genre) =>
            genre.toLowerCase().includes(input.toLowerCase())
        );

        if (filteredGenres.length === 0) {
            suggestions.style.display = 'none';
            return;
        }

        filteredGenres.forEach((genre) => {
            const suggestion = document.createElement('div');
            suggestion.textContent = genre;
            suggestion.addEventListener('click', () => {
                addGenre(genre);
                genreInput.value = '';
                suggestions.style.display = 'none';
            });
            suggestions.appendChild(suggestion);
        });

        suggestions.style.display = 'block';
    }

    // Добавление жанра
    function addGenre(genre) {
        const genreTag = document.createElement('div');
        genreTag.classList.add('genre-tag');
        genreTag.textContent = genre;

        const removeButton = document.createElement('button');
        removeButton.classList.add('remove-genre');
        removeButton.textContent = '×';
        removeButton.addEventListener('click', () =>
            genresContainer.removeChild(genreTag)
        );

        genreTag.appendChild(removeButton);
        genresContainer.appendChild(genreTag);
    }

    // Обработка ввода
    genreInput.addEventListener('input', () => {
        updateSuggestions(genreInput.value.trim());
    });

    // Добавление жанра по кнопке
    addGenreButton.addEventListener('click', () => {
        const genre = genreInput.value.trim();
        if (genre) {
            addGenre(genre);
            genreInput.value = '';
        }
    });



    // Обновление подсказок для окна изменения книги
    function updateEditSuggestions(input) {
        editSuggestions.innerHTML = '';
        if (!input) {
            editSuggestions.style.display = 'none';
            return;
        }

        const filteredGenres = genresList.filter((genre) =>
            genre.toLowerCase().includes(input.toLowerCase())
        );

        if (filteredGenres.length === 0) {
            editSuggestions.style.display = 'none';
            return;
        }

        filteredGenres.forEach((genre) => {
            const suggestion = document.createElement('div');
            suggestion.classList.add('suggestion-item');
            suggestion.textContent = genre;
            suggestion.addEventListener('click', () => {
                addGenreToEditContainer(genre);
                editGenreInput.value = '';
                editSuggestions.style.display = 'none';
            });
            editSuggestions.appendChild(suggestion);
        });

        editSuggestions.style.display = 'block';
    }

    // Добавление жанра в контейнер в окне изменения книги
    /*function addGenreToEditContainer(genre) {
        // Проверяем, чтобы жанр не был добавлен дважды
        const existingTags = Array.from(editGenresContainer.querySelectorAll('.genre-tag'))
            .map(tag => tag.textContent.replace('×', '').trim());
        if (existingTags.includes(genre)) {
            alert('Этот жанр уже добавлен.');
            return;
        }

        const genreTag = document.createElement('div');
        genreTag.classList.add('genre-tag');
        genreTag.textContent = genre;

        const removeButton = document.createElement('button');
        removeButton.classList.add('remove-genre');
        removeButton.textContent = '×';
        removeButton.addEventListener('click', () =>
            editGenresContainer.removeChild(genreTag)
        );

        genreTag.appendChild(removeButton);
        editGenresContainer.appendChild(genreTag);
    }*/

    // Обработка ввода в поле жанров для окна изменения книги
    editGenreInput.addEventListener('input', () => {
        updateEditSuggestions(editGenreInput.value.trim());
    });

    // Добавление жанра по кнопке в окне изменения книги
    editAddGenreButton.addEventListener('click', () => {
        const genre = editGenreInput.value.trim();
        if (genre) {
            addGenreToEditContainer(genre);
            editGenreInput.value = '';
        }
    });


    // Инициализация
    fetchGenres();

});


async function loadAdminData()
{
    loadBooks();
    loadAuthors();
    loadGenres();
    loadPublishers();
    loadSeries();
}


// Добавление жанра в контейнер в окне изменения книги
function addGenreToEditContainer(genre) {

    const editGenresContainer = document.getElementById("edit-book-genres-container");
    // Проверяем, чтобы жанр не был добавлен дважды
    const existingTags = Array.from(editGenresContainer.querySelectorAll('.genre-tag'))
        .map(tag => tag.textContent.replace('×', '').trim());
    if (existingTags.includes(genre)) {
        alert('Этот жанр уже добавлен.');
        return;
    }

    const genreTag = document.createElement('div');
    genreTag.classList.add('genre-tag');
    genreTag.textContent = genre;

    const removeButton = document.createElement('button');
    removeButton.classList.add('remove-genre');
    removeButton.textContent = '×';
    removeButton.addEventListener('click', () =>
        editGenresContainer.removeChild(genreTag)
    );

    genreTag.appendChild(removeButton);
    editGenresContainer.appendChild(genreTag);
}


async function loadBooks(query = "") {
    const container = document.getElementById("books-container");
    try {
        let url = `${API_URL}/books/search`;
        if (query) {
            url += `?name=${encodeURIComponent(query)}`;
        }
        const response = await fetch(url);
        const books = await response.json();

        if (books.length == undefined)
        {
            container.innerHTML = '';
            return;
        } 

        container.innerHTML = books.map(book => `
            <div class="admin-book">
                <h3 class="book-name">${book.name}</h3>
                <p>${book.description || ""}</p>
                <p class="book-rating">Рейтинг: ${book.rating.toFixed(2)} ★</p>
                <p>Скачивания: ${book.downloadcount}</p>
                <div class="book-actions">
                    <button class="edit-btn" onclick="editBook(${book.bookid})">Редактировать</button>
                    <button class="delete-btn" onclick="deleteBook(${book.bookid})">Удалить</button>
                </div>
            </div>
        `).join("");
    } catch (error) {
        console.error("Ошибка при загрузке книг", error);
    }
}

function searchBooks() {
    const query = document.getElementById("book-search").value;
    loadBooks(query);
}

async function deleteBook(bookid) {
    // Создаем элемент для подтверждения
    const confirmationDialog = document.createElement("div");
    confirmationDialog.className = "confirmation-dialog";
    confirmationDialog.innerHTML = `
        <div class="dialog-content">
            <p>Вы уверены, что хотите удалить эту книгу?</p>
            <div class="dialog-actions">
                <button class="confirm-btn" onclick="confirmDeleteBook(${bookid})">Удалить</button>
                <button class="cancel-btn" onclick="closeDialog()">Отмена</button>
            </div>
        </div>
    `;

    // Добавляем диалог на страницу
    document.body.appendChild(confirmationDialog);

    // Блокируем скроллинг
    document.body.style.overflow = "hidden";
}


function closeDialog() {
    // Удаляем диалог
    const dialog = document.querySelector(".confirmation-dialog");
    if (dialog) {
        dialog.remove();
    }

    // Восстанавливаем скроллинг
    document.body.style.overflow = "";
}

async function confirmDeleteBook(bookid) {
    try {
        const response = await fetch(`${API_URL}/admin/delete_book/${bookid}`, {
            method: "DELETE",
            headers: {
                "Authorization": `Bearer ${localStorage.getItem("access_token")}`,
            },
        });
        if (response.ok) {
            showNotification("Книга успешно удалена");
            loadBooks(); // Обновляем список книг
        } else {
            const error = await response.json();
            alert(`Ошибка: ${error.detail}`);
        }
    } catch (err) {
        console.error("Ошибка при удалении книги:", err);
        alert("Произошла ошибка. Попробуйте снова.");
    } finally {
        closeDialog();
    }
}




async function loadAuthors(query = "") {
    const container = document.getElementById("authors-container");
    try {
        let url = `${API_URL}/get_last_authors`;
        if (query) {
            url += `?name=${encodeURIComponent(query)}`;
        }
        const response = await fetch(url);
        const authors = await response.json();

        container.innerHTML = authors.map(author => `
            <div class="admin-author">
                <h3 class="author-name">${author.firstname} ${author.lastname}</h3>
                <p>Дата рождения: ${author.birthdate ? formatDate(author.birthdate) : "—"}</p>
                <div class="author-actions">
                    <button class="edit-btn" onclick="editAuthor(${author.authorid})">Редактировать</button>
                    <button class="delete-btn" onclick="deleteAuthor(${author.authorid})">Удалить</button>
                </div>
            </div>
        `).join("");
    } catch (error) {
        console.error("Ошибка при загрузке авторов", error);
    }
}

function searchAuthors() {
    const query = document.getElementById("author-search").value;
    loadAuthors(query);
}


function formatDate(dateString) {
    const date = new Date(dateString);
    return date.toLocaleDateString("ru-RU", { day: '2-digit', month: '2-digit', year: 'numeric' });
}

function editAuthor(authorId) {
    // Логика редактирования автора
}

async function deleteAuthor(authorid) {
    // Создаем элемент для подтверждения
    const confirmationDialog = document.createElement("div");
    confirmationDialog.className = "confirmation-dialog";
    confirmationDialog.innerHTML = `
        <div class="dialog-content">
            <p>Вы уверены, что хотите удалить этого автора</p>
            <div class="dialog-actions">
                <button class="confirm-btn" onclick="confirmDeleteAuthor(${authorid})">Удалить</button>
                <button class="cancel-btn" onclick="closeDialog()">Отмена</button>
            </div>
        </div>
    `;

    // Добавляем диалог на страницу
    document.body.appendChild(confirmationDialog);

    // Блокируем скроллинг
    document.body.style.overflow = "hidden";
}

async function confirmDeleteAuthor(authorid) {
    try {
        const response = await fetch(`${API_URL}/admin/delete_author/${authorid}`, {
            method: "DELETE",
            headers: {
                "Authorization": `Bearer ${localStorage.getItem("access_token")}`,
            },
        });
        if (response.ok) {
            showNotification("Автор успешно удален");
            loadAuthors();
        } else {
            const error = await response.json();
            showErrorNotification(`Ошибка: ${error.detail}`);
        }
    } catch (err) {
        console.error("Ошибка при удалении книги:", err);
        showErrorNotification("Произошла ошибка. Попробуйте снова");
    } finally {
        closeDialog();
    }
}


async function loadGenres(query = "") {
    const container = document.getElementById("genres-container");
    try {
        let url = `${API_URL}/genres`;
        if (query) {
            url += `?name=${encodeURIComponent(query)}`;
        }
        const response = await fetch(url);
        const genres = await response.json();

        container.innerHTML = genres.map(genre => `
            <div class="admin-author">
                <h3 class="author-name">${genre.name}</h3>
                <div class="author-actions">
                    <button class="edit-btn" onclick="editGenre(${genre.genreid})">Редактировать</button>
                    <button class="delete-btn" onclick="deleteGenre(${genre.genreid}, '${genre.name}')">Удалить</button>
                </div>
            </div>
        `).join("");
    } catch (error) {
        console.error("Ошибка при загрузке жанров", error);
    }
}

function searchGenres() {
    const query = document.getElementById("genre-search").value;
    loadGenres(query);
}


async function loadPublishers(query = "") {
    const container = document.getElementById("publishers-container");
    try {
        let url = `${API_URL}/publishers`;
        if (query) {
            url += `?name=${encodeURIComponent(query)}`;
        }
        const response = await fetch(url);
        const publishers = await response.json();

        container.innerHTML = publishers.map(publisher => `
            <div class="admin-author">
                <h3 class="author-name">${publisher.name}</h3>
                <p>Год основания: ${publisher.foundationyear ? publisher.foundationyear : "—"}</p>
                <p>Страна: ${publisher.country ? publisher.country : "—"}</p>
                <div class="author-actions">
                    <button class="edit-btn" onclick="editPublisher(${publisher.publisherid})">Редактировать</button>
                    <button class="delete-btn" onclick="deletePublisher(${publisher.publisherid}, '${publisher.name}')">Удалить</button>
                </div>
            </div>
        `).join("");
    } catch (error) {
        console.error("Ошибка при загрузке издательств", error);
    }
}

function searchPublishers() {
    const query = document.getElementById("publisher-search").value;
    loadPublishers(query);
}


async function loadSeries(query = "") {
    const container = document.getElementById("series-container");
    try {
        let url = `${API_URL}/bookseries`;
        if (query) {
            url += `?name=${encodeURIComponent(query)}`;
        }
        const response = await fetch(url);
        const series = await response.json();

        container.innerHTML = series.map(serie => `
            <div class="admin-author">
                <h3 class="author-name">${serie.name}</h3>
                <div class="author-actions">
                    <button class="edit-btn" onclick="editSeries(${serie.seriesid})">Редактировать</button>
                    <button class="delete-btn" onclick="deleteSeries(${serie.seriesid}, '${serie.name}')">Удалить</button>
                </div>
            </div>
        `).join("");
    } catch (error) {
        console.error("Ошибка при загрузке серий книг", error);
    }
}

function searchSeries() {
    const query = document.getElementById("series-search").value;
    loadSeries(query);
}


// Добавление нового автора
function addAuthor(className = '') {

    const container = document.getElementById(`${className}modal-authors-container`);

    const newAuthor = document.createElement('div');
    newAuthor.className = 'author-fields';
    newAuthor.innerHTML = `
        <input type="text" class="author-first-name" placeholder="Имя">
        <input type="text" class="author-last-name" placeholder="Фамилия">
        <button type="button" class="remove-author" onclick="removeAuthor(this)">Удалить</button>
    `;
    container.appendChild(newAuthor);
}

function removeAuthor(button) {
    button.parentElement.remove();
}

// Обработка загрузки файлов
const filesList = []; // Хранит выбранные файлы

document.getElementById("book-files").addEventListener("change", function (event) {
    const fileInput = event.target;
    const newFiles = Array.from(fileInput.files);

    // Добавляем новые файлы в массив
    newFiles.forEach(file => {
        filesList.push(file);
        addFileToList(file);
    });

    // Очищаем input для возможности загрузить тот же файл заново
    fileInput.value = "";
});

function addFileToList(file) {
    const listItem = document.createElement("li");
    listItem.textContent = file.name;

    // Кнопка удаления файла
    const removeButton = document.createElement("button");
    removeButton.textContent = "Удалить";
    removeButton.classList.add("remove-file");
    removeButton.addEventListener("click", function () {
        // Удаляем файл из списка
        const index = filesList.indexOf(file);
        if (index > -1) {
            filesList.splice(index, 1);
        }
        listItem.remove();
    });

    listItem.appendChild(removeButton);
    document.getElementById("files-list").appendChild(listItem);
}


// Открыть модальное окно
function showAddBookForm() {
    const modal = document.getElementById("add-book-modal");
    modal.style.display = "flex";
    document.body.classList.add("modal-open"); // Отключаем прокрутку основной страницы
}

function closeAddBookForm() {
    const modal = document.getElementById("add-book-modal");
    modal.style.display = "none";
    document.body.classList.remove("modal-open"); // Возвращаем прокрутку основной страницы
}

// Отправка формы
async function submitBook() {
    const title = document.getElementById("book-title").value;
    if (!title) {
        showErrorModal('Поле "Название" обязательно для заполнения', 'add-book-btn');
        return;
    }
    const description = document.getElementById("book-description").value;
    const isbn = document.getElementById("book-isbn").value;

    // Собираем авторов
    const authors = Array.from(document.querySelectorAll("#modal-authors-container .author-fields")).map((field) => {
        const firstName = field.querySelector(".author-first-name").value.trim();
        const lastName = field.querySelector(".author-last-name").value.trim();
        if (!firstName && !lastName) return null; // Пропускаем пустые авторы
        
        return {
            first_name: firstName,
            last_name: lastName
        };
    }).filter(author => author !== null); // Убираем null из массива

    const genres = Array.from(document.querySelectorAll('#book-genres-container .genre-tag'))
    .map((genreTag) => {
        return { name: genreTag.textContent.replace('×', '').trim() };  // Формируем объект { name: "жанр" }
    });



    const series = document.getElementById("book-series").value;
    const language = document.getElementById("book-language").value;
    const publisher = document.getElementById("book-publisher").value;
    const year = document.getElementById("book-year").value;

    const formData = new FormData();

    // Используем массив filesList для добавления файлов
    filesList.forEach((file) => formData.append("files", file));
    formData.append("genres", JSON.stringify(genres));

    formData.append("name", title);
    formData.append("description", description);
    formData.append("isbn", isbn);
    formData.append("authors", JSON.stringify(authors));
    formData.append("genres", JSON.stringify(genres));
    formData.append("series_name", series);
    formData.append("language", language);
    formData.append("publisher_name", publisher);
    if (year) formData.append("publication_year", year);

    try {
        const token = localStorage.getItem("access_token");
        const response = await fetch("http://localhost:8000/admin/add_book", {
            method: "POST",
            headers: {
                "Authorization": `Bearer ${token}`,
            },
            body: formData,
        });

        if (response.ok) {
            showNotification('Книга успешно добавлена');
            clearModalAddBook();
            closeAddBookForm();
            loadBooks();
        } else {
            const errorData = await response.json();
            showErrorModal(errorData.message || 'Ошибка при добавлении книги', 'add-book-btn');
        }
    } catch (error) {
        console.error("Ошибка при добавлении книги:", error);
        showErrorModal("Ошибка при добавлении книги", 'add-book-btn');
    }
}


// Очистка модального окна
function clearModalAddBook() {
    document.getElementById('book-title').value = '';
    document.getElementById('book-isbn').value = '';
    const container = document.getElementById('modal-authors-container');
    while (container.firstChild) {
        container.removeChild(container.firstChild);
    }
    document.getElementById('book-genre-input').value = '';
    // Очистка жанров
    const genresContainer = document.getElementById('book-genres-container');
    while (genresContainer.firstChild) {
        genresContainer.removeChild(genresContainer.firstChild);  // Удаляем все добавленные жанры
    }

    document.getElementById('book-series').value = '';
    document.getElementById('book-language').value = '';
    document.getElementById('book-publisher').value = '';
    document.getElementById('book-year').value = '';
    document.getElementById('book-description').value = '';
    // Сбрасываем input file
    const fileInput = document.getElementById('book-files');
    fileInput.value = ''; // Сбрасываем выбранные файлы
    filesList.length = 0;
    // Очищаем список загруженных файлов
    const filesListHTML = document.getElementById('files-list');
    filesListHTML.innerHTML = ''; // Удаляем все элементы списка
    clearError('add-book-btn');
}


// Отображение ошибки над кнопкой
function showErrorModal(message, btnid) {
    const errorElement = document.getElementById(`error-message-${btnid}`);
    if (!errorElement) {
        const errorDiv = document.createElement('div');
        errorDiv.id = `error-message-${btnid}`;
        errorDiv.className = 'error-message';
        errorDiv.textContent = message;
        const submitButton = document.getElementById(btnid);
        submitButton.insertAdjacentElement('beforebegin', errorDiv);
    } else {
        errorElement.textContent = message;
    }
}

// Очистка ошибок
function clearError(btnid) {
    const errorElement = document.getElementById(`error-message-${btnid}`);
    if (errorElement) {
        errorElement.remove();
    }
}

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
    window.location.href = "/";
}


// Функция для открытия модального окна добавления автора
function showAddAuthorForm() {
    const modal = document.getElementById("add-author-modal");
    modal.style.display = "flex";
    document.body.classList.add("modal-open"); // Отключаем прокрутку основной страницы
}

// Функция для закрытия модального окна добавления автора
function closeAddAuthorForm() {
    const modal = document.getElementById("add-author-modal");
    modal.style.display = "none";
    document.body.classList.remove("modal-open"); // Возвращаем прокрутку основной страницы
}

// Функция для отправки данных автора на сервер
async function submitAuthor() {
    const firstName = document.getElementById("author-first-name").value.trim();
    const lastName = document.getElementById("author-last-name").value.trim();
    const birthdate = document.getElementById("author-birthdate").value;

    if (!firstName || !lastName) {
        showErrorModal("Имя и фамилия обязательны для заполнения", 'add-author-btn');
        return;
    }

    const formData = new FormData();

    formData.append("first_name", firstName);
    formData.append("last_name", lastName);
    if(birthdate) formData.append("birth_date", birthdate);

    /*const authorData = {
        first_name: firstName,
        last_name: lastName,
        birthdate: birthdate || null, // Если дата не указана, передаем null
    };*/
    try {
        const response = await fetch(`${API_URL}/admin/add_author`, {
            method: "POST",
            headers: {
                "Authorization": `Bearer ${localStorage.getItem("access_token")}`,
            },
            body: formData,
        });

        if (response.ok) {
            showNotification('Автор успешно добавлен');
            closeAddAuthorForm();
            clearModalAddAuthor();
            loadAuthors();  // Перезагружаем список авторов
        } else {
            const errorData = await response.json();
            showErrorModal(errorData.detail/* || 'Ошибка при добавлении автора'*/, 'add-author-btn');
        }
    } catch (error) {
        console.error("Ошибка при добавлении автора:", error);
        showErrorModal(`Ошибка при добавлении автора`, 'add-author-btn');
    }
}



// Очистка модального окна
function clearModalAddAuthor() {
    document.getElementById("author-first-name").value = '';
    document.getElementById("author-last-name").value = '';
    document.getElementById("author-birthdate").value = '';
    clearError('add-author-btn');
}


// Открытие модального окна редактирования автора
async function editAuthor(authorId) {
    const submitBtn = document.getElementById("edit-author-btn");
    submitBtn.onclick = () => submitEditAuthor(authorId);
    const modal = document.getElementById("edit-author-modal");
    modal.style.display = "flex";
    document.body.classList.add("modal-open"); // Отключаем прокрутку основной страницы

    try {
        const response = await fetch(`/authorDetails?author_id=${authorId}`);

        if (!response.ok) throw "Ошибка при загрузке данных книги";

        const authorData = await response.json();
        // Загружаем данные автора в форму
        loadAuthorDataIntoForm(authorData);
    } catch (error) {
        console.error(error);
    }
}

// Загрузка данных автора в форму редактирования
function loadAuthorDataIntoForm(author) {
    document.getElementById("edit-author-first-name").value = author.firstname || '';
    document.getElementById("edit-author-last-name").value = author.lastname || '';
    document.getElementById("edit-author-birthdate").value = author.birthdate || '';
}

// Функция для закрытия модального окна редактирования автора
function closeEditAuthorForm() {
    const modal = document.getElementById("edit-author-modal");
    modal.style.display = "none";
    document.body.classList.remove("modal-open"); // Возвращаем прокрутку основной страницы
    clearModalEditAuthor(); // Очищаем форму при закрытии
}

// Очистка модального окна редактирования автора
function clearModalEditAuthor() {
    document.getElementById("edit-author-first-name").value = '';
    document.getElementById("edit-author-last-name").value = '';
    document.getElementById("edit-author-birthdate").value = '';
    clearError('edit-author-btn'); // Очистка ошибок
}

// Функция для отправки данных автора на сервер (редактирование)
async function submitEditAuthor(authorId) {
    const firstName = document.getElementById("edit-author-first-name").value.trim();
    const lastName = document.getElementById("edit-author-last-name").value.trim();
    const birthdate = document.getElementById("edit-author-birthdate").value;

    if (!firstName || !lastName) {
        showErrorModal("Имя и фамилия обязательны для заполнения", 'edit-author-btn');
        return;
    }

    const formData = new FormData();
    formData.append("author_id", authorId);
    formData.append("first_name", firstName);
    formData.append("last_name", lastName);
    if (birthdate) formData.append("birth_date", birthdate);

    try {
        const response = await fetch(`${API_URL}/admin/update_author`, {
            method: "PUT",
            headers: {
                "Authorization": `Bearer ${localStorage.getItem("access_token")}`,
            },
            body: formData,
        });

        if (response.ok) {
            showNotification('Автор успешно обновлен');
            closeEditAuthorForm();
            loadAuthors(); // Перезагружаем список авторов
        } else {
            const errorData = await response.json();
            showErrorModal(errorData.detail, 'edit-author-btn');
        }
    } catch (error) {
        console.error("Ошибка при обновлении автора:", error);
        showErrorModal("Ошибка при обновлении автора", 'edit-author-btn');
    }
}




let editFilesList = []; // Список новых загруженных файлов
let currentFileFormats = []; // Список форматов уже существующих файлов
let removedFileFormats = []; // Удалённые форматы файлов


document.getElementById("edit-book-files").addEventListener("change", function (event) {
    const fileInput = event.target;
    const newFiles = Array.from(fileInput.files);

    // Добавляем новые файлы в массив
    newFiles.forEach(file => {
        editFilesList.push(file);
        addFileToEditList(file);
    });

    // Очищаем input для возможности загрузить тот же файл заново
    fileInput.value = "";
});

function addFileToEditList(file) {
    const listItem = document.createElement("li");
    listItem.textContent = file.name;

    // Кнопка удаления файла
    const removeButton = document.createElement("button");
    removeButton.textContent = "Удалить";
    removeButton.classList.add("remove-file");
    removeButton.addEventListener("click", function () {
        // Удаляем файл из списка
        const index = editFilesList.indexOf(file);
        if (index > -1) {
            editFilesList.splice(index, 1);
        }
        listItem.remove();
    });

    listItem.appendChild(removeButton);
    document.getElementById("edit-files-list").appendChild(listItem);
}

// Открытие модального окна для изменения книги
async function editBook(bookId) {
    const submitBtn = document.getElementById("edit-book-btn");
    submitBtn.onclick = () => submitEditBook(bookId);
    const modal = document.getElementById("edit-book-modal");
    modal.style.display = "flex";
    document.body.classList.add("modal-open");

    try {
        const response = await fetch(`/bookDetails?book_id=${bookId}`);

        if (!response.ok) throw new Error("Ошибка при загрузке данных книги");

        const bookData = await response.json();
        loadBookDataIntoForm(bookData);
    } catch (error) {
        console.error("Ошибка при загрузке книги:", error);
    }
}

// Загрузка данных книги в форму
function loadBookDataIntoForm(book) {
    document.getElementById("edit-book-title").value = book.name || '';
    document.getElementById("edit-book-description").value = book.description || '';
    document.getElementById("edit-book-isbn").value = book.isbn || '';
    document.getElementById("edit-book-series").value = book.series || '';
    document.getElementById("edit-book-language").value = book.language || '';
    document.getElementById("edit-book-publisher").value = book.publisher || '';
    document.getElementById("edit-book-year").value = book.publicationyear || '';

    // Загрузка авторов
    const authorsContainer = document.getElementById("edit-modal-authors-container");
    authorsContainer.innerHTML = '';
    book.authors.forEach(author => {
        const authorDiv = document.createElement("div");
        authorDiv.className = "author-fields";
        authorDiv.innerHTML = `
            <input type="text" class="author-first-name" placeholder="Имя" value="${author.firstname}">
            <input type="text" class="author-last-name" placeholder="Фамилия" value="${author.lastname}">
            <button type="button" class="remove-author" onclick="removeAuthor(this)">Удалить</button>
        `;
        authorsContainer.appendChild(authorDiv);
    });

    // Загрузка жанров в окно редактирования книги
    const genresContainer = document.getElementById("edit-book-genres-container");
    genresContainer.innerHTML = ''; 
    book.genres.forEach(genre => {
        addGenreToEditContainer(genre); 
    });

    // Загрузка файлов
    const filesListElement = document.getElementById("edit-files-list");
    filesListElement.innerHTML = '';
    currentFileFormats = book.formats || [];

    console.log(currentFileFormats)

    currentFileFormats.forEach(format => {
        const fileName = `${book.name.replace(/\s/g, '_')}_${format}.${format}`;
        const listItem = document.createElement("li");
        listItem.textContent = fileName;

        const removeButton = document.createElement("button");
        removeButton.textContent = "Удалить";
        removeButton.classList.add("remove-file");
        removeButton.addEventListener("click", function () {
            removedFileFormats.push(format);
            listItem.remove();
            console.log(removedFileFormats);
        });

        listItem.appendChild(removeButton);
        filesListElement.appendChild(listItem);
    });
}

// Закрытие модального окна
function closeEditBookForm() {
    const modal = document.getElementById("edit-book-modal");
    modal.style.display = "none";
    document.body.classList.remove("modal-open");

    clearEditBookForm();
}

// Очистка формы изменения книги
function clearEditBookForm() {
    document.getElementById("edit-book-title").value = '';
    document.getElementById("edit-book-description").value = '';
    document.getElementById("edit-book-isbn").value = '';
    document.getElementById("edit-modal-authors-container").innerHTML = '';
    document.getElementById("edit-book-genres-container").innerHTML = '';
    document.getElementById("edit-book-series").value = '';
    document.getElementById("edit-book-language").value = '';
    document.getElementById("edit-book-publisher").value = '';
    document.getElementById("edit-book-year").value = '';
    document.getElementById("edit-files-list").innerHTML = '';
    editFilesList = [];
    currentFileFormats = [];
    removedFileFormats = [];
    clearError('edit-book-btn');
}


// Сохранение изменений
async function submitEditBook(bookId) {
    const title = document.getElementById("edit-book-title").value;
    if (!title) {
        showErrorModal('Поле "Название" обязательно для заполнения', 'edit-book-btn');
        return;
    }

    const description = document.getElementById("edit-book-description").value;
    const isbn = document.getElementById("edit-book-isbn").value;

    const authors = Array.from(document.querySelectorAll("#edit-modal-authors-container .author-fields")).map(field => ({
        first_name: field.querySelector(".author-first-name").value.trim(),
        last_name: field.querySelector(".author-last-name").value.trim(),
    })).filter(author => author.first_name || author.last_name);

    const genres = Array.from(document.querySelectorAll('#edit-book-genres-container .genre-tag')).map(tag => ({
        name: tag.textContent.replace('×', '').trim()
    }));

    const series = document.getElementById("edit-book-series").value;
    const language = document.getElementById("edit-book-language").value;
    const publisher = document.getElementById("edit-book-publisher").value;
    const year = document.getElementById("edit-book-year").value;

    const formData = new FormData();


    formData.append("book_id", bookId);
    formData.append("name", title);
    formData.append("description", description);
    formData.append("isbn", isbn);
    formData.append("authors", JSON.stringify(authors));
    formData.append("genres", JSON.stringify(genres));
    formData.append("series_name", series);
    formData.append("language", language);
    formData.append("publisher_name", publisher);
    if (year) formData.append("publication_year", year);

    try {
        const token = localStorage.getItem("access_token");
        const response = await fetch(`${API_URL}/admin/update_book`, {
            method: "PUT",
            headers: {
                "Authorization": `Bearer ${token}`,
            },
            body: formData,
        });

        if (!response.ok) {
            const errorData = await response.json();
            throw errorData.message || "Ошибка при обновлении книги";
        }

        showNotification("Книга успешно обновлена");

        if (editFilesList.length > 0 || removedFileFormats.length > 0) {
            await updateBookFiles(bookId);
        }

        closeEditBookForm();
        loadBooks();
    } catch (error) {
        console.error("Ошибка при изменении книги:", error);
        showErrorModal(error.message, 'edit-book-btn');
    }
}

// Обновление файлов книги
async function updateBookFiles(bookId) {
    // Проверка на изначальные дубликаты в editFilesList
    const formatCounts = {};
    editFilesList.forEach(file => {
        const format = file.name.split('.').pop().toLowerCase(); // Извлекаем формат из имени файла
        if (!formatCounts[format]) {
            formatCounts[format] = 0;
        }
        formatCounts[format]++;
    });

    for (const [format, count] of Object.entries(formatCounts)) {
        if (count > 1) {
            showErrorNotification(`Формат '${format}' добавлен несколько раз в файлы для загрузки`);
            return; // Останавливаем выполнение функции
        }
    }

    // Проверка на дублирование форматов с существующими файлами
    const addedFormats = new Set(
        editFilesList.map(file => file.name.split('.').pop().toLowerCase())
    );

    for (const format of addedFormats) {
        if (
            currentFileFormats.includes(format) &&
            !removedFileFormats.includes(format)
        ) {
            showErrorNotification(`Формат '${format}' уже существует и не был удалён`);
            return; // Останавливаем выполнение функции
        }
    }

    // Создание данных для отправки
    const formData = new FormData();
    editFilesList.forEach(file => formData.append("files_to_add", file));
    formData.append("files_to_delete", JSON.stringify(removedFileFormats));
    console.log(JSON.stringify(removedFileFormats));

    try {
        const token = localStorage.getItem("access_token");
        const response = await fetch(`${API_URL}/admin/update_book_files?book_id=${bookId}`, {
            method: "PUT",
            headers: { "Authorization": `Bearer ${token}` },
            body: formData,
        });

        if (!response.ok) {
            const errorData = await response.json();
            throw errorData.detail || "Ошибка при обновлении файлов книги";
        }
    } catch (error) {
        showErrorNotification(error);
        console.error(error);
    }
}



// Функция для открытия модального окна добавления жанра
function showAddGenreForm() {
    const modal = document.getElementById("add-genre-modal");
    modal.style.display = "flex";
    document.body.classList.add("modal-open"); // Отключаем прокрутку основной страницы
}

// Функция для закрытия модального окна добавления жанра
function closeAddGenreForm() {
    const modal = document.getElementById("add-genre-modal");
    modal.style.display = "none";
    document.body.classList.remove("modal-open"); // Возвращаем прокрутку основной страницы
    //clearModalAddGenre(); // Очищаем форму при закрытии
}

// Очистка модального окна добавления жанра
function clearModalAddGenre() {
    document.getElementById("genre-name").value = '';
    document.getElementById("genre-description").value = '';
    clearError('add-genre-btn'); // Очистка ошибок (если реализована)
}

// Функция для отправки данных жанра на сервер
async function submitGenre() {
    const name = document.getElementById("genre-name").value.trim();
    const description = document.getElementById("genre-description").value.trim();

    if (!name) {
        showErrorModal("Название жанра обязательно для заполнения", 'add-genre-btn');
        return;
    }

    const formData = new FormData();
    formData.append("name", name);
    if (description) formData.append("description", description);

    try {
        const response = await fetch(`${API_URL}/admin/add_genre`, {
            method: "POST",
            headers: {
                "Authorization": `Bearer ${localStorage.getItem("access_token")}`,
            },
            body: formData,
        });

        if (response.ok) {
            showNotification('Жанр успешно добавлен');
            closeAddGenreForm();
            clearModalAddGenre();
            loadGenres(); // Перезагружаем список жанров
        } else {
            const errorData = await response.json();
            showErrorModal(errorData.detail, 'add-genre-btn');
        }
    } catch (error) {
        console.error("Ошибка при добавлении жанра:", error);
        showErrorModal("Ошибка при добавлении жанра", 'add-genre-btn');
    }
}


// Открытие модального окна редактирования жанра
async function editGenre(genreId) {
    const submitBtn = document.getElementById("edit-genre-btn");
    submitBtn.onclick = () => submitEditGenre(genreId);
    const modal = document.getElementById("edit-genre-modal");
    modal.style.display = "flex";
    document.body.classList.add("modal-open"); // Отключаем прокрутку основной страницы

    try {
        const response = await fetch(`/genreDetails?genre_id=${genreId}`);

        if (!response.ok) throw new Error("Ошибка при загрузке данных жанра");

        const genreData = await response.json();
        // Загружаем данные жанра в форму
        loadGenreDataIntoForm(genreData);
    } catch (error) {
        console.error(error);
        showErrorNotification("Ошибка при загрузке данных жанра");
    }
}


// Загрузка данных жанра в форму редактирования
function loadGenreDataIntoForm(genre) {
    document.getElementById("edit-genre-name").value = genre.name || '';
    document.getElementById("edit-genre-description").value = genre.description || '';
}

// Закрытие модального окна редактирования жанра
function closeEditGenreForm() {
    const modal = document.getElementById("edit-genre-modal");
    modal.style.display = "none";
    document.body.classList.remove("modal-open"); // Возвращаем прокрутку основной страницы
    clearModalEditGenre(); // Очищаем форму при закрытии
}

// Очистка модального окна редактирования жанра
function clearModalEditGenre() {
    document.getElementById("edit-genre-name").value = '';
    document.getElementById("edit-genre-description").value = '';
    clearError('edit-genre-btn'); // Очистка ошибок
}

// Функция для отправки данных жанра на сервер (редактирование)
async function submitEditGenre(genreId) {
    const name = document.getElementById("edit-genre-name").value.trim();
    const description = document.getElementById("edit-genre-description").value.trim();

    if (!name) {
        showErrorModal("Название жанра обязательно для заполнения", 'edit-genre-btn');
        return;
    }

    const formData = new FormData();
    formData.append("genre_id", genreId);
    formData.append("name", name);
    if (description) formData.append("description", description);

    try {
        const response = await fetch(`${API_URL}/admin/update_genre`, {
            method: "PUT",
            headers: {
                "Authorization": `Bearer ${localStorage.getItem("access_token")}`,
            },
            body: formData,
        });

        if (response.ok) {
            showNotification('Жанр успешно обновлен');
            closeEditGenreForm();
            loadGenres(); // Перезагружаем список жанров
        } else {
            const errorData = await response.json();
            showErrorModal(errorData.detail, 'edit-genre-btn');
        }
    } catch (error) {
        console.error("Ошибка при обновлении жанра:", error);
        showErrorModal("Ошибка при обновлении жанра", 'edit-genre-btn');
    }
}


async function deleteGenre(genreId, name) {
    // Создаем элемент для подтверждения
    const confirmationDialog = document.createElement("div");
    confirmationDialog.className = "confirmation-dialog";
    confirmationDialog.innerHTML = `
        <div class="dialog-content">
            <p>Вы уверены, что хотите удалить жанр ${name}?</p>
            <div class="dialog-actions">
                <button class="confirm-btn" onclick="confirmDeleteGenre(${genreId})">Удалить</button>
                <button class="cancel-btn" onclick="closeDialog()">Отмена</button>
            </div>
        </div>
    `;

    // Добавляем диалог на страницу
    document.body.appendChild(confirmationDialog);

    // Блокируем скроллинг
    document.body.style.overflow = "hidden";
}

async function confirmDeleteGenre(genreId) {
    try {
        const response = await fetch(`${API_URL}/admin/delete_genre/${genreId}`, {
            method: "DELETE",
            headers: {
                "Authorization": `Bearer ${localStorage.getItem("access_token")}`,
            },
        });
        if (response.ok) {
            showNotification("Жанр успешно удален");
            loadGenres(); // Обновляем список жанров
        } else {
            const error = await response.json();
            showErrorNotification(`Ошибка: ${error.detail}`);
        }
    } catch (err) {
        console.error("Ошибка при удалении жанра:", err);
        showErrorNotification("Произошла ошибка. Попробуйте снова");
    } finally {
        closeDialog();
    }
}




// Функция для открытия модального окна добавления издательства
function showAddPublisherForm() {
    const modal = document.getElementById("add-publisher-modal");
    modal.style.display = "flex";
    document.body.classList.add("modal-open"); // Отключаем прокрутку основной страницы
}

// Функция для закрытия модального окна добавления издательства
function closeAddPublisherForm() {
    const modal = document.getElementById("add-publisher-modal");
    modal.style.display = "none";
    document.body.classList.remove("modal-open"); // Возвращаем прокрутку основной страницы
    //clearModalAddPublisher(); // Очищаем форму при закрытии
}

// Очистка модального окна добавления издательства
function clearModalAddPublisher() {
    document.getElementById("publisher-name").value = '';
    document.getElementById("publisher-foundation-year").value = '';
    document.getElementById("publisher-country").value = '';
    clearError('add-publisher-btn'); // Очистка ошибок
}

// Функция для отправки данных издательства на сервер
async function submitPublisher() {
    const name = document.getElementById("publisher-name").value.trim();
    const foundationYear = document.getElementById("publisher-foundation-year").value.trim();
    const country = document.getElementById("publisher-country").value.trim();

    if (!name) {
        showErrorModal("Название издательства обязательно для заполнения", 'add-publisher-btn');
        return;
    }

    const formData = new FormData();
    formData.append("name", name);
    if (foundationYear) formData.append("foundation_year", foundationYear);
    if (country) formData.append("country", country);

    try {
        const response = await fetch(`${API_URL}/admin/add_publisher`, {
            method: "POST",
            headers: {
                "Authorization": `Bearer ${localStorage.getItem("access_token")}`,
            },
            body: formData,
        });

        if (response.ok) {
            showNotification('Издательство успешно добавлено');
            closeAddPublisherForm();
            clearModalAddPublisher(); // Очищаем форму при закрытии
            loadPublishers(); // Перезагружаем список издательств
        } else {
            const errorData = await response.json();
            showErrorModal(errorData.detail, 'add-publisher-btn');
        }
    } catch (error) {
        console.error("Ошибка при добавлении издательства:", error);
        showErrorModal("Ошибка при добавлении издательства", 'add-publisher-btn');
    }
}


// Открытие модального окна редактирования издательства
async function editPublisher(publisherId) {
    const submitBtn = document.getElementById("edit-publisher-btn");
    submitBtn.onclick = () => submitEditPublisher(publisherId);
    const modal = document.getElementById("edit-publisher-modal");
    modal.style.display = "flex";
    document.body.classList.add("modal-open"); // Отключаем прокрутку основной страницы

    try {
        const response = await fetch(`${API_URL}/publisherDetails?publisher_id=${publisherId}`);

        if (!response.ok) throw new Error("Ошибка при загрузке данных издательства");

        const publisherData = await response.json();
        // Загружаем данные издательства в форму
        loadPublisherDataIntoForm(publisherData);
    } catch (error) {
        console.error(error);
        showErrorNotification("Ошибка при загрузке данных издательства");
    }
}

// Загрузка данных издательства в форму редактирования
function loadPublisherDataIntoForm(publisher) {
    document.getElementById("edit-publisher-name").value = publisher.name || '';
    document.getElementById("edit-publisher-foundation-year").value = publisher.foundationyear || '';
    document.getElementById("edit-publisher-country").value = publisher.country || '';
}

// Закрытие модального окна редактирования издательства
function closeEditPublisherForm() {
    const modal = document.getElementById("edit-publisher-modal");
    modal.style.display = "none";
    document.body.classList.remove("modal-open"); // Возвращаем прокрутку основной страницы
    clearModalEditPublisher(); // Очищаем форму при закрытии
}

// Очистка модального окна редактирования издательства
function clearModalEditPublisher() {
    document.getElementById("edit-publisher-name").value = '';
    document.getElementById("edit-publisher-foundation-year").value = '';
    document.getElementById("edit-publisher-country").value = '';
    clearError('edit-publisher-btn'); // Очистка ошибок
}

// Функция для отправки данных издательства на сервер (редактирование)
async function submitEditPublisher(publisherId) {
    const name = document.getElementById("edit-publisher-name").value.trim();
    const foundationYear = document.getElementById("edit-publisher-foundation-year").value.trim();
    const country = document.getElementById("edit-publisher-country").value.trim();

    if (!name) {
        showErrorModal("Название издательства обязательно для заполнения", 'edit-publisher-btn');
        return;
    }

    const formData = new FormData();
    formData.append("publisher_id", publisherId);
    formData.append("name", name);
    if (foundationYear) formData.append("foundation_year", foundationYear);
    if (country) formData.append("country", country);

    try {
        const response = await fetch(`${API_URL}/admin/update_publisher`, {
            method: "PUT",
            headers: {
                "Authorization": `Bearer ${localStorage.getItem("access_token")}`,
            },
            body: formData,
        });

        if (response.ok) {
            showNotification('Издательство успешно обновлено');
            closeEditPublisherForm();
            loadPublishers(); // Перезагружаем список издательств
        } else {
            const errorData = await response.json();
            showErrorModal(errorData.detail, 'edit-publisher-btn');
        }
    } catch (error) {
        console.error("Ошибка при обновлении издательства:", error);
        showErrorModal("Ошибка при обновлении издательства", 'edit-publisher-btn');
    }
}


async function deletePublisher(publisherId, name) {
    // Создаем элемент для подтверждения
    const confirmationDialog = document.createElement("div");
    confirmationDialog.className = "confirmation-dialog";
    confirmationDialog.innerHTML = `
        <div class="dialog-content">
            <p>Вы уверены, что хотите удалить издательство ${name}?</p>
            <div class="dialog-actions">
                <button class="confirm-btn" onclick="confirmDeletePublisher(${publisherId})">Удалить</button>
                <button class="cancel-btn" onclick="closeDialog()">Отмена</button>
            </div>
        </div>
    `;

    // Добавляем диалог на страницу
    document.body.appendChild(confirmationDialog);

    // Блокируем скроллинг
    document.body.style.overflow = "hidden";
}

async function confirmDeletePublisher(publisherId) {
    try {
        const response = await fetch(`${API_URL}/admin/delete_publisher/${publisherId}`, {
            method: "DELETE",
            headers: {
                "Authorization": `Bearer ${localStorage.getItem("access_token")}`,
            },
        });
        if (response.ok) {
            showNotification("Издательство успешно удалено");
            loadPublishers(); // Обновляем список издательств
        } else {
            const error = await response.json();
            showErrorNotification(`Ошибка: ${error.detail}`);
        }
    } catch (err) {
        console.error("Ошибка при удалении издательства:", err);
        showErrorNotification("Произошла ошибка. Попробуйте снова");
    } finally {
        closeDialog();
    }
}


// Функция для открытия модального окна добавления серии
function showAddSeriesForm() {
    const modal = document.getElementById("add-series-modal");
    modal.style.display = "flex";
    document.body.classList.add("modal-open"); // Отключаем прокрутку основной страницы
}

// Функция для закрытия модального окна добавления серии
function closeAddSeriesForm() {
    const modal = document.getElementById("add-series-modal");
    modal.style.display = "none";
    document.body.classList.remove("modal-open"); // Возвращаем прокрутку основной страницы
}

// Очистка модального окна добавления серии
function clearModalAddSeries() {
    document.getElementById("series-name").value = '';
    document.getElementById("series-description").value = '';
    clearError('add-series-btn'); // Очистка ошибок
}

// Функция для отправки данных серии на сервер
async function submitSeries() {
    const name = document.getElementById("series-name").value.trim();
    const description = document.getElementById("series-description").value.trim();

    if (!name) {
        showErrorModal("Название серии обязательно для заполнения", 'add-series-btn');
        return;
    }

    const formData = new FormData();
    formData.append("name", name);
    if (description) formData.append("description", description);

    try {
        const response = await fetch(`${API_URL}/admin/add_bookseries`, {
            method: "POST",
            headers: {
                "Authorization": `Bearer ${localStorage.getItem("access_token")}`,
            },
            body: formData,
        });

        if (response.ok) {
            showNotification('Серия книг успешно добавлена');
            closeAddSeriesForm();
            clearModalAddSeries();
            loadSeries(); // Перезагружаем список серий
        } else {
            const errorData = await response.json();
            showErrorModal(errorData.detail, 'add-series-btn');
        }
    } catch (error) {
        console.error("Ошибка при добавлении серии:", error);
        showErrorModal("Ошибка при добавлении серии", 'add-series-btn');
    }
}


// Открытие модального окна редактирования серии
async function editSeries(seriesId) {
    const submitBtn = document.getElementById("edit-series-btn");
    submitBtn.onclick = () => submitEditSeries(seriesId);
    const modal = document.getElementById("edit-series-modal");
    modal.style.display = "flex";
    document.body.classList.add("modal-open"); // Отключаем прокрутку основной страницы

    try {
        const response = await fetch(`/bookseriesDetails?series_id=${seriesId}`);

        if (!response.ok) throw new Error("Ошибка при загрузке данных серии");

        const seriesData = await response.json();
        // Загружаем данные серии в форму
        loadSeriesDataIntoForm(seriesData);
    } catch (error) {
        console.error(error);
        showErrorNotification("Ошибка при загрузке данных серии");
    }
}

// Загрузка данных серии в форму редактирования
function loadSeriesDataIntoForm(series) {
    document.getElementById("edit-series-name").value = series.name || '';
    document.getElementById("edit-series-description").value = series.description || '';
}

// Закрытие модального окна редактирования серии
function closeEditSeriesForm() {
    const modal = document.getElementById("edit-series-modal");
    modal.style.display = "none";
    document.body.classList.remove("modal-open"); // Возвращаем прокрутку основной страницы
    clearModalEditSeries(); // Очищаем форму при закрытии
}

// Очистка модального окна редактирования серии
function clearModalEditSeries() {
    document.getElementById("edit-series-name").value = '';
    document.getElementById("edit-series-description").value = '';
    clearError('edit-series-btn'); // Очистка ошибок
}

// Функция для отправки данных серии на сервер (редактирование)
async function submitEditSeries(seriesId) {
    const name = document.getElementById("edit-series-name").value.trim();
    const description = document.getElementById("edit-series-description").value.trim();

    if (!name) {
        showErrorModal("Название серии обязательно для заполнения", 'edit-series-btn');
        return;
    }

    const formData = new FormData();
    formData.append("series_id", seriesId);
    formData.append("name", name);
    if (description) formData.append("description", description);

    try {
        const response = await fetch(`${API_URL}/admin/update_bookseries`, {
            method: "PUT",
            headers: {
                "Authorization": `Bearer ${localStorage.getItem("access_token")}`,
            },
            body: formData,
        });

        if (response.ok) {
            showNotification('Серия успешно обновлена');
            closeEditSeriesForm();
            loadSeries(); // Перезагружаем список серий
        } else {
            const errorData = await response.json();
            showErrorModal(errorData.detail, 'edit-series-btn');
        }
    } catch (error) {
        console.error("Ошибка при обновлении серии:", error);
        showErrorModal("Ошибка при обновлении серии", 'edit-series-btn');
    }
}


// Функция для открытия диалогового окна удаления серии
async function deleteSeries(seriesId, name) {
    // Создаем элемент для подтверждения
    const confirmationDialog = document.createElement("div");
    confirmationDialog.className = "confirmation-dialog";
    confirmationDialog.innerHTML = `
        <div class="dialog-content">
            <p>Вы уверены, что хотите удалить серию "${name}"?</p>
            <div class="dialog-actions">
                <button class="confirm-btn" onclick="confirmDeleteSeries(${seriesId})">Удалить</button>
                <button class="cancel-btn" onclick="closeDialog()">Отмена</button>
            </div>
        </div>
    `;

    // Добавляем диалог на страницу
    document.body.appendChild(confirmationDialog);

    // Блокируем скроллинг
    document.body.style.overflow = "hidden";
}

// Функция для подтверждения и отправки запроса на удаление серии
async function confirmDeleteSeries(seriesId) {
    try {
        const response = await fetch(`${API_URL}/admin/delete_bookseries/${seriesId}`, {
            method: "DELETE",
            headers: {
                "Authorization": `Bearer ${localStorage.getItem("access_token")}`,
            },
        });
        if (response.ok) {
            showNotification("Серия успешно удалена");
            loadSeries(); // Обновляем список серий
        } else {
            const error = await response.json();
            showErrorNotification(`Ошибка: ${error.detail}`);
        }
    } catch (err) {
        console.error("Ошибка при удалении серии:", err);
        showErrorNotification("Произошла ошибка. Попробуйте снова");
    } finally {
        closeDialog();
    }
}

// Функция для закрытия диалогового окна
function closeDialog() {
    const dialog = document.querySelector(".confirmation-dialog");
    if (dialog) {
        dialog.remove();
    }
    // Восстанавливаем скроллинг
    document.body.style.overflow = "";
}
