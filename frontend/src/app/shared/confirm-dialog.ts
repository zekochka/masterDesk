import { Component, EventEmitter, Input, Output } from '@angular/core';

@Component({
  selector: 'app-confirm-dialog',
  template: `
    <div class="modal-backdrop" (click)="cancel.emit()">
      <section class="dialog confirm-dialog" role="alertdialog" aria-modal="true" aria-labelledby="confirm-title" (click)="$event.stopPropagation()">
        <div class="confirm-icon">!</div>
        <h2 id="confirm-title">{{ title }}</h2>
        <p>{{ description }}</p>
        <div class="dialog-actions">
          <button class="button button-secondary" type="button" (click)="cancel.emit()">Отмена</button>
          <button class="button button-danger" type="button" (click)="confirm.emit()">{{ confirmText }}</button>
        </div>
      </section>
    </div>
  `,
})
export class ConfirmDialog {
  @Input() title = 'Подтвердить действие?';
  @Input() description = 'Это действие нельзя отменить.';
  @Input() confirmText = 'Удалить';
  @Output() confirm = new EventEmitter<void>();
  @Output() cancel = new EventEmitter<void>();
}
