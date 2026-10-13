import { HlmAlertImports } from '@spartan-ng/helm/alert';
import { HlmCardImports } from '@spartan-ng/helm/card';
import { HlmFieldImports } from '@spartan-ng/helm/field';
import { HlmInputImports } from '@spartan-ng/helm/input';
import { Component, inject, signal, output, DestroyRef } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { FormsModule, NgForm } from '@angular/forms';
import { switchMap } from 'rxjs';
import { HlmButtonImports } from '@spartan-ng/helm/button';
import { AuthService } from '../../../../core/services/auth.service';
import { apiError } from '../../../../core/utils/api-error';
@Component({
  selector: 'app-password-change',
  imports: [
    HlmAlertImports,
    HlmCardImports,
    HlmFieldImports,
    HlmInputImports,
    FormsModule,
    HlmButtonImports,
  ],
  template: `<form #form="ngForm" hlmCard class="min-w-0" (ngSubmit)="save(form)">
    <div hlmCardHeader>
      <h2 hlmCardTitle>Crie sua nova senha</h2>
      <p hlmCardDescription>Altere a senha inicial para começar a gerenciar os pets.</p>
    </div>
    <div hlmCardContent class="grid gap-3">
      <div hlmField class="my-4">
        <label hlmFieldLabel for="current">Senha atual</label
        ><input
          hlmInput
          id="current"
          name="current"
          type="password"
          [(ngModel)]="current"
          required
          autocomplete="current-password"
          [disabled]="busy()"
        />
      </div>
      <div hlmField class="my-4">
        <label hlmFieldLabel for="new">Nova senha</label
        ><input
          hlmInput
          id="new"
          name="new"
          type="password"
          [(ngModel)]="password"
          required
          minlength="8"
          pattern="(?=.*[A-Z])(?=.*[a-z])(?=.*[0-9]).{8,}"
          autocomplete="new-password"
          [disabled]="busy()"
        />
      </div>
      <p>Use pelo menos 8 caracteres, com maiúscula, minúscula e número.</p>
      @if (error()) {
        <div hlmAlert variant="destructive" class="my-4" role="alert">
          <p hlmAlertDescription>{{ error() }}</p>
        </div>
      }
      <button
        hlmBtn
        type="submit"
        class="gap-[15px]"
        [disabled]="busy() || form.invalid || password === current"
      >
        {{ busy() ? 'Salvando...' : 'Alterar senha' }}
      </button>
    </div>
  </form>`,
})
export class PasswordChange {
  private readonly auth = inject(AuthService);
  private readonly destroyRef = inject(DestroyRef);
  readonly changed = output<void>();
  protected current = '';
  protected password = '';
  protected readonly busy = signal(false);
  protected readonly error = signal('');
  protected save(form: NgForm) {
    if (this.busy() || form.invalid || this.current === this.password) return;
    this.busy.set(true);
    this.error.set('');
    let saved = false;
    this.auth
      .changePassword(this.current, this.password)
      .pipe(
        switchMap(() => {
          saved = true;
          this.current = '';
          this.password = '';
          return this.auth.refresh();
        }),
        takeUntilDestroyed(this.destroyRef),
      )
      .subscribe({
        next: () => {
          this.busy.set(false);
          this.changed.emit();
        },
        error: (error) => {
          this.busy.set(false);
          this.error.set(
            saved
              ? 'Senha alterada, mas não foi possível renovar a sessão. Entre novamente com sua nova senha.'
              : apiError(error),
          );
        },
      });
  }
}
