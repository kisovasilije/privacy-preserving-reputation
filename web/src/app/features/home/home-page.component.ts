import { Component, OnInit, inject, signal } from '@angular/core';
import {
  AbstractControl,
  FormBuilder,
  ReactiveFormsModule,
  ValidationErrors,
  ValidatorFn,
  Validators,
} from '@angular/forms';
import { MatButtonModule } from '@angular/material/button';
import { MatCardModule } from '@angular/material/card';
import { MatDatepickerModule } from '@angular/material/datepicker';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatNativeDateModule } from '@angular/material/core';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatSelectModule } from '@angular/material/select';
import { AvailableUser } from '../../core/auth/auth.models';
import { AuthService } from '../../core/auth/auth.service';
import { AuthStore } from '../../core/auth/auth.store';
import { getApiErrorMessage } from '../../core/http/api-error.util';
import { SubmitRatingRequest } from '../../core/ratings/ratings.models';
import { RatingsService } from '../../core/ratings/ratings.service';
import {
  CreateRoundRequest,
  OpenedRound,
} from '../../core/rounds/rounds.models';
import { RoundsService } from '../../core/rounds/rounds.service';
import { EMPTY, from, map, Observable, of, switchMap } from 'rxjs';
import { commit } from '../../utils/commitment.util';

function trimmedTextValidator(config: {
  min?: number;
  max?: number;
  required?: boolean;
}): ValidatorFn {
  return (control: AbstractControl): ValidationErrors | null => {
    const value = typeof control.value === 'string' ? control.value.trim() : '';

    if (!value) {
      return config.required ? { required: true } : null;
    }

    if (config.min != null && value.length < config.min) {
      return {
        minlength: { requiredLength: config.min, actualLength: value.length },
      };
    }

    if (config.max != null && value.length > config.max) {
      return {
        maxlength: { requiredLength: config.max, actualLength: value.length },
      };
    }

    return null;
  };
}

function parseDateValue(
  dateValue: Date | string | null | undefined,
): Date | null {
  if (!dateValue) {
    return null;
  }

  const parsed =
    dateValue instanceof Date ? new Date(dateValue) : new Date(dateValue);
  return Number.isNaN(parsed.getTime()) ? null : parsed;
}

function parseDateParts(
  dateValue: Date | string | null | undefined,
  timeValue: string | null | undefined,
): Date | null {
  if (!dateValue || !timeValue) {
    return null;
  }

  const parsedDate = parseDateValue(dateValue);
  if (!parsedDate) {
    return null;
  }

  const [hours, minutes] = timeValue.split(':').map(Number);
  if (!Number.isInteger(hours) || !Number.isInteger(minutes)) {
    return null;
  }

  parsedDate.setHours(hours, minutes, 0, 0);
  return parsedDate;
}

function toInteger(value: unknown): number | null {
  const numericValue =
    typeof value === 'number'
      ? value
      : typeof value === 'string' && value.trim()
        ? Number(value)
        : NaN;
  return Number.isInteger(numericValue) ? numericValue : null;
}

const roundScheduleValidator: ValidatorFn = (
  control: AbstractControl,
): ValidationErrors | null => {
  const opensAtDateValue = control.get('opensAtDate')?.value as Date | null;
  const opensAtTimeValue = control.get('opensAtTime')?.value as string;
  const closesAtDateValue = control.get('closesAtDate')?.value as Date | null;
  const closesAtTimeValue = control.get('closesAtTime')?.value as string;

  if (!closesAtDateValue || !closesAtTimeValue) {
    return null;
  }

  const closesAt = parseDateParts(closesAtDateValue, closesAtTimeValue);
  if (!closesAt) {
    return { invalidClosesAt: true };
  }

  if (!opensAtDateValue && !opensAtTimeValue) {
    return closesAt > new Date() ? null : { closesAtInPast: true };
  }

  if (!opensAtDateValue || !opensAtTimeValue) {
    return { incompleteOpensAt: true };
  }

  const opensAt = parseDateParts(opensAtDateValue, opensAtTimeValue);
  if (!opensAt) {
    return { invalidOpensAt: true };
  }

  return closesAt > opensAt ? null : { closesBeforeOpens: true };
};

