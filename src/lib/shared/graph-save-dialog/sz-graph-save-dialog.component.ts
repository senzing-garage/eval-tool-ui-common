import { Component, Inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import {
    MAT_DIALOG_DATA,
    MatDialogModule,
    MatDialogRef
} from '@angular/material/dialog';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatButtonModule } from '@angular/material/button';

export interface SzGraphSaveDialogData {
    /** Pre-filled name (for "update" flow). */
    name?: string;
    /** Pre-filled description (for "update" flow). */
    description?: string;
    /** Dialog title override. */
    title?: string;
}

export interface SzGraphSaveDialogResult {
    name: string;
    description: string;
}

@Component({
    selector: 'sz-graph-save-dialog',
    standalone: true,
    imports: [
        CommonModule,
        FormsModule,
        MatDialogModule,
        MatFormFieldModule,
        MatInputModule,
        MatButtonModule
    ],
    templateUrl: 'sz-graph-save-dialog.component.html',
    styleUrls: ['sz-graph-save-dialog.component.scss']
})
export class SzGraphSaveDialog {
    title = 'Save Graph';
    name = '';
    description = '';

    constructor(
        public dialogRef: MatDialogRef<SzGraphSaveDialog>,
        @Inject(MAT_DIALOG_DATA) public data: SzGraphSaveDialogData
    ) {
        if (data) {
            if (data.title) this.title = data.title;
            if (data.name) this.name = data.name;
            if (data.description) this.description = data.description;
        }
    }

    onSave(): void {
        if (!this.name.trim()) return;
        this.dialogRef.close({
            name: this.name.trim(),
            description: this.description.trim()
        } as SzGraphSaveDialogResult);
    }

    onCancel(): void {
        this.dialogRef.close(null);
    }
}
