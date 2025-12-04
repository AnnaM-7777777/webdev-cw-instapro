import { formatDistanceToNow, parseISO } from "date-fns";
import { ru } from "date-fns/locale";
import { USER_POSTS_PAGE } from "../routes.js";
import { renderHeaderComponent } from "./header-component.js";
import { posts, goToPage, user } from "../index.js";
import { addLike, removeLike, deletePost } from "../api.js"; // <- Чтобы получить токен

export function renderPostsPageComponent({ appEl, user }) {
    if (!posts || !Array.isArray(posts)) {
        appEl.innerHTML = "<p>Загрузка...</p>";
        return;
    }

    console.log("Актуальный список постов:", posts);

    const postListHtml = posts
        .map((post) => {
            // Форматирование даты (если нужно)
            // const formattedDate = formatDistanceToNow(new Date(post.createdAt), { addSuffix: true });
            const formattedDate = post.createdAt
                ? formatDistanceToNow(parseISO(post.createdAt), {
                      addSuffix: true,
                      locale: ru,
                  })
                : "Дата не указана";
            const hasUserLiked =
                user &&
                Array.isArray(post.likes) &&
                post.likes.some((like) => like?.id === user._id);

            const likeImage = hasUserLiked
                ? "./assets/images/like-active.svg"
                : "./assets/images/like-not-active.svg";

            const isDemoPost = post.id.startsWith("demo-");
            const canDelete = user && post.user.id === user._id;

            const likeButtonHtml = isDemoPost
                ? `<button class="like-button" disabled>
                    <img src="${likeImage}" alt="${
                      hasUserLiked ? "Лайк активен" : "Лайк неактивен"
                  }">
                 </button>`
                : `<button data-post-id="${post.id}" class="like-button">
                    <img src="${likeImage}" alt="${
                      hasUserLiked ? "Лайк активен" : "Лайк неактивен"
                  }">
                </button>`;

            const deleteButtonHtml =
                !isDemoPost && canDelete
                    ? `<button class="post-delete-button" data-post-id="${post.id}" aria-label="Удалить пост">
                    <img class="post-delete-img" src="./assets/images/delete_icon.svg" alt="Удалить">
                </button>`
                    : "";

            return `
                <li class="post">
                    <div class="post-header" data-user-id="${post.user.id}">
                        <img src="${
                            post.user.imageUrl
                        }" class="post-header__user-image">
                        <p class="post-header__user-name">${post.user.name}</p>
                    </div>

                    <div class="post-image-container">
                        <img class="post-image" src="${post.imageUrl}">
                    </div>

                    <div class="post-likes">
                        ${likeButtonHtml}
                        <p class="post-likes-text">Нравится: <strong>${
                            post.likes.length
                        }</strong></p>
                        ${deleteButtonHtml}          
                    </div>

                    <p class="post-text">
                        <span class="user-name">${post.user.name}</span>
                        ${post.description}
                    </p>
                    
                    <p class="post-date">
                        ${formatDistanceToNow(parseISO(post.createdAt), {
                            addSuffix: true,
                            locale: ru,
                        })}
                    </p>
                </li>
            `;
        })
        .join(""); // <- Преобразуем массив HTML-элементов в одну строку

    const appHtml = `
        <div class="page-container">
            <div class="header-container"></div>

            <ul class="posts">
                ${postListHtml}
            </ul>
        </div>
    `;

    appEl.innerHTML = appHtml;

    // Очистка старых обработчиков
    appEl.querySelectorAll(".like-button, .post-delete-button, .post-header").forEach((el) => {
        el.replaceWith(el.cloneNode(true));
    });

    renderHeaderComponent({
        element: document.querySelector(".header-container"),
    });

    // Обработчик лайка
    const handleLike = (postId) => {
        const post = posts.find((p) => p.id === postId);
        if (!post || !user) {
            alert("Чтобы ставить лайки, войдите в аккаунт");
            return;
        }

        const hasUserLiked =
            Array.isArray(post.likes) &&
            post.likes.some((like) => like?.id === user._id);

        if (hasUserLiked) {
            post.likes = post.likes.filter((like) => like?.id !== user._id);
        } else {
            post.likes.push({
                id: user._id,
                name: user.name || "Пользователь",
            });
        }

        renderPostsPageComponent({ appEl, user });

        const request = hasUserLiked
            ? removeLike({ token: user.token, postId })
            : addLike({ token: user.token, postId });

        request.catch((error) => {
            console.error("Ошибка:", error);

            // Откат
            if (hasUserLiked) {
                post.likes.push({
                    id: user._id,
                    name: user.name || "Пользователь",
                });
            } else {
                post.likes = post.likes.filter((like) => like?.id !== user._id);
            }
            renderPostsPageComponent({ appEl, user });
            alert("Не удалось обновить лайк");
        });
    };

    // Обработчик удаления
    const handleDelete = (postId) => {
        if (!user) {
            alert("Чтобы удалять посты, войдите в аккаунт");
            return;
        }

        const confirmed = confirm("Вы уверены, что хотите удалить этот пост?");
        if (!confirmed) return;

        deletePost({ token: user.token, postId })
        .then(() => {
            const index = posts.findIndex((p) => p.id === postId);

            if (index !== -1) {
                posts.splice(index, 1);
            }

            renderPostsPageComponent({ appEl, user });
        })
        .catch((error) => {
            console.error("Ошибка удаления:", error);
            alert("Не удалось удалить пост");
        });
    };

    // Обработчик лайков (только для не -демо постов)
    if (appEl._hasPostClickListener) {
        appEl.removeEventListener("click", appEl._postClickHandler);
    }

    // Создаём новый обработчик
    const clickHandler = (e) => {
        if (e.target.closest(".like-button:not([disabled])")) {
            const postId = e.target.closest(".like-button").dataset.postId;
            handleLike(postId);

        } else if (e.target.closest(".post-delete-button")) {
            const postId = e.target.closest(".post-delete-button").dataset.postId;
            handleDelete(postId);

        } else if (e.target.closest(".post-header")) {
            const userId = e.target.closest(".post-header").dataset.userId;
            goToPage(USER_POSTS_PAGE, { userId });
        }
    };

    // Сохраняем обработчик и флаг
    appEl._postClickHandler = clickHandler;
    appEl._hasPostClickListener = true;

    // Добавляем
    appEl.addEventListener("click", clickHandler);
}
