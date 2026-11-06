import { Component, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, ReactiveFormsModule, ValidationErrors, Validators } from '@angular/forms';
import { Router, RouterLink } from '@angular/router';
import { IconComponent } from '../../../shared/icon/icon.component';
import { AuthService } from '../../../core/services/auth.service';
import { TIPOS_DOCUMENTO } from '../../../core/models/auth.models';

function passwordsIgualesValidator(group: any): ValidationErrors | null {
  const pass = group.get('contrasena')?.value;
  const confirm = group.get('contrasena_confirmation')?.value;
  return pass && confirm && pass !== confirm ? { noCoinciden: true } : null;
}

@Component({
  selector: 'app-registro',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, RouterLink, IconComponent],
  templateUrl: './registro.component.html',
  styleUrls: ['./registro.component.scss'],
})
export class RegistroComponent {
  cargando = signal(false);
  error = signal<string | null>(null);
  exito = signal(false);
  verPassword = signal(false);
  tiposDocumento = TIPOS_DOCUMENTO;

  private fb = inject(FormBuilder);
  private auth = inject(AuthService);
  private router = inject(Router);

  form = this.fb.group(
    {
      nombre: ['', [Validators.required, Validators.maxLength(50)]],
      apellido: ['', [Validators.required, Validators.maxLength(50)]],
      tipo_documento_id: [1, [Validators.required]],
      numero_documento: ['', [Validators.required, Validators.maxLength(15)]],
      numero_telefono: ['', [Validators.required, Validators.pattern(/^[0-9]+$/), Validators.maxLength(20)]],
      correo: ['', [Validators.required, Validators.email, Validators.maxLength(255)]],
      contrasena: [
        '',
        [
          Validators.required,
          Validators.minLength(10),
          Validators.pattern(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[^a-zA-Z0-9]).+$/),
        ],
      ],
      contrasena_confirmation: ['', [Validators.required]],
    },
    { validators: passwordsIgualesValidator }
  );

  submit(): void {
    if (this.form.invalid) {
      this.form.markAllAsTouched();
      return;
    }

    this.cargando.set(true);
    this.error.set(null);

    this.auth.registro(this.form.getRawValue() as any).subscribe({
      next: () => {
        this.cargando.set(false);
        this.exito.set(true);
        setTimeout(() => this.router.navigate(['/login']), 2200);
      },
      error: (err) => {
        this.cargando.set(false);
        this.error.set(this.mensajeError(err));
      },
    });
  }

  private mensajeError(err: any): string {
    const errores = err?.error?.errors;
    if (errores) {
      const primero = Object.values(errores)[0];
      if (Array.isArray(primero)) return primero[0];
    }
    return err?.error?.message ?? 'No pudimos crear tu cuenta. Intenta nuevamente.';
  }
}
