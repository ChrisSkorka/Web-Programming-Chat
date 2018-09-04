import { Component, OnInit, Inject } from '@angular/core';
import {MAT_DIALOG_DATA, MatDialogRef} from "@angular/material";

@Component({
  selector: 'app-delete-dialog',
  templateUrl: './delete-dialog.component.html',
  styleUrls: ['./delete-dialog.component.scss']
})
export class DeleteDialogComponent implements OnInit {

  name:string = '';
  type:string = '';

  constructor(private dialogRef: MatDialogRef<DeleteDialogComponent>, @Inject(MAT_DIALOG_DATA) data) {
    // show given data
    this.name = data.name;
    this.type = data.type; // Group or Channel
  }

  ngOnInit() {
  }

  // cancel process
  cancel(){
    this.dialogRef.close(false);
  }

  // confirm
  delete(){
    this.dialogRef.close(true);
  }

}
