import { formatDistanceToNow, parseISO } from "date-fns";
import { ru } from "date-fns/locale";
import { USER_POSTS_PAGE } from "../routes.js";
import { renderHeaderComponent } from "./header-component.js";
import { posts, goToPage, user } from "../index.js";
import { addLike, removeLike, deletePost } from "../api.js";
import { escapeHtml } from "../helpers.js";

export function renderPostsPageComponent({
    appEl,
    user,
    posts,
    isUserPage = false,
    profileUser = null,
}) {
    const render = () => {
        // Заголовок профиля (только на странице пользователя)
        let profileHtml = "";
        if (isUserPage && profileUser) {
            profileHtml = `
                <div class="user-profile-header">
                <img src="${escapeHtml(profileUser.imageUrl)}" class="user-profile-avatar" alt="${escapeHtml(profileUser.name)}">
                <h2 class="user-profile-name" role="paragraph">${escapeHtml(profileUser.name)}</h2>
                </div>
            `;
        }

        if (!posts || !Array.isArray(posts)) {
            appEl.innerHTML = "<p>Загрузка...</p>";
            return;
        }

        // Генерация постов
        const postListHtml = posts
        .map((post) => {
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
            const canDelete = user && post.user.id === user?._id;

            const likeButtonHtml = isDemoPost
                ? `<button class="like-button" disabled><img src="${likeImage}" alt="${
                        hasUserLiked ? "Лайк активен" : "Лайк неактивен"
                    }"></button>`
                : `<button data-post-id="${
                        post.id
                    }" class="like-button"><img src="${likeImage}" alt="${
                        hasUserLiked ? "Лайк активен" : "Лайк неактивен"
                    }"></button>`;

            const deleteButtonHtml =
                !isDemoPost && canDelete
                    ? `<button class="post-delete-button" data-post-id="${post.id}" aria-label="Удалить пост"><img class="post-delete-img" src="./assets/images/delete_icon.svg" alt="Удалить"></button>`
                    : "";

            // Убираем .post-header на странице пользователя
            const headerHtml = isUserPage
                ? ""
                : `
                    <div class="post-header" data-user-id="${post.user.id}">
                        <img src="${post.user.imageUrl}" class="post-header__user-image">
                        <p class="post-header__user-name">${post.user.name}</p>
                    </div>
                `;

            return `
    <li class="post">
        ${headerHtml}
        <div class="post-image-container">
        <img class="post-image" src="${post.imageUrl}">
        </div>
        <div class="post-likes">
        ${likeButtonHtml}
        <p class="post-likes-text">Нравится: <strong>${post.likes.length}</strong></p>
        ${deleteButtonHtml}
        </div>
        <p class="post-text">
        <span class="user-name">${escapeHtml(post.user.name)}</span>
        ${escapeHtml(post.description)}
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
        .join("");

        // Финальный HTML
        const appHtml = `
            <div class="page-container">
                <div class="header-container"></div>
                ${profileHtml}
                <ul class="posts">${postListHtml}</ul>
            </div>
        `;

        appEl.innerHTML = appHtml;

        // Рендерим шапку (кнопка "Добавить")
        renderHeaderComponent({
            element: document.querySelector(".header-container"),
        });

        // Обработчики
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

            render(); // перерисовываем текущее состояние

            const request = hasUserLiked
                ? removeLike({ token: user.token, postId })
                : addLike({ token: user.token, postId });

            request.catch((error) => {

                // Откат при ошибке
                if (hasUserLiked) {
                    post.likes.push({
                        id: user._id,
                        name: user.name || "Пользователь",
                    });
                } else {
                    post.likes = post.likes.filter(
                        (like) => like?.id !== user._id
                    );
                }
                render();
                alert("Не удалось обновить лайк");
            });
        };

        const handleDelete = (postId) => {
            if (!user) {
                alert("Чтобы удалять посты, войдите в аккаунт");
                return;
            }

            if (!confirm("Вы уверены, что хотите удалить этот пост?")) return;

            deletePost({ token: user.token, postId })
                .then(() => {
                    const index = posts.findIndex((p) => p.id === postId);
                    if (index !== -1) posts.splice(index, 1);
                    render();
                })
                .catch(() => {
                    alert("Не удалось удалить пост");
                });
        };

        // Делегирование событий
        if (appEl._postClickHandler) {
            appEl.removeEventListener("click", appEl._postClickHandler);
        }

        const clickHandler = (e) => {
            if (e.target.closest(".like-button:not([disabled])")) {
                const postId = e.target.closest(".like-button").dataset.postId;
                handleLike(postId);
            } else if (e.target.closest(".post-delete-button")) {
                const postId = e.target.closest(".post-delete-button").dataset
                    .postId;
                handleDelete(postId);
            } else if (!isUserPage && e.target.closest(".post-header")) {
                const userId = e.target.closest(".post-header").dataset.userId;
                goToPage(USER_POSTS_PAGE, { userId });
            }
        };

        appEl._postClickHandler = clickHandler;
        appEl.addEventListener("click", clickHandler);
    };

    render();
}
