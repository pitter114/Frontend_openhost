import { Component, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { Router, RouterLink } from '@angular/router';
import { IconComponent } from '../../../shared/icon/icon.component';
import { AuthService } from '../../../core/services/auth.service';

@Component({
  selector: 'app-login',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, RouterLink, IconComponent],
  templateUrl: './login.component.html',
  styleUrls: ['./login.component.scss'],
})
export class LoginComponent {
  paso = signal<'credenciales' | '2fa'>('credenciales');
  cargando = signal(false);
  error = signal<string | null>(null);
  verPassword = signal(false);

  metodo2fa = signal<string>('');
  private reto = '';

  private fb = inject(FormBuilder);
  private auth = inject(AuthService);
  private router = inject(Router);

  form = this.fb.group({
    correo: ['', [Validators.required, Validators.email]],
    contrasena: ['', [Validators.required]],
  });

  form2fa = this.fb.group({
    codigo: ['', [Validators.required, Validators.minLength(6)]],
  });

  submitCredenciales(): void {
    if (this.form.invalid) {
      this.form.markAllAsTouched();
      return;
    }

    this.cargando.set(true);
    this.error.set(null);
    const { correo, contrasena } = this.form.getRawValue();

    this.auth.login(correo!, contrasena!).subscribe({
      next: (res) => {
        this.cargando.set(false);
        if (res.requiere_2fa) {
          this.reto = res.reto ?? '';
          this.metodo2fa.set(res.metodo ?? 'código');
          this.paso.set('2fa');
        } else {
          this.router.navigate(['/organizaciones']);
        }
      },
      error: (err) => {
        this.cargando.set(false);
        this.error.set(this.mensajeError(err, 'No pudimos iniciar sesión. Verifica tus credenciales.'));
      },
    });
  }

  submit2fa(): void {
    if (this.form2fa.invalid) {
      this.form2fa.markAllAsTouched();
      return;
    }

    this.cargando.set(true);
    this.error.set(null);
    const { codigo } = this.form2fa.getRawValue();

    this.auth.verificar2fa(this.reto, codigo!).subscribe({
      next: () => {
        this.cargando.set(false);
        this.router.navigate(['/organizaciones']);
      },
      error: (err) => {
        this.cargando.set(false);
        this.error.set(this.mensajeError(err, 'Código incorrecto o expirado.'));
      },
    });
  }

  volver(): void {
    this.paso.set('credenciales');
    this.error.set(null);
    this.form2fa.reset();
  }

  private mensajeError(err: any, fallback: string): string {
    return err?.error?.message ?? err?.error?.errors?.correo?.[0] ?? fallback;
  }
}