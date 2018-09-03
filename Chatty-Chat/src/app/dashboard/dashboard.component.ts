import { Component, OnInit } from '@angular/core';
import { ActivatedRoute } from '@angular/router';
import { MatDialog, MatDialogConfig } from "@angular/material";
import { HttpClient, HttpErrorResponse, HttpHeaders } from '@angular/common/http';
import { DeleteDialogComponent } from '../delete-dialog/delete-dialog.component';

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

  constructor(private activatedRoute:ActivatedRoute, private http: HttpClient, private dialog: MatDialog) {
    this.userID = activatedRoute.snapshot.params['userID'];
  }

  ngOnInit() {

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

  onClickDeleteGroup(i){
    let group = this.groups[i];

    let dialogConfig = new MatDialogConfig();

    dialogConfig.disableClose = true;
    dialogConfig.autoFocus = true;

    dialogConfig.data = {
        name: group.name,
        type: 'Group'
    };
    
    let dialogRef = this.dialog.open(DeleteDialogComponent, dialogConfig);

    dialogRef.afterClosed().subscribe((selection) => {
      if(selection){
        // TODO delete
      }
    });
  }

  onClickDeleteChannel(i, j){
    let channel = this.groups[i].channels[j];

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
        // TODO delete
      }
    });
  }

  onClickGroupMembers(index){
    console.log("Edit group members " + index);
  }

  onClickChannelMembers(i, j){
    console.log("Edit channel members " + i + " " + j);
  }

  onNewGroupClick(){
    console.log("Create new group");
  }

  onClickNewChannel(i){
    console.log("Create new channel under " + i);
  }

  onClickManageUsers(){
    console.log("Manage users");
  }

  submitMessage(){
    alert("Here we fucking go... " + this.newmessage);
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
