import { djwt } from "../deps.ts";
import { createSecretKeyFromSecret } from "../utils/auth.ts";
import jsonwebtoken from "npm:jsonwebtoken";
import { assertEquals } from "std/assert/mod.ts";

Deno.test("jsonwebtoken should be able to verify the token from djwt", async () => {
  const secret =
    "The flow of time is always cruel... its speed seems different for each person, but no one can change it... A thing that does not change with time is a memory of younger days...";

  const secretKey = await createSecretKeyFromSecret(secret);
  const payload = {
    readme: "Can you readme?",
  };

  const token = await djwt.create(
    { alg: "HS256", typ: "JWT" },
    payload,
    secretKey,
  );

  const decoded = jsonwebtoken.verify(token, secret);

  assertEquals(decoded.readme, payload.readme);
});

Deno.test("djwt should be able to verify the token from jsonwebtoken", async () => {
  const secret =
    "Many centuries ago, a grand library was built here. But now, it's only a shadow of its former self. It's still a great source of knowledge, however.";

  const secretKey = await createSecretKeyFromSecret(secret);

  const payload = {
    readme: "Can you readme?",
  };

  const token = jsonwebtoken.sign(
    payload,
    secret,
  );

  const decoded = await djwt.verify(token, secretKey);

  assertEquals(decoded.readme, payload.readme);
});
