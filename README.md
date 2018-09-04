# Web-Programming-Chat
Web programming assignment chat web app

Description: web application for users to communicate in chennels of groups to other participants in real time.

## Git
- Chatty-Chat:      Chat angular and server application source code
  - src:              client source code (angular)
  - server:           server source code (nodejs)
- prototyping:      maily screen design prototyping
- media:            assest and corresponding production files

## Requirements / appication model:
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

## Functions:
- Server
  - Check if autherised for all actions
    - Return error structures to unautherisd requests
  - Recieve login data and return status
  - Serve website
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
  - Store groups, channels and messages
  - Store user data
  - Add\Remove groups
  - Add\Remove channels
  - Add\Remove users
- Browser
  - If user details saved
    - Check autherisation with server
      - If incorrect, delete local details and show login screen
    - Get user priviledge
    - Get groups list for user
    - Get channels for user for group
    - Get messages for channel
      - Periodicially check if messages available
  - If user details not saved
    - Show login screen
    - authenticate user details
      - If correct, save them
  - If Group admin or super admin, show group, channel and participants managment options

## Data structures:

Key:
- { name1: type1 => name2: type2 } denotes a mapping of name1: type1 onto name2: type2
- ( fiel1: type1, ... ) denotes an object with fields file1: type1, ...
- [ name: type ]  denotes an array of elements of type type

### Server representation:
In the server representation users, groups and channels are all doubly linked
This is to improve access and writing efficiency

#### Users
---
User objects contain basic information and references to the groups and channels thay are part of. Usernames allows fast checks of usernames (ie does such a user exists).

users: { userID:int -> (
  active: boolean,
  superadmin: boolean,
  groupadmin: boolean,
  username: string,
  useremail: string,
  colo: int,
  groups: { groupID:int => [channelID: int ]}
)}

usernames: { username: string => userID }

#### Passwords
---
Passwords are not yet implemented.

passwords: { userID:int => (
  passwordHash: string,
  passwordSaltL string,
)}

#### Groups
---
Groups contain their name and references to its participants and channels.

groups: { groupID => (
  name: string,
  participants: [ userID:int ],
  channels: [ channelID:int ],
)}


#### Channels
---
Channels contain name and references to the group they belong to and its participants.

channels: { channelID:int => (
  groupID: int,
  name: string,
  participants: [ userID:int ],
)}

#### Messsages
---
Messages are indexed by they channel ID (map from ID to message history). Each message contains a reference to the sender, the content and datetime in seconds from epoch format. Messages are stored seperate from channels to improve write and access performance. 

messages: { channelID:int => [
  message: (
    userID: int,
    content: string,
    datetime: int,
  ) 
]}


### Client representation
In the client representation objects contain the data directly rather than linking to other strscture.

#### User Token
USed to identify a signed in user

userID: int

#### User
---
A single user object with basic information about the signin user as well as references to the users groups and channels.

user: (
  active: boolean,
  superadmin: boolean,
  groupadmin: boolean,
  username: string,
  useremail: string,
  colo: int,
  groups: { groupID:int => [ channelID: int ]}
)

#### User's Groups and Channels
List of groups the user is part of. Each group has lists of channels that the user is part of. This is used to build the group and channel list.

usersGroups: [ 
  group: (
    groupID: int,
    name: string,
    channels: [
      channel: (
        channelID: int,
        name: string,
      )
    ],
  )
]

#### Channel's participants
The participant list contained in this structure is dependent on teh channel currently selected. Each participant contains the username, color and isadminstatus. Note that isadmin is true if the user is either groupadmin or superadmin.

participants: [  
  participant:(
    username: string,
    color: int,
    isadmin: boolean,
  )
]

#### Messages
The message histpry contained in this structure depends on the channel currently selected. Each message contains the senders username, content, datetime in a readable format and user's color.

messages: [
  message: (
    username: string,
    content: string,
    datetime: string,
    color: int,
  )
]

#### Managing Users
This strcture is used to manage user. It can be used to add users to and remove them from groups, channels and the service. availableUsers is a list of all users that qualify given the context (ie only users is the parent group can be added to a channel). selectedUserID is a list of ids that is included in the to be managed entiry (ie users part of a channel).

manageUsers: {
  availableUsers: {
    userID: int,
    username: string,
    useremail: string,
  },
  selectedUserID: [ userID: int ],
}

## REST API - Routes

### Client routes
Routes created by the client locally in the borwser

- /           default route, redirects to login or dash depending on signed in status
- /login      ligin screen
- /dash       signin dashboard with all functionality dependign on user

### Server post routes
Routes used to transfere reques and data bestween client and server. Note User toke is shorted to UT, UT's are use for most request to verify authority to perform an action.

- /login            verfies a login rerquest
  - In:               username and password
  - Out:              user token or error
- /user             provides user information
  - In:               user token
  - Out:              user information, group and channel lists
- /channel          open channel
  - In:               UT, channel ID
  - Out:              refactored messages history, refactored participaUT list
- /new-group        create a group
  - In:               UT (creator), name
  - Out:              success status
- /new-channel      create a channel
  - In:               UT (creator), parent group, name
  - Out:              success status
- /new-user         creates a new user
  - In:               UT (creator), name, email, permissions, color
  - Out:              succes status
- /delete-group     delete a group and all its channels
  - In:               UT, groups ID
  - Out:              success status
- /delete-channel   delete a channel
  - In:               UT, channel ID
  - Out:              success status
- /manage-group     serve list of users relevant to a group to be governed
  - In:               UT, group ID
  - Out:              list of relevant users
- /manage-channel   serve list of users relevant to a channel to be governed
  - In:               UT, channel ID
  - Out:              list of relevant users
- /manage-users     serve list of user in the system to be governed
  - In:               UT
  - Out:              list of relevant users
- /update-group     add and remove user from a group and its channels
  - In:               UT, users to add, users to remove
  - Out:              success status
- /update-channel   add and remove users from a channel
  - In:               UT, users to add, userd to remove
  - Out:              success status
- /update-users     remove people from the system
  - In:               UT, users to be removed, (users to be add is ingnored but present)
  - Out:              success status

## Angular Architecture

