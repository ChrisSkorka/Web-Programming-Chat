// imports
var bodyParser = require('body-parser');
var express = require("express");
var app = express();
var http = require("http").Server(app);
var fs = require('fs');
var mongo = require('mongodb').MongoClient;
var ObjectID = require('mongodb').ObjectID;

// server settings
var port = 3000;

// database settings
var url = "mongodb://localhost:27017/";
var dbName = "chattychat";

var collectionNameUsers 	= "users";
var collectionNameGroups 	= "groups";
var collectionNameChannels 	= "channels";
var collectionNameMessages 	= "messages";

// database collections
var dbServer;
var users;
var groups;
var channels;
var messages;

// default user
var defaultUser = {
	active:true, 
	userName: 'super', 
	password: 'super',
	superAdmin:true, 
	groupAdmin:true, 
	userEmail:'super@admin.com', 
	color:0, 
	groups:{}
}

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
		groups 		= db.collection(collectionNameGroups);
		channels 	= db.collection(collectionNameChannels);
		messages 	= db.collection(collectionNameMessages);

		// if no user exists, create the default super user
		users.findOne({}, {projection:{_id:1}},  (error, result) => {
			if (err) throw err;

			// if no user exists
			if(result == null)
				users.insertOne(defaultUser, (e, r) => {
					console.log("Default super user inserted");
				});
		});

		console.log("Connected to database");
	})
}

// program exit handler, closes database when the program finishes, crashes or is killed
function exitHandler(options, exitCode){
	dbServer.close();
	console.log("Disconnected from database");

	if (options.exit) process.exit();
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
	app.post("/login", 			routeLogin);
	app.post("/user", 			routeUser);
	app.post("/channel", 		routeChannel);
	app.post("/send-message", 	routeSendMessage);
	app.post("/new-group", 		routeNewGroup);
	app.post("/new-channel", 	routeNewChannel);
	app.post("/delete-group", 	routeDeleteGroup);
	app.post("/delete-channel", routeDeleteChannel);
	app.post("/new-user", 		routeNewUser);
	app.post("/manage-group", 	routeManageGroup);
	app.post("/manage-channel", routeManageChannel);
	app.post("/manage-users", 	routeManageUsers);
	app.post("/update-group", 	routeUpdateGroup);
	app.post("/update-channel", routeUpdateChannel);
	app.post("/update-users", 	routeUpdateUsers);
	
	// begin listening for connections
	http.listen(port);
	console.log("server started");
}

// proces the login route
// either returns the user id or an error
function routeLogin(req, res){

	// check if valid request
	if(!('username' in req.body && 'password' in req.body))
		return respondInvalidRequest(res);

	// get values from request
	let userName = req.body.username;
	let password = req.body.password;

	// find user in db
	users.findOne(
		{userName: userName}, 
		{projection: {_id:1, password:1}}
		).then( user => {

		// check if user exists
		if(user == null)
			respondError(res, 'User does not exist');

		// check if password matches
		else if(user.password != password)
			respondError(res, 'Password is incorrect');

		// if user is verified return token (id)
		else
			respondData(res, user._id);

			console.log("typeof user._id " + typeof user._id);

	}).catch(error => {
		respondInternalError(res);
	});
}

// process the user route
// returns the user data for a given userID and corresponding groups and channels
function routeUser(req, res){

	// check if valid request
	if(!('userID' in req.body))
		return respondInvalidRequest(res);

	// find user in database
	let userID = req.body.userID;
	console.log(userID);

	users.findOne(
		{_id: ObjectID(userID)}, 
		{projection: {password:0}}
		).then(user => {
			
		// if user token does not exist
		if(user == null)
			respondError(res, 'User does not exist');

		// if data retrived
		else{
			// TODO return all groups and channels if super user

			respondData(res, user);
		}

	}).catch(error => {
		console.log(error);
		respondInternalError(res);
	});
}

// process the channel route
// returns the channel's participants and messages
function routeChannel(req, res){

	// check if valid request
	if(!('userID' in req.body && 'channelName' in req.body))
		return respondInvalidRequest(res);
	
	// find user in db
	let userID = req.body.userID;
	let channelName = req.body.channelName;
	let response = {channel: null, messages: null, };

	// execute queries
	// find user in db
	users.findOne(
		{_id: ObjectID(userID)}, 
		{explain: true}
		).then( dbResponse => {

			// check if user exists else continue
			if(dbResponse.executionStats.executionStages.nReturned == 0)
				respondError(res, 'User does not exist');
			else
				return channels.findOne({channelName: channelName}, {});

	//  find channel
	}).then( dbChannel => {

		// check if user exists
		if(dbChannel == null)
			respondError(res, 'Channel does not exist');
		else{

			response.channel = dbChannel;

			return messages.find({groupName: response.channel.groupName, channelName: response.channel.channelName}, {}).toArray();
		}


	// find all messages of this channel
	}).then( dbMessages => {

		response.messages = dbMessages;
		respondData(res, response);

	}).catch(error => {
		console.log(error);
		respondInternalError(res);
	});
}

