import { Component, OnInit } from '@angular/core';
import { MatDialog, MatDialogConfig } from "@angular/material";
import { HttpClient, HttpErrorResponse, HttpHeaders } from '@angular/common/http';
import { Router } from '@angular/router';
import { DeleteDialogComponent } from '../delete-dialog/delete-dialog.component';
import { NewDialogComponent } from '../new-dialog/new-dialog.component';
import { NewUserDialogComponent } from '../new-user-dialog/new-user-dialog.component';
import { ManageUsersDialogComponent } from '../manage-users-dialog/manage-users-dialog.component';

@Component({
  selector: 'app-dashboard',
  templateUrl: './dashboard.component.html',
  styleUrls: ['./dashboard.component.scss']
})
export class DashboardComponent implements OnInit {

  // app properties
  newmessage:string = '';
  editing_groups:boolean = false;
  editing_users:boolean = false;
  editing_channel_participants:boolean = false;

  // user properties
  userID:number = -1;
  username:string = '';
  useremail:string = '';
  color:number = 0;
  superadmin:boolean = false;

  // content
  channelName:string = '';
  channelID:number = -1;
  groups:any = [];
  channel_list_visibilities = [];
  participants:any = [];
  messages:any = [];

  // server
  port: string = '3000';
  host: string = 'http://localhost:' + this.port;

  constructor(private router:Router, private http: HttpClient, private dialog: MatDialog) {}

  // get userID and download user info and group and channel lists
  ngOnInit() {
    this.userID = Number(localStorage.getItem('userID'));
    this.refreshUserData();
  }

  // on group click
  // expands or retracts channel list
  onClickGroup(index){
    this.channel_list_visibilities[index] = !this.channel_list_visibilities[index];
  }

  // on channel click
  // get data for selected channel and show in message and participants area
  onClickChannel(channel){

    // get channel data and messages
    this.http.post(
      this.host + '/channel', 
      {userID:this.userID, channelID:channel.ID}
    ).subscribe(
      (res:any) => {
        if(res.error == null){

          // if secessful
          this.messages = res.data.messages;
          this.participants = res.data.participants;
          this.channelName = channel.name;
          this.channelID = channel.ID;
        }else{
          alert(res.error);
        }
      },
      err => {
        alert("Error connecting to the server");
      }
    );
  }

  // enable and disable group and channel editing
  onClickManageGroups(){
    this.editing_groups = !this.editing_groups;
  }

  // on group delete option click
  // shows confirmation dialog and sends deletion request to server
  onClickDeleteGroup(group){

    // material dialog
    let dialogConfig = new MatDialogConfig();
    dialogConfig.disableClose = true;
    dialogConfig.autoFocus = true;

    // data passed to dialog
    dialogConfig.data = {
        name: group.name,
        type: 'Group',
    };
    
    let dialogRef = this.dialog.open(DeleteDialogComponent, dialogConfig);

    //on dialog close
    dialogRef.afterClosed().subscribe((selection) => {
      if(selection){

        // if positive response send delete group request
        this.http.post(
          this.host + '/delete-group', 
          {userID:this.userID, groupID:group.ID}
        ).subscribe(
          (res:any) => {
            if(res.error == null){

              // if sucsucessful, update groups and channels list
              this.refreshUserData();
            }else{
              alert(res.error);
            }
          },
          err => {
            alert("Error connecting to the server");
          }
        );
      }
    });
  }

  // on channels delete option click
  // shows confirmation dialog and sends deletion request to server
  onClickDeleteChannel(channel){

    // material dialog
    let dialogConfig = new MatDialogConfig();
    dialogConfig.disableClose = true;
    dialogConfig.autoFocus = true;

    // data passed to dialog
    dialogConfig.data = {
        name: channel.name,
        type: 'Channel'
    };
    
    let dialogRef = this.dialog.open(DeleteDialogComponent, dialogConfig);

    // on dialog close send request
    dialogRef.afterClosed().subscribe((selection) => {
      if(selection){

        // if positive response send delete channel request
        this.http.post(
          this.host + '/delete-channel', 
          {userID:this.userID, channelID:channel.ID}
        ).subscribe(
          (res:any) => {
            if(res.error == null){

              // if sucessful, update groups and channels list
              this.refreshUserData();
            }else{
              alert(res.error);
            }
          },
          err => {
            alert("Error connecting to the server");
          }
        );
      }
    });
  }

