## adding MCP connection to claude code
Start claude code, and enter the following command to add MCP connection of `honeycomb-workshop` and `embrace-workshop`

```shell
! claude mcp add --transport http --scope project honeycomb-workshop https://mcp.honeycomb.io/mcp --header "Authorization: Bearer hcamk_01kq8rht5z0qr8w3yrw4gnjqfa:7chgfv6hcr2r7twfjbcdnkxyz2q14zkc"

! claude mcp add --transport http --scope project embrace-workshop https://mcp.embrace.io/mcp --header "Authorization: Bearer emb_sa_HAoIqSI8lBf-v9ilqxIeVp0lpu2nLKB4r6yUrdU0dgI"
```

You may need to restart claude code after adding the mcp connection.