import { Injectable, signal } from '@angular/core';

export interface ToastItem {
  id: string;
  tipo: 'success' | 'error' | 'info' | 'warning';
  mensaje: string;
  subtitulo?: string;
  duracion?: number;
}

@Injectable({ providedIn: 'root' })
export class ToastService {
  toasts = signal<ToastItem[]>([]);

  show(tipo: 'success' | 'error' | 'info' | 'warning', mensaje: string, subtitulo?: string, duracion = 3500): void {
    const id = Math.random().toString(36).substring(2, 9);
    const item: ToastItem = { id, tipo, mensaje, subtitulo, duracion };

    this.toasts.update((current) => [...current, item]);

    if (duracion > 0) {
      setTimeout(() => {
        this.dismiss(id);
      }, duracion);
    }
  }

  success(mensaje: string, subtitulo?: string): void {
    this.show('success', mensaje, subtitulo);
  }

  error(mensaje: string, subtitulo?: string): void {
    this.show('error', mensaje, subtitulo, 4500);
  }

  info(mensaje: string, subtitulo?: string): void {
    this.show('info', mensaje, subtitulo);
  }

  warning(mensaje: string, subtitulo?: string): void {
    this.show('warning', mensaje, subtitulo);
  }

  dismiss(id: string): void {
    this.toasts.update((current) => current.filter((t) => t.id !== id));
  }
}
