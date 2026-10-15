import { createServer, type Server } from "node:http";
import { afterEach, describe, expect, test, vi } from "vitest";
import { HTTPClient } from "../../src/http_client";

const baseUrl = "https://api.example";
const headers = {
  Authorization: "Bearer TEST_TOKEN",
  Cookie: "session=TEST_SESSION",
  "Proxy-Authorization": "Basic TEST_PROXY",
  api_key: "TEST_API_KEY",
  "X-Custom-Secret": "TEST_CUSTOM_SECRET",
};
const redirectStatuses = [301, 302, 307, 308];

describe("HTTPClient redirects", () => {
  test.each([...redirectStatuses, 303])(
    "returns a cross-origin %i response without forwarding credentials",
    async (status) => {
      const response = new Response("redirect", {
        status,
        headers: { Location: "https://attacker.example/collect" },
      });
      const fetchMock = vi.fn().mockResolvedValue(response);
      vi.stubGlobal("fetch", fetchMock);

      const result = await new HTTPClient({ baseUrl }).call({
        path: "/redirect",
        method: "POST",
        body: { secret: "TEST_BODY" },
        headers,
      });

      expect(result).toBe(response);
      expect(fetchMock).toHaveBeenCalledTimes(1);
      expect(fetchMock.mock.calls[0]?.[1]).toMatchObject({
        redirect: "manual",
        headers,
      });
    },
  );

  test.each([
    "//attacker.example/collect",
    "https://api.example.attacker.example/collect",
    "https://api.example@attacker.example/collect",
    "https://api.example:8443/collect",
    "http://api.example/collect",
    "data:text/plain,secret",
    "https://user:password@api.example/collect",
    "http://[invalid",
  ])("does not follow unsafe Location %s", async (location) => {
    const response = new Response(null, {
      status: 307,
      headers: { Location: location },
    });
    const fetchMock = vi.fn().mockResolvedValue(response);
    vi.stubGlobal("fetch", fetchMock);

    const result = await new HTTPClient({ baseUrl }).call({
      path: "/redirect",
      headers,
    });

    expect(result).toBe(response);
    expect(fetchMock).toHaveBeenCalledTimes(1);
  });

  test.each(redirectStatuses)(
    "preserves the request for a same-origin %i redirect",
    async (status) => {
      const response = new Response("ok");
      const fetchMock = vi
        .fn()
        .mockResolvedValueOnce(
          new Response(null, {
            status,
            headers: { Location: "/destination" },
          }),
        )
        .mockResolvedValueOnce(response);
      vi.stubGlobal("fetch", fetchMock);

      const result = await new HTTPClient({ baseUrl }).call({
        path: "/redirect/{id}",
        pathParams: { id: "123" },
        query: { q: "test", omitted: undefined },
        method: "PUT",
        body: { value: "test" },
        headers: { ...headers, omitted: undefined },
      });

      expect(result).toBe(response);
      expect(fetchMock).toHaveBeenCalledTimes(2);
      expect(fetchMock).toHaveBeenNthCalledWith(
        1,
        "https://api.example/redirect/123?q=test",
        {
          method: "PUT",
          headers,
          body: '{"value":"test"}',
          redirect: "manual",
        },
      );
      expect(fetchMock).toHaveBeenNthCalledWith(
        2,
        "https://api.example/destination",
        fetchMock.mock.calls[0]?.[1],
      );
    },
  );

  test.each([
    ["next", "https://api.example/folder/next"],
    ["../next?download=1", "https://api.example/next?download=1"],
    ["?download=1", "https://api.example/folder/redirect?download=1"],
    ["https://API.EXAMPLE:443/next", "https://api.example/next"],
    ["//api.example/next", "https://api.example/next"],
  ])("resolves same-origin Location %s", async (location, destination) => {
    const fetchMock = vi
      .fn()
      .mockResolvedValueOnce(
        new Response(null, { status: 307, headers: { Location: location } }),
      )
      .mockResolvedValueOnce(new Response("ok"));
    vi.stubGlobal("fetch", fetchMock);

    await new HTTPClient({ baseUrl }).call({ path: "/folder/redirect" });

    expect(fetchMock).toHaveBeenCalledTimes(2);
    expect(fetchMock.mock.calls[1]?.[0]).toBe(destination);
  });

  test.each([200, 301, 302, 307, 308])(
    "returns status %i without Location",
    async (status) => {
      const response = new Response(null, { status });
      const fetchMock = vi.fn().mockResolvedValue(response);
      vi.stubGlobal("fetch", fetchMock);

      expect(
        await new HTTPClient({ baseUrl }).call({ path: "/redirect" }),
      ).toBe(response);
      expect(fetchMock).toHaveBeenCalledTimes(1);
    },
  );

  test.each(["https://attacker.example/collect", "/redirect"])(
    "returns a second redirect to %s without following it",
    async (location) => {
      const secondRedirect = new Response(null, {
        status: 307,
        headers: { Location: location },
      });
      const fetchMock = vi
        .fn()
        .mockResolvedValueOnce(
          new Response(null, {
            status: 307,
            headers: { Location: "/next" },
          }),
        )
        .mockResolvedValueOnce(secondRedirect);
      vi.stubGlobal("fetch", fetchMock);

      const result = await new HTTPClient({ baseUrl }).call({
        path: "/redirect",
        headers,
      });

      expect(result).toBe(secondRedirect);
      expect(fetchMock).toHaveBeenCalledTimes(2);
      expect(fetchMock.mock.calls[1]?.[1].redirect).toBe("manual");
    },
  );
});

