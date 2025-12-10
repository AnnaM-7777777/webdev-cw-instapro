import { uploadImage } from "../api.js";

/**
 * Компонент загрузки изображения.
 * Этот компонент позволяет пользователю загружать изображение и отображать его превью.
 * Если изображение уже загружено, пользователь может заменить его.
 *
 * @param {HTMLElement} params.element - HTML-элемент, в который будет рендериться компонент.
 * @param {Function} params.onImageUrlChange - Функция, вызываемая при изменении URL изображения.
 *                                            Принимает один аргумент - новый URL изображения или пустую строку.
 */
export function renderUploadImageComponent({ element, onImageUrlChange }) {
    /**
     * URL текущего изображения.
     * Изначально пуст, пока пользователь не загрузит изображение.
     * @type {string}
     */
    let imageUrl = "";

    /**
     * Функция рендеринга компонента.
     * Отображает интерфейс компонента в зависимости от состояния:
     * либо форма выбора файла, либо превью загруженного изображения с кнопкой замены.
     */
    const render = () => {
        element.innerHTML = `
            <div class="upload-image">
              ${imageUrl
                ? `
                  <div class="file-upload-image-container">
                    <img class="file-upload-image" src="${imageUrl}" alt="Загруженное изображение">
                    <button class="file-upload-remove-button button">Заменить фото</button>
                  </div>
                `
                : `
                  <label class="file-upload-label secondary-button">
                    <input type="file" class="file-upload-input" style="display:none"/>
                    Выберите фото
                  </label>
                `
              }
            </div>
        `;

        // Обработчик выбора файла
        const fileInputElement = element.querySelector(".file-upload-input");

        fileInputElement?.addEventListener("change", () => {
            const file = fileInputElement.files[0];
            if (!file) return;

            if (!file.type.startsWith("image/")) {
                alert("Выберите изображение");
                return;
            }

            const label = element.querySelector(".file-upload-label");
            if (label) {
                label.textContent = "Загружаю...";
                label.setAttribute("disabled", "true");
            }

            uploadImage({ file })
            .then((data) => {
                console.log("Ответ от uploadImage:", data);
                imageUrl = data.fileUrl;
                onImageUrlChange(imageUrl);
                render();
            })
            .catch((err) => {
                console.error("Ошибка загрузки:", err);
                alert("Не удалось загрузить изображение");
                render();
            });
        });

        // Обработчик удаления изображения
        element.querySelector(".file-upload-remove-button")
        ?.addEventListener("click", () => {
            imageUrl = ""; // Сбрасываем URL изображения
            onImageUrlChange(imageUrl); // Уведомляем об изменении URL изображения
            render(); // Перерисовываем компонент
        });
    };

    // Инициализация компонента
    render();
}
