import { ServerRoute } from "@hapi/hapi";

const chatsRoutes: ServerRoute[] = [
  {
    method: "GET",
    path: "/chat1",
    options: {
      auth: "base",
    },
    handler: (request, h) => {
      return h.file("index.html");
    },
  },
  {
    method: "GET",
    path: "/chat2",
    options: {
      auth: "base",
    },
    handler: (request, h) => {
      return h.file("index1.html");
    },
  },
];

export default chatsRoutes;
