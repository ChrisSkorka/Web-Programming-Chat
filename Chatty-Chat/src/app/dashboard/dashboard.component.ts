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
  groupadmin:boolean = false;

  // content
  channel_name:string = '';
  channel_id:number = -1;
  groups:any = [];
  channel_list_visibilities = [];
  participants:any = [];
  messages:any = [];

  constructor(private router:Router, private http: HttpClient, private dialog: MatDialog) {
    
  }

  ngOnInit() {
    this.userID = Number(localStorage.getItem('userID'));
    this.refreshUserData();
  }

  onGroupClick(index){
    this.channel_list_visibilities[index] = !this.channel_list_visibilities[index];
    //alert(this.groups[index].showChannels);
  }

  // get data for selected channel and show
  onClickChannel(channel){
    // get channel data and messages
    this.http.post(
      'http://localhost:3000/channel', 
      {userID:this.userID, channelID:channel.ID}
    ).subscribe(
      (res:any) => {
        if(res.error == null){
          this.messages = res.data.messages;
          this.participants = res.data.participants;
          this.channel_name = channel.name;
          this.channel_id = channel.ID;
        }else{
          alert(res.error);
        }
      },
      err => {
        alert("Error connecting to the server");
      }
    );
  }

  onManageGroupsClick(){
    this.editing_groups = !this.editing_groups;
  }

  onClickDeleteGroup(group){

    let dialogConfig = new MatDialogConfig();

    dialogConfig.disableClose = true;
    dialogConfig.autoFocus = true;

    dialogConfig.data = {
        name: group.name,
        type: 'Group',
    };
    
    let dialogRef = this.dialog.open(DeleteDialogComponent, dialogConfig);

    dialogRef.afterClosed().subscribe((selection) => {
      if(selection){
        // send delete group request
        this.http.post(
          'http://localhost:3000/delete-group', 
          {userID:this.userID, groupID:group.ID}
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

  onClickDeleteChannel(channel){

    let dialogConfig = new MatDialogConfig();

    dialogConfig.disableClose = true;
    dialogConfig.autoFocus = true;

    dialogConfig.data = {
        name: channel.name,
        type: 'Channel'
    };
    
    let dialogRef = this.dialog.open(DeleteDialogComponent, dialogConfig);

    dialogRef.afterClosed().subscribe((selection) => {
      if(selection){
        // send delete channel request
        this.http.post(
          'http://localhost:3000/delete-channel', 
          {userID:this.userID, channelID:channel.ID}
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

  onClickGroupMembers(group){
    // get users in and available for group
    this.http.post(
      'http://localhost:3000/manage-group', 
      {userID:this.userID, groupID:group.ID}
    ).subscribe(
      (res:any) => {
        if(res.error == null){
          
          let availableUsers = res.data.availableUsers;
          let selectedIDs = res.data.selectedIDs;

          this.manageUsers(availableUsers, selectedIDs, (add, remove)=>{
            
            // update server
            this.http.post(
              'http://localhost:3000/update-group', 
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

  onClickChannelMembers(channel){
    // get users in and available for channel
    this.http.post(
      'http://localhost:3000/manage-channel', 
      {userID:this.userID, channelID:channel.ID}
    ).subscribe(
      (res:any) => {
        if(res.error == null){
          
          let availableUsers = res.data.availableUsers;
          let selectedIDs = res.data.selectedIDs;

          this.manageUsers(availableUsers, selectedIDs, (add, remove)=>{
            
            // update server
            this.http.post(
              'http://localhost:3000/update-channel', 
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

  onClickNewGroup(){
    let dialogConfig = new MatDialogConfig();

    dialogConfig.disableClose = true;
    dialogConfig.autoFocus = true;

    dialogConfig.data = {
        type: 'Group'
    };
    
    let dialogRef = this.dialog.open(NewDialogComponent, dialogConfig);

    dialogRef.afterClosed().subscribe((selection) => {
      if(selection){
        // send create new group request
        this.http.post(
          'http://localhost:3000/new-group', 
          {userID:this.userID, name:selection}
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

  onClickNewChannel(group){
    let dialogConfig = new MatDialogConfig();

    dialogConfig.disableClose = true;
    dialogConfig.autoFocus = true;

    dialogConfig.data = {
        type: 'Channel'
    };
    
    let dialogRef = this.dialog.open(NewDialogComponent, dialogConfig);

    dialogRef.afterClosed().subscribe((selection) => {
      if(selection){
        // send create new channel request
        this.http.post(
          'http://localhost:3000/new-channel', 
          {userID:this.userID, groupID:group.ID, name:selection}
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

  onClickNewUsers(){
    let dialogConfig = new MatDialogConfig();

    dialogConfig.disableClose = true;
    dialogConfig.autoFocus = true;

    dialogConfig.data = {};
    
    let dialogRef = this.dialog.open(NewUserDialogComponent, dialogConfig);

    dialogRef.afterClosed().subscribe((selection) => {
      if(selection){
        // send create new group request
        this.http.post(
          'http://localhost:3000/new-user', 
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

  onClickDeleteUsers(){
    // get users in and available for channel
    this.http.post(
      'http://localhost:3000/manage-users', 
      {userID:this.userID}
    ).subscribe(
      (res:any) => {
        if(res.error == null){
          
          let availableUsers = res.data.availableUsers;
          let selectedIDs = res.data.selectedIDs;

          this.manageUsers(availableUsers, selectedIDs, (add, remove)=>{
            
            // update server
            this.http.post(
              'http://localhost:3000/update-users', 
              {userID:this.userID, add:add, remove:remove}
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

  manageUsers(availableUsers:any, selectedIDs:any, update:(add:any, remove:any)=>any){

    let dialogConfig = new MatDialogConfig();

    dialogConfig.disableClose = true;
    dialogConfig.autoFocus = true;

    dialogConfig.data = {
      availableUsers:availableUsers,
      selectedIDs:selectedIDs,
    };
    
    let dialogRef = this.dialog.open(ManageUsersDialogComponent, dialogConfig);

    dialogRef.afterClosed().subscribe((selection) => {
      if(selection){
        // get selection data into difference
        update(selection.add, selection.remove);
      }
    });
  }

  submitMessage(){
    alert("Here we fucking go... " + this.newmessage);
  }

  // gets userdate, group lists and channel lists and displays them
  refreshUserData(){
    // get user data
    this.http.post(
      'http://localhost:3000/user', 
      {userID:this.userID}
    ).subscribe(
      (res:any) => {
        if(res.error == null){
          this.superadmin = res.data.userdata.superadmin;
          this.groupadmin = res.data.userdata.groupadmin;
          this.username = res.data.userdata.username;
          this.useremail = res.data.userdata.useremail;
          this.color = res.data.userdata.color;
          this.groups = res.data.groups;
          this.channel_list_visibilities = new Array(this.groups.length).fill(false); // array of false's, one per group
        }else{
          alert(res.error);
        }
      },
      err => {
        alert("Error connecting to the server");
      }
    );
  }

  // sigh out user
  signout(){
    localStorage.removeItem('userID');
    this.router.navigate(['/']);
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
