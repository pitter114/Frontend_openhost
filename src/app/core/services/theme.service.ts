import { Injectable, signal } from '@angular/core';

const THEME_KEY = 'openhost_theme';

@Injectable({ providedIn: 'root' })
export class ThemeService {
  private readonly _oscuro = signal<boolean>(this.leerPreferencia());
  readonly oscuro = this._oscuro.asReadonly();

  constructor() {
    this.aplicar(this._oscuro());
  }

  alternar(): void {
    this.fijar(!this._oscuro());
  }

  fijar(oscuro: boolean): void {
    this._oscuro.set(oscuro);
    localStorage.setItem(THEME_KEY, oscuro ? 'dark' : 'light');
    this.aplicar(oscuro);
  }

  private aplicar(oscuro: boolean): void {
    document.documentElement.classList.toggle('dark', oscuro);
  }

  private leerPreferencia(): boolean {
    const guardado = localStorage.getItem(THEME_KEY);
    if (guardado) return guardado === 'dark';
    return window.matchMedia?.('(prefers-color-scheme: dark)').matches ?? false;
  }
}
