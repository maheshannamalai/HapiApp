import Lab from "@hapi/lab";
import { expect } from "@hapi/code";
const { afterEach, beforeEach, describe, it } = (exports.lab = Lab.script());
import { init } from "..";
import { badRequest } from "@hapi/boom";

const Cookie =
  "sid=Fe26.2**3f4cfef2ee4406b43acd194c8db304e12df599b64450e63f32714fc526690341*MIBiWuoJtiIgtUdxCDqHyg*8qe9j92si_3OP--ULEq3Jg**aa7d44131358b23e2f7469d066be490822fa0368f8fb9a0f4787b36f5e9f95eb*lA9icn-CXRVfecdLTJEu7-KoG8krftNCN93uK-vT6ZY; token=Fe26.2**031c8ba051608a38d9682322cb242133b3537302ad29d70ce48b7590db18b159*PkaeflcBxrfebxrDYT3xkg*VPFsgUdtDFYv4N3uNmBHMYsCFvmf8x-JBJZYfLUuPkOXNFYM2PA9rpTYhRtOoyQxwHKRYx6Qd0oH91B9IMV4dN9NZ9OF3c5__L_CMHZMnzQcIA1eaYyoJYbfrsnDNA5aAJu53y1TrAy3vv6zNTSys8PhuWG5YpWnkEssb0oPP8n7D9E4FcWNWSZ5LT8ET4598-uSdIxAvqSg8Zh91E6exHC4aKgjhk6FJAHwbwDgO4-9KR80ho46yzuSzSeHehIj**39a27be187a9fd90e66d6c90264002ad9e95d290cf5303205cc9a09b458c2a52*JJHGplY45rfbPEI78KvqHwtFCZ_QDaJ26rvUdPBuYws";

describe("GET /orders", () => {
  let server;

  beforeEach(async () => {
    server = await init();
  });

  afterEach(async () => {
    await server.stop();
  });

  it("with user id check", async () => {
    const res = await server.inject({
      method: "get",
      url: "/orders?userId=2",
      headers: {
        Cookie,
      },
    });
    expect(res.statusCode).to.equal(200);
  });

  it("without user id check", async () => {
    const res = await server.inject({
      method: "get",
      url: "/orders",
      headers: {
        Cookie,
      },
    });
    expect(res.statusCode).to.equal(400);
    expect(res.payload).to.equal(
      JSON.stringify(badRequest("User id missing!").output.payload)
    );
  });
});
