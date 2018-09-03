import { Component, OnInit, Inject } from '@angular/core';
import {MAT_DIALOG_DATA, MatDialogRef} from "@angular/material";

@Component({
  selector: 'app-new-dialog',
  templateUrl: './new-dialog.component.html',
  styleUrls: ['./new-dialog.component.scss']
})
export class NewDialogComponent implements OnInit {

  name:string = '';
  type:string = '';

  constructor(private dialogRef: MatDialogRef<NewDialogComponent>, @Inject(MAT_DIALOG_DATA) data) {
    this.type = data.type;
  }

  ngOnInit() {
  }

  cancel(){
    this.dialogRef.close(false);
  }

  create(){
    this.dialogRef.close(this.name);
  }

}
