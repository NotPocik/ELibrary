const API_URL = 'http://localhost:8000';

document.addEventListener("DOMContentLoaded", function() {
    const isAuthorized = !!localStorage.getItem("access_token");
    document.getElementById("profile-link").classList.toggle("hidden", !isAuthorized);
    document.getElementById("logout-link").classList.toggle("hidden", !isAuthorized);
    document.getElementById("login-link").classList.toggle("hidden", isAuthorized);
});


document.addEventListener("DOMContentLoaded", async function () {
    const bookid = document.querySelector(".book-details").dataset.bookId;
    const bookContainer = document.querySelector(".book-details");

    try {
        const response = await fetch(`/bookDetails?book_id=${bookid}`);
        if (!response.ok) {
            throw new Error("Ошибка загрузки данных о книге");
        }

        const book = await response.json();

        // Преобразуем массив авторов в строку
        const authors = book.authors
            .map(author => `${author.firstname} ${author.lastname}`)
            .join(", ");

        // Заполнение данных о книге
        document.querySelector(".book-title").textContent = book.name;
        document.getElementById("isbn").textContent = book.isbn || "-";
        document.getElementById("authors").textContent = authors || "-";
        document.getElementById("genres").textContent = book.genres && book.genres.length > 0 ? book.genres.join(", ") : "-";
        document.getElementById("series").textContent = book.series || "-";
        document.getElementById("language").textContent = book.language || "-";
        document.getElementById("publisher").textContent = book.publisher || "-";
        document.getElementById("year").textContent = book.publicationyear || "-";
        document.getElementById("rating").textContent = `${book.rating.toFixed(2)} ★`;
        document.getElementById("downloads").textContent = book.downloadcount;
        document.getElementById("description").textContent = book.description || "-";

        // Создание кнопок для каждого доступного формата
        const formatsContainer = document.querySelector(".download-formats");
        book.formats.forEach(format => {
            const button = document.createElement("button");
            button.className = "download-btn";
            button.textContent = `${format}`;
            button.onclick = () => downloadBook(bookid, format);
            formatsContainer.appendChild(button);
        });
    } catch (error) {
        console.error(error);
        bookContainer.innerHTML = `<p>Не удалось загрузить данные о книге.</p>`;
    }
    loadReviews();
    loadUserScore();
});


async function downloadBook(bookid, format){
    try {
        window.location.href = `/bookDownload?book_id=${bookid}&format=${format}`;
        if (localStorage.getItem("access_token")){
            const response = await fetch(`${API_URL}/add_book_download?book_id=${bookid}`, {
                method: "POST",
                headers: {
                    "Authorization": `Bearer ${localStorage.getItem("access_token")}`
                },
            });
            
            if (!response.ok) {
                error = await response.json()
                throw error.detail;
            }
        }
    } catch (error) {
        console.error(error);
        //showErrorNotification(error);
    }
}


function logout() {
    localStorage.removeItem("access_token");
    localStorage.removeItem("role");
    const bookid = document.querySelector(".book-details").dataset.bookId;
    window.location.href = `/book/${bookid}`;
}

function login() {
    window.location.href = "/auth";
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


async function loadUserScore(){
    try {
        const bookid = document.querySelector(".book-details").dataset.bookId;
        const response = await fetch(`${API_URL}/get_user_score?book_id=${bookid}`, {
            method: "GET",
            headers: {
                "Content-Type": "application/json",
                "Authorization": `Bearer ${localStorage.getItem("access_token")}`
            },
        });
        
        if (!response.ok) throw new Error("Ошибка загрузки оценки");

        const score = await response.json();
        document.getElementById("current-rating").textContent = `Ваша оценка: ${score.score}`;
       
    } catch (error) {
    }
}

// Загрузка отзывов
async function loadReviews() {
    try {
        const bookid = document.querySelector(".book-details").dataset.bookId;
        const response = await fetch(`${API_URL}/get_book_reviews?book_id=${bookid}`);
        if (!response.ok) throw new Error("Ошибка загрузки отзывов");

        const reviews = await response.json();
        const reviewsContainer = document.getElementById("reviews-container");
        reviewsContainer.innerHTML = "";

        reviews.forEach(review => {
            const listItem = document.createElement("li");
            listItem.innerHTML = `
                <strong>${review.username}</strong> (${new Date(review.reviewdatetime).toLocaleString()}):
                <p>${review.comment}</p>
            `;
            reviewsContainer.appendChild(listItem);
        });
    } catch (error) {
        console.error(error);
        showNotification("Не удалось загрузить отзывы.");
    }
}

// Сохранение оценки
document.getElementById("submit-rating-btn").addEventListener("click", async () => {
    const bookid = document.querySelector(".book-details").dataset.bookId;
    const rating = document.getElementById("rating-select").value;

    if (!rating) {
        showErrorNotification("Пожалуйста, выберите оценку");
        return;
    }

    try {
        const response = await fetch(`${API_URL}/add_rating`, {
            method: "POST",
            headers: {
                "Content-Type": "application/json",
                "Authorization": `Bearer ${localStorage.getItem("access_token")}`
            },
            body: JSON.stringify({ book_id: bookid, score: parseInt(rating) })
        });
        
        if (!response.ok) {
            error = await response.json()
            throw error.detail;
        }
        document.getElementById("current-rating").textContent = `Ваша оценка: ${rating}`;
        showNotification("Оценка успешно сохранена.");
    } catch (error) {
        console.error(error);
        showErrorNotification(error);
    }
});


async function add_review(){
    const bookid = document.querySelector(".book-details").dataset.bookId;
    const reviewText = document.getElementById("review-text").value.trim();

        if (!reviewText) {
            showErrorNotification("Пожалуйста, введите текст отзыва");
            return;
        }

        try {
            const response = await fetch(`${API_URL}/add_review`, {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                    "Authorization": `Bearer ${localStorage.getItem("access_token")}`
                },
                body: JSON.stringify({ book_id: bookid, comment: reviewText })
            });

            if (!response.ok) {
                error = await response.json()
                throw error.detail;
            }
            document.getElementById("review-text").value = "";
            showNotification("Отзыв успешно добавлен");
            loadReviews();
        } catch (error) {
            console.error(error);
            showErrorNotification(error);
        }
}