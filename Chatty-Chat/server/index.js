var bodyParser = require('body-parser');
var express = require("express");
var app = express();
var http = require("http").Server(app);
var fs = require('fs');

var fNameUsers = 'users.txt';
var fNameUsernames = 'usernames.txt';
var fNameGroups = 'groups.txt';
var fNameChannels = 'channels.txt';
var fNameMessages = 'messages.txt';
var fNameId = 'id.txt';

var users;
var usernames;
var groups;
var channels;
var messages;
var id;

setupFS();
startServer();

function setupFS(){
	try{
		fs.accessSync(fNameUsers, fs.constants.F_OK);
		fs.accessSync(fNameUsernames, fs.constants.F_OK);
		fs.accessSync(fNameGroups, fs.constants.F_OK);
		fs.accessSync(fNameChannels, fs.constants.F_OK);
		fs.accessSync(fNameMessages, fs.constants.F_OK);
		fs.accessSync(fNameId, fs.constants.F_OK);

		// if all files are OK, read them
		users = JSON.parse(fs.readFileSync(fNameUsers));
		usernames = JSON.parse(fs.readFileSync(fNameUsernames));
		groups = JSON.parse(fs.readFileSync(fNameGroups));
		channels = JSON.parse(fs.readFileSync(fNameChannels));
		messages = JSON.parse(fs.readFileSync(fNameMessages));
		id = JSON.parse(fs.readFileSync(fNameId));

		console.log("Red files and restored state");

	}catch(error){
		// one or more files do not exist or are inacccessible
		// create blank state
		initState();
		console.log("Files unavailable! new state created");
	}
}

function initState(){
	users = {
		0:{active:true, superadmin:true, groupadmin:true, username:'superadmin', useremail:'super@admin.com', color:0, groups:{}},
	};
	usernames = {'superadmin':0,};
	groups = {};
	channels = {};
	messages = {};
	id = 1;

	saveUsers();
	saveGroups();
	saveChannels();
	saveMessages();
	saveIDCounter();
}

function startServer(){
	app.use(bodyParser.json())
	app.use(express.static(__dirname + "./dest"));
	app.use(function(req, res, next) {
		res.header("Access-Control-Allow-Origin", "*");
		res.header("Access-Control-Allow-Headers", "*");
		next();
	});
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
	app.post("/new-user", (req, res) => {
		res.send(JSON.stringify(routeNewUser(req)));
	});
	app.post("/manage-group", (req, res) => {
		res.send(JSON.stringify(routeManageGroup(req)));
	});
	app.post("/manage-channel", (req, res) => {
		res.send(JSON.stringify(routeManageChannel(req)));
	});
	app.post("/manage-users", (req, res) => {
		res.send(JSON.stringify(routeManageUsers(req)));
	});
	app.post("/update-group", (req, res) => {
		res.send(JSON.stringify(routeUpdateGroup(req)));
	});
	app.post("/update-channel", (req, res) => {
		res.send(JSON.stringify(routeUpdateChannel(req)));
	});
	app.post("/update-users", (req, res) => {
		res.send(JSON.stringify(routeUpdateUsers(req)));
	});
	
	console.log("server starting");
	http.listen(3000);
}

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

	saveUserGroupChannelState();
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

	saveUserGroupChannelState();
	saveMessages();
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

	saveUserGroupChannelState();
	saveMessages();
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

	saveUserGroupChannelState();
	saveMessages();
	return response;
}

// process the new user route
// checks permission, adds new user to users
function routeNewUser(req){
	// template
	let response = templateResponse();

	// if user exists
	let userID = req.body.userID;
	if(userID in users){

		let user = users[userID];

		// check if user has permission
		if(user.groupadmin || user.superadmin){

			//check if user already exists
			let user_details = req.body.newUser;
			if(!(user_details.username in usernames)){

				// generate group, add it to the groups and user
				let user_id = generateID();
				let new_user = {
					active:true, 
					superadmin:user_details.superadmin, 
					groupadmin:user_details.groupadmin, 
					username:user_details.username, 
					useremail:user_details.useremail, 
					color:user_details.color, 
					groups:{}};
				users[user_id] = new_user;
				usernames[user_details.username] = user_id;

				response.data = user_id;

			// username already exists
			}else{
				response.error = 'Username already exists';
			}

		// user does not have permission
		}else{
			response.error = 'User does not have the necessary permission';
		}

	// if user cannot be found
	}else{
		response.error = 'User does not exist';
	}

	saveUserGroupChannelState();
	return response;
}

