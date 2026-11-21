import { TestBed } from '@angular/core/testing';
import { MAT_DIALOG_DATA, MatDialogRef } from '@angular/material/dialog';
import { NoopAnimationsModule } from '@angular/platform-browser/animations';
import { of } from 'rxjs';
import { RatingsService } from '../../core/ratings/ratings.service';
import {
  RatingResultsDialogComponent,
  RatingResultsDialogData,
} from './rating-results-dialog.component';

describe('RatingResultsDialogComponent', () => {
  it('loads and displays the current user summary for the selected round', async () => {
    const ratingsService = jasmine.createSpyObj<RatingsService>(
      'RatingsService',
      ['getRatingSummary'],
    );
    ratingsService.getRatingSummary.and.returnValue(of({ average: 4.5, count: 2 }));

    await TestBed.configureTestingModule({
      imports: [RatingResultsDialogComponent, NoopAnimationsModule],
      providers: [
        { provide: RatingsService, useValue: ratingsService },
        {
          provide: MAT_DIALOG_DATA,
          useValue: {
            roundId: 6,
            roundTitle: 'Q2 Review',
          } satisfies RatingResultsDialogData,
        },
        { provide: MatDialogRef, useValue: jasmine.createSpyObj('MatDialogRef', ['close']) },
      ],
    }).compileComponents();

    const fixture = TestBed.createComponent(RatingResultsDialogComponent);
    fixture.detectChanges();

    expect(ratingsService.getRatingSummary).toHaveBeenCalledOnceWith(6);
    expect(fixture.nativeElement.textContent).toContain('Q2 Review');
    expect(fixture.nativeElement.textContent).toContain('4.5');
    expect(fixture.nativeElement.textContent).toContain('2');
  });
});
