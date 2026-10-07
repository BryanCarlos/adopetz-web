import { Component, inject, signal, output, DestroyRef } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { FormsModule, NgForm } from '@angular/forms';
import { switchMap } from 'rxjs';
import { HlmButtonImports } from '@spartan-ng/helm/button';
import { AuthService } from '../../../../core/services/auth.service';
import { apiError } from '../../../../core/utils/api-error';
@Component({
  selector: 'app-password-change',
  imports: [FormsModule, HlmButtonImports],
  template: `<form #form="ngForm" class="form-panel password-panel" (ngSubmit)="save(form)">
    <h2>Crie sua nova senha</h2>
    <p>Altere a senha inicial para começar a gerenciar os pets.</p>
    <label for="current">Senha atual</label
    ><input
      id="current"
      name="current"
      type="password"
      [(ngModel)]="current"
      required
      autocomplete="current-password"
      [disabled]="busy()"
    />
    <label for="new">Nova senha</label
    ><input
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
    <p>Use pelo menos 8 caracteres, com maiúscula, minúscula e número.</p>
    @if (error()) {
      <p class="form-error" role="alert">{{ error() }}</p>
    }
    <button
      hlmBtn
      type="submit"
      class="action-button"
      [disabled]="busy() || form.invalid || password === current"
    >
      {{ busy() ? 'Salvando...' : 'Alterar senha' }}
    </button>
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
