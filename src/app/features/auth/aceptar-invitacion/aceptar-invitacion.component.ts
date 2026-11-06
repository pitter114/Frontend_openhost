import { Component, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, ReactiveFormsModule, ValidationErrors, Validators } from '@angular/forms';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { IconComponent } from '../../../shared/icon/icon.component';
import { AuthService } from '../../../core/services/auth.service';

function passwordsIgualesValidator(group: any): ValidationErrors | null {
  const pass = group.get('contrasena')?.value;
  const confirm = group.get('contrasena_confirmation')?.value;
  return pass && confirm && pass !== confirm ? { noCoinciden: true } : null;
}

@Component({
  selector: 'app-aceptar-invitacion',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, RouterLink, IconComponent],
  templateUrl: './aceptar-invitacion.component.html',
  styleUrls: ['./aceptar-invitacion.component.scss'],
})
export class AceptarInvitacionComponent {
  private fb = inject(FormBuilder);
  private auth = inject(AuthService);
  private route = inject(ActivatedRoute);
  private router = inject(Router);

  token = this.route.snapshot.queryParamMap.get('token') ?? '';

  cargando = signal(false);
  error = signal<string | null>(null);
  exito = signal(false);
  verPassword = signal(false);

  form = this.fb.group(
    {
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
    if (!this.token) {
      this.error.set('El enlace de invitación no es válido — falta el token.');
      return;
    }

    if (this.form.invalid) {
      this.form.markAllAsTouched();
      return;
    }

    this.cargando.set(true);
    this.error.set(null);
    const { contrasena, contrasena_confirmation } = this.form.getRawValue();

    this.auth.aceptarInvitacion(this.token, contrasena!, contrasena_confirmation!).subscribe({
      next: () => {
        this.cargando.set(false);
        this.exito.set(true);
        setTimeout(() => this.router.navigate(['/login']), 2200);
      },
      error: (err) => {
        this.cargando.set(false);
        this.error.set(
          err?.error?.message ?? 'No pudimos activar tu cuenta. El enlace puede haber expirado o ya haberse usado.'
        );
      },
    });
  }
}
