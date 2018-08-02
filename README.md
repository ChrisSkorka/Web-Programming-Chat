# Web-Programming-Chat
Web programming assignment chat web app

Requirements / appication model
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