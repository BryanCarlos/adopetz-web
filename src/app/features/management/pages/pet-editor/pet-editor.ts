import { HlmSpinnerImports } from '@spartan-ng/helm/spinner';
import { HlmAlertImports } from '@spartan-ng/helm/alert';
import { HlmCardImports } from '@spartan-ng/helm/card';
import { HlmCheckboxImports } from '@spartan-ng/helm/checkbox';
import { HlmFieldImports } from '@spartan-ng/helm/field';
import { HlmTextareaImports } from '@spartan-ng/helm/textarea';
import { HlmInputImports } from '@spartan-ng/helm/input';
import {
  HlmDatePicker,
  HlmDatePickerTrigger,
  provideHlmDatePickerConfig,
} from '@spartan-ng/helm/date-picker';
import { provideBrnCalendarI18n } from '@spartan-ng/brain/calendar';
import { Component, DestroyRef, HostListener, inject, signal } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { AbstractControl, FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { DatePipe } from '@angular/common';
import { concatMap, from, Observable, tap } from 'rxjs';
import { HlmButtonImports } from '@spartan-ng/helm/button';
import { ManagerPet, PetDetails, VaccineDetails } from '../../../../core/models/pet';
import { PetsService } from '../../../../core/services/pets.service';
import { apiError } from '../../../../core/utils/api-error';
import { dateFromApi, dateToApi, formatCalendarDate } from '../../../../core/utils/calendar-date';
import { ConfirmDelete } from '../../../../shared/components/confirm-delete/confirm-delete';
import { Icon } from '../../../../shared/components/icon/icon';

export function localToday() {
  const now = new Date();
  return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-${String(now.getDate()).padStart(2, '0')}`;
}
export function pastDate(control: AbstractControl) {
  const day =
    control.value instanceof Date ? dateToApi(control.value)?.slice(0, 10) : control.value;
  return day && day > localToday() ? { futureDate: true } : null;
}
export function integerAge(control: AbstractControl) {
  return control.value != null && !Number.isInteger(control.value) ? { integer: true } : null;
}
export function validPhoto(file: File): string | null {
  if (!['image/jpeg', 'image/png', 'image/webp', 'image/avif'].includes(file.type))
    return 'Use fotos JPEG, PNG, WebP ou AVIF.';
  if (file.size > 10 * 1024 * 1024) return 'Cada foto deve ter no máximo 10 MB.';
  return null;
}
interface PendingPhoto {
  file: File;
  url: string;
}

@Component({
  imports: [
    HlmSpinnerImports,
    HlmAlertImports,
    HlmCardImports,
    HlmCheckboxImports,
    HlmFieldImports,
    HlmTextareaImports,
    HlmInputImports,
    HlmDatePicker,
    HlmDatePickerTrigger,
    ReactiveFormsModule,
    RouterLink,
    DatePipe,
    HlmButtonImports,
    ConfirmDelete,
    Icon,
  ],
  providers: [
    provideHlmDatePickerConfig<Date>({ formatDate: formatCalendarDate, autoCloseOnSelect: true }),
    provideBrnCalendarI18n({
      formatWeekdayName: (day) => ['Dom', 'Seg', 'Ter', 'Qua', 'Qui', 'Sex', 'Sáb'][day],
      labelWeekday: (day) =>
        [
          'Domingo',
          'Segunda-feira',
          'Terça-feira',
          'Quarta-feira',
          'Quinta-feira',
          'Sexta-feira',
          'Sábado',
        ][day],
      formatMonth: (month) =>
        new Intl.DateTimeFormat('pt-BR', { month: 'long' }).format(new Date(2020, month, 1)),
      formatHeader: (month, year) =>
        new Intl.DateTimeFormat('pt-BR', { month: 'long', year: 'numeric' }).format(
          new Date(year, month, 1),
        ),
      months: () => [
        'janeiro',
        'fevereiro',
        'março',
        'abril',
        'maio',
        'junho',
        'julho',
        'agosto',
        'setembro',
        'outubro',
        'novembro',
        'dezembro',
      ],
      labelPrevious: () => 'Mês anterior',
      labelNext: () => 'Próximo mês',
    }),
  ],
  templateUrl: './pet-editor.html',
})
export class PetEditor {
  private readonly fb = inject(FormBuilder);
  private readonly pets = inject(PetsService);
  private readonly route = inject(ActivatedRoute);
  private readonly router = inject(Router);
  private readonly destroyRef = inject(DestroyRef);
  protected readonly id = this.route.snapshot.paramMap.get('id');
  protected readonly pet = signal<ManagerPet | null>(null);
  protected readonly loading = signal(false);
  protected readonly saving = signal(false);
  protected readonly error = signal('');
  protected readonly message = signal('');
  protected readonly pendingPhotos = signal<PendingPhoto[]>([]);
  protected readonly pendingVaccines = signal<VaccineDetails[]>([]);
  protected readonly editingVaccine = signal<string | null>(null);
  protected readonly today = new Date();
  private saved = false;
  protected readonly form = this.fb.group({
    name: ['', [Validators.required, Validators.maxLength(100)]],
    breed: ['', Validators.maxLength(100)],
    about: ['', [Validators.required, Validators.maxLength(500)]],
    ageInYears: [null as number | null, [Validators.min(0), Validators.max(99), integerAge]],
    rescueDate: [null as Date | null, pastDate],
    adopted: [false],
  });
  protected readonly vaccineForm = this.fb.nonNullable.group({
    name: ['', [Validators.required, Validators.maxLength(100)]],
    applicationDate: this.fb.control<Date | null>(null, pastDate),
  });

  constructor() {
    if (this.id) this.load(true);
    this.destroyRef.onDestroy(() =>
      this.pendingPhotos().forEach((photo) => URL.revokeObjectURL(photo.url)),
    );
  }
  hasUnsavedChanges() {
    return (
      !this.saved &&
      (this.form.dirty ||
        this.pendingPhotos().length > 0 ||
        this.pendingVaccines().length > 0 ||
        (this.vaccineForm.dirty && !!this.vaccineForm.controls.name.value.trim()))
    );
  }
  @HostListener('window:beforeunload', ['$event'])
  protected beforeUnload(event: BeforeUnloadEvent) {
    if (this.hasUnsavedChanges()) event.preventDefault();
  }

  protected load(initial = false) {
    if (!this.id) return;
    if (initial) this.loading.set(true);
    this.pets
      .get(this.id)
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: (pet) => {
          this.pet.set(pet);
          this.loading.set(false);
          this.saving.set(false);
          if (initial) {
            this.form.reset({
              name: pet.name,
              breed: pet.breed ?? '',
              about: pet.about,
              ageInYears: pet.ageInYears,
              rescueDate: dateFromApi(pet.rescueDate),
              adopted: pet.isAdopted,
            });
          }
        },
        error: (error) => {
          this.loading.set(false);
          this.saving.set(false);
          this.error.set(apiError(error));
          if (error.error?.errorCode === 'PASSWORD_CHANGE_REQUIRED')
            void this.router.navigate(['/ong']);
        },
      });
  }
  protected save() {
    if (this.saving()) return;
    this.form.markAllAsTouched();
    const value = this.form.getRawValue();
    if (this.form.invalid || !value.name?.trim() || !value.about?.trim()) {
      this.error.set('Confira os campos. Nome e descrição são obrigatórios.');
      return;
    }
    const details: PetDetails = {
      name: value.name!.trim(),
      breed: value.breed?.trim() || null,
      about: value.about!.trim(),
      ageInYears: value.ageInYears,
      rescueDate: dateToApi(value.rescueDate),
      adopted: value.adopted ?? false,
    };
    this.saving.set(true);
    this.error.set('');
    this.message.set('');
    if (this.id) {
      this.pets
        .update(this.id, details)
        .pipe(takeUntilDestroyed(this.destroyRef))
        .subscribe({
          next: () => {
            this.form.markAsPristine();
            this.message.set('Dados do pet salvos.');
            this.load();
          },
          error: (error) => {
            this.saving.set(false);
            this.error.set(apiError(error));
          },
        });
    } else {
      this.pets
        .create(
          details,
          this.pendingPhotos().map((photo) => photo.file),
          this.pendingVaccines(),
        )
        .pipe(takeUntilDestroyed(this.destroyRef))
        .subscribe({
          next: (response) => {
            this.saved = true;
            void this.router.navigate(['/ong', response.id, 'editar']);
          },
          error: (error) => {
            this.saving.set(false);
            this.error.set(apiError(error));
          },
        });
    }
  }
  protected selectPhotos(event: Event) {
    const input = event.target as HTMLInputElement;
    const files = Array.from(input.files ?? []);
    input.value = '';
    if (!files.length || this.saving()) return;
    this.error.set('');
    if (files.length + this.pendingPhotos().length + (this.pet()?.images.length ?? 0) > 4) {
      this.error.set('Cada pet pode ter no máximo 4 fotos.');
      return;
    }
    for (const file of files) {
      const problem = validPhoto(file);
      if (problem) {
        this.error.set(problem);
        return;
      }
    }
    this.pendingPhotos.update((photos) => [
      ...photos,
      ...files.map((file) => ({ file, url: URL.createObjectURL(file) })),
    ]);
  }
  protected removePendingPhoto(photo: PendingPhoto) {
    URL.revokeObjectURL(photo.url);
    this.pendingPhotos.update((photos) => photos.filter((item) => item !== photo));
  }
  protected uploadPhotos() {
    if (!this.id || !this.pendingPhotos().length || this.saving()) return;
    const id = this.id;
    this.saving.set(true);
    this.error.set('');
    this.message.set('');
    from([...this.pendingPhotos()])
      .pipe(
        concatMap((photo) =>
          this.pets.addImage(id, photo.file).pipe(tap(() => this.removePendingPhoto(photo))),
        ),
        takeUntilDestroyed(this.destroyRef),
      )
      .subscribe({
        complete: () => {
          this.message.set('Fotos adicionadas.');
          this.load();
        },
        error: (error) => {
          this.error.set(`${apiError(error)} As fotos não enviadas permanecem selecionadas.`);
          this.load();
        },
      });
  }
  protected deletePhoto(imageId: string) {
    if (this.id) this.run(this.pets.deleteImage(this.id, imageId), 'Foto excluída.');
  }
  protected editVaccine(vaccine: VaccineDetails & { id: string }) {
    this.editingVaccine.set(vaccine.id);
    this.vaccineForm.reset({
      name: vaccine.name,
      applicationDate: dateFromApi(vaccine.applicationDate),
    });
  }
  protected cancelVaccine() {
    this.editingVaccine.set(null);
    this.vaccineForm.reset();
  }
  protected saveVaccine() {
    this.vaccineForm.markAllAsTouched();
    if (this.vaccineForm.invalid || this.saving()) return;
    const value = this.vaccineForm.getRawValue();
    if (!value.name.trim()) {
      this.error.set('Informe o nome da vacina.');
      return;
    }
    const vaccine: VaccineDetails = {
      name: value.name.trim(),
      applicationDate: dateToApi(value.applicationDate),
    };
    if (!this.id) {
      this.pendingVaccines.update((vaccines) => [...vaccines, vaccine]);
      this.cancelVaccine();
      return;
    }
    const vaccineId = this.editingVaccine();
    this.run(
      vaccineId
        ? this.pets.updateVaccine(this.id, vaccineId, vaccine)
        : this.pets.addVaccine(this.id, vaccine),
      'Vacina salva.',
      () => this.cancelVaccine(),
    );
  }
  protected deleteVaccine(vaccineId: string) {
    if (this.id)
      this.run(this.pets.deleteVaccine(this.id, vaccineId), 'Vacina excluída.', () => {
        if (this.editingVaccine() === vaccineId) this.cancelVaccine();
      });
  }
  protected removePendingVaccine(index: number) {
    this.pendingVaccines.update((vaccines) => vaccines.filter((_, i) => i !== index));
  }
  private run(operation: Observable<void>, message: string, after?: () => void) {
    if (this.saving()) return;
    this.saving.set(true);
    this.error.set('');
    this.message.set('');
    operation.pipe(takeUntilDestroyed(this.destroyRef)).subscribe({
      next: () => {
        after?.();
        this.message.set(message);
        this.load();
      },
      error: (error) => {
        this.saving.set(false);
        this.error.set(apiError(error));
      },
    });
  }
  protected safeImage(url: string) {
    return /^https?:\/\//i.test(url) ? url : '';
  }
}
