import { HttpErrorResponse } from '@angular/common/http';
import { signal } from '@angular/core';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { NoopAnimationsModule } from '@angular/platform-browser/animations';
import { of, Subject, throwError } from 'rxjs';
import { AuthService } from '../../core/auth/auth.service';
import { AuthStore } from '../../core/auth/auth.store';
import { RatingsService } from '../../core/ratings/ratings.service';
import { OpenedRound } from '../../core/rounds/rounds.models';
import { RoundsService } from '../../core/rounds/rounds.service';
import { HomePageComponent } from './home-page.component';

describe('HomePageComponent', () => {
  let fixture: ComponentFixture<HomePageComponent>;
  let ratingsService: jasmine.SpyObj<RatingsService>;
  let roundsService: jasmine.SpyObj<RoundsService>;

  const authStoreStub = {
    username: signal('alice'),
    isAuthenticated: signal(true),
    userId: signal(5),
  };

  const authServiceStub = jasmine.createSpyObj<AuthService>('AuthService', [
    'refreshSession',
    'getUsers',
  ]);

  const buildRound = (id: number, authorId: number, title = `Round ${id}`): OpenedRound => ({
    id,
    title,
    description: `Description ${id}`,
    opensAt: '2026-04-12T08:00:00.000Z',
    closesAt: '2026-04-12T12:00:00.000Z',
    authorId,
    createdAt: '2026-04-12T07:00:00.000Z',
    updatedAt: '2026-04-12T07:30:00.000Z',
  });

  beforeEach(async () => {
    authStoreStub.userId.set(5);
    ratingsService = jasmine.createSpyObj<RatingsService>('RatingsService', [
      'submitRating',
      'getRatingSummary',
    ]);
    roundsService = jasmine.createSpyObj<RoundsService>('RoundsService', [
      'getOpenedRounds',
      'createRound',
      'closeRound',
    ]);
    authServiceStub.refreshSession.and.returnValue(of('token'));
    authServiceStub.getUsers.and.returnValue(
      of([
        { id: 2, username: 'bob', email: 'bob@example.com' },
        { id: 5, username: 'alice', email: 'alice@example.com' },
      ]),
    );
    ratingsService.submitRating.and.returnValue(of({ id: 42 }));
    ratingsService.getRatingSummary.and.returnValue(of({ average: 4.5, count: 2 }));
    roundsService.getOpenedRounds.and.returnValue(of([]));

    await TestBed.configureTestingModule({
      imports: [HomePageComponent, NoopAnimationsModule],
      providers: [
        { provide: AuthStore, useValue: authStoreStub },
        { provide: AuthService, useValue: authServiceStub },
        { provide: RatingsService, useValue: ratingsService },
        { provide: RoundsService, useValue: roundsService },
      ],
    }).compileComponents();

    fixture = TestBed.createComponent(HomePageComponent);
  });

  it('renders fetched opened rounds', () => {
    roundsService.getOpenedRounds.and.returnValue(of([buildRound(1, 5, 'Spring Review')]));

    fixture.detectChanges();

    expect(fixture.nativeElement.textContent).toContain('Spring Review');
    expect(fixture.nativeElement.textContent).toContain('Description 1');
  });

  it('shows owner close action only for owned rounds', () => {
    roundsService.getOpenedRounds.and.returnValue(of([buildRound(1, 5), buildRound(2, 9)]));

    fixture.detectChanges();

    const closeButtons = getButtonsByText(fixture, 'Close early');
    expect(closeButtons.length).toBe(1);
  });

  it('opens results for the selected round through the main API', async () => {
    roundsService.getOpenedRounds.and.returnValue(of([buildRound(6, 9, 'Q2 Review')]));

    fixture.detectChanges();

    getButtonsByText(fixture, 'Results')[0].click();
    await fixture.whenStable();
    fixture.detectChanges();

    expect(ratingsService.getRatingSummary).toHaveBeenCalledOnceWith(6);
    expect(document.body.textContent).toContain('Q2 Review');
    expect(document.body.textContent).toContain('4.5');
    expect(document.body.textContent).toContain('2');
  });

  it('disables only the clicked close button while closing is pending', () => {
    roundsService.getOpenedRounds.and.returnValue(of([buildRound(1, 5), buildRound(2, 5)]));
    const closeSubject = new Subject<OpenedRound>();
    roundsService.closeRound.and.returnValue(closeSubject.asObservable());

    fixture.detectChanges();

    const closeButtons = getButtonsByText(fixture, 'Close early');
    closeButtons[0].click();
    fixture.detectChanges();

    const pendingButtons = getButtons(fixture).filter((button) => {
      const text = button.textContent?.trim() ?? '';
      return text === 'Closing...' || text === 'Close early';
    });

    expect(pendingButtons[0].disabled).toBeTrue();
    expect(pendingButtons[1].disabled).toBeFalse();
  });

  it('refetches opened rounds after a round is closed', () => {
    roundsService.getOpenedRounds.and.returnValues(of([buildRound(1, 5)]), of([]));
    roundsService.closeRound.and.returnValue(of(buildRound(1, 5)));

    fixture.detectChanges();

    getButtonsByText(fixture, 'Close early')[0].click();
    fixture.detectChanges();

    expect(roundsService.getOpenedRounds).toHaveBeenCalledTimes(2);
    expect(fixture.nativeElement.textContent).toContain('No rounds are open right now.');
  });

  it('does not submit the create form when it is invalid', () => {
    fixture.detectChanges();

    (fixture.componentInstance as any).submitCreateRound();
    fixture.detectChanges();

    expect(roundsService.createRound).not.toHaveBeenCalled();
    expect(fixture.nativeElement.textContent).toContain('Closing date and time are required.');
  });

  it('prevents creation when closesAt is not after opensAt', () => {
    fixture.detectChanges();

    const component = fixture.componentInstance as any;
    component.createRoundForm.setValue({
      title: 'Peer Review',
      description: '',
      opensAtDate: new Date('2027-04-12T00:00:00'),
      opensAtTime: '12:00',
      closesAtDate: new Date('2027-04-12T00:00:00'),
      closesAtTime: '11:00',
    });

    component.submitCreateRound();
    fixture.detectChanges();

    expect(roundsService.createRound).not.toHaveBeenCalled();
    expect(fixture.nativeElement.textContent).toContain('Closing time must be after opening time.');
  });

  it('resets the form and refreshes rounds after successful creation', () => {
    roundsService.getOpenedRounds.and.returnValues(of([]), of([buildRound(3, 5, 'New Round')]));
    roundsService.createRound.and.returnValue(of(buildRound(3, 5, 'New Round')));

    fixture.detectChanges();

    const component = fixture.componentInstance as any;
    component.createRoundForm.setValue({
      title: 'New Round',
      description: 'Invite private feedback',
      opensAtDate: null,
      opensAtTime: '',
      closesAtDate: new Date('2027-04-12T00:00:00'),
      closesAtTime: '15:00',
    });

    component.submitCreateRound();
    fixture.detectChanges();

    expect(roundsService.createRound).toHaveBeenCalled();
    expect(roundsService.getOpenedRounds).toHaveBeenCalledTimes(2);
    expect(component.createRoundForm.getRawValue()).toEqual({
      title: '',
      description: '',
      opensAtDate: null,
      opensAtTime: '',
      closesAtDate: null,
      closesAtTime: '',
    });
    expect(fixture.nativeElement.textContent).toContain(
      'Round created and is now open for ratings.',
    );
  });

  it('selects a round for rating when a round card is clicked', () => {
    roundsService.getOpenedRounds.and.returnValue(of([buildRound(6, 9, 'Q2 Review')]));

    fixture.detectChanges();

    (fixture.nativeElement.querySelector('.round-card') as HTMLElement).click();
    fixture.detectChanges();

    expect((fixture.componentInstance as any).ratingForm.controls.roundId.value).toBe(6);
    expect(fixture.nativeElement.textContent).toContain('Selected');
  });

  it('loads available target users without the signed-in user', () => {
    fixture.detectChanges();

    const component = fixture.componentInstance as any;

    expect(authServiceStub.getUsers).toHaveBeenCalled();
    expect(component.availableUsers()).toEqual([
      { id: 2, username: 'bob', email: 'bob@example.com' },
    ]);
  });

  it('keeps the rater ID anonymous by default', () => {
    fixture.detectChanges();

    const formValue = (fixture.componentInstance as any).ratingForm.getRawValue();
    expect(formValue.keepRaterIdAnonymous).toBeTrue();
    expect(formValue.keepTargetIdAnonymous).toBeFalse();
    expect(formValue.keepRoundIdAnonymous).toBeFalse();
  });

  it('does not submit the rating form when it is invalid', async () => {
    roundsService.getOpenedRounds.and.returnValue(of([buildRound(6, 9, 'Q2 Review')]));

    fixture.detectChanges();

    getButtonsByText(fixture, 'Rate')[0].click();
    await fixture.whenStable();
    fixture.detectChanges();

    getDocumentButtonsByText('Submit rating')[0].click();
    fixture.detectChanges();

    expect(ratingsService.submitRating).not.toHaveBeenCalled();
    expect(document.body.textContent).toContain('Pick a rating from 1 through 5.');
    expect(document.body.textContent).toContain('Choose a target user.');
  });

  it('submits plain rating data and privacy preferences to the main API', async () => {
    roundsService.getOpenedRounds.and.returnValue(of([buildRound(6, 9, 'Q2 Review')]));

    fixture.detectChanges();

    const component = fixture.componentInstance as any;
    component.ratingForm.setValue({
      roundId: 6,
      value: 5,
      targetId: 2,
      comment: '  Reliable, clear communication, delivered on time.  ',
      keepRaterIdAnonymous: true,
      keepTargetIdAnonymous: false,
      keepRoundIdAnonymous: false,
    });

    component.submitRating();
    await fixture.whenStable();
    fixture.detectChanges();

    const request = ratingsService.submitRating.calls.mostRecent().args[0];
    expect(request).toEqual({
      value: 5,
      roundId: 6,
      targetId: 2,
      comment: 'Reliable, clear communication, delivered on time.',
      keepRaterIdAnonymous: true,
      keepTargetIdAnonymous: false,
      keepRoundIdAnonymous: false,
    });
    expect('raterId' in request).toBeFalse();
    expect('commitment' in request).toBeFalse();
    expect('proof' in request).toBeFalse();
    expect('publicSignals' in request).toBeFalse();
    expect('shares' in request).toBeFalse();
    expect(component.ratingForm.getRawValue()).toEqual({
      roundId: 6,
      value: null,
      targetId: null,
      comment: '',
      keepRaterIdAnonymous: true,
      keepTargetIdAnonymous: false,
      keepRoundIdAnonymous: false,
    });
    expect(fixture.nativeElement.textContent).toContain('Rating submitted.');
  });

  it('sends required domain IDs with anonymity choices for the backend to apply', async () => {
    fixture.detectChanges();

    const component = fixture.componentInstance as any;
    component.ratingForm.setValue({
      roundId: 6,
      value: 4,
      targetId: 2,
      comment: '',
      keepRaterIdAnonymous: true,
      keepTargetIdAnonymous: true,
      keepRoundIdAnonymous: true,
    });

    component.submitRating();
    await fixture.whenStable();

    const request = ratingsService.submitRating.calls.mostRecent().args[0];
    expect(request).toEqual({
      value: 4,
      roundId: 6,
      targetId: 2,
      keepRaterIdAnonymous: true,
      keepTargetIdAnonymous: true,
      keepRoundIdAnonymous: true,
    });
  });

  it('keeps the form values and shows the backend error when rating submission fails', async () => {
    ratingsService.submitRating.and.returnValue(
      throwError(
        () =>
          new HttpErrorResponse({
            error: { message: 'Rating round is closed.' },
            status: 400,
          }),
      ),
    );

    fixture.detectChanges();

    const component = fixture.componentInstance as any;
    component.ratingForm.setValue({
      roundId: 6,
      value: 5,
      targetId: 2,
      comment: '',
      keepRaterIdAnonymous: true,
      keepTargetIdAnonymous: false,
      keepRoundIdAnonymous: false,
    });

    component.submitRating();
    await fixture.whenStable();
    fixture.detectChanges();

    expect(component.ratingForm.getRawValue()).toEqual({
      roundId: 6,
      value: 5,
      targetId: 2,
      comment: '',
      keepRaterIdAnonymous: true,
      keepTargetIdAnonymous: false,
      keepRoundIdAnonymous: false,
    });
    expect(fixture.nativeElement.textContent).toContain('Rating round is closed.');
  });

  it('keeps rating submission pending until the main API succeeds', async () => {
    const ratingResponse = new Subject<{ id: number }>();
    ratingsService.submitRating.and.returnValue(ratingResponse);

    fixture.detectChanges();

    const component = fixture.componentInstance as any;
    component.ratingForm.setValue({
      roundId: 6,
      value: 5,
      targetId: 2,
      comment: '',
      keepRaterIdAnonymous: true,
      keepTargetIdAnonymous: false,
      keepRoundIdAnonymous: false,
    });

    component.submitRating();
    await fixture.whenStable();
    fixture.detectChanges();

    expect(component.ratingPending()).toBeTrue();
    expect(fixture.nativeElement.textContent).not.toContain('Rating submitted.');

    ratingResponse.next({ id: 42 });
    fixture.detectChanges();

    expect(component.ratingPending()).toBeFalse();
    expect(fixture.nativeElement.textContent).toContain('Rating submitted.');
  });

  it('shows backend validation errors when create fails', () => {
    roundsService.createRound.and.returnValue(
      throwError(() => new HttpErrorResponse({ error: { message: 'Title already exists.' } })),
    );

    fixture.detectChanges();

    const component = fixture.componentInstance as any;
    component.createRoundForm.setValue({
      title: 'Conflict Round',
      description: '',
      opensAtDate: null,
      opensAtTime: '',
      closesAtDate: new Date('2027-04-12T00:00:00'),
      closesAtTime: '16:00',
    });

    component.submitCreateRound();
    fixture.detectChanges();

    expect(fixture.nativeElement.textContent).toContain('Title already exists.');
  });
});

function getButtonsByText(
  fixture: ComponentFixture<HomePageComponent>,
  text: string,
): HTMLButtonElement[] {
  return getButtons(fixture).filter((button) => (button.textContent?.trim() ?? '') === text);
}

function getButtons(fixture: ComponentFixture<HomePageComponent>): HTMLButtonElement[] {
  return Array.from(fixture.nativeElement.querySelectorAll('button'));
}

function getDocumentButtonsByText(text: string): HTMLButtonElement[] {
  return Array.from(document.body.querySelectorAll('button')).filter(
    (button) => (button.textContent?.trim() ?? '') === text,
  );
}
