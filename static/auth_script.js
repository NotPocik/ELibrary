const API_URL = 'http://127.0.0.1:8000';

// Переключение между формами логина и регистрации
function toggleForms() {
    const loginForm = document.getElementById("login-form");
    const registerForm = document.getElementById("register-form");
    const formTitle = document.getElementById("form-title");

    if (loginForm.classList.contains("hidden")) {
        loginForm.classList.remove("hidden");
        registerForm.classList.add("hidden");
        formTitle.textContent = "Вход";
    } else {
        loginForm.classList.add("hidden");
        registerForm.classList.remove("hidden");
        formTitle.textContent = "Регистрация";
    }
}

// Отображение сообщений
function displayMessage(message) {
    let messageElement = document.getElementById("message");
    if (!messageElement) {
        messageElement = document.createElement("p");
        messageElement.id = "message";
        document.querySelector(".container").appendChild(messageElement);
    }
    messageElement.textContent = message;
}

// Обработка формы регистрации
document.getElementById("register-form").addEventListener("submit", async (event) => {
    event.preventDefault();

    const username = event.target.username.value;
    const email = event.target.email.value;
    const password = event.target.password.value;

    if (password.length < 8){
        displayMessage("Пароль должен содержать не менее 8 символов");
        return;
    }
    
    try {
        const response = await fetch(`${API_URL}/register`, {
            method: "POST",
            headers: {
                "Content-Type": "application/json",
            },
            body: JSON.stringify({ username, email, password }),
        });

        const data = await response.json();
        if (response.ok) {
            displayMessage("Регистрация прошла успешно!");
            toggleForms();  // Переключаем на форму входа
        } else {
            displayMessage(`Ошибка регистрации: ${data.detail}`);
        }
    } catch (error) {
        displayMessage("Ошибка сети: " + error.message);
    }
});



document.getElementById("login-form").addEventListener("submit", async (event) => {
    event.preventDefault();

    const username = event.target.username.value;
    const password = event.target.password.value;

    try {
        console.log("Отправка запроса на сервер...");
        const response = await fetch(`${API_URL}/login`, {
            method: "POST",
            headers: {
                "Content-Type": "application/x-www-form-urlencoded",
            },
            body: new URLSearchParams({ username, password }),
        });

        const data = await response.json();

        if (response.ok) {
            localStorage.setItem("access_token", data.access_token);
            localStorage.setItem("role", data.usertype);
            displayMessage("Вы успешно вошли в систему!");

            if (data.usertype === "Admin") {
                window.location.href = "/admin/";
            } else {
                window.location.href = "/";
            }
        } else {
            displayMessage(`Ошибка авторизации: ${data.detail}`);
        }
    } catch (error) {
        console.error("Ошибка сети:", error);
        displayMessage("Ошибка сети: " + error.message);
    }
});



// Обработка формы логина
/*document.getElementById("login-form").addEventListener("submit", async (event) => {
    event.preventDefault();

    const username = event.target.username.value;
    const password = event.target.password.value;

    try {
        const response = await fetch(`${API_URL}/login`, {
            method: "POST",
            headers: {
                "Content-Type": "application/x-www-form-urlencoded",
            },
            body: new URLSearchParams({ username, password }),
            credentials: "include", // Разрешает отправку и получение cookies
        });

        const data = await response.json();
        if (response.ok) {
            localStorage.setItem("access_token", data.access_token);  // Сохраняем токен в localStorage
            localStorage.setItem("role", data.usertype);
            //document.cookie = `access_token=${data.access_token}; path=/; HttpOnly=false; SameSite=Strict`;
            //document.cookie = `role=${data.usertype}; path=/; HttpOnly=false; SameSite=Strict`;
            displayMessage("Вы успешно вошли в систему!");

            if (data.usertype === "Admin") {
                window.location.href = "/admin/";
            } else {
                window.location.href = "/";
            }

        } else {
            displayMessage(`Ошибка авторизации: ${data.detail}`);
        }
    } catch (error) {
        displayMessage("Ошибка сети: " + error.message);
    }
});*/