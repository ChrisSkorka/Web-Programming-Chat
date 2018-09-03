var bodyParser = require('body-parser');
var express = require("express");
var app = express();
var http = require("http").Server(app);

// - Users:{ ID:int -> ... }
//   - SuperAdmin:boolean
//   - Username:string
//   - Email:string
//   - ChatColor:int
//   - Groups:{ ID:int -> ... }
//     - Channels:{ ID:int }
// - Passwords:{ ID -> ... }
//   - PasswordHash:string
//   - PasswordSalt:string
// - Groups:{ ID:int -> ... }
//   - Name:string
//   - Participants:[int]
//   - GroupAdmins:[int]
//   - Channels:[int]
// - Channels:{ ID:int -> ... }
//   - Groupd:int
//   - Namne:string
//   - Participants:[int]
// - Messages:{ Channel:int -> ... }
//   - Messages:[]
//     - Sender:int
//     - Content:string
//     - Datetime:int

var users = {
	0:{active:true, superadmin:true, groupadmin:true, username:'admin', useremail:'super@admin.c', color:0, groups:{0:[0], 1:[2]}},
	1:{active:true, superadmin:false, groupadmin:true, username:'gadmin', useremail:'group@admin.c', color:100, groups:{0:[0, 1]}},
	2:{active:true, superadmin:false, groupadmin:false, username:'user', useremail:'loser@user.c', color:200, groups:{0:[0, 1], 1:[2]}},
};

var usernames = {
	'admin':0,
	'gadmin':1,
	'user':2,
};

var groups = {
	0:{name:'WeAreNumberOne', participants:[0, 1, 2], channels:[0, 1]},
	1:{name:'WeAreNumberTwo', participants:[0, 2], channels:[2]},
};

var channels = {
	0:{group:0, name:'NowListenClosely', participants:[0, 1, 2]},
	1:{group:0, name:'HeresALittleLesson', participants:[1, 2]},
	2:{group:1, name:'BeepTest', participants:[0, 2]},
};

var messages = {
	0:[
		{sender:0, content:'Now Listen Closely', datetime:0},
		{sender:2, content:'Heres a little lesson', datetime:0},
	],
	1:[

	],
	2:[
		{sender:1, content:'Whats the beep test?', datetime:0},
		{sender:2, content:'The 20m multistage fitness test (MSFT) is a commonly used maximal running aerobic fitness test. It is also known as the 20 meter shuttle run test, beep or bleep test among other names.', datetime:0},
	],
};

var id = 10;

app.use(bodyParser.json())
app.use(express.static(__dirname + "./dest"));
app.use(function(req, res, next) {
	res.header("Access-Control-Allow-Origin", "*");
	res.header("Access-Control-Allow-Headers", "*");
	next();
  });
// app.get("/account", function (req, res) {
//     res.sendFile(__dirname + "/www/account.html");
// });
app.post("/login", (req, res) => {
    res.send(JSON.stringify(routeLogin(req)));
});
app.post("/user", (req, res) => {
    res.send(JSON.stringify(routeUser(req)));
});
app.post("/channel", (req, res) => {
    res.send(JSON.stringify(routeChannel(req)));
});
app.post("/new-group", (req, res) => {
    res.send(JSON.stringify(routeNewGroup(req)));
});
app.post("/new-channel", (req, res) => {
    res.send(JSON.stringify(routeNewChannel(req)));
});
app.post("/delete-group", (req, res) => {
    res.send(JSON.stringify(routeDeleteGroup(req)));
});
app.post("/delete-channel", (req, res) => {
    res.send(JSON.stringify(routeDeleteChannel(req)));
});

// proces the login route
// either returns the user id or an error
function routeLogin(req){
	// template
	let response = templateResponse();

	// if the user exists return the user data
	if(req.body.username in usernames){
		let userID = usernames[req.body.username];
		response.data = userID;

	// if the user does not exist, return an error
	}else{
		response.error = 'User does not exist';
	}
	
	return response;
}

// process the user route
// returns the user data for a given userID
function routeUser(req){
	// template
	let response = templateResponse();

	// if user exists
	if(req.body.userID in users){
		let user = users[req.body.userID];
		let group_list = [];

		// get list of groups from group ID list
		let users_groups = user.groups;
		for(let groupID in user.groups){

			// get list of channels from channel ID list
			let channel_list = [];
			for(let channelID of user.groups[groupID]){

				// channel data initially needed by client
				let channel_item = channels[channelID];
				channel_list.push({
					ID:channelID,
					name:channel_item.name,
				});
			}

			// group data initially needed by client
			let group_item = groups[groupID];
			group_list.push({
				ID:groupID, 
				name:group_item.name,
				channels:channel_list,
			});
		}

		// compose response
		response.data = {userdata:user, groups:group_list};

	// if user cannot be found
	}else{
		response.error = 'User does not exist';
	}

	return response;
}

