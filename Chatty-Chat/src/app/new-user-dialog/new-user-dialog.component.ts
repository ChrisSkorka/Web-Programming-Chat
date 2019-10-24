import { Component, OnInit, Inject } from '@angular/core';
import {MAT_DIALOG_DATA, MatDialogRef} from "@angular/material";

@Component({
  selector: 'app-new-user-dialog',
  templateUrl: './new-user-dialog.component.html',
  styleUrls: ['./new-user-dialog.component.scss']
})
export class NewUserDialogComponent implements OnInit {

  username:string = '';
  email:string = '';
  password:string = '';
  color:number = 0;
  type:number = 0;
  maxType:number = 1;
  types:any = ["Default", "Group Admin", "Super Admin"];

  constructor(private dialogRef: MatDialogRef<NewUserDialogComponent>, @Inject(MAT_DIALOG_DATA) data) {
    // set max type selectable (prevent groupadmin from creating superadmin)
    this.maxType = data.maxType;
    this.types = this.types.slice(0, this.maxType+1);
  }

  ngOnInit() {
  }

  // cancel the process
  cancel(){
    this.dialogRef.close(false);
  }

  // return collected data
  create(){
    this.dialogRef.close({
      username:this.username,
      useremail:this.email,
      password:this.password,
      color:this.color,
      groupadmin:this.type > 0,
      superadmin:this.type == 2,
    });
  }

  // live color updates
  onSliderChange(event){
    this.color = event.value;
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
