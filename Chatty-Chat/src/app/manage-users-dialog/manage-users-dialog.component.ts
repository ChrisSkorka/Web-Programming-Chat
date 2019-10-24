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

  addCount:number = 0;
  removeCount:number = 0;

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

  // calculates the difference between original state and the new state
  // it creates two lists, one of the useres added and one of the ones removed
  getDifference(){

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

    return difference;
  }

  // updates number of users added and removed
  updateTally(){

    let difference = this.getDifference();
    this.addCount = difference.add.length;
    this.removeCount = difference.remove.length;
  }

  // cancel process
  cancel(){
    this.dialogRef.close(false);
  }
  
  // return changes
  save(){
    this.dialogRef.close(this.getDifference());
  }
}
