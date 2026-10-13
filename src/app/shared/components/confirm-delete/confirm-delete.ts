import { Component, input, output } from '@angular/core';
import { HlmDialogImports } from '@spartan-ng/helm/dialog';
import { HlmButtonImports } from '@spartan-ng/helm/button';
@Component({
  selector: 'app-confirm-delete',
  imports: [HlmDialogImports, HlmButtonImports],
  template: `<hlm-dialog>
    <button hlmBtn variant="destructive" hlmDialogTrigger [disabled]="disabled()">
      {{ label() }}
    </button>
    <hlm-dialog-content *hlmDialogPortal="let ctx" closeLabel="Fechar" [showCloseButton]="false">
      <hlm-dialog-header
        ><h2 hlmDialogTitle>{{ title() }}</h2>
        <p hlmDialogDescription>{{ description() }}</p></hlm-dialog-header
      >
      <hlm-dialog-footer
        ><button hlmBtn variant="outline" hlmDialogClose>Cancelar</button
        ><button hlmBtn variant="destructive" (click)="ctx.close(); confirmed.emit()">
          Confirmar exclusão
        </button></hlm-dialog-footer
      >
    </hlm-dialog-content>
  </hlm-dialog>`,
})
export class ConfirmDelete {
  readonly label = input('Excluir');
  readonly title = input('Excluir este item?');
  readonly description = input('Esta operação não pode ser desfeita.');
  readonly disabled = input(false);
  readonly confirmed = output<void>();
}
