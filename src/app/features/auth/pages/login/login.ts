import { HlmAlertImports } from '@spartan-ng/helm/alert';
import { HlmCardImports } from '@spartan-ng/helm/card';
import { HlmFieldImports } from '@spartan-ng/helm/field';
import { HlmInputImports } from '@spartan-ng/helm/input';
import { Component, inject, signal } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { FormsModule, NgForm } from '@angular/forms';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { HlmButtonImports } from '@spartan-ng/helm/button';
import { AuthService } from '../../../../core/services/auth.service';
import { Icon } from '../../../../shared/components/icon/icon';
import { Subject, exhaustMap, catchError, of } from 'rxjs';
@Component({
  imports: [
    HlmAlertImports,
    HlmCardImports,
    HlmFieldImports,
    HlmInputImports,
    FormsModule,
    RouterLink,
    HlmButtonImports,
    Icon,
  ],
  template: `<section
    class="auth-page grid grid-cols-2 items-center gap-[70px] min-h-[670px] py-[70px] max-[701px]:grid-cols-1 max-[701px]:gap-[30px] max-[701px]:py-[40px] container w-[min(1100px,_calc(100%_-_64px))] mx-auto px-0 max-[701px]:w-[calc(100%_-_36px)]"
  >
    <div
      class="auth-intro [&_h1]:text-[40px] [&_h1]:leading-[1.2] [&_h1]:tracking-[-1.6px] [&_h1]:font-[750] [&_h1]:m-[20px_0] [&_h1_span]:text-primary [&_p]:text-[15px] [&_p]:leading-[1.8] [&_p]:text-muted-foreground [&_p]:mb-[25px] [&_a]:text-[13px] [&_a]:text-primary [&_a]:font-[650] max-[701px]:[&_h1]:text-[32px]"
    >
      <span class="eyebrow text-primary text-[10px] font-[750] tracking-[1.7px]">ÁREA DA ONG</span>
      <h1>Você cuida deles.<br /><span>A gente ajuda a encontrar um lar.</span></h1>
      <p>Entre com o acesso da sua organização para acompanhar os pets cadastrados.</p>
      <a routerLink="/">← Voltar para a vitrine</a>
    </div>
    <form #form="ngForm" hlmCard class="min-w-0" (ngSubmit)="submit(form)">
      <div hlmCardHeader>
        <span
          class="panel-icon grid place-items-center size-12 bg-secondary rounded-[14px] mb-[22px] text-primary"
          ><app-icon name="user"
        /></span>
        <h2 hlmCardTitle>Que bom ter você aqui.</h2>
        <p hlmCardDescription>Use o e-mail e a senha da sua ONG.</p>
      </div>
      <div hlmCardContent class="grid gap-3">
        @if (passwordChanged) {
          <p role="status">Senha alterada! Entre com sua nova senha.</p>
        }
        @if (expired) {
          <p role="status">Sua sessão expirou. Entre novamente para continuar.</p>
        }
        @if (unavailable) {
          <p role="status">
            Não foi possível recuperar a sessão. Confira sua conexão e tente novamente.
          </p>
        }
        <div hlmField class="my-4">
          <label hlmFieldLabel for="email">E-mail</label
          ><input
            hlmInput
            id="email"
            type="email"
            name="email"
            [(ngModel)]="email"
            required
            email
            autocomplete="username"
            placeholder="contato@ong.org.br"
            [disabled]="busy()"
          />
        </div>
        <div hlmField class="my-4">
          <label hlmFieldLabel for="password">Senha</label
          ><input
            hlmInput
            id="password"
            type="password"
            name="password"
            [(ngModel)]="password"
            required
            autocomplete="current-password"
            placeholder="Sua senha"
            [disabled]="busy()"
          />
        </div>
        @if (error()) {
          <div hlmAlert variant="destructive" class="my-4" role="alert">
            <p hlmAlertDescription>{{ error() }}</p>
          </div>
        }
        <button hlmBtn type="submit" class="gap-[15px]" [disabled]="busy() || form.invalid">
          {{ busy() ? 'Entrando...' : 'Entrar' }}<app-icon name="arrow" />
        </button>
        <p class="form-hint">
          O acesso é exclusivo para organizações cadastradas. As contas são criadas pelo responsável
          pelo Adopetz.
        </p>
      </div>
    </form>
  </section>`,
})
export class Login {
  private readonly route = inject(ActivatedRoute);
  protected readonly expired = this.route.snapshot.queryParamMap.has('expired');
  protected readonly unavailable = this.route.snapshot.queryParamMap.has('unavailable');
  protected readonly passwordChanged =
    inject(ActivatedRoute).snapshot.queryParamMap.has('passwordChanged');
  private readonly auth = inject(AuthService);
  private readonly router = inject(Router);
  private readonly submissions = new Subject<void>();
  protected email = '';
  protected password = '';
  protected readonly busy = signal(false);
  protected readonly error = signal('');
  constructor() {
    this.submissions
      .pipe(
        exhaustMap(() => {
          this.busy.set(true);
          this.error.set('');
          return this.auth.login(this.email.trim(), this.password).pipe(
            catchError((error) => {
              this.error.set(
                error.status === 401
                  ? 'E-mail ou senha incorretos.'
                  : error.status === 429
                    ? 'Muitas tentativas. Aguarde um momento antes de tentar novamente.'
                    : 'Não foi possível entrar. Tente novamente em instantes.',
              );
              return of(null);
            }),
          );
        }),
        takeUntilDestroyed(),
      )
      .subscribe((response) => {
        this.busy.set(false);
        if (response) {
          this.password = '';
          void this.router.navigate(['/ong']);
        }
      });
  }
  protected submit(form: NgForm) {
    if (form.valid) this.submissions.next();
  }
}