@Component({
  selector: 'app-home-page',
  imports: [
    ReactiveFormsModule,
    MatButtonModule,
    MatCardModule,
    MatDatepickerModule,
    MatFormFieldModule,
    MatInputModule,
    MatNativeDateModule,
    MatProgressSpinnerModule,
    MatSelectModule,
  ],
  templateUrl: './home-page.component.html',
  styleUrl: './home-page.component.scss',
})
export class HomePageComponent implements OnInit {
  protected readonly authStore = inject(AuthStore);

  private readonly formBuilder = inject(FormBuilder);
  private readonly authService = inject(AuthService);
  private readonly ratingsService = inject(RatingsService);
  private readonly roundsService = inject(RoundsService);
  private readonly dateTimeFormatter = new Intl.DateTimeFormat(undefined, {
    dateStyle: 'medium',
    timeStyle: 'short',
  });

  protected readonly refreshing = signal(false);
  protected readonly roundsLoading = signal(true);
  protected readonly roundsFetchError = signal<string | null>(null);
  protected readonly openedRounds = signal<OpenedRound[]>([]);
  protected readonly usersLoading = signal(true);
  protected readonly usersFetchError = signal<string | null>(null);
  protected readonly availableUsers = signal<AvailableUser[]>([]);
  protected readonly createPending = signal(false);
  protected readonly createFeedbackMessage = signal<string | null>(null);
  protected readonly createFeedbackTone = signal<'success' | 'error' | null>(
    null,
  );
  protected readonly ratingPending = signal(false);
  protected readonly closePendingById = signal<Record<number, boolean>>({});
  protected readonly statusMessage = signal<string | null>(null);
  protected readonly statusTone = signal<'success' | 'error' | null>(null);
  protected readonly hourOptions = Array.from({ length: 24 }, (_, index) =>
    `${index}`.padStart(2, '0'),
  );
  protected readonly minuteOptions = ['00', '30'];
  protected readonly ratingValueOptions = [1, 2, 3, 4, 5];
  protected readonly createRoundForm = this.formBuilder.group(
    {
      title: ['', [trimmedTextValidator({ min: 3, max: 128, required: true })]],
      description: ['', [trimmedTextValidator({ max: 1024 })]],
      opensAtDate: [null as Date | null],
      opensAtTime: [''],
      closesAtDate: [null as Date | null],
      closesAtTime: ['', [trimmedTextValidator({ required: true })]],
    },
    { validators: [roundScheduleValidator] },
  );
  protected readonly ratingForm = this.formBuilder.group({
    roundId: [null as number | null, [Validators.required]],
    value: [
      null as number | null,
      [Validators.required, Validators.min(1), Validators.max(5)],
    ],
    targetId: [null as number | null, [Validators.required]],
    comment: ['', [trimmedTextValidator({ max: 1024 })]],
  });

  ngOnInit(): void {
    this.loadOpenedRounds();
    this.loadAvailableUsers();
  }

  protected renewAccessToken(): void {
    this.refreshing.set(true);
    this.clearStatus();

    this.authService.refreshSession().subscribe({
      next: () => {
        this.refreshing.set(false);
        this.statusTone.set('success');
        this.statusMessage.set('Your private rating space is ready to use.');
      },
      error: (error: unknown) => {
        this.refreshing.set(false);
        this.statusTone.set('error');
        this.statusMessage.set(
          getApiErrorMessage(
            error,
            'We could not reopen your private rating space right now.',
          ),
        );
      },
    });
  }

  protected loadOpenedRounds(): void {
    this.roundsLoading.set(true);
    this.roundsFetchError.set(null);

    this.roundsService.getOpenedRounds().subscribe({
      next: (rounds) => {
        this.roundsLoading.set(false);
        this.openedRounds.set(rounds);
      },
      error: (error: unknown) => {
        this.roundsLoading.set(false);
        this.roundsFetchError.set(
          getApiErrorMessage(
            error,
            'We could not load opened rounds right now.',
          ),
        );
      },
    });
  }

  protected loadAvailableUsers(): void {
    this.usersLoading.set(true);
    this.usersFetchError.set(null);

    this.authService.getUsers().subscribe({
      next: (users) => {
        this.usersLoading.set(false);
        this.availableUsers.set(
          users.filter((user) => this.isAvailableRatingTarget(user)),
        );
      },
      error: (error: unknown) => {
        this.usersLoading.set(false);
        this.usersFetchError.set(
          getApiErrorMessage(
            error,
            'We could not load available users right now.',
          ),
        );
      },
    });
  }

