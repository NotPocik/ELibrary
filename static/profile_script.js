document.addEventListener("DOMContentLoaded", async () => {
    const token = localStorage.getItem("access_token");
    if (!token) {
        showErrorNotification("Вы не авторизованы");
        window.location.href = "/auth";
        return;
    }

    try {
        const response = await fetch("http://localhost:8000/users/me", {
            method: "GET",
            headers: {
                "Authorization": `Bearer ${token}`,
            },
        });

        if (!response.ok) {
            throw new Error("Ошибка получения данных профиля");
        }

        const data = await response.json();
        document.getElementById("username").textContent = data.username;
        document.getElementById("email").textContent = data.email;
    } catch (error) {
        console.error(error);
        showErrorNotification("Не удалось загрузить данные профиля");
    }
});

document.getElementById("change-password-btn").addEventListener("click", () => {
    document.getElementById("password-modal").classList.remove("hidden");
});

document.getElementById("cancel-btn").addEventListener("click", () => {
    document.getElementById("password-modal").classList.add("hidden");
});

document.getElementById("password-form").addEventListener("submit", async (event) => {
    event.preventDefault();
    const currentPassword = document.getElementById("current-password").value;
    const newPassword = document.getElementById("new-password").value;
    const confirmPassword = document.getElementById("confirm-password").value;

    if (newPassword !== confirmPassword) {
        showErrorNotification("Пароли не совпадают");
        return;
    }

    const formData = new FormData();
    formData.append("old_password", currentPassword);
    formData.append("new_password", newPassword);

    try {
        const token = localStorage.getItem("access_token");
        const response = await fetch("http://localhost:8000/change_password", {
            method: "POST",
            headers: {
                "Authorization": `Bearer ${token}`,
            },
            body: formData,
        });

        if (!response.ok) {
            throw new Error("Ошибка изменения пароля");
        }

        showNotification("Пароль успешно изменен");
        document.getElementById("password-modal").classList.add("hidden");
    } catch (error) {
        console.error(error);
        showErrorNotification("Не удалось изменить пароль");
    }
});


async function logout() {
    localStorage.removeItem("access_token");
    localStorage.removeItem("role");
    window.location.href = "/";
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