// process the manage group route
// check for permission, return list of all users, available ids and selected ids
function routeManageGroup(req){
	// template
	let response = templateResponse();

	// if user exists
	let userID = req.body.userID;
	if(userID in users){

		let user = users[userID];

		// check if user has permission
		if(user.groupadmin || user.superadmin){

			// check if groups exists
			let groupID = req.body.groupID;
			if(groupID in groups){

				// get relavant user data
				let relevant_users = [];
				let availableIDs = [];
				for(let userID in users){
					let user = users[userID];
					relevant_users.push({
						userID:Number(userID),
						username:user.username,
						useremail:user.useremail,
					});
					availableIDs.push(userID);
				}

				// get user ids that are in the group
				let selectedIDs = groups[groupID].participants;

				response.data = {
					availableUsers:relevant_users,
					selectedIDs:selectedIDs,
				};

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

// process the manage channel route
// check for permission, return list of all users, available ids and selected ids
function routeManageChannel(req){
	// template
	let response = templateResponse();

	// if user exists
	let userID = req.body.userID;
	if(userID in users){

		// check if user has permission
		let user = users[userID];
		if(user.groupadmin || user.superadmin){

			// check if channel exists
			let channelID = req.body.channelID;
			if(channelID in channels){

				let channel = channels[channelID];
				let groupID = channel.group;
				let group = groups[groupID];

				// get relavant user data
				let relevant_users = [];
				let availableIDs = [];
				for(let userID of group.participants){
					let user = users[userID];
					relevant_users.push({
						userID:Number(userID),
						username:user.username,
						useremail:user.useremail,
					});
					availableIDs.push(userID);
				}

				// get user ids that are in the group
				let selectedIDs = channel.participants;

				response.data = {
					availableUsers:relevant_users,
					selectedIDs:selectedIDs,
				};

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

// process the manage users route
// check for permission, return list of all users
function routeManageUsers(req){
	// template
	let response = templateResponse();

	// if user exists
	let userID = req.body.userID;
	if(userID in users){

		// check if user has permission
		let user = users[userID];
		if(user.groupadmin || user.superadmin){

			// get relavant user data
			let relevant_users = [];
			let selectedIDs = [];
			for(let userID in users){
				let user = users[userID];
				relevant_users.push({
					userID:Number(userID),
					username:user.username,
					useremail:user.useremail,
				});
				selectedIDs.push(Number(userID));
			}

			response.data = {
				availableUsers:relevant_users,
				selectedIDs:selectedIDs,
			};

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

// process the update group route
// check for permission, add and remove users accordingly
function routeUpdateGroup(req){
	// template
	let response = templateResponse();

	// if user exists
	let userID = req.body.userID;
	if(userID in users){

		// check if user has permission
		let user = users[userID];
		if(user.groupadmin || user.superadmin){

			// check if groups exists
			let groupID = req.body.groupID;
			if(groupID in groups){

				let group = groups[groupID];
				let add = req.body.add;
				let remove = req.body.remove;

				// add users to groups and groups to users
				for(let userID of add){
					users[userID].groups[groupID] = [];
					group.participants.push(userID);
				}

				// remove users from groups and its channels and remove channels and groups from user
				for(let userID of remove){
					// remove user from channels of group
					for(let channelID of users[userID].groups[groupID]){
						let channel = channels[channelID];
						let index = channel.participants.indexOf(userID);
						channel.participants.splice(index, 1);
					}

					// remove user from group
					let index = group.participants.indexOf(userID);
					group.participants.splice(index, 1);

					// remove group and channels from user
					delete users[userID].groups[groupID];
				}
			

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

	saveUserGroupChannelState();
	saveMessages();
	return response;
}

// process the update channel route
// check for permission, add and remove users accordingly
function routeUpdateChannel(req){
	// template
	let response = templateResponse();

	// if user exists
	let userID = req.body.userID;
	if(userID in users){

		// check if user has permission
		let user = users[userID];
		if(user.groupadmin || user.superadmin){

			// check if groups exists
			let channelID = req.body.channelID;
			if(channelID in channels){

				let channel = channels[channelID];
				let groupID = channel.group;
				let group = groups[groupID];
				let add = req.body.add;
				let remove = req.body.remove;

				// add users to channels and add channels to users
				for(let userID of add){
					channel.participants.push(userID);
					users[userID].groups[groupID].push(channelID);
				}

				// remove users from channels and remove channels from users
				for(let userID of remove){
					let i = channel.participants.indexOf(userID);
					channel.participants.splice(i, 1);
					let j = users[userID].groups[groupID].indexOf(channelID);
					users[userID].groups[groupID].splcie(j, 1);
				}

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

	saveUserGroupChannelState();
	saveMessages();
	return response;
}

// process the update users route
// check for permission, add and remove users accordingly
function routeUpdateUsers(req){
	// template
	let response = templateResponse();

	// if user exists
	let userID = req.body.userID;
	if(userID in users){

		// check if user has permission
		let user = users[userID];
		if(user.groupadmin || user.superadmin){

			let remove = req.body.remove;

			// remove users from groups, channels and existance
			for(let userID of remove){
				let user = users[userID];
				let username = user.username;

				// remove user from groups and channels
				for(groupID in user.groups){
					// remove from all channels
					for(channelID of user.groups[groupID]){
						let channel = channels[channelID];
						let index = channel.participants.indexOf(userID);
						channel.participants.splice(index, 1);
					}

					// remove from group
					let group = groups[groupID];
					let index = group.participants.indexOf(userID);
					group.participants.splice(index, 1);
				}

				// remove user
				users[userID].active = false;
				delete usernames[username];
			}
		

			response.data = true;

		// user does not have permission
		}else{
			response.error = 'User does not have the necessary permission';
		}

	// if user cannot be found
	}else{
		response.error = 'User does not exist';
	}

	saveUserGroupChannelState();
	saveMessages();
	return response;
}

function saveUsers(){
	fs.writeFile(fNameUsers, JSON.stringify(users));
	fs.writeFile(fNameUsernames, JSON.stringify(usernames));
}

function saveGroups(){
	fs.writeFile(fNameGroups, JSON.stringify(groups));
}

function saveChannels(){
	fs.writeFile(fNameChannels, JSON.stringify(channels));
}

function saveMessages(){
	fs.writeFile(fNameMessages, JSON.stringify(messages));
}

function saveIDCounter(){
	fs.writeFile(fNameId, JSON.stringify(id));
}

function saveUserGroupChannelState(){
	saveUsers();
	saveGroups();
	saveChannels();
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
	id++;
	saveIDCounter();
	return id;
}