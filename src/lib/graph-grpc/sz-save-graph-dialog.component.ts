import { Component, Inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { MAT_DIALOG_DATA, MatDialogModule, MatDialogRef } from '@angular/material/dialog';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatButtonModule } from '@angular/material/button';
import { DragDropModule } from '@angular/cdk/drag-drop';

export interface SzSaveGraphDialogData {
  name?: string;
  description?: string;
}

export interface SzSaveGraphDialogResult {
  name: string;
  description: string;
}

@Component({
    selector: 'sz-save-graph-dialog',
    templateUrl: './sz-save-graph-dialog.component.html',
    styleUrls: ['./sz-save-graph-dialog.component.scss'],
    imports: [
      CommonModule, FormsModule, DragDropModule,
      MatDialogModule, MatFormFieldModule, MatInputModule, MatButtonModule,
    ]
})
export class SzSaveGraphDialog {
  name: string;
  description: string;

  constructor(
    private dialogRef: MatDialogRef<SzSaveGraphDialog, SzSaveGraphDialogResult>,
    @Inject(MAT_DIALOG_DATA) public data: SzSaveGraphDialogData
  ) {
    this.name = data?.name ?? '';
    this.description = data?.description ?? '';
  }

  onSave(): void {
    if (!this.name.trim()) return;
    this.dialogRef.close({ name: this.name.trim(), description: this.description.trim() });
  }
}