  // on group member option click
  // gets the users that can be in the group and are in the group and allows
  // the user to add or remove users from the group
  onClickGroupMembers(group){
    
    // get all user and users already in group
    this.http.post(
      this.host + '/manage-group', 
      {userID:this.userID, groupID:group.ID}
    ).subscribe(
      (res:any) => {
        if(res.error == null){
          
          // get all users and users already in group
          let availableUsers = res.data.availableUsers;
          let selectedIDs = res.data.selectedIDs;

          // show manage users dialog to add and remove users from group
          this.manageUsers(availableUsers, selectedIDs, (add, remove)=>{
            
            // send proposed changes to the server
            this.http.post(
              this.host + '/update-group', 
              {userID:this.userID, groupID:group.ID, add:add, remove:remove}
            ).subscribe(
              (res:any) => {
                if(res.error == null){
                  this.refreshUserData();
                }else{
                  alert(res.error);
                }
              },
              err => {
                alert("Error connecting to the server");
              }
            );
          });
        }else{
          alert(res.error);
        }
      },
      err => {
        alert("Error connecting to the server");
      }
    );
  }

  // on channels member option click
  // gets the users that can be in the channel and are in the channel and allows
  // the user to add or remove users from the channel
  onClickChannelMembers(channel){
    // get users from channel and group
    this.http.post(
      this.host + '/manage-channel', 
      {userID:this.userID, channelID:channel.ID}
    ).subscribe(
      (res:any) => {
        if(res.error == null){
          
          // users from group and channel
          let availableUsers = res.data.availableUsers;
          let selectedIDs = res.data.selectedIDs;

          // show manage users dialog 
          this.manageUsers(availableUsers, selectedIDs, (add, remove)=>{
            
            // send proposed changes to server
            this.http.post(
              this.host + '/update-channel', 
              {userID:this.userID, channelID:channel.ID, add:add, remove:remove}
            ).subscribe(
              (res:any) => {
                if(res.error == null){
                  this.refreshUserData();
                }else{
                  alert(res.error);
                }
              },
              err => {
                alert("Error connecting to the server");
              }
            );
          });

        }else{
          alert(res.error);
        }
      },
      err => {
        alert("Error connecting to the server");
      }
    );
  }

  // on create new group click
  // show new group dialog and send new group request to server
  onClickNewGroup(){

    // material dialog
    let dialogConfig = new MatDialogConfig();
    dialogConfig.disableClose = true;
    dialogConfig.autoFocus = true;

    // type passed to dialog
    dialogConfig.data = {
        type: 'Group'
    };
    
    let dialogRef = this.dialog.open(NewDialogComponent, dialogConfig);

    // on dialog close
    dialogRef.afterClosed().subscribe((selection) => {
      if(selection){
        // send create new group request
        this.http.post(
          this.host + '/new-group', 
          {userID:this.userID, name:selection}
        ).subscribe(
          (res:any) => {
            if(res.error == null){

              // if sucessful update group and channel lists
              this.refreshUserData();
            }else{
              alert(res.error);
            }
          },
          err => {
            alert("Error connecting to the server");
          }
        );
      }
    });
  }

  // on creake new chennel click
  // shows new channel dialog and send the request with the name to the server
  onClickNewChannel(group){

    // meterial dialog
    let dialogConfig = new MatDialogConfig();
    dialogConfig.disableClose = true;
    dialogConfig.autoFocus = true;

    // passes type to dialog
    dialogConfig.data = {
        type: 'Channel'
    };
    
    let dialogRef = this.dialog.open(NewDialogComponent, dialogConfig);

    // on dialog close
    dialogRef.afterClosed().subscribe((selection) => {

      // if positive reponse
      if(selection){

        // send create new channel request
        this.http.post(
          this.host + '/new-channel', 
          {userID:this.userID, groupID:group.ID, name:selection}
        ).subscribe(
          (res:any) => {
            if(res.error == null){

              // if sucessful update group and channel list
              this.refreshUserData();
            }else{
              alert(res.error);
            }
          },
          err => {
            alert("Error connecting to the server");
          }
        );
      }
    });
  }

  // on create user click
  // shows new user dialog and send enterd data to srever
  onClickNewUsers(){

    // material dialog
    let dialogConfig = new MatDialogConfig();
    dialogConfig.disableClose = true;
    dialogConfig.autoFocus = true;

    // data passed to dialog
    // maximum permissions this user can create
    dialogConfig.data = {
      maxType:this.superadmin ? 2: 1,
    };
    let dialogRef = this.dialog.open(NewUserDialogComponent, dialogConfig);

    // on dialog close
    dialogRef.afterClosed().subscribe((selection) => {
      
      // if user pressed create
      if(selection){

        // send create new group request
        this.http.post(
          this.host + '/new-user', 
          {userID:this.userID, newUser:selection}
        ).subscribe(
          (res:any) => {
            if(res.error == null){
              this.refreshUserData();
            }else{
              alert(res.error);
            }
          },
          err => {
            alert("Error connecting to the server");
          }
        );
      }
    });
  }

