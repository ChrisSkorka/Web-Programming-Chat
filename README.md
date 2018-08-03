# Web-Programming-Chat
Web programming assignment chat web app

Requirements / appication model:
- Groups
  - Channels
- Users
  - Details
    - Username
    - Email
    - Password
    - Initial user is called super
  - Group admins
    - Manage groups and channels
    - Manage users in channel
    - Elevate users to group admin
  - Super admin
    - System wide access
    - All of group admins
    - Create admin user + group pair
    - Remove users
    - Elevate users to super admins
- Login - authentification
  - login with username/password
  - super admin creates user
- Pages
  - Landing page
    - Signed out
      - Login page
      - Remeber login details locally
    - Signed in
    - List of groups
      - List of channels
    - Channel selected
      - Chat history - messages
      - Text box to send messages

Functions:
- Server
  - Check if autherised for all actions
    - Return error structures to unautherisd requests
  - Recieve login data and return status
  - Serve list of groups of user
    - Super admin gets all groups
  - Serve list of channels of group and user
    - Super admin and group admin gets all channels
  - Serve list of messages for a channel
  - Serve message hash for update checking
  - Recieve message from user to channel
  - Process users added to group
  - Process users added to channel
  - Process users removed from group and channels
  - Process users removed from channels
  - Process users elevated to group admin
  - Process users elevated to super admin
  - Store messages
  - Store user data
- Browser
  - If user details saved
    - Check autherisation with server
      - If incorrect, delete local details and show login screen
    - Get user priviledge
    - Get groups list for user
    - Get channels for user for group
    - Get messages for channel
  - If user details not saved
    - Show login screen
    - authenticate user details
      - If correct, save them
  - If Group admin or super admin, show group, channel and participants managment options





Data structures: