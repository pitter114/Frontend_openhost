import { Component, computed, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { DomSanitizer, SafeHtml } from '@angular/platform-browser';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { RouterLink } from '@angular/router';
import { IconComponent } from '../../../shared/icon/icon.component';
import { AuthService } from '../../../core/services/auth.service';
import { DosFactoresService } from '../../../core/services/dos-factores.service';

type Paso = 'estado' | 'totp-qr' | 'totp-codigos' | 'desactivar';

@Component({
  selector: 'app-seguridad',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, RouterLink, IconComponent],
  templateUrl: './seguridad.component.html',
  styleUrls: ['./seguridad.component.scss'],
})
export class SeguridadComponent {
  private auth = inject(AuthService);
  private dosFactores = inject(DosFactoresService);
  private sanitizer = inject(DomSanitizer);
  private fb = inject(FormBuilder);

  cuenta = this.auth.cuenta;
  dosFaActiva = computed(() => !!this.cuenta()?.dosfa_confirmado);
  dosFaMetodo = computed(() => this.cuenta()?.dosfa_metodo ?? null);

  paso = signal<Paso>('estado');
  cargando = signal(false);
  cargandoCodigo = signal(false);
  codigoEnviado = signal(false);
  error = signal<string | null>(null);
  exito = signal<string | null>(null);

  qrSvg = signal<SafeHtml | null>(null);
  secretoTotp = signal<string | null>(null);
  codigosRecuperacion = signal<string[]>([]);

  formConfirmar = this.fb.group({
    codigo: ['', [Validators.required, Validators.minLength(6)]],
  });

  formDesactivar = this.fb.group({
    contrasena: ['', [Validators.required]],
    codigo: ['', [Validators.required]],
  });

  activarPorCorreo(): void {
    this.cargando.set(true);
    this.error.set(null);
    this.dosFactores.habilitar('correo').subscribe({
      next: () => {
        this.auth.me().subscribe({
          next: () => {
            this.cargando.set(false);
            this.exito.set('Verificación en dos pasos por correo activada.');
          },
          error: () => this.cargando.set(false),
        });
      },
      error: (err) => {
        this.cargando.set(false);
        this.error.set(err?.error?.message ?? 'No pudimos activar la verificación por correo.');
      },
    });
  }

  activarPorTotp(): void {
    this.cargando.set(true);
    this.error.set(null);
    this.dosFactores.habilitar('totp').subscribe({
      next: (res) => {
        this.cargando.set(false);
        this.secretoTotp.set(res.secreto);
        this.qrSvg.set(res.qr_svg ? this.sanitizer.bypassSecurityTrustHtml(res.qr_svg) : null);
        this.paso.set('totp-qr');
      },
      error: (err) => {
        this.cargando.set(false);
        this.error.set(err?.error?.message ?? 'No pudimos iniciar la configuración de la app autenticadora.');
      },
    });
  }

  confirmarTotp(): void {
    if (this.formConfirmar.invalid) {
      this.formConfirmar.markAllAsTouched();
      return;
    }

    this.cargando.set(true);
    this.error.set(null);
    const { codigo } = this.formConfirmar.getRawValue();

    this.dosFactores.confirmar(codigo!).subscribe({
      next: (res) => {
        this.cargando.set(false);
        this.codigosRecuperacion.set(res.codigos_recuperacion);
        this.paso.set('totp-codigos');
        this.auth.me().subscribe();
      },
      error: (err) => {
        this.cargando.set(false);
        this.error.set(err?.error?.message ?? 'El código no es válido.');
      },
    });
  }

  irADesactivar(): void {
    this.error.set(null);
    this.exito.set(null);
    this.codigoEnviado.set(false);
    this.paso.set('desactivar');
  }

  solicitarCodigo(): void {
    this.cargandoCodigo.set(true);
    this.error.set(null);
    this.dosFactores.solicitarCodigo().subscribe({
      next: () => {
        this.cargandoCodigo.set(false);
        this.codigoEnviado.set(true);
      },
      error: (err) => {
        this.cargandoCodigo.set(false);
        this.error.set(err?.error?.message ?? 'No pudimos enviar el código.');
      },
    });
  }

  desactivar(): void {
    if (this.formDesactivar.invalid) {
      this.formDesactivar.markAllAsTouched();
      return;
    }

    this.cargando.set(true);
    this.error.set(null);
    const { contrasena, codigo } = this.formDesactivar.getRawValue();

    this.dosFactores.deshabilitar(contrasena!, codigo!).subscribe({
      next: () => {
        this.cargando.set(false);
        this.formDesactivar.reset();
        this.auth.me().subscribe({
          next: () => {
            this.paso.set('estado');
            this.exito.set('Verificación en dos pasos desactivada.');
          },
        });
      },
      error: (err) => {
        this.cargando.set(false);
        this.error.set(err?.error?.message ?? 'No pudimos desactivar la verificación en dos pasos.');
      },
    });
  }

  cancelar(): void {
    this.error.set(null);
    this.paso.set('estado');
    this.qrSvg.set(null);
    this.secretoTotp.set(null);
    this.codigoEnviado.set(false);
    this.formConfirmar.reset();
    this.formDesactivar.reset();
  }

  terminarConfiguracionTotp(): void {
    this.codigosRecuperacion.set([]);
    this.paso.set('estado');
    this.exito.set('Verificación en dos pasos con app autenticadora activada.');
  }
}