// --- prototype ---
// process the send message route
function routeSendMessage(req, res){

	// check if valid request
	if(!('userID' in req.body && 'channelName' in req.body))
		return respondInvalidRequest(res);
	
	// find user in db
	let userID = req.body.userID;
	let message = {
		userName:		'',
		groupName: 		req.body.groupName,
		channelName: 	req.body.channelName,
		color: 			req.body.color,
		content: 		req.body.content,
		datetime: 		req.body.datetime,
	};

	// execute queries
	// find user in db
	users.findOne(
		{_id: ObjectID(userID)}, 
		{projection: {userName: 1, groups: 1}}
		).then( user => {

			// check if user exists
			if(user == null)
				respondError(res, 'User does not exist');
			
			// check if user is in the channel and group
			else{
				for(group of user.groups){
					if(group.groupName == message.groupName && group.channels.includes(message.channelName)){
						message.userName = user.userName;
						return messages.insertOne(message);
					}
				}

				respondError(res, 'User is not in group');
			}

	//  find channel
	}).then( result => {

		respondData(res, true);

	}).catch(error => {
		console.log(error);
		respondInternalError(res);
	});
}

// process the new group route
// check permission, creates the group, adds the creator or return error
function routeNewGroup(req, res){

	// check if valid request
	if(!('userID' in req.body && 'groupName' in req.body))
		return respondInvalidRequest(res);

	// get values from request
	let userID = req.body.userID;
	let groupName = req.body.groupName;
	let user = null;

	// execute queries
	// find user and check permissions
	users.findOne(
		{_id: ObjectID(userID)}, 
		{projection: {password: 0}}
		).then( dbUser => {

			user = dbUser;

			// check if user exists
			if(user == null)
				respondError(res, 'User does not exist');

			// check if user has permissions
			else if(!user.superAdmin && !groupAdmin)
				respondError(res, 'User does not have the necessary permission');

			// if all okay continue
			else
				return groups.findOne({groupName: groupName}, {explain: true});

	// find group, if already exists cant continue
	}).then( dbGroups => {

		// group already exists
		if(dbGroups.executionStats.executionStages.nReturned >= 1)
			respondError(res, 'Group name already exists');

		// no group already exists with this name
		else{
			let group = {
				groupName: groupName,
				participants: [user.userName],
				channels: [],
			};
			return groups.insertOne(group);
		}

	// update list of groups of user
	}).then( result => {

		user.groups.push({
			groupName: groupName,
			channels: [],
		});

		return users.updateOne({userName: user.userName}, { $set: {groups: user.groups}});

	// if everything was successful, respond
	}).then( result => {

		respondData(res, true);

	}).catch(error => {
		console.log(error);
		respondInternalError(res);
	});

}

// process the new channel route
// check permission, creates the channel, adds the creator and returns feedback
function routeNewChannel(req, res){

	// check if valid request
	if(!('userID' in req.body && 'groupName' in req.body && 'channelName' in req.body))
		return respondInvalidRequest(res);

	// get values from request
	let userID = req.body.userID;
	let groupName = req.body.groupName;
	let channelName = req.body.channelName;
	let user = null;

	// execute queries
	users.findOne(
		{_id: ObjectID(userID)}, 
		{projection: {password: 0}}
		).then( dbUser => {

			user = dbUser;

			// check if user exists
			if(user == null)
				respondError(res, 'User does not exist');

			// check if user has permissions
			else if(!user.superAdmin && !groupAdmin)
				respondError(res, 'User does not have the necessary permission');

			// if all okay continue
			else
				return channels.findOne({groupName: groupName, channelName: channelName}, {explain: true});

	// check if a channel with the name already exists within the group
	}).then( dbChannel => {

		// there is a channel with the name in the group
		if(dbChannel.executionStats.executionStages.nReturned >= 1)
			respondError(res, 'Channel name already exists in this groups');

		// create new channel
		else{
			let channel = {
				groupName: groupName,
				channelName: channelName,
				participants: [ {userName: user.userName, color: user.color} ],
			};
			return channels.insertOne(channel);
		}

	// get channel list from group to modify
	}).then( result => {

		return groups.findOne({groupName: groupName}, {projection: {channels: 1}});

	// add channel to group
	}).then( group => {

		group.channels.push(channelName);
		return groups.updateOne({groupName: groupName}, {$set: {channels: group.channels}});

	// update groups structure of user
	}).then( result => {

		for(group of user.groups){
			if(group.groupName == groupName)
				group.channels.push(channelName);
		}

		return users.updateOne({userName: user.userName}, { $set: {groups: user.groups}});

	// respond
	}).then( result => {

		respondData(res, true);

	}).catch(error => {
		console.log(error);
		respondInternalError(res);
	});
}

