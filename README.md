# mcp-server-template

> **Archived.** For new projects, use the [TypeScript MCP server template for WASI p3](https://github.com/cosmonic-labs/mcp-server-template-ts-p3).
>
> The MCP and WebAssembly ecosystem is moving fast. We are building directly on the official MCP SDKs to keep up with protocol changes and reduce custom integration code. This repository is no longer maintained and is retained for reference.
>
> The new template uses the official TypeScript SDK and supports WASI p3 HTTP in both directions. For Rust, use [mcp-server-template-rs](https://github.com/cosmonic-labs/mcp-server-template-rs).

## Historical documentation

Template repository for creating a WebAssembly component [Model Context Protocol (MCP)][mcp] Server,
with [wasmCloud][wasmcloud].

[mcp]: https://modelcontextprotocol.io/docs/getting-started/intro
[wasmcloud]: https://wasmcloud.com

# Dependencies

- Download [Wasm Shell (`wash`)][wash] v2.2.0 or higher

[wash]: https://github.com/wasmcloud/wasmcloud

## Start the development loop

To start a new project based on this template, you can clone the repository or create a new project with `wash`:

```console
wash new https://github.com/cosmonic-labs/mcp-server-template-ts --name my-project
```

When `wash` prompts you to `Execute template setup command 'npm install'?`, type `y` to select **yes**. This will run `npm install` automatically upon project creation. (If you'd rather run `npm install` manually after navigating to the directory, you can do that, too.)

In the project directory, start a development loop:

```console
npm run dev
```

The `dev` script will automatically run [the official MCP model inspector][model-inspector] in your browser on [`http://localhost:6274/`](http://localhost:6274/).

Using the model inspector you can connect to the local MCP server via HTTP, manipulate resources, run tools, and more.

[model-inspector]: https://github.com/modelcontextprotocol/inspector

## Optional: Generate MCP tools from OpenAPI specification

You can generate MCP tools from an OpenAPI specification using the [`openapi2mcp`](https://github.com/cosmonic-labs/openapi2mcp) tool.

Generate MCP tools from your OpenAPI specification:

```console
npm run openapi2mcp path/to/openapi/spec.json
```

**Note:** The path to the OpenAPI spec must be inside the repository for the `openapi2mcp` npm script to work.

The HTTP client follows at most one redirect with the same scheme, host, and port as the request. It returns cross-origin redirects without contacting the destination, keeping credentials and request bodies on the original origin. APIs that redirect downloads to a CDN need an explicit integration for that destination.

### Set up Cosmonic Control

Once your MCP server is ready for primetime, ensure your [Cosmonic Control][cosmonic] cluster is running.

<details>
<summary>Don't have a Cosmonic Control cluster set up?</summary>

:::warning[Cosmonic Control required]
It's free to get started with Cosmonic Control. You will need a Kubernetes cluster and an installation of Cosmonic Control to deploy the component. Follow the [Get Started](https://docs.cosmonic.com/install-cosmonic-control) instructions in the Cosmonic Control documentation. 
:::

</details>

### Deploy the application with Helm CLI

Make sure to substitute your own pushed image in the command below:

```shell
helm install mcpserver oci://ghcr.io/cosmonic-labs/charts/http-trigger\
  --version 0.1.2\
  --set 'components[0].name=mcpserver'\
  --set 'components[0].image=ghcr.io/cosmonic-labs/petstore-mcp-server:v0.4.0'\
  --set ingress.host="mcpserver.localhost.cosmonic.sh"\
  --set pathNote="/v1/mcp"
```

## Connect to the deployed MCP server

You can use [the official MCP model inspector][model-inspector] to connect. Start the MCP inspector via the following command:

```console
npx @modelcontextprotocol/inspector
```

[cosmonic]: https://docs.cosmonic.com/
