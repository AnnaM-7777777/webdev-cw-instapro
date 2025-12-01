import { USER_POSTS_PAGE } from "../routes.js";
import { renderHeaderComponent } from "./header-component.js";
import { posts, goToPage, user } from "../index.js";
import { addLike, removeLike } from "../api.js"; // чтобы получить токен

export function renderPostsPageComponent({ appEl, user }) {
    console.log("Актуальный список постов:", posts);

    const postListHtml = posts
        .map((post) => {
            // Форматирование даты (если нужно)
            // const formattedDate = formatDistanceToNow(new Date(post.createdAt), { addSuffix: true });

            const hasUserLiked =
                user &&
                Array.isArray(post.likes) &&
                post.likes.some((like) => like && like.id === user.id);
            const likeImage = hasUserLiked
                ? "./assets/images/like-active.svg"
                : "./assets/images/like-not-active.svg";

            return `
      <li class="post">
        <div class="post-header" data-user-id="${post.user.id}">
          <img src="${post.user.imageUrl}" class="post-header__user-image">
          <p class="post-header__user-name">${post.user.name}</p>
        </div>
        <div class="post-image-container">
          <img class="post-image" src="${post.imageUrl}">
        </div>
        <div class="post-likes">
        <button data-post-id="${post.id}" class="like-button">
          <img src="${likeImage}">
        </button>
        <p class="post-likes-text">
          Нравится: <strong>${post.likes.length}</strong>
        </p>
      </div>
        <p class="post-text">
          <span class="user-name">${post.user.name}</span>
          ${post.description}
        </p>
        <p class="post-date">
          ${post.createdAt}  // Замените на formattedDate, если используете date-fns
        </p>
      </li>
    `;
        })
        .join(""); // <-  Преобразуем массив HTML-элементов в одну строку

    const appHtml = `
    <div class="page-container">
      <div class="header-container"></div>
      <ul class="posts">
        ${postListHtml}
      </ul>
    </div>
  `;

    appEl.innerHTML = appHtml;

    renderHeaderComponent({
        element: document.querySelector(".header-container"),
    });

    for (let userEl of document.querySelectorAll(".post-header")) {
        userEl.addEventListener("click", () => {
            goToPage(USER_POSTS_PAGE, {
                userId: userEl.dataset.userId,
            });
        });
    }

    // Обработчик клика по кнопке лайка
    document.querySelectorAll(".like-button").forEach((button) => {
        button.addEventListener("click", () => {
            const postId = button.dataset.postId;
            const post = posts.find((p) => p.id === postId);

            if (!user) {
                alert("Чтобы ставить лайки, нужно войти в аккаунт");
                return;
            }

            const hasUserLiked =
                user &&
                Array.isArray(post.likes) &&
                post.likes.some((like) => like && like.id === user.id);

            let apiCall;

            // Локально обновляем + запускаем запрос
            if (hasUserLiked) {
                post.likes = post.likes.filter((like) => like.id !== user.id);
                apiCall = removeLike({ token: user.token, postId });
            } else {
                post.likes.push({
                    id: user.id,
                    name: user.name || "Пользователь",
                });
                apiCall = addLike({ token: user.token, postId });
            }

            // Перерисовываем сразу (оптимистичный UI)
            renderPostsPageComponent({ appEl, user });

            // Обрабатываем ошибку — откатываем
        });
    });
}