// process the delete group route
// check permission, delete group from groups and users
function routeDeleteGroup(req, res){

	// check if user exists
	let userID = req.body.userID;
	if(!(userID in users))
		return respondError('User does not exist');

	// check if user has permission
	let user = users[userID];
	if(!user.groupadmin && !user.superadmin)
		return respondError('User does not have the necessary permission');

	// check if groups exists
	let groupID = req.body.groupID;
	if(!(groupID in groups))
		return respondError('Specified group does not exist');

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
	return respondData(true);
}

// process the delete channel route
// check permission, delete group from groups and users
function routeDeleteChannel(req, res){


	// check if valid request
	if(!('userID' in req.body && 'groupName' in req.body && 'channelName' in req.body))
		return respondInvalidRequest(res);

	// get values from request
	let userID = req.body.userID;
	let groupName = req.body.groupName;
	let channelName = req.body.channelName;
	let participants = [];
	let user = null;

	// execute queries
	users.findOne(
		{_id: ObjectID(userID)}, 
		{projection: {password: 0}}
		).then( dbUser => {

			user = dbUser;

			// check if user exists
			if(user == null)
				respondError(res, 'User does not exist');

			// check if user has permissions
			else if(!user.superAdmin && !groupAdmin)
				respondError(res, 'User does not have the necessary permission');

			// if all okay continue
			else
				return channels.findOne({groupName: groupName, channelName: channelName}, {projection: {participants: 1}});

	// check if the channel exists within the group
	}).then( dbChannel => {

		// there is no channel with the name in the group
		if(dbChannel == null)
			respondError(res, 'Specified channel does not exist');

		// remove channel
		else{
			participants = dbChannel.participants;
			return channels.delete({groupName: groupName, channelName: channelName});
		}

	// channel deleted, delete it from users and groups
	}).then( result => {

		return users.find({userName: {$in: participants}}, {projection: {groups: 1}}).toArray();

	}).then( users => {

		for(user of users){

			// remove channel from users group-channel structure
			for(group of user.groups){
				if(group.groupName == groupName){
					let index = group.channels.indexOf(channelName);
					group.channels.splice(index, 1);
				}
			}
		}

		return users.updateOne({_id: ObjectID(userID)}, {$set: {groups: user.groups}});

	// get groups channel list
	}).then( result => {

		return groups.findOne({groupName: groupName}, {projection: {channels: 1}});

	// update groups channel list
	}).then( group => {

		let index = group.channels.indexOf(channelName);
		group.channels.splice(index, 1);

		return groups.updateOne({groupName: groupName}, { $set: {channels: group.channels}});

	// respond
	}).then( result => {

		respondData(res, true);

	}).catch(error => {
		console.log(error);
		respondInternalError(res);
	});





	// check if user exists
	let userID = req.body.userID;
	if(!(userID in users))
		return respondError('User does not exist');

	let user = users[userID];

	// check if user has permission
	if(!user.groupadmin && !user.superadmin)
		return respondError('User does not have the necessary permission');

		let channelID = req.body.channelID;

	// check if channel exists
	if(!(channelID in channels))
		return respondError('Specified channel does not exist');

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
	return respondData(true);
}