// process the channel route
// returns the channel participants and messages
function routeChannel(req){
	// template
	let response = templateResponse();

	// if user exists
	if(req.body.userID in users){

		// get participants into client compatible format
		let formatted_participants = [];
		for(let participant of channels[req.body.channelID].participants){
			formatted_participants.push({
				username:users[participant].username,
				color:users[participant].color,
				isadmin:users[participant].groupadmin,
			});
		}

		// get messages into client compatible format
		let formatted_messages = [];
		for(let message of messages[req.body.channelID]){
			let datetime = new Date(message.datetime);
			datetime = datetime.toLocaleTimeString() + " " + datetime.toLocaleDateString();
			formatted_messages.push({
				username:users[message.sender].username,
				content:message.content,
				datetime:datetime,
				color:users[message.sender].color,
			});
		}

		response.data = {participants:formatted_participants, messages:formatted_messages};
		
	// if user cannot be found
	}else{
		response.error = 'User does not exist';
	}

	return response;
}

// process the new group route
// check permission, creates the group, adds the creator and returns feedback
function routeNewGroup(req){
	// template
	let response = templateResponse();

	// if user exists
	let userID = req.body.userID;
	if(userID in users){

		let user = users[userID];

		// check if user has permission
		if(user.groupadmin || user.superadmin){

			// generate group, add it to the groups and user
			let group_name = req.body.name;
			let group_id = generateID();
			let new_group = {name:group_name, participants:[userID], channels:[]};
			groups[group_id] = new_group;
			user.groups[group_id] = [];

			response.data = group_id;

		// user does not have permission
		}else{
			response.error = 'User does not have the necessary permission';
		}

	// if user cannot be found
	}else{
		response.error = 'User does not exist';
	}

	return response;
}

// process the new channel route
// check permission, creates the channel, adds the creator and returns feedback
function routeNewChannel(req){
	// template
	let response = templateResponse();

	// if user exists
	let userID = req.body.userID;
	if(userID in users){

		let user = users[userID];

		// check if user has permission
		if(user.groupadmin || user.superadmin){

			let groupID = req.body.groupID;

			// check if groups exists
			if(groupID in groups){
				// generate channel, add it to the group and channels and user
				let channel_name = req.body.name;
				let channel_id = generateID();
				let new_channel = {group:groupID, name:channel_name, participants:[userID]};
				groups[groupID].channels.push(channel_id);
				channels[channel_id] = new_channel;
				messages[channel_id] = [];
				user.groups[groupID].push(channel_id);

				response.data = channel_id;

			// groups does not exist
			}else{
				response.error = 'Specified group does not exist';
			}

		// user does not have permission
		}else{
			response.error = 'User does not have the necessary permission';
		}

	// if user cannot be found
	}else{
		response.error = 'User does not exist';
	}

	return response;
}

// process the delete group route
// check permission, delete group from groups and users
function routeDeleteGroup(req){
	// template
	let response = templateResponse();

	// if user exists
	let userID = req.body.userID;
	if(userID in users){

		let user = users[userID];

		// check if user has permission
		if(user.groupadmin || user.superadmin){

			let groupID = req.body.groupID;

			// check if groups exists
			if(groupID in groups){

				// delete group from groups and users
				let group = groups[groupID];
				let group_channels = group.channels;
				
				// remove channel from channels and message from messages
				for(let channelID of group_channels){
					delete channels[channelID];
					delete messages[channelID];
				}

				// remove group from users
				for(let participantID of group.participants){
					delete users[participantID].groups[groupID];
				}

				// remove group from groups
				delete groups[groupID];

				response.data = true;

			// groups does not exist
			}else{
				response.error = 'Specified group does not exist';
			}

		// user does not have permission
		}else{
			response.error = 'User does not have the necessary permission';
		}

	// if user cannot be found
	}else{
		response.error = 'User does not exist';
	}

	return response;
}

// process the delete channel route
// check permission, delete group from groups and users
function routeDeleteChannel(req){
	// template
	let response = templateResponse();

	// if user exists
	let userID = req.body.userID;
	if(userID in users){

		let user = users[userID];

		// check if user has permission
		if(user.groupadmin || user.superadmin){

			let channelID = req.body.channelID;

			// check if channel exists
			if(channelID in channels){

				let channel = channels[channelID];
				let groupID = channel.group;
				let group = groups[groupID];
				
				// remove channel from group
				let index = group.channels.indexOf(channelID);
				group.channels.splice(index, 1);

				// remove channel from users
				for(let participantID of channel.participants){
					let index = users[participantID].groups[groupID].indexOf(channelID);
					users[participantID].groups[groupID].splice(index, 1);
				}

				// remove channel from channel and messages from messages
				delete channels[channelID];
				delete messages[channelID];

				response.data = true;

			// channel does not exist
			}else{
				response.error = 'Specified channel does not exist';
			}

		// user does not have permission
		}else{
			response.error = 'User does not have the necessary permission';
		}

	// if user cannot be found
	}else{
		response.error = 'User does not exist';
	}

	return response;
}

// template response
function templateResponse(){
	return {
		data: null,
		error: null,
	};
}

// generate a new ID and return it
function generateID(){
	return id++;
}

console.log("server starting");
http.listen(3000);