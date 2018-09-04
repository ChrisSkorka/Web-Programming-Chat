import { Component, OnInit, Inject } from '@angular/core';
import {MAT_DIALOG_DATA, MatDialogRef} from "@angular/material";

@Component({
  selector: 'app-manage-users-dialog',
  templateUrl: './manage-users-dialog.component.html',
  styleUrls: ['./manage-users-dialog.component.scss']
})
export class ManageUsersDialogComponent implements OnInit {

  availableUsers:any = [];
  selectedIDs:any = [];
  selection:any = [];
  original_selection:any = [];

  constructor(private dialogRef: MatDialogRef<ManageUsersDialogComponent>, @Inject(MAT_DIALOG_DATA) data) {
    let availableUsers:any = data.availableUsers;
    let selectedIDs:any = data.selectedIDs;

    // compute difference
    for(let user of availableUsers){
      let included:boolean = selectedIDs.includes(user.userID);
      this.selection.push(included);
      this.original_selection.push(included);
    }

    // update table
    this.availableUsers = availableUsers;
    this.selectedIDs = selectedIDs;
  }

  ngOnInit() {}

  // cancel process
  cancel(){
    this.dialogRef.close(false);
  }
  
  // return changes
  save(){

    // which useres were added and which were removed
    let difference:any = {
      add:[],
      remove:[],
    };

    // check each user if it has been added or removed (or unchanged)
    for(let i:number = 0; i < this.selection.length; i++){
      if(!this.original_selection[i] && this.selection[i])
        difference.add.push(this.availableUsers[i].userID);
      if(this.original_selection[i] && !this.selection[i])
        difference.remove.push(this.availableUsers[i].userID);
    }

    this.dialogRef.close(difference);
  }
}