  protected submitCreateRound(): void {
    if (this.createRoundForm.invalid) {
      this.createRoundForm.markAllAsTouched();
      this.setCreateFeedback(
        'error',
        'Round was not created. Check the highlighted fields and try again.',
      );
      return;
    }

    const request = this.buildCreateRoundRequest();
    if (!request) {
      this.createRoundForm.markAllAsTouched();
      this.setCreateFeedback(
        'error',
        'Round was not created. Check the schedule and try again.',
      );
      return;
    }

    this.clearStatus();
    this.clearCreateFeedback();
    this.createPending.set(true);

    this.roundsService.createRound(request).subscribe({
      next: () => {
        this.createPending.set(false);
        this.createRoundForm.reset({
          title: '',
          description: '',
          opensAtDate: null,
          opensAtTime: '',
          closesAtDate: null,
          closesAtTime: '',
        });
        this.setCreateFeedback(
          'success',
          this.isFutureRound(request)
            ? 'Round created. It will appear once it opens.'
            : 'Round created and is now open for ratings.',
        );
        this.loadOpenedRounds();
      },
      error: (error: unknown) => {
        this.createPending.set(false);
        this.setCreateFeedback(
          'error',
          getApiErrorMessage(error, 'Round was not created. Try again.'),
        );
      },
    });
  }

  protected closeRound(roundId: number): void {
    if (this.isClosePending(roundId)) {
      return;
    }

    this.clearStatus();
    this.setClosePending(roundId, true);

    this.roundsService.closeRound(roundId).subscribe({
      next: () => {
        this.setClosePending(roundId, false);
        this.statusTone.set('success');
        this.statusMessage.set('Round closed early.');
        this.loadOpenedRounds();
      },
      error: (error: unknown) => {
        this.setClosePending(roundId, false);
        this.statusTone.set('error');
        this.statusMessage.set(
          getApiErrorMessage(error, 'We could not close the round.'),
        );
      },
    });
  }

  protected selectRoundForRating(round: OpenedRound): void {
    this.ratingForm.controls.roundId.setValue(round.id);
    this.ratingForm.controls.roundId.markAsDirty();
  }

  protected selectRatingValue(value: number): void {
    this.ratingForm.controls.value.setValue(value);
    this.ratingForm.controls.value.markAsDirty();
  }

  protected submitRating(): void {
    if (this.ratingForm.invalid) {
      this.ratingForm.markAllAsTouched();
      return;
    }

    let req: SubmitRatingRequest;
    this.buildSubmitRatingRequest()
      .pipe(
        switchMap((request) => {
          if (!request) {
            this.ratingForm.markAllAsTouched();
            return EMPTY;
          }

          this.clearStatus();
          this.ratingPending.set(true);

          req = request;
          return this.ratingsService.submitRating(request);
        }),
      )
      .subscribe({
        next: () => {
          this.ratingPending.set(false);
          this.ratingForm.reset({
            roundId: req.roundId,
            value: null,
            targetId: null,
            comment: '',
          });
          this.statusTone.set('success');
          this.statusMessage.set('Rating submitted.');
        },
        error: (error: unknown) => {
          this.ratingPending.set(false);
          this.statusTone.set('error');
          this.statusMessage.set(
            getApiErrorMessage(error, 'We could not submit the rating.'),
          );
        },
      });
  }

  protected formatDateTime(value: string): string {
    return this.dateTimeFormatter.format(new Date(value));
  }

  protected isOwner(round: OpenedRound): boolean {
    return round.authorId === this.authStore.userId();
  }

  protected isClosePending(roundId: number): boolean {
    return this.closePendingById()[roundId] === true;
  }

  protected isSelectedForRating(roundId: number): boolean {
    return toInteger(this.ratingForm.controls.roundId.value) === roundId;
  }

  protected getUserOptionLabel(user: AvailableUser): string {
    return user.email
      ? `${user.username} (${user.email})`
      : `${user.username} #${user.id}`;
  }

  protected getTitleErrorMessage(): string {
    const control = this.createRoundForm.controls.title;

    if (control.hasError('required')) {
      return 'Title is required.';
    }

    if (control.hasError('minlength')) {
      return 'Title must be between 3 and 128 characters.';
    }

    if (control.hasError('maxlength')) {
      return 'Title must be between 3 and 128 characters.';
    }

    return '';
  }

