// imports
var bodyParser = require('body-parser');
var express = require("express");
var app = express();
var http = require("http").Server(app);
var fs = require('fs');
var mongo = require('mongodb').MongoClient;

// database settings
var url = "mongodb://localhost:27017/";
var dbName = "chattychat";

var collectionNameUsers 	= "users";
var collectionNameUseranmes = "usernames";
var collectionNameGroups 	= "groups";
var collectionNameChannels 	= "channels";
var collectionNameMessages 	= "messages";
var collectionNameConfig 	= "config";

// database collections
var dbServer;
var users;
var usernames;
var groups;
var channels;
var messages;
var config;


// connect and setup database
setupDatabase();

// start srver
startServer();

// connect to database
function setupDatabase(){

	mongo.connect(url, function(err, dbs){
		if (err) throw err;

		// connect to database
		dbServer = dbs
		let db = dbServer.db(dbName);

		// once connected, register on exit signal handler to close db
		process.on('exit', 		exitHandler.bind(null, {cleanup:true}));
		process.on('SIGINT', 	exitHandler.bind(null, {exit:true}));
		process.on('SIGUSR1', 	exitHandler.bind(null, {exit:true}));
		process.on('SIGUSR2', 	exitHandler.bind(null, {exit:true}));
		process.on('uncaughtException', exitHandler.bind(null, {exit:true}));

		// get collections
		users 		= db.collection(collectionNameUsers);
		usernames 	= db.collection(collectionNameUseranmes);
		groups 		= db.collection(collectionNameGroups);
		channels 	= db.collection(collectionNameChannels);
		messages 	= db.collection(collectionNameMessages);
		config		= db.collection(collectionNameConfig);

		// if no user exists, create the default super user
		db.collection("users").find({}).toArray(function(err, result) {
			if (err) throw err;
			console.log(result);
		});
	})
}

// program exit handler, closes database when the program finishes, crashes or is killed
function exitHandler(options, exitCode){
	dbServer.close();
	console.log("Disconnected from database");

	if (options.exit) process.exit();
}

