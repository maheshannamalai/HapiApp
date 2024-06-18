import Lab from "@hapi/lab";
import { expect } from "@hapi/code";
const { afterEach, beforeEach, describe, it } = (exports.lab = Lab.script());
import { init } from "..";
import { badRequest } from "@hapi/boom";

const Authorization =
  "Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ1c2VySWQiOjEsImlhdCI6MTcxODYzNTIyNywiZXhwIjoxNzE4NzIxNjI3fQ.Ce7-KuAEB8SGoxXVlofluhUJ-WA8mpOMEuXQS1v106w";

describe("GET /orders", () => {
  let server;

  beforeEach(async () => {
    server = await init(3001);
  });

  afterEach(async () => {
    await server.stop();
  });

  it("get orders", async () => {
    const res = await server.inject({
      method: "get",
      url: "/orders",
      headers: {
        Authorization,
      },
    });
    expect(res.statusCode).to.equal(200);
  });

  it("get product detail", async () => {
    const res = await server.inject({
      method: "get",
      url: "/products/7",
      headers: {
        Authorization,
      },
    });
    expect(res.statusCode).to.equal(200);
  });

  it("get product detail", async () => {
    const res = await server.inject({
      method: "get",
      url: "/products/check",
      headers: {
        Authorization,
      },
    });
    expect(res.statusCode).to.equal(400);
    expect(res.payload).to.equal(
      JSON.stringify(badRequest("Invalid request params input").output.payload)
    );
  });
});
