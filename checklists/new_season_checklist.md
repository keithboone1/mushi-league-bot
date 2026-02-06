1. Update teams table with `/season add_team`

2. Double check the room IDs in the .env

3. Run `/season new`.
This command will make a schedule based on the current teams table.

4. Run `/player set_active` on all players.
If a player is not in the db, the bot will prompt you to use `/player add` instead

5. Run `/draft list all` to check that everyone's star rating is correct.
If anyone is wrong, you can update with `/player rate`

6. Run `/player assign` on all captains, coaches, and retained players.
Running this before `/draft init` is required. The lack of a draft is how the bot knows a player was retained.

7. Run `/draft init`.
You must input the normal draft order, but the bot has built-in support for the limited round. The input draft order will start from round 2.

8. Run `/draft start` to ping the first team.