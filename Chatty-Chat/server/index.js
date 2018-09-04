// imports
var bodyParser = require('body-parser');
var express = require("express");
var app = express();
var http = require("http").Server(app);
var fs = require('fs');

// filenames
var fNameUsers = 'users.txt';
var fNameUsernames = 'usernames.txt';
var fNameGroups = 'groups.txt';
var fNameChannels = 'channels.txt';
var fNameMessages = 'messages.txt';
var fNameId = 'id.txt';

// datastructures/state
var users;
var usernames;
var groups;
var channels;
var messages;
var id;

// setup files/filesystem
setupFS();
// start srver
startServer();

// ensure file and state is in working order
// checks if file are accessible, if not it creates a new blank state
function setupFS(){
	try{
		// check all files are accessible
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

		console.log("files OK and state restored");

	}catch(error){
		// one or more files do not exist or are inaccessible
		// create blank state
		initState();
		console.log("Files unavailable! new state created");
	}
}

// nitialize a new blank state
function initState(){

	// default values (superadmin is default user)
	users = {
		0:{active:true, superadmin:true, groupadmin:true, username:'superadmin', useremail:'super@admin.com', color:0, groups:{}},
	};
	usernames = {'superadmin':0,};
	groups = {};
	channels = {};
	messages = {};
	id = 1;

	// save everything
	saveUsers();
	saveGroups();
	saveChannels();
	saveMessages();
	saveIDCounter();
}

//start server
// sets up server, uses and post request processing
function startServer(){
	// main settings
	app.use(bodyParser.json())
	app.use(express.static(__dirname + "\\..\\dist\\Chatty-Chat"));
	app.use(function(req, res, next) {
		res.header("Access-Control-Allow-Origin", "*");
		res.header("Access-Control-Allow-Headers", "*");
		next();
	});

	// all routes and post requests with the corresponding function 
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
	
	// begin listening for connections
	http.listen(3000);
	console.log("server started");
}

