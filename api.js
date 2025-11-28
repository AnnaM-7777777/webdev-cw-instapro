// Замени на свой, чтобы получить независимый от других набор данных.
// "боевая" версия инстапро лежит в ключе prod
const personalKey = "prod";
const baseHost = "https://webdev-hw-api.vercel.app";
const postsHost = `${baseHost}/api/v1/${personalKey}/instapro`;

export function getPosts({ token }) {
    return fetch(postsHost, {
        method: "GET",
        headers: {
            Authorization: token,
        },
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
            // Сохраняем токен в localStorage
            localStorage.setItem("token", data.token);
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
            // Сохраняем токен в localStorage
            localStorage.setItem("token", data.token);
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
            Authorization: token,  
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
