import { DecimalPipe } from '@angular/common';
import { Component, DestroyRef, OnInit, inject, signal } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { MatButtonModule } from '@angular/material/button';
import { MAT_DIALOG_DATA, MatDialogModule } from '@angular/material/dialog';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { getApiErrorMessage } from '../../core/http/api-error.util';
import { RatingSummary } from '../../core/ratings/ratings.models';
import { TrustedAuthoritiesService } from '../../core/ratings/trusted-authorities.service';

export interface RatingResultsDialogData {
  roundId: number;
  roundTitle: string;
  targetId: number;
}

@Component({
  selector: 'app-rating-results-dialog',
  imports: [DecimalPipe, MatButtonModule, MatDialogModule, MatProgressSpinnerModule],
  templateUrl: './rating-results-dialog.component.html',
  styleUrl: './rating-results-dialog.component.scss',
})
export class RatingResultsDialogComponent implements OnInit {
  protected readonly data = inject<RatingResultsDialogData>(MAT_DIALOG_DATA);
  private readonly trustedAuthoritiesService = inject(TrustedAuthoritiesService);
  private readonly destroyRef = inject(DestroyRef);

  protected readonly loading = signal(true);
  protected readonly errorMessage = signal<string | null>(null);
  protected readonly summary = signal<RatingSummary | null>(null);

  ngOnInit(): void {
    this.trustedAuthoritiesService
      .getRatingSummary(this.data.roundId, this.data.targetId)
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: (summary) => {
          this.summary.set(summary);
          this.loading.set(false);
        },
        error: (error: unknown) => {
          this.errorMessage.set(
            getApiErrorMessage(error, 'We could not load results for this round.'),
          );
          this.loading.set(false);
        },
      });
  }
}
