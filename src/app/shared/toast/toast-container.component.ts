import { Component, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ToastService, ToastItem } from '../../core/services/toast.service';
import { IconComponent } from '../icon/icon.component';

@Component({
  selector: 'app-toast-container',
  standalone: true,
  imports: [CommonModule, IconComponent],
  template: `
    <div class="toast-container" *ngIf="toastService.toasts().length > 0">
      <div
        class="toast-pill toast-pill--{{ t.tipo }}"
        *ngFor="let t of toastService.toasts()"
        (click)="toastService.dismiss(t.id)"
      >
        <div class="toast-icon">
          <app-icon [name]="getIcon(t.tipo)" [size]="16" />
        </div>
        <div class="toast-body">
          <div class="toast-msg">{{ t.mensaje }}</div>
          <div class="toast-sub" *ngIf="t.subtitulo">{{ t.subtitulo }}</div>
        </div>
        <button type="button" class="toast-close" (click)="toastService.dismiss(t.id)">
          <app-icon name="x" [size]="14" />
        </button>
      </div>
    </div>
  `,
  styles: [`
    :host {
      display: contents;
    }

    .toast-container {
      position: fixed;
      bottom: 24px;
      right: 24px;
      z-index: 10000;
      display: flex;
      flex-direction: column;
      gap: 10px;
      pointer-events: none;
      max-width: 420px;
      width: calc(100vw - 32px);
    }

    .toast-pill {
      pointer-events: auto;
      display: flex;
      align-items: flex-start;
      gap: 12px;
      background: var(--pms-card, #161e2e);
      border: 1px solid var(--pms-border, #26324b);
      border-radius: var(--pms-radius-md, 12px);
      padding: 12px 14px;
      box-shadow: 0 10px 30px rgba(0, 0, 0, 0.35), 0 2px 8px rgba(0, 0, 0, 0.2);
      animation: toast-in 0.25s cubic-bezier(0.16, 1, 0.3, 1);
      cursor: pointer;
      transition: transform 0.15s ease, opacity 0.15s ease;

      &:hover {
        transform: translateY(-2px);
      }

      &--success {
        border-left: 4px solid var(--pms-green, #10b981);
        .toast-icon { color: var(--pms-green, #10b981); background: rgba(16, 185, 129, 0.12); }
      }

      &--error {
        border-left: 4px solid var(--pms-red, #ef4444);
        .toast-icon { color: var(--pms-red, #ef4444); background: rgba(239, 68, 68, 0.12); }
      }

      &--warning {
        border-left: 4px solid var(--pms-amber, #f59e0b);
        .toast-icon { color: var(--pms-amber, #f59e0b); background: rgba(245, 158, 11, 0.12); }
      }

      &--info {
        border-left: 4px solid var(--pms-blue, #3b6bf6);
        .toast-icon { color: var(--pms-blue, #3b6bf6); background: rgba(59, 107, 246, 0.12); }
      }
    }

    .toast-icon {
      width: 28px;
      height: 28px;
      border-radius: 8px;
      display: flex;
      align-items: center;
      justify-content: center;
      flex-shrink: 0;
    }

    .toast-body {
      flex: 1;
      min-width: 0;
    }

    .toast-msg {
      font-size: 13.5px;
      font-weight: 600;
      color: var(--pms-text, #f1f5f9);
      line-height: 1.35;
    }

    .toast-sub {
      font-size: 12px;
      color: var(--pms-text-muted, #7c869c);
      margin-top: 2px;
      line-height: 1.3;
    }

    .toast-close {
      border: none;
      background: transparent;
      color: var(--pms-text-muted, #7c869c);
      padding: 2px;
      cursor: pointer;
      flex-shrink: 0;
      display: flex;
      align-items: center;
      justify-content: center;

      &:hover {
        color: var(--pms-text, #f1f5f9);
      }
    }

    @keyframes toast-in {
      from {
        opacity: 0;
        transform: translateY(12px) scale(0.96);
      }
      to {
        opacity: 1;
        transform: translateY(0) scale(1);
      }
    }
  `]
})
export class ToastContainerComponent {
  toastService = inject(ToastService);

  getIcon(tipo: string): string {
    switch (tipo) {
      case 'success': return 'sparkles';
      case 'error': return 'alert';
      case 'warning': return 'bell';
      default: return 'shield';
    }
  }
}
