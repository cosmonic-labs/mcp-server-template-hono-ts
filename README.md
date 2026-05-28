# mcp-server-template

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
  --set components.name=mcpserver\
  --set components.image=ghcr.io/cosmonic-labs/petstore-mcp-server:v0.2.0\
  --set ingress.host="mcpserver.localhost.cosmonic.sh"\
  --set pathNote="/v1/mcp"
```

## Connect to the deployed MCP server

You can use [the official MCP model inspector][model-inspector] to connect. Start the MCP inspector via the following command:

```console
npx @modelcontextprotocol/inspector
```

[cosmonic]: https://docs.cosmonic.com/
