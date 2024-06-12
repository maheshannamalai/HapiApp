import Hapi from "@hapi/hapi";
import inert from "@hapi/inert";

const init = async () => {
  const server = Hapi.server({
    port: 4000,
    host: "localhost",
  });

  await server.register(inert);

  server.route({
    method: "GET",
    path: "/",
    handler: async (request, h) => {
      return h.file("fetch.html");
    },
  });

  await server.start();
  console.log("Server running on %s", server.info.uri);
};

init();
