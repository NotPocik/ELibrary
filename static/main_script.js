const API_URL = 'http://localhost:8000';

document.addEventListener("DOMContentLoaded", function() {
    const isAuthorized = !!localStorage.getItem("access_token");
    document.getElementById("profile-link").classList.toggle("hidden", !isAuthorized);
    document.getElementById("logout-link").classList.toggle("hidden", !isAuthorized);
    document.getElementById("login-link").classList.toggle("hidden", isAuthorized);
});

document.addEventListener("DOMContentLoaded", async function () {
    const booksContainer = document.querySelector("#books-container");

    try {
        // Запрос к API для получения списка книг
        const response = await fetch("http://localhost:8000/popularbooks");
        if (!response.ok) {
            throw new Error("Ошибка при загрузке данных о книгах");
        }

        const books = await response.json();

        // Отображение книг на странице
        books.forEach((book) => {
            const bookElement = document.createElement("div");
            bookElement.classList.add("book");

            bookElement.innerHTML = `
                <a href="/book/${book.bookid}" class="book-link">
                    <h3>${book.name}</h3>
                    <p>${book.description || ""}</p>
                    <p class="rating">Рейтинг: ${book.rating.toFixed(2)} ★</p>
                    <p>Скачивания: ${book.downloadcount}</p>
                </a>
            `;

            booksContainer.appendChild(bookElement);
        });
    } catch (error) {
        console.error(error);
        booksContainer.innerHTML = "<p>Не удалось загрузить книги.</p>";
    }
});




async function logout() {
    localStorage.removeItem("access_token");
    localStorage.removeItem("role");
    window.location.href = "/";
}

function login() {
    window.location.href = "/auth";
}

async function profile(){
  /*access_token =  localStorage.getItem("access_token");
  const user =  await fetch('/users/me', {
  method: 'GET',
  headers: {
    'Accept': 'application/json',
    'Authorization': `Bearer ${access_token}`
  }
})
  .then(response => response.json())
  .then(data => {
    console.log(data);
  })
  .catch(error => {
    console.error('Error:', error);
  });*/

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