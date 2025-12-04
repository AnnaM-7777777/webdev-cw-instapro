import { addPost } from "../api.js";
import { renderUploadImageComponent } from "./upload-image-component.js";

export function renderAddPostPageComponent({ appEl, onGetPosts, user }) {
    if (!user?.token) {
        alert("Вы не авторизованы");
        return;
    }

    let imageUrl = "";

    const render = () => {
        const appHtml = `
            <div class="page-container">
                <div class="header-container">
                    <h1>Добавить новый пост</h1>
                </div>

                <div class="form">
                    <div class="form-row">
                        <label>Описание:</label>
                        <textarea id="description-input" placeholder="Введите описание..."></textarea>
                    </div>

                    <div class="form-row" id="upload-container"></div>

                    <div class="form-row">
                        <button class="button" id="add-button">Добавить</button>
                    </div>
                </div>
            </div>
        `;

        appEl.innerHTML = appHtml;

        // Подключаем компонент загрузки — ТОЧНО КАК В РЕГИСТРАЦИИ
        const uploadContainer = document.getElementById("upload-container");

        renderUploadImageComponent({
            element: uploadContainer,
            onImageUrlChange: (url) => {
                console.log("Получен URL изображения:", url);
                imageUrl = url;
            },
        });

        // Обработчик отправки
        document.getElementById("add-button").addEventListener("click", () => {
            const description = document.getElementById("description-input").value.trim();
            if (!description) {
                alert("Пожалуйста, введите описание.");
                return;
            }

            if (!imageUrl) {
                alert("Пожалуйста, загрузите изображение.");
                return;
            }

            addPost({ token: user.token, description, imageUrl })
            .then(() => {
                alert("Пост успешно добавлен!");
                onGetPosts();
            })
            .catch((err) => {
                console.error("Ошибка:", err);
                alert("Не удалось создать пост: " + err.message);
            });
        });
    };

    render();
}
