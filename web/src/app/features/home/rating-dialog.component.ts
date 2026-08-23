import { Component, inject } from '@angular/core';
import { FormGroup, ReactiveFormsModule } from '@angular/forms';
import { MatButtonModule } from '@angular/material/button';
import { MatCheckboxModule } from '@angular/material/checkbox';
import { MAT_DIALOG_DATA, MatDialogModule, MatDialogRef } from '@angular/material/dialog';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatSelectModule } from '@angular/material/select';
import { AvailableUser } from '../../core/auth/auth.models';
import { OpenedRound } from '../../core/rounds/rounds.models';

export interface RatingDialogData {
  availableUsers: () => AvailableUser[];
  form: FormGroup;
  getCommentErrorMessage: () => string;
  getUserOptionLabel: (user: AvailableUser) => string;
  ratingPending: () => boolean;
  ratingValueOptions: number[];
  selectedRound: OpenedRound;
  usersFetchError: () => string | null;
  usersLoading: () => boolean;
}

@Component({
  selector: 'app-rating-dialog',
  imports: [
    ReactiveFormsModule,
    MatButtonModule,
    MatCheckboxModule,
    MatDialogModule,
    MatFormFieldModule,
    MatInputModule,
    MatProgressSpinnerModule,
    MatSelectModule,
  ],
  templateUrl: './rating-dialog.component.html',
  styleUrl: './rating-dialog.component.scss',
})
export class RatingDialogComponent {
  protected readonly data = inject<RatingDialogData>(MAT_DIALOG_DATA);
  private readonly dialogRef = inject(MatDialogRef<RatingDialogComponent>);

  protected selectRatingValue(value: number): void {
    this.data.form.controls['value'].setValue(value);
    this.data.form.controls['value'].markAsDirty();
  }

  protected submit(): void {
    if (this.data.form.invalid) {
      this.data.form.markAllAsTouched();
      return;
    }

    this.dialogRef.close('submit');
  }
}
