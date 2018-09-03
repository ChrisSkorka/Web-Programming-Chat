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
    this.name = data.name;
    this.type = data.type;
  }

  ngOnInit() {
  }

  cancel(){
    this.dialogRef.close(false);
  }

  delete(){
    this.dialogRef.close(true);
  }

}
