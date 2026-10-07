import { HlmCardImports } from '@spartan-ng/helm/card';
import { HlmEmptyImports } from '@spartan-ng/helm/empty';
import { HlmSpinnerImports } from '@spartan-ng/helm/spinner';
import { HlmAlertImports } from '@spartan-ng/helm/alert';
import { HlmBadgeImports } from '@spartan-ng/helm/badge';
import { Component, inject, signal, DestroyRef } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { RouterLink } from '@angular/router';
import { HlmButtonImports } from '@spartan-ng/helm/button';
import { ManagerPet, Page } from '../../../../core/models/pet';
import { PetsService } from '../../../../core/services/pets.service';
import { apiError } from '../../../../core/utils/api-error';
import { Pagination } from '../../../../shared/components/pagination/pagination';
import { ConfirmDelete } from '../../../../shared/components/confirm-delete/confirm-delete';
import { Icon } from '../../../../shared/components/icon/icon';
import { PasswordChange } from '../../../auth/components/password-change/password-change';

@Component({
  imports: [
    HlmCardImports,
    HlmEmptyImports,
    HlmSpinnerImports,
    HlmAlertImports,
    HlmBadgeImports,
    RouterLink,
    HlmButtonImports,
    Pagination,
    ConfirmDelete,
    Icon,
    PasswordChange,
  ],
  templateUrl: './pets.html',
})
export class MyPets {
  private readonly pets = inject(PetsService);
  private readonly destroyRef = inject(DestroyRef);
  protected readonly result = signal<Page<ManagerPet> | null>(null);
  protected readonly busy = signal(false);
  protected readonly actionId = signal<string | null>(null);
  protected readonly passwordChange = signal(false);
  protected readonly error = signal('');
  protected readonly message = signal('');
  constructor() {
    this.load(1);
  }
  protected load(page: number) {
    if (this.busy()) return;
    this.busy.set(true);
    this.error.set('');
    this.pets
      .mine(page)
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: (result) => {
          this.busy.set(false);
          if (!result.items.length && result.totalCount > 0 && page > 1) {
            this.load(page - 1);
            return;
          }
          this.result.set(result);
        },
        error: (error) => {
          this.busy.set(false);
          if (error.error?.errorCode === 'PASSWORD_CHANGE_REQUIRED') this.passwordChange.set(true);
          else this.error.set(apiError(error));
        },
      });
  }
  protected passwordChanged() {
    this.passwordChange.set(false);
    this.message.set('Senha alterada. Sua sessão foi renovada.');
    this.load(1);
  }
  protected remove(pet: ManagerPet) {
    if (this.actionId()) return;
    this.actionId.set(pet.id);
    this.error.set('');
    this.message.set('');
    this.pets
      .delete(pet.id)
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: () => {
          this.actionId.set(null);
          this.message.set(`${pet.name} foi excluído.`);
          this.load(this.result()?.pageNumber ?? 1);
        },
        error: (error) => {
          this.actionId.set(null);
          this.error.set(apiError(error));
        },
      });
  }
  protected toggleAdoption(pet: ManagerPet) {
    if (this.actionId()) return;
    this.actionId.set(pet.id);
    this.error.set('');
    this.message.set('');
    this.pets
      .update(pet.id, {
        name: pet.name,
        breed: pet.breed,
        about: pet.about,
        ageInYears: pet.ageInYears,
        rescueDate: pet.rescueDate,
        adopted: !pet.isAdopted,
      })
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: () => {
          this.actionId.set(null);
          this.message.set(`Status de ${pet.name} atualizado.`);
          this.load(this.result()?.pageNumber ?? 1);
        },
        error: (error) => {
          this.actionId.set(null);
          this.error.set(apiError(error));
        },
      });
  }
  protected imageUrl(pet: ManagerPet) {
    const url = pet.images[0]?.filePath;
    return url && /^https?:\/\//i.test(url) ? url : null;
  }
  protected imageFailed(event: Event) {
    (event.target as HTMLImageElement).hidden = true;
  }
}
