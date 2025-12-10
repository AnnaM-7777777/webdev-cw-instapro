import { getPosts } from "./api.js";
import { renderAddPostPageComponent } from "./components/add-post-page-component.js";
import { renderAuthPageComponent } from "./components/auth-page-component.js";
import {
    ADD_POSTS_PAGE,
    AUTH_PAGE,
    LOADING_PAGE,
    POSTS_PAGE,
    USER_POSTS_PAGE,
} from "./routes.js";
import { renderPostsPageComponent } from "./components/posts-page-component.js";
import { renderLoadingPageComponent } from "./components/loading-page-component.js";
import {
    getUserFromLocalStorage,
    removeUserFromLocalStorage,
    saveUserToLocalStorage,
} from "./helpers.js";

export let user = getUserFromLocalStorage();
export let page = null;
export let posts = [];
export const demoPosts = [
    {
        id: "demo-1",
        description: "Ромашка, ромашка...",
        imageUrl: "https://i.postimg.cc/3rV9kKD2/pchela-na-cvetke.jpg",
        createdAt: new Date(Date.now() - 19 * 60 * 1000).toISOString(), // 19 минут назад
        user: {
            id: "642d00329b190443860c2f31",
            name: "Иван Иваныч",
            imageUrl: "https://i.postimg.cc/3rV9kKD2/pchela-na-cvetke.jpg",
        },
        likes: [
            { id: "user1", name: "Пользователь 1" },
            { id: "user2", name: "Пользователь 2" },
        ],
    },
    {
        id: "demo-2",
        description: "Нарисовала картину, посмотрите какая красивая",
        imageUrl:
            "https://storage.yandexcloud.net/skypro-webdev-homework-bucket/1680670675451-%25C3%2590%25C2%25A1%25C3%2590%25C2%25BD%25C3%2590%25C2%25B8%25C3%2590%25C2%25BC%25C3%2590%25C2%25BE%25C3%2590%25C2%25BA%2520%25C3%2591%25C2%258D%25C3%2590%25C2%25BA%25C3%2591%25C2%2580%25C3%2590%25C2%25B0%25C3%2590%25C2%25BD%25C3%2590%25C2%25B0%25202023-03-31%2520%25C3%2590%25C2%25B2%252012.51.20.png",
        createdAt: new Date(Date.now() - 3 * 60 * 60 * 1000).toISOString(), // 3 часа назад
        user: {
            id: "6425602ce156b600f7858df2",
            name: "Варварва Н.",
            imageUrl:
                "https://storage.yandexcloud.net/skypro-webdev-homework-bucket/1680601502867-%25C3%2590%25C2%25A1%25C3%2590%25C2%25BD%25C3%2590%25C2%25B8%25C3%2590%25C2%25BC%25C3%2590%25C2%25BE%25C3%2590%25C2%25BA%2520%25C3%2591%25C2%258D%25C3%2590%25C2%25BA%25C3%2591%25C2%2580%25C3%2590%25C2%25B0%25C3%2590%25C2%25BD%25C3%2590%25C2%25B0%25202023-04-04%2520%25C3%2590%25C2%25B2%252014.04.29.png",
        },
        likes: Array(35)
            .fill(null)
            .map((_, i) => ({ id: `like-${i}`, name: `Лайкер ${i}` })),
    },
    {
        id: "demo-3",
        description: "Голова",
        imageUrl:
            "https://leonardo.osnova.io/97a160ca-76b6-5cba-87c6-84ef29136bb3/",
        createdAt: new Date(Date.now() - 8 * 24 * 60 * 60 * 1000).toISOString(), // 8 дней назад
        user: {
            id: "6425602ce156b600f7858df2",
            name: "Варварва Н.",
            imageUrl:
                "https://storage.yandexcloud.net/skypro-webdev-homework-bucket/1680601502867-%25C3%2590%25C2%25A1%25C3%2590%25C2%25BD%25C3%2590%25C2%25B8%25C3%2590%25C2%25BC%25C3%2590%25C2%25BE%25C3%2590%25C2%25BA%2520%25C3%2591%25C2%258D%25C3%2590%25C2%25BA%25C3%2591%25C2%2580%25C3%2590%25C2%25B0%25C3%2590%25C2%25BD%25C3%2590%25C2%25B0%25202023-04-04%2520%25C3%2590%25C2%25B2%252014.04.29.png",
        },
        likes: [],
    },
];

//пока не нужна
/* const getToken = () => {
    const token = user ? `Bearer ${user.token}` : undefined;
    return token;
}; */

export const logout = () => {
    user = null;
    removeUserFromLocalStorage();
    goToPage(POSTS_PAGE);
};

//Включает страницу приложения
export const goToPage = (newPage, data) => {
    if (
        [
            POSTS_PAGE,
            AUTH_PAGE,
            ADD_POSTS_PAGE,
            USER_POSTS_PAGE,
            LOADING_PAGE,
        ].includes(newPage)
    ) {
        if (newPage === ADD_POSTS_PAGE) {
            //Если пользователь не авторизован, то отправляем его на страницу авторизации перед добавлением поста
            page = user ? ADD_POSTS_PAGE : AUTH_PAGE;
            return renderApp();
        }

        if (newPage === POSTS_PAGE) {
            page = LOADING_PAGE;
            renderApp();

            // Передаём токен, если пользователь залогинен
            const token = user ? `Bearer ${user.token}` : null;

            return getPosts({ token })
                .then((newPosts) => {
                    page = POSTS_PAGE;
                    posts = [...newPosts, ...demoPosts];
                    renderApp();
                })
                .catch((error) => {
                    console.error(error);
                    goToPage(POSTS_PAGE);
                });
        }

        if (newPage === USER_POSTS_PAGE) {
            const { userId } = data;
            if (!userId) {
                console.error("userId не передан");
                goToPage(POSTS_PAGE);
                return;
            }

            // Фильтруем уже загруженные посты
            const userPosts = posts.filter((post) => post.user.id === userId);

            page = USER_POSTS_PAGE;
            posts = userPosts;
            renderApp();
            return;
        }
        page = newPage;
        renderApp();

        return;
    }

    throw new Error("страницы не существует");
};

const renderApp = () => {
    const appEl = document.getElementById("app");
    if (page === LOADING_PAGE) {
        return renderLoadingPageComponent({
            appEl,
            user,
            goToPage,
        });
    }

    if (page === AUTH_PAGE) {
        return renderAuthPageComponent({
            appEl,
            setUser: (newUser) => {
                user = newUser;
                saveUserToLocalStorage(user);
                goToPage(POSTS_PAGE);
            },
            user,
            goToPage,
        });
    }

    if (page === ADD_POSTS_PAGE) {
        return renderAddPostPageComponent({
            appEl,
            onGetPosts: () => goToPage(POSTS_PAGE),
            user, // передаём user
        });
    }

    if (page === POSTS_PAGE) {
        return renderPostsPageComponent({
            appEl,
            posts,
            user,
            isUserPage: false,
        });
    }

    if (page === USER_POSTS_PAGE) {
        const profileUser = posts.length > 0 ? posts[0].user : null;
        return renderPostsPageComponent({
            appEl,
            posts,
            user,
            isUserPage: true,
            profileUser,
        });
    }
};

goToPage(POSTS_PAGE);
