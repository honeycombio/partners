## adding MCP connection to claude code
Start claude code, and enter the following command to add MCP connection of `honeycomb-workshop` and `embrace-workshop`

```shell
! claude mcp add --transport http --scope project honeycomb-workshop https://mcp.honeycomb.io/mcp --header "Authorization: Bearer <honeycomb-mcp-api-key>"

! claude mcp add --transport http --scope project embrace-workshop https://mcp.embrace.io/mcp --header "Authorization: Bearer <embrace-mcp-api-key>"
```

You may need to restart claude code after adding the mcp connection.

## Skills
there is a skill.md file which describes the skills for using Honeycomb and Embrace MCP connection to perform joint-investigation of end-to-end.

Copy the content of the skill.md file, and ask claude to create a skill based on that.

e.g.
```
create skill /investigate based on @skill.md
```