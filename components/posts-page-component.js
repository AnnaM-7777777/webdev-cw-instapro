import { formatDistanceToNow, parseISO } from "date-fns";
import { ru } from "date-fns/locale";
import { USER_POSTS_PAGE } from "../routes.js";
import { renderHeaderComponent } from "./header-component.js";
import { posts, goToPage, user } from "../index.js";
import { addLike, removeLike, deletePost } from "../api.js"; // чтобы получить токен

export function renderPostsPageComponent({ appEl, user }) {
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
            const canDelete = user && post.user.id === user._id;
            const deleteButtonHtml = canDelete
                ? `<button class="post-delete-button" data-post-id="${post.id}">
              <img class="post-delete-img" src="assets/images/delete_icon.svg" alt="Удалить">
            </button>`
                : "";

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

        if (!post || !user) {
            alert("Чтобы ставить лайки, войдите в аккаунт");
            return;
        }

        //ЕДИНСТВЕННЫЙ ПРАВИЛЬНЫЙ СПОСОБ для API (объекты)
        const hasUserLiked = Array.isArray(post.likes) && 
            post.likes.some(like => like?.id === user._id);

        if (hasUserLiked) {
            post.likes = post.likes.filter(like => like?.id !== user._id);
        } else {
            post.likes.push({ id: user._id, name: user.name || "Пользователь" });
        }

        renderPostsPageComponent({ appEl, user });

        const request = hasUserLiked
            ? removeLike({ token: user.token, postId })
            : addLike({ token: user.token, postId });

        request.catch((error) => {
            console.error("Ошибка:", error);
            // Откатываем локально — тем же способом
            if (hasUserLiked) {
                post.likes.push({ id: user._id, name: user.name || "Пользователь" });
            } else {
                post.likes = post.likes.filter(like => like?.id !== user._id);
            }
            renderPostsPageComponent({ appEl, user });
            alert("Не удалось обновить лайк");
        });
    });
});

    // Удаление постов
    document.querySelectorAll(".post-delete-button").forEach((button) => {
        button.addEventListener("click", () => {
            if (!user) return;

            const postId = button.dataset.postId;
            const confirmed = confirm(
                "Вы уверены, что хотите удалить этот пост?"
            );
            if (!confirmed) return;

            deletePost({ token: user.token, postId })
                .then(() => {
                    // Удаляем пост из локального массива
                    const index = posts.findIndex((p) => p.id === postId);
                    if (index !== -1) {
                        posts.splice(index, 1);
                    }
                    // Перерисовываем
                    renderPostsPageComponent({ appEl, user });
                })
                .catch((error) => {
                    console.error("Ошибка удаления:", error);
                    alert("Не удалось удалить пост");
                });
        });
    });
}
