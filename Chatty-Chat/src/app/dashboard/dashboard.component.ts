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
  superadmin:boolean = true;
  newmessage:string = '';
  groups:any = [
    {ID:0 ,Name:'Group 1', Participants:[1, 2, 3], GroupAdmins:[1], ShowChannels:true, Channels:[
      {ID:123, Group:0, Name:'Channel 1', Participants:[2, 3]},
      {ID:133, Group:0, Name:'Channel 2', Participants:[1, 3]},
    ]}
  ];
  channel_list_visibilities = [true];
  participants:any = [
    {Username:'User1', IsAdmin:false, Color:0}, 
    {Username:'TechSupport420', IsAdmin:true, Color:100}, 
    {Username:'User3333333333333333', IsAdmin:false, Color:200}
  ];
  messages:any = [
    {Username:this.participants[0].Username, Content:'Whats up boizzzz', Datetime:'12:34 26/08/2075', Color:this.participants[0].Color},
    {Username:this.participants[1].Username, Content:'Whats up boizzzz', Datetime:'12:34 26/08/2075', Color:this.participants[1].Color},
    {Username:this.participants[2].Username, Content:'Whats up boizzzz', Datetime:'12:34 26/08/2075', Color:this.participants[2].Color}
  ];

  constructor() { }

  ngOnInit() {
  }

  onGroupClick(index){
    this.channel_list_visibilities[index] = !this.channel_list_visibilities[index];
    //alert(this.groups[index].showChannels);
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
