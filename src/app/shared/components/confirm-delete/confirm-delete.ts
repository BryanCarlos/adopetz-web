import { Component, input, output } from '@angular/core';
import { BrnDialogImports } from '@spartan-ng/brain/dialog';
import { HlmButtonImports } from '@spartan-ng/helm/button';
@Component({
  selector: 'app-confirm-delete',
  imports: [BrnDialogImports, HlmButtonImports],
  template: `<brn-dialog>
    <button hlmBtn variant="destructive" brnDialogTrigger [disabled]="disabled()">
      {{ label() }}
    </button>
    <section *brnDialogContent="let ctx" class="delete-dialog">
      <h2 brnDialogTitle>{{ title() }}</h2>
      <p brnDialogDescription>{{ description() }}</p>
      <div>
        <button hlmBtn variant="outline" (click)="ctx.close()">Cancelar</button
        ><button hlmBtn variant="destructive" (click)="ctx.close(); confirmed.emit()">
          Confirmar exclusão
        </button>
      </div>
    </section>
  </brn-dialog>`,
  styles: [
    `
      .delete-dialog {
        background: white;
        padding: 28px;
        border-radius: 18px;
        border: 1px solid var(--border);
        width: min(440px, calc(100vw - 36px));
        box-shadow: 0 20px 80px #03045e30;
      }
      .delete-dialog h2 {
        font-size: 22px;
        font-weight: 700;
        color: var(--navy);
      }
      .delete-dialog p {
        font-size: 14px;
        color: var(--muted-foreground);
        line-height: 1.7;
        margin: 15px 0 24px;
      }
      .delete-dialog > div {
        display: flex;
        justify-content: flex-end;
        gap: 10px;
        flex-wrap: wrap;
      }
    `,
  ],
})
export class ConfirmDelete {
  readonly label = input('Excluir');
  readonly title = input('Excluir este item?');
  readonly description = input('Esta operação não pode ser desfeita.');
  readonly disabled = input(false);
  readonly confirmed = output<void>();
}