// proces the login route
// either returns the user id or an error
function routeLogin(req){
	// template
	let response = templateResponse();

	// if the user exists return the user id
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
// returns the user data for a given userID and corresponding groups and channels
function routeUser(req){
	// template
	let response = templateResponse();

	// if user exists
	if(req.body.userID in users){
		let user = users[req.body.userID];
		let usersGroups = [];

		// if superuser, all groups and channels are returned
		if(user.superadmin){

			// add all groups and their channels
			for(let groupID in groups){

				// add all channels
				let usersChannels = [];
				for(let channelID of groups[groupID].channels){
					usersChannels.push({
						ID:channelID,
						name:channels[channelID].name,
					});
				}

				// add a group object to the list
				usersGroups.push({
					ID:groupID,
					name:groups[groupID].name,
					channels:usersChannels,
				});
			}

		// if normal user or groupadmin return groups and channels they are in
		}else{
			
			// get list of groups from group ID list
			for(let groupID in user.groups){

				// get list of channels from channel ID list
				let usersChannels = [];
				for(let channelID of user.groups[groupID]){

					// channel data initially needed by client
					let channel = channels[channelID];
					usersChannels.push({
						ID:channelID,
						name:channel.name,
					});
				}

				// group data initially needed by client
				let usersGroup = groups[groupID];
				usersGroups.push({
					ID:groupID, 
					name:usersGroup.name,
					channels:usersChannels,
				});
			}
		}


		// compose response
		response.data = {userdata:user, groups:usersGroups};

	// if user cannot be found
	}else{
		response.error = 'User does not exist';
	}

	return response;
}

// process the channel route
// returns the channel's participants and messages
function routeChannel(req){
	// template
	let response = templateResponse();

	// if user exists
	if(req.body.userID in users){

		// get list of all the participants
		// get channel participants into client compatible format
		let formattedParticipants = [];
		for(let participant of channels[req.body.channelID].participants){
			formattedParticipants.push({
				username:users[participant].username,
				color:users[participant].color,
				isadmin:users[participant].groupadmin,
			});
		}

		// get messages into client compatible format with aditional data (color, username)
		let formattedMessages = [];
		for(let message of messages[req.body.channelID]){
			let datetime = new Date(message.datetime);
			datetime = datetime.toLocaleTimeString() + " " + datetime.toLocaleDateString();
			formattedMessages.push({
				username:users[message.sender].username,
				content:message.content,
				datetime:datetime,
				color:users[message.sender].color,
			});
		}

		response.data = {participants:formattedParticipants, messages:formattedMessages};
		
	// if user cannot be found
	}else{
		response.error = 'User does not exist';
	}

	return response;
}

// process the new group route
// check permission, creates the group, adds the creator or return error
function routeNewGroup(req){
	// template
	let response = templateResponse();

	// if user exists
	let userID = req.body.userID;
	if(userID in users){

		// check if user has permission
		let user = users[userID];
		if(user.groupadmin || user.superadmin){

			// generate group, add it to the groups and user and add user to it
			let groupName = req.body.name;
			let groupID = generateID();
			let newGroup = {name:groupName, participants:[userID], channels:[]};
			groups[groupID] = newGroup;
			user.groups[groupID] = [];

			response.data = groupID;

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

		// check if user has permission
		let user = users[userID];
		if(user.groupadmin || user.superadmin){

			// check if groups exists
			let groupID = req.body.groupID;
			if(groupID in groups){

				// generate channel, add it to the group and channels and user
				let channelName = req.body.name;
				let channelID = generateID();
				let newChannel = {group:groupID, name:channelName, participants:[userID]};
				groups[groupID].channels.push(channelID);
				channels[channelID] = newChannel;
				messages[channelID] = [];
				user.groups[groupID].push(channelID);

				response.data = channelID;

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

		// check if user has permission
		let user = users[userID];
		if(user.groupadmin || user.superadmin){

			// check if groups exists
			let groupID = req.body.groupID;
			if(groupID in groups){

				// delete group from groups and users
				let group = groups[groupID];
				let groupChannels = group.channels;
				
				// remove channel from channels and message from messages
				for(let channelID of groupChannels){
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

		// check if user has permission
		let user = users[userID];
		if(user.groupadmin || user.superadmin){

			//check if user already exists
			let newUser = req.body.newUser;
			if(!(newUser.username in usernames)){

				// generate user, add it to users
				let newUserID = generateID();
				users[newUserID] = {
					active:true, 
					superadmin:newUser.superadmin, 
					groupadmin:newUser.groupadmin, 
					username:newUser.username, 
					useremail:newUser.useremail, 
					color:newUser.color, 
					groups:{}};
				usernames[newUser.username] = newUserID;

				response.data = newUserID;

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
// check for permission, returns all users, user ids of group
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

				// get all users
				let availableUsers = [];
				for(let userID in users){
					let user = users[userID];
					availableUsers.push({
						userID:Number(userID),
						username:user.username,
						useremail:user.useremail,
					});
				}

				// get user ids that are in the group
				let selectedIDs = groups[groupID].participants;

				response.data = {
					availableUsers:availableUsers,
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
// check for permission, returns users in group, user ids of channel
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

				// get users from group
				let availableUsers = [];
				for(let userID of group.participants){
					let user = users[userID];
					availableUsers.push({
						userID:Number(userID),
						username:user.username,
						useremail:user.useremail,
					});
				}

				// get user ids from the channel
				let selectedIDs = channel.participants;

				response.data = {
					availableUsers:availableUsers,
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
// check for permission, return all users, all user ids
function routeManageUsers(req){
	// template
	let response = templateResponse();

	// if user exists
	let userID = req.body.userID;
	if(userID in users){

		// check if user has permission
		let user = users[userID];
		if(user.groupadmin || user.superadmin){

			// get all users and all user ids
			let availableUsers = [];
			let selectedIDs = [];
			for(let userID in users){
				let user = users[userID];
				availableUsers.push({
					userID:Number(userID),
					username:user.username,
					useremail:user.useremail,
				});
				selectedIDs.push(Number(userID));
			}

			response.data = {
				availableUsers:availableUsers,
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
// check for permission, adds and removes users accordingly
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

				// user ids in add are added to the group
				// add users to groups and groups to users
				for(let userID of add){
					users[userID].groups[groupID] = [];
					group.participants.push(userID);
				}

				// user ids in remove are removed from the group
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
// check for permission, adds and removes users accordingly
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

				// user ids in add are added to the channel
				// add users to channels and add channels to users
				for(let userID of add){
					channel.participants.push(userID);
					users[userID].groups[groupID].push(channelID);
				}

				// user ids in remove are removed from the channel
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
// check for permission, removes users accordingly
// the user iself is deactivated to allow messages to reatain relevant links
// once deactivated a user with the same name can be created again
function routeUpdateUsers(req){
	// template
	let response = templateResponse();

	// if user exists
	let userID = req.body.userID;
	if(userID in users){

		// check if user has permission
		let user = users[userID];
		if(user.superadmin){

			let remove = req.body.remove;

			// user ids in remove are removed from the system
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

// saves users and usernames to file
function saveUsers(){
	fs.writeFile(fNameUsers, JSON.stringify(users), (error) => {
		// notify of the error
		console.log('Error writing '+fNameUsers);
		console.log(error);
	  });
	fs.writeFile(fNameUsernames, JSON.stringify(usernames, (error) => {
		// notify of the error
		console.log('Error writing '+fNameUsernames);
		console.log(error);
	  }));
}

// saves groups to file
function saveGroups(){
	fs.writeFile(fNameGroups, JSON.stringify(groups), (error) => {
		// notify of the error
		console.log('Error writing '+fNameGroups);
		console.log(error);
	  });
}

// saves channels to file
function saveChannels(){
	fs.writeFile(fNameChannels, JSON.stringify(channels), (error) => {
		// notify of the error
		console.log('Error writing '+fNameChannels);
		console.log(error);
	  });
}

// saves messages to file
function saveMessages(){
	fs.writeFile(fNameMessages, JSON.stringify(messages), (error) => {
		// notify of the error
		console.log('Error writing '+fNameMessages);
		console.log(error);
	  });
}

// saves id counter to file
function saveIDCounter(){
	fs.writeFile(fNameId, JSON.stringify(id), (error) => {
		// notify of the error
		console.log('Error writing '+fNameId);
		console.log(error);
	  });
}

// save users, usernames, groups and channels (for convinience)
function saveUserGroupChannelState(){
	saveUsers();
	saveGroups();
	saveChannels();
}

// template response, data and/or error is inserted
function templateResponse(){
	return {
		data: null,
		error: null,
	};
}

// generate a new unique ID and return it
function generateID(){
	id++;
	saveIDCounter();
	return id;
}