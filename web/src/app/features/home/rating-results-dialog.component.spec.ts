import { TestBed } from '@angular/core/testing';
import { MAT_DIALOG_DATA, MatDialogRef } from '@angular/material/dialog';
import { NoopAnimationsModule } from '@angular/platform-browser/animations';
import { of } from 'rxjs';
import { TrustedAuthoritiesService } from '../../core/ratings/trusted-authorities.service';
import {
  RatingResultsDialogComponent,
  RatingResultsDialogData,
} from './rating-results-dialog.component';

describe('RatingResultsDialogComponent', () => {
  it('loads and displays the current user summary for the selected round', async () => {
    const trustedAuthoritiesService = jasmine.createSpyObj<TrustedAuthoritiesService>(
      'TrustedAuthoritiesService',
      ['getRatingSummary'],
    );
    trustedAuthoritiesService.getRatingSummary.and.returnValue(of({ average: 4.5, count: 2 }));

    await TestBed.configureTestingModule({
      imports: [RatingResultsDialogComponent, NoopAnimationsModule],
      providers: [
        { provide: TrustedAuthoritiesService, useValue: trustedAuthoritiesService },
        {
          provide: MAT_DIALOG_DATA,
          useValue: {
            roundId: 6,
            roundTitle: 'Q2 Review',
            targetId: 5,
          } satisfies RatingResultsDialogData,
        },
        { provide: MatDialogRef, useValue: jasmine.createSpyObj('MatDialogRef', ['close']) },
      ],
    }).compileComponents();

    const fixture = TestBed.createComponent(RatingResultsDialogComponent);
    fixture.detectChanges();

    expect(trustedAuthoritiesService.getRatingSummary).toHaveBeenCalledOnceWith(6, 5);
    expect(fixture.nativeElement.textContent).toContain('Q2 Review');
    expect(fixture.nativeElement.textContent).toContain('4.5');
    expect(fixture.nativeElement.textContent).toContain('2');
  });
});
