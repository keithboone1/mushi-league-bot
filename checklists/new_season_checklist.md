1. Update teams table (currently a manual process)

2. Run `/season new`.
This command will make a schedule based on the current teams table.

3. Run `/player set_active` on all players.
If a player is not in the db, the bot will prompt you to use `/player add` instead

4. Run `/draft list all` to check that everyone's star rating is correct.
If anyone is wrong, you can update with `/player rate`

5. Run `/player assign` on all captains, coaches, and retained players.
Running this before `/draft init` is required. The lack of a draft is how the bot knows a player was retained.

6. Run `/draft init`.
You must input the normal draft order, but the bot has built-in support for the limited round. The input draft order will start from round 2.

7. Run `/draft start` to ping the first team.