## adding MCP connection to claude code
Start claude code, and enter the following command to add MCP connection of `honeycomb-workshop` and `embrace-workshop`

```shell
! claude mcp add --transport http --scope project honeycomb-workshop https://mcp.honeycomb.io/mcp --header "Authorization: Bearer <honeycomb-mcp-api-key>"

! claude mcp add --transport http --scope project embrace-workshop https://mcp.embrace.io/mcp --header "Authorization: Bearer <embrace-mcp-api-key>"
```

You may need to restart claude code after adding the mcp connection.