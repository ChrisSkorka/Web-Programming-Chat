import { Component, OnInit } from '@angular/core';

@Component({
  selector: 'app-dashboard',
  templateUrl: './dashboard.component.html',
  styleUrls: ['./dashboard.component.scss']
})
export class DashboardComponent implements OnInit {

  channel_name:string = 'Temp#Ch';
  username:string = 'TechSupport420';
  useremail:string = 'chris@email.com';
  groups:any = [{Name:'Group 1', Participants:[1, 2, 3], GroupAdmins:[1], Channels:[0, 1, 2]}];

  constructor() { }

  ngOnInit() {
  }

  onGroupClick(index){
    alert(index);
  }

}