// process the new user route
// checks permission, adds new user to users
function routeNewUser(req, res){

	// check if valid request
	if(!('userID' in req.body && 'newUser' in req.body))
		return respondInvalidRequest(res);

	// get values from request
	let userID = req.body.userID;
	let newUser = req.body.newUser;

	// execute queries
	// check if user exists and has appropriate permissions
	users.findOne(
		{_id: ObjectID(userID)}, 
		{projection: {password: 0}}
		).then( dbUser => {

			user = dbUser;

			// check if user exists
			if(user == null)
				respondError(res, 'User does not exist');

			// check if user has permissions
			else if(!user.superAdmin && !groupAdmin)
				respondError(res, 'User does not have the necessary permission');

			// if all okay continue
			else
				return users.findOne({userName: newUser.userName}, {explain: true});

	// check if user already exists and if not create new user
	}).then( dbUser => {

		// there is a user with the name
		if(dbUser.executionStats.executionStages.nReturned >= 1)
			respondError(res, 'Username already exists');

		// create new user
		else{
			let user = {
				active: true,
				superAdmin: 	newUser.superAdmin,
				groupAdmin: 	newUser.groupAdmin, 
				userName: 		newUser.userName,
				userEmail: 		newUser.userEmail,
				color: 			newUser.color,
				password: 		newUser.password,
				groups: 		[],
			};
			return users.insertOne(user);
		}

	// respond
	}).then( result => {

		respondData(res, true);

	}).catch(error => {
		console.log(error);
		respondInternalError(res);
	});
}

// process the manage group route
// check for permission, returns all users, user ids of group
function routeManageGroup(req, res){

	// check if user exists
	let userID = req.body.userID;
	if(!(userID in users))
		return respondError();

	let user = users[userID];

	// check if user has permission
	if(!user.groupadmin && !user.superadmin)
		return respondError();

	// check if groups exists
	let groupID = req.body.groupID;
	if(!(groupID in groups))
		return respondError();

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

	return respondData({availableUsers:availableUsers, selectedIDs:selectedIDs});
}

// process the manage channel route
// check for permission, returns users in group, user ids of channel
function routeManageChannel(req, res){

	// check if user exists
	let userID = req.body.userID;
	if(!(userID in users))
		return respondError('User does not exist');

	// check if user has permission
	let user = users[userID];
	if(!user.groupadmin && !user.superadmin)
		return respondError('User does not have the necessary permission');

	// check if channel exists
	let channelID = req.body.channelID;
	if(!(channelID in channels))
		return respondError('Specified group does not exist');

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

	return respondData({availableUsers:availableUsers, selectedIDs:selectedIDs});
}

// process the manage users route
// check for permission, return all users, all user ids
function routeManageUsers(req, res){

	// check if user exists
	let userID = req.body.userID;
	if(!(userID in users))
		return respondError('User does not exist');

	// check if user has permission
	let user = users[userID];
	if(!user.groupadmin && !user.superadmin)
		return respondError('User does not have the necessary permission');

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

	return respondData({availableUsers:availableUsers, selectedIDs:selectedIDs});
}

// process the update group route
// check for permission, adds and removes users accordingly
function routeUpdateGroup(req, res){

	// check if user exists
	let userID = req.body.userID;
	if(!(userID in users))
		return respondError('User does not exist');

	// check if user has permission
	let user = users[userID];
	if(!user.groupadmin && !user.superadmin)
		return respondError('User does not have the necessary permission');

	// check if groups exists
	let groupID = req.body.groupID;
	if(!(groupID in groups))
		return respondError('Specified group does not exist');

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
	return respondData(true);
}

// process the update channel route
// check for permission, adds and removes users accordingly
function routeUpdateChannel(req, res){

	// check if user exists
	let userID = req.body.userID;
	if(!(userID in users))
		return respondError();

	// check if user has permission
	let user = users[userID];
	if(!user.groupadmin && !user.superadmin)
		return respondError();

	// check if groups exists
	let channelID = req.body.channelID;
	if(!(channelID in channels))
		return respondError();

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
	return respondData(true);
}

// process the update users route
// check for permission, removes users accordingly
// the user iself is deactivated to allow messages to reatain relevant links
// once deactivated a user with the same name can be created again
function routeUpdateUsers(req, res){

	// if user exists
	let userID = req.body.userID;
	if(!(userID in users))
		return respondError('User does not exist');

	// check if user has permission
	let user = users[userID];
	if(!(user.superadmin))
		return respondError('User does not have the necessary permission');

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
	return respondData(true);
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

// error response, sends an error message
function respondError(res, msg){
	let response = templateResponse();
	response.error = msg;
	res.send(JSON.stringify(response));
	return null;
}

// data response on success, sends requested data
function respondData(res, msg){
	let response = templateResponse();
	response.data = msg;
	res.send(JSON.stringify(response));
	return null;
}

// invalid request response, sent when the request is invalid
function respondInvalidRequest(res){
	return respondError(res, 'Error: Invalid request');
}

// internal error response, sent when an unextected error occures
function respondInternalError(res){
	return respondError(res, 'Unable to process the request');
}

// template response, data and/or error is inserted
function templateResponse(){
	return {
		data: null,
		error: null,
	};
}
