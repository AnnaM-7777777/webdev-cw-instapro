// Замени на свой, чтобы получить независимый от других набор данных.
// "боевая" версия инстапро лежит в ключе prod
const personalKey = "AnnaM-7777777";
const baseHost = "https://wedev-api.sky.pro";
const postsHost = `${baseHost}/api/v1/${personalKey}/instapro`;

export function getPosts({ token }) {
    const headers = {};
    if (token) {
        headers.Authorization = token;
    }

    return fetch(postsHost, {
        method: "GET",
        headers,
    })
        .then((response) => {
            if (response.status === 401) {
                throw new Error("Нет авторизации");
            }
            return response.json();
        })
        .then((data) => {
            return data.posts;
        });
}

export function registerUser({ login, password, name, imageUrl }) {
    return fetch(baseHost + "/api/user", {
        method: "POST",
        body: JSON.stringify({
            login,
            password,
            name,
            imageUrl,
        }),
    })
        .then((response) => {
            if (response.status === 400) {
                throw new Error("Такой пользователь уже существует");
            }
            return response.json();
        })
        .then((data) => {
            console.log("Данные, полученные после регистрации:", data); // <- ДО записи localStorage

            const tokenString = JSON.stringify(data);

            console.log(
                "Сохраняемая строка токена в localStorage:",
                tokenString
            );

            localStorage.setItem("token", JSON.stringify(data));

            console.log("Токен успешно сохранен в localStorage"); // <- ПОСЛЕ записи localStorage
            return data;
        });
}

export function loginUser({ login, password }) {
    return fetch(baseHost + "/api/user/login", {
        method: "POST",
        body: JSON.stringify({
            login,
            password,
        }),
    })
        .then((response) => {
            if (response.status === 400) {
                throw new Error("Неверный логин или пароль");
            }
            return response.json();
        })
        .then((data) => {
            console.log("Данные, полученные после логина:", data); // <- ДО записи localStorage

            const tokenString = JSON.stringify(data);

            console.log(
                "Сохраняемая строка токена в localStorage:",
                tokenString
            );

            localStorage.setItem("token", JSON.stringify(data));
            console.log("Токен успешно сохранен в localStorage"); // <- ПОСЛЕ записи localStorage
            return data;
        });
}

// Загружает картинку в облако, возвращает url загруженной картинки
export function uploadImage({ file }) {
    const data = new FormData();
    data.append("file", file);

    return fetch(baseHost + "/api/upload/image", {
        method: "POST",
        body: data,
    }).then((response) => {
        return response.json();
    });
}

export function addPost({ token, description, imageUrl }) {
    console.log("URL для создания поста:", postsHost); // Проверка URL
    console.log("Токен:", token); // Проверка токена
    console.log("Описание:", description); // Проверка описания
    console.log("URL картинки:", imageUrl); // Проверка URL картинки

    return fetch(postsHost, {
        method: "POST",
        headers: {
            Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
            description,
            imageUrl,
        }),
    }).then((response) => {
        if (response.ok) {
            return response.json();
        } else if (response.status === 400) {
            throw new Error("Некорректные данные");
        } else if (response.status === 401) {
            throw new Error("Нет авторизации");
        } else {
            throw new Error(`Ошибка при создании поста: ${response.status}`);
        }
    });
}

// Ставит лайк посту
export function addLike({ token, postId }) {
    return fetch(`${postsHost}/${postId}/like`, {
        method: "POST",
        headers: {
            Authorization: `Bearer ${token}`,
        },
    }).then((response) => {
        if (!response.ok) {
            throw new Error("Не удалось поставить лайк");
        }
        // Проверяем, есть ли тело ответа
        const contentType = response.headers.get("content-type");
        if (contentType && contentType.includes("application/json")) {
            return response.json(); // возвращаем обновлённый пост
        } else {
            // Если тела нет — возвращаем null, и обновляем локально
            return null;
        }
    });
}

// Удаляет лайк у поста
export function removeLike({ token, postId }) {
    return fetch(`${postsHost}/${postId}/dislike`, {
        method: "POST",
        headers: {
            Authorization: `Bearer ${token}`,
        },
    }).then((response) => {
        if (!response.ok) {
            throw new Error("Не удалось убрать лайк");
        }
        return response.json();
    });
}