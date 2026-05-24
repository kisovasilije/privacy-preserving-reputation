import { HttpErrorResponse } from '@angular/common/http';
import { signal } from '@angular/core';
import { ComponentFixture, TestBed } from '@angular/core/testing';
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

  const authServiceStub = jasmine.createSpyObj<AuthService>('AuthService', ['refreshSession', 'getUsers']);

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
    ratingsService = jasmine.createSpyObj<RatingsService>('RatingsService', ['submitRating']);
    roundsService = jasmine.createSpyObj<RoundsService>('RoundsService', ['getOpenedRounds', 'createRound', 'closeRound']);
    authServiceStub.refreshSession.and.returnValue(of('token'));
    authServiceStub.getUsers.and.returnValue(of([
      { id: 2, username: 'bob', email: 'bob@example.com' },
      { id: 5, username: 'alice', email: 'alice@example.com' },
    ]));
    ratingsService.submitRating.and.returnValue(of(void 0));
    roundsService.getOpenedRounds.and.returnValue(of([]));

    await TestBed.configureTestingModule({
      imports: [HomePageComponent],
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
      opensAtDate: new Date('2026-04-12T00:00:00'),
      opensAtTime: '12:00',
      closesAtDate: new Date('2026-04-12T00:00:00'),
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
      closesAtDate: new Date('2026-04-12T00:00:00'),
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
    expect(fixture.nativeElement.textContent).toContain('Round created and is now open for ratings.');
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

  it('does not submit the rating form when it is invalid', () => {
    fixture.detectChanges();

    (fixture.componentInstance as any).submitRating();
    fixture.detectChanges();

    expect(ratingsService.submitRating).not.toHaveBeenCalled();
    expect(fixture.nativeElement.textContent).toContain('Choose an opened round.');
    expect(fixture.nativeElement.textContent).toContain('Pick a rating from 1 through 5.');
    expect(fixture.nativeElement.textContent).toContain('Choose a target user.');
  });

  it('submits ratings with the selected round, value, target, commitment, and trimmed comment', async () => {
    roundsService.getOpenedRounds.and.returnValue(of([buildRound(6, 9, 'Q2 Review')]));

    fixture.detectChanges();

    const component = fixture.componentInstance as any;
    component.ratingForm.setValue({
      roundId: 6,
      value: 5,
      targetId: 2,
      comment: '  Reliable, clear communication, delivered on time.  ',
    });

    component.submitRating();
    await fixture.whenStable();
    fixture.detectChanges();

    const request = ratingsService.submitRating.calls.mostRecent().args[0];
    expect(request).toEqual(jasmine.objectContaining({
      value: 5,
      comment: 'Reliable, clear communication, delivered on time.',
      roundId: 6,
      targetId: 2,
    }));
    expect(request.commitment).toMatch(/^[a-f0-9]{64}$/);
    expect(component.ratingForm.getRawValue()).toEqual({
      roundId: 6,
      value: null,
      targetId: null,
      comment: '',
    });
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
      closesAtDate: new Date('2026-04-12T00:00:00'),
      closesAtTime: '16:00',
    });

    component.submitCreateRound();
    fixture.detectChanges();

    expect(fixture.nativeElement.textContent).toContain('Title already exists.');
  });
});

function getButtonsByText(fixture: ComponentFixture<HomePageComponent>, text: string): HTMLButtonElement[] {
  return getButtons(fixture).filter((button) => (button.textContent?.trim() ?? '') === text);
}

function getButtons(fixture: ComponentFixture<HomePageComponent>): HTMLButtonElement[] {
  return Array.from(fixture.nativeElement.querySelectorAll('button'));
}