  // on remove user click
  // shows manage users dialog which allows user to be disselected and then deleted
  onClickDeleteUsers(){

    // get list of all users
    this.http.post(
      this.host + '/manage-users', 
      {userID:this.userID}
    ).subscribe(
      (res:any) => {
        if(res.error == null){
          
          // get user lists from response
          let availableUsers = res.data.availableUsers;
          let selectedIDs = res.data.selectedIDs;

          // invoke manage users dialog with user list
          this.manageUsers(availableUsers, selectedIDs, (add, remove)=>{
            
            // once dialog is closed the proposed changes are sent to the server

            // update server
            this.http.post(
              this.host + '/update-users', 
              {userID:this.userID, add:add, remove:remove}
            ).subscribe(
              (res:any) => {
                if(res.error == null){
                  this.refreshUserData();
                }else{
                  alert(res.error);
                }
              },
              error => {
                alert("Error connecting to the server");
              }
            );
          });

        }else{
          alert(res.error);
        }
      },
      err => {
        alert("Error connecting to the server");
      }
    );
  }

  // shows manage users dialog with list of users (some checked) and apon completion 
  // invokes the update callback function
  manageUsers(availableUsers:any, selectedIDs:any, update:(add:any, remove:any)=>any){

    // material dialog
    let dialogConfig = new MatDialogConfig();
    dialogConfig.disableClose = true;
    dialogConfig.autoFocus = true;

    // data passed to dialog, all users to list, users selected
    dialogConfig.data = {
      availableUsers:availableUsers,
      selectedIDs:selectedIDs,
    };
    
    let dialogRef = this.dialog.open(ManageUsersDialogComponent, dialogConfig);

    // on dialog close
    dialogRef.afterClosed().subscribe((selection) => {

      // if a new user has been submitted
      if(selection){

        // get selection data into difference
        update(selection.add, selection.remove);
      }
    });
  }

  // submit message prototype
  submitMessage(messageInput){

    // if message is empty, ignore
    if(this.newmessage == ""){
      return;
    }

    // if no channel selected report it
    if(this.channelID == -1){
      alert("No channel selected, open a channel from groups on the left");
      return;
    }

    // if positive response send delete channel request
    this.http.post(
      this.host + '/send-message', 
      {userID:this.userID, content: this.newmessage, datetime: Date.now(), channelID:this.channelID}
    ).subscribe(
      (res:any) => {
        if(res.error == null){

          // if sucessful, add message locally
          let datetime = new Date(Date.now());

          this.messages.push({
            username: this.username,
            content: this.newmessage,
            datetime: datetime.toLocaleTimeString() + " " + datetime.toLocaleDateString(),
            color: this.color,
          });

          // empty message input
          this.newmessage = "";
        }else{
          alert(res.error);
        }
      },
      err => {
        alert("Error connecting to the server");
      }
    );
  }

  // gets userdate, group lists and channel lists and displays them
  refreshUserData(){
    // get user data request
    this.http.post(
      this.host + '/user', 
      {userID:this.userID}
    ).subscribe(
      (res:any) => {
        if(res.error == null){

          // copy info
          this.superadmin = res.data.userdata.superadmin;
          this.username = res.data.userdata.username;
          this.useremail = res.data.userdata.useremail;
          this.color = res.data.userdata.color;
          this.groups = res.data.groups;

          // array of false's, one per group, determine expansion of groups channel lists
          this.channel_list_visibilities = new Array(this.groups.length).fill(false); 
        
        // if error, show error
        }else{
          alert(res.error);
        }
      },
      err => {
        alert("Error connecting to the server");
      }
    );
  }

  // sigh out user, remove userID stored and navigate to login
  signout(){
    localStorage.removeItem('userID');
    this.router.navigate(['login']);
  }

  //get rgb color string with specified hue
  getColor(h, s = 0.50, v = 0.40, a = 1.0){
    var r, g, b, sector, hueInSector, p, q, t;
    
    h %= 360;

    h /= 60
    sector = Math.floor(h);
    hueInSector = h - sector

    p = v * (1 - s)
    q = v * (1 - s * hueInSector)
    t = v * (1 - s * (1 - hueInSector))

    switch(sector) {
      case 0:
        r = v;
        g = t;
        b = p;
        break;
   
      case 1:
        r = q;
        g = v;
        b = p;
        break;
   
      case 2:
        r = p;
        g = v;
        b = t;
        break;
   
      case 3:
        r = p;
        g = q;
        b = v;
        break;
   
      case 4:
        r = t;
        g = p;
        b = v;
        break;
      
      case 5:
      default:
        r = v;
        g = p;
        b = q;
    }

    r = Math.floor(r * 255)
    g = Math.floor(g * 255)
    b = Math.floor(b * 255)
    return "rgba("+r+","+g+","+b+","+a+")";
  }
}