describe("HTTPClient with real fetch", () => {
  const servers: Server[] = [];

  afterEach(async () => {
    await Promise.all(
      servers.splice(0).map(
        (server) =>
          new Promise<void>((resolve, reject) => {
            server.close((error) => (error ? reject(error) : resolve()));
            server.closeAllConnections();
          }),
      ),
    );
  });

  async function listen(server: Server): Promise<string> {
    await new Promise<void>((resolve, reject) => {
      server.once("error", reject);
      server.listen(0, "127.0.0.1", () => {
        server.off("error", reject);
        resolve();
      });
    });
    servers.push(server);
    const address = server.address();
    if (!address || typeof address === "string") {
      throw new Error("Expected a TCP address");
    }
    return `http://127.0.0.1:${address.port}`;
  }

  test.each(["GET", "POST", "PUT", "DELETE"])(
    "never sends a redirected %s request to another origin",
    async (method) => {
      const received = vi.fn();
      const destination = await listen(
        createServer((request, response) => {
          received(request.headers);
          response.end("received");
        }),
      );
      const upstream = await listen(
        createServer((_request, response) => {
          response.writeHead(307, { Location: destination });
          response.end("redirect");
        }),
      );

      const response = await new HTTPClient({ baseUrl: upstream }).call({
        path: "/redirect",
        method,
        headers,
        body: method === "GET" ? undefined : { secret: "TEST_BODY" },
      });

      expect(response.status).toBe(307);
      expect(await response.text()).toBe("redirect");
      expect(received).not.toHaveBeenCalled();
    },
  );

  test("does not automatically follow a cross-origin second hop", async () => {
    const received = vi.fn();
    const destination = await listen(
      createServer((_request, response) => {
        received();
        response.end("received");
      }),
    );
    const upstream = await listen(
      createServer((request, response) => {
        response.writeHead(307, {
          Location: request.url?.startsWith("/redirect")
            ? "/next"
            : destination,
        });
        response.end("redirect");
      }),
    );

    const response = await new HTTPClient({ baseUrl: upstream }).call({
      path: "/redirect",
      headers,
    });

    expect(response.status).toBe(307);
    expect(await response.text()).toBe("redirect");
    expect(received).not.toHaveBeenCalled();
  });
});
