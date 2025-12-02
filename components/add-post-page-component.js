import { addPost, uploadImage } from "../api.js"; // Import функции addPost

export function renderAddPostPageComponent({ appEl, onGetPosts }) {
    let imageUrl = "";
    let isUploading = false; // Добавляем состояние загрузки
    let token = null;

    const render = () => {
        const appHtml = `
            <div class="page-container">
                <div class="header-container"></div>
                
                <div class="header-container">
                    <h1>Добавить новый пост</h1>
                </div>

                <div class="form">
                    <div class="form-row">
                        <label>Описание:</label>
                        <textarea id="description-input"></textarea>
                    </div>

                    <div class="form-row">
                        <label>Ссылка на изображение:</label>
                        <input type="text" id="image-url-input"  value="${imageUrl}"/>
                    </div>

                    ${isUploading ? `<div class="form-row">Загрузка...</div>` : ""}
                    
                    <div class="form-row">
                        <button class="button" id="add-button" ${isUploading ? "disabled" : ""}>Добавить</button>
                    </div>
                </div>
            </div>
        `;

        appEl.innerHTML = appHtml;

        const addButton = document.getElementById("add-button");
        const descriptionInput = document.getElementById("description-input");
        const imageUrlInput = document.getElementById("image-url-input");
        const uploadImageInput = document.getElementById("upload-image-input");

        uploadImageInput.addEventListener("change", () => {
            if (uploadImageInput.files && uploadImageInput.files[0]) {
                const file = uploadImageInput.files[0];

                // Проверка типа файла
                if (!file.type.startsWith("image/")) {
                    showErrorMessage("Пожалуйста, загрузите изображение.");
                    return;
                }

                isUploading = true; // Начинаем загрузку
                render();
                uploadImage({ file })
                    .then((data) => {
                        imageUrl = data.url;
                        isUploading = false; // Загрузка завершена
                        render(); // Перерисовать страницу с новым URL
                    })
                    .catch((error) => {
                        console.error(
                            "Ошибка при загрузке изображения:",
                            error
                        );
                        showErrorMessage(
                            "Произошла ошибка при загрузке изображения."
                        );
                    })
                    .finally(() => {
                        isUploading = false;
                        render();
                    });
            }
        });

        addButton.addEventListener("click", () => {
            const description = descriptionInput.value;
            const finalImageUrl = imageUrl || imageUrlInput.value;

            if (!description || !finalImageUrl) {
                showErrorMessage("Пожалуйста, заполните все поля.");
                return;
            }

            const tokenString = localStorage.getItem("token");
            console.log("Содержимое tokenString:", tokenString); // Добавленная строка

            if (tokenString) {
                try {
                    const tokenData = JSON.parse(tokenString); // → { user: { token: "...", ... } }
                    token = tokenData && tokenData.user ? tokenData.user.token : null;

                    console.log("Извлеченный токен:", token);
                } catch (error) {
                    console.error(
                        "Ошибка при парсинге токена из localStorage:",
                        error
                    );
                }
            } else {
                console.warn("Токен не найден в localStorage");
            }

            if (!token) {
                showErrorMessage(
                    "Вы не авторизованы. Пожалуйста, войдите в систему."
                );
                return;
            }

            addPost({
                token: token,
                description: description,
                imageUrl: finalImageUrl,
            })
                .then((newPost) => {
                    alert("Пост успешно добавлен!");
                    console.log(
                        "Пост успешно добавлен!  Ответ от сервера:",
                        newPost
                    );
                    descriptionInput.value = "";
                    imageUrlInput.value = "";
                    imageUrl = "";
                    onGetPosts(); //  Обновляем список постов
                    render();
                })
                .catch((error) => {
                    console.error("Ошибка при создании поста:", error);
                    showErrorMessage(
                        `Произошла ошибка при создании поста: ${error.message}`
                    );
                });
        });
    };

    function showErrorMessage(message) {
        console.error(message);
        alert(message);
    }

    render();
}