// nitialize a new blank state
function initState(){

	// default values (superadmin is default user)
	users = {
		0:{active:true, superadmin:true, groupadmin:true, username:'super', useremail:'super@admin.com', color:0, groups:{}},
	};
	usernames = {'super':0,};
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
	app.use("/login", express.static(__dirname + "\\..\\dist\\Chatty-Chat"));
	app.use("/dash", express.static(__dirname + "\\..\\dist\\Chatty-Chat"));
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
	app.post("/send-message", (req, res) => {
		res.send(JSON.stringify(routeSendMessage(req)));
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

	// if the user exists return the user id
	let username = req.body.username
	if(username in usernames){
		let userID = usernames[username];
		return data(userID);

	// if the user does not exist, return an error
	}else{
		return error('User does not exist');
	}
}

// process the user route
// returns the user data for a given userID and corresponding groups and channels
function routeUser(req){

	// check if does exists
	if(!(req.body.userID in users))
		return error('User does not exist');

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
	return data({userdata:user, groups:usersGroups});
}

// process the channel route
// returns the channel's participants and messages
function routeChannel(req){

	// check if user exists
	if(!(req.body.userID in users))
		return error('User does not exist');

	// check if channel exists
	if(!(req.body.channelID in channels))
		return error('Channel does not exist');

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

	return data({participants:formattedParticipants, messages:formattedMessages});
}

// --- prototype ---
// process the send message route
function routeSendMessage(req){

	// if user does not exists
	if(!(req.body.userID in users))
		return error('User does not exist');
	
	// if channel or messages do not exists
	let channelID = req.body.channelID;
	if(!(channelID in channels && channelID in messages))
		return error('User does not exist');

	// add message
	let message = {
		sender: req.body.userID,
		content: req.body.content,
		datetime: req.body.datetime,
	}
	messages[channelID].push(message);
	
	saveMessages();
	return data(true);
}

// process the new group route
// check permission, creates the group, adds the creator or return error
function routeNewGroup(req){

	// check if user exists
	let userID = req.body.userID;
	if(!(userID in users))
		return error('User does not exist');

	// check if user has permission
	let user = users[userID];
	if(!user.groupadmin && !user.superadmin)
		return error('User does not have the necessary permission');

	// generate group, add it to the groups and user and add user to it
	let groupName = req.body.name;
	let groupID = generateID();
	let newGroup = {name:groupName, participants:[userID], channels:[]};
	groups[groupID] = newGroup;
	user.groups[groupID] = [];

	saveUserGroupChannelState();
	return data(groupID);
}

// process the new channel route
// check permission, creates the channel, adds the creator and returns feedback
function routeNewChannel(req){

	// check if user exists
	let userID = req.body.userID;
	if(!(userID in users))
		return error('User does not exist');

	// check if user has permission
	let user = users[userID];
	if(!user.groupadmin && !user.superadmin)
		return error('User does not have the necessary permission');

	// check if groups exists
	let groupID = req.body.groupID;
	if(!(groupID in groups))
		return error('Specified group does not exist');

	// generate channel, add it to the group and channels and user
	let channelName = req.body.name;
	let channelID = generateID();
	let newChannel = {group:groupID, name:channelName, participants:[userID]};
	groups[groupID].channels.push(channelID);
	channels[channelID] = newChannel;
	messages[channelID] = [];
	user.groups[groupID].push(channelID);

	saveUserGroupChannelState();
	saveMessages();
	return data(channelID);
}

// process the delete group route
// check permission, delete group from groups and users
function routeDeleteGroup(req){

	// check if user exists
	let userID = req.body.userID;
	if(!(userID in users))
		return error('User does not exist');

	// check if user has permission
	let user = users[userID];
	if(!user.groupadmin && !user.superadmin)
		return error('User does not have the necessary permission');

	// check if groups exists
	let groupID = req.body.groupID;
	if(!(groupID in groups))
		return error('Specified group does not exist');

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

	saveUserGroupChannelState();
	saveMessages();
	return data(true);
}

// process the delete channel route
// check permission, delete group from groups and users
function routeDeleteChannel(req){

	// check if user exists
	let userID = req.body.userID;
	if(!(userID in users))
		return error('User does not exist');

	let user = users[userID];

	// check if user has permission
	if(!user.groupadmin && !user.superadmin)
		return error('User does not have the necessary permission');

		let channelID = req.body.channelID;

	// check if channel exists
	if(!(channelID in channels))
		return error('Specified channel does not exist');

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

	saveUserGroupChannelState();
	saveMessages();
	return data(true);
}

// process the new user route
// checks permission, adds new user to users
function routeNewUser(req){

	// check if user exists
	let userID = req.body.userID;
	if(!(userID in users))
		return error('Username already exists');

	// check if user has permission
	let user = users[userID];
	if(!user.groupadmin && !user.superadmin)
		return error('User does not have the necessary permission');

	//check if user already exists
	let newUser = req.body.newUser;
	if(newUser.username in usernames)
		return error('User does not exist');

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

	saveUserGroupChannelState();
	return data(newUserID);
}

// process the manage group route
// check for permission, returns all users, user ids of group
function routeManageGroup(req){

	// check if user exists
	let userID = req.body.userID;
	if(!(userID in users))
		return error();

	let user = users[userID];

	// check if user has permission
	if(!user.groupadmin && !user.superadmin)
		return error();

	// check if groups exists
	let groupID = req.body.groupID;
	if(!(groupID in groups))
		return error();

	// get all users
	let availableUsers = [];
	for(let userID in users){
		let user = users[userID];
		
		// if user is active (not deleted)
		if(user.active){
			availableUsers.push({
				userID:Number(userID),
				username:user.username,
				useremail:user.useremail,
			});
		}
	}

	// get user ids that are in the group
	let selectedIDs = groups[groupID].participants;

	return data({availableUsers:availableUsers, selectedIDs:selectedIDs});
}

// process the manage channel route
// check for permission, returns users in group, user ids of channel
function routeManageChannel(req){

	// check if user exists
	let userID = req.body.userID;
	if(!(userID in users))
		return error('User does not exist');

	// check if user has permission
	let user = users[userID];
	if(!user.groupadmin && !user.superadmin)
		return error('User does not have the necessary permission');

	// check if channel exists
	let channelID = req.body.channelID;
	if(!(channelID in channels))
		return error('Specified group does not exist');

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

	return data({availableUsers:availableUsers, selectedIDs:selectedIDs});
}

// process the manage users route
// check for permission, return all users, all user ids
function routeManageUsers(req){

	// check if user exists
	let userID = req.body.userID;
	if(!(userID in users))
		return error('User does not exist');

	// check if user has permission
	let user = users[userID];
	if(!user.groupadmin && !user.superadmin)
		return error('User does not have the necessary permission');

	// get all users and all user ids
	let availableUsers = [];
	let selectedIDs = [];
	for(let userID in users){
		let user = users[userID];

		// if user is active (not deleted)
		if(user.active){
			availableUsers.push({
				userID:Number(userID),
				username:user.username,
				useremail:user.useremail,
			});
			selectedIDs.push(Number(userID));
		}
	}

	return data({availableUsers:availableUsers, selectedIDs:selectedIDs});
}

// process the update group route
// check for permission, adds and removes users accordingly
function routeUpdateGroup(req){

	// check if user exists
	let userID = req.body.userID;
	if(!(userID in users))
		return error('User does not exist');

	// check if user has permission
	let user = users[userID];
	if(!user.groupadmin && !user.superadmin)
		return error('User does not have the necessary permission');

	// check if groups exists
	let groupID = req.body.groupID;
	if(!(groupID in groups))
		return error('Specified group does not exist');

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

	saveUserGroupChannelState();
	saveMessages();
	return data(true);
}

// process the update channel route
// check for permission, adds and removes users accordingly
function routeUpdateChannel(req){

	// check if user exists
	let userID = req.body.userID;
	if(!(userID in users))
		return error();

	// check if user has permission
	let user = users[userID];
	if(!user.groupadmin && !user.superadmin)
		return error();

	// check if groups exists
	let channelID = req.body.channelID;
	if(!(channelID in channels))
		return error();

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
		users[userID].groups[groupID].splice(j, 1);
	}

	saveUserGroupChannelState();
	saveMessages();
	return data(true);
}

// process the update users route
// check for permission, removes users accordingly
// the user iself is deactivated to allow messages to reatain relevant links
// once deactivated a user with the same name can be created again
function routeUpdateUsers(req){

	// if user exists
	let userID = req.body.userID;
	if(!(userID in users))
		return error('User does not exist');

	// check if user has permission
	let user = users[userID];
	if(!(user.superadmin))
		return error('User does not have the necessary permission');

	let remove = req.body.remove;

	// user ids in remove are removed from the system
	// remove users from groups, channels and existance
	for(let userID of remove){
		let user = users[userID];
		console.log(user);
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

	saveUserGroupChannelState();
	saveMessages();
	return data(true);
}

// saves users and usernames to file
function saveUsers(){
	fs.writeFile(fNameUsers, JSON.stringify(users), (error) => {
		if(error){
			// notify of the error
			console.log('Error writing '+fNameUsers);
			console.log(error);
		}
	});
	fs.writeFile(fNameUsernames, JSON.stringify(usernames), (error) => {
		if(error){
			// notify of the error
			console.log('Error writing '+fNameUsernames);
			console.log(error);
		}
	});
}

// saves groups to file
function saveGroups(){
	fs.writeFile(fNameGroups, JSON.stringify(groups), (error) => {
		if(error){
			// notify of the error
			console.log('Error writing '+fNameGroups);
			console.log(error);
		}
	});
}

// saves channels to file
function saveChannels(){
	fs.writeFile(fNameChannels, JSON.stringify(channels), (error) => {
		if(error){
			// notify of the error
			console.log('Error writing '+fNameChannels);
			console.log(error);
		}
	});
}

// saves messages to file
function saveMessages(){
	fs.writeFile(fNameMessages, JSON.stringify(messages), (error) => {
		if(error){
			// notify of the error
			console.log('Error writing '+fNameMessages);
			console.log(error);
		}
	});
}

// saves id counter to file
function saveIDCounter(){
	fs.writeFile(fNameId, JSON.stringify(id), (error) => {
		if(error){
			// notify of the error
			console.log('Error writing '+fNameId);
			console.log(error);
		}
	});
}

// save users, usernames, groups and channels (for convinience)
function saveUserGroupChannelState(){
	saveUsers();
	saveGroups();
	saveChannels();
}

// error response
function error(msg){
	let response = templateResponse();
	response.error = msg;
	return response;
}

function data(msg){
	let response = templateResponse();
	response.data = msg;
	return response;
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