  protected getDescriptionErrorMessage(): string {
    return this.createRoundForm.controls.description.hasError('maxlength')
      ? 'Description must be 1024 characters or fewer.'
      : '';
  }

  protected getScheduleErrorMessage(): string | null {
    const form = this.createRoundForm;
    const closesAtDateControl = form.controls.closesAtDate;
    const closesAtTimeControl = form.controls.closesAtTime;

    if (
      !closesAtDateControl.touched &&
      !closesAtTimeControl.touched &&
      !form.touched
    ) {
      return null;
    }

    if (
      !closesAtDateControl.value ||
      !(closesAtTimeControl.value ?? '').trim()
    ) {
      return 'Closing date and time are required.';
    }

    if (form.hasError('invalidClosesAt')) {
      return 'Closing date and time are invalid.';
    }

    if (form.hasError('closesAtInPast')) {
      return 'Closing time must be in the future.';
    }

    if (form.hasError('incompleteOpensAt')) {
      return 'Opening date and time must both be set.';
    }

    if (form.hasError('invalidOpensAt')) {
      return 'Opening date and time are invalid.';
    }

    if (form.hasError('closesBeforeOpens')) {
      return 'Closing time must be after opening time.';
    }

    return null;
  }

  protected getCommentErrorMessage(): string {
    return this.ratingForm.controls.comment.hasError('maxlength')
      ? 'Comment must be 1024 characters or fewer.'
      : '';
  }

  private buildCreateRoundRequest(): CreateRoundRequest | null {
    const {
      title,
      description,
      opensAtDate,
      opensAtTime,
      closesAtDate,
      closesAtTime,
    } = this.createRoundForm.getRawValue();
    const closesAt = parseDateParts(closesAtDate, closesAtTime);

    if (!closesAt) {
      return null;
    }

    const normalizedTitle = (title ?? '').trim();
    const normalizedDescription = (description ?? '').trim();

    const request: CreateRoundRequest = {
      title: normalizedTitle,
      closesAt: closesAt.toISOString(),
    };

    if (normalizedDescription) {
      request.description = normalizedDescription;
    }

    const opensAt = parseDateParts(opensAtDate, opensAtTime);
    if (opensAt) {
      request.opensAt = opensAt.toISOString();
    }

    return request;
  }

  private isFutureRound(request: CreateRoundRequest): boolean {
    return request.opensAt != null && new Date(request.opensAt) > new Date();
  }

  private buildSubmitRatingRequest(): Observable<SubmitRatingRequest | null> {
    const { roundId, value, targetId, comment } = this.ratingForm.getRawValue();
    const normalizedRoundId = toInteger(roundId);
    const normalizedValue = toInteger(value);
    const normalizedTargetId = toInteger(targetId);

    if (
      normalizedRoundId == null ||
      normalizedValue == null ||
      normalizedValue < 1 ||
      normalizedValue > 5 ||
      normalizedTargetId == null
    ) {
      return of(null);
    }

    return from(commit(normalizedValue)).pipe(
      map(({ commitment, nonce }) => {
        const request: SubmitRatingRequest = {
          roundId: normalizedRoundId,
          value: normalizedValue,
          targetId: normalizedTargetId,
          commitment,
        };

        const normalizedComment = (comment ?? '').trim();
        if (normalizedComment) {
          request.comment = normalizedComment;
        }

        return request;
      }),
    );
  }

  private setClosePending(roundId: number, pending: boolean): void {
    this.closePendingById.update((current) => {
      const next = { ...current };
      if (pending) {
        next[roundId] = true;
      } else {
        delete next[roundId];
      }

      return next;
    });
  }

  private clearStatus(): void {
    this.statusMessage.set(null);
    this.statusTone.set(null);
  }

  private isAvailableRatingTarget(user: AvailableUser): boolean {
    return Number.isInteger(user.id) && user.id !== this.authStore.userId();
  }

  private setCreateFeedback(tone: 'success' | 'error', message: string): void {
    this.createFeedbackTone.set(tone);
    this.createFeedbackMessage.set(message);
  }

  private clearCreateFeedback(): void {
    this.createFeedbackMessage.set(null);
    this.createFeedbackTone.set(null);
  }
}
