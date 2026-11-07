import { Component, OnInit, computed, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { Router } from '@angular/router';
import { AuthService } from '../../core/services/auth.service';
import { ToastService } from '../../core/services/toast.service';
import { IconComponent } from '../icon/icon.component';

@Component({
  selector: 'app-cambio-contrasena-modal',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, IconComponent],
  templateUrl: './cambio-contrasena-modal.component.html',
  styleUrls: ['./cambio-contrasena-modal.component.scss'],
})
export class CambioContrasenaModalComponent implements OnInit {
  private fb = inject(FormBuilder);
  private auth = inject(AuthService);
  private toast = inject(ToastService);
  private router = inject(Router);

  mostrar = computed(() => {
    const c = this.auth.cuenta();
    return !!c && (c.contrasena_temporal === true || (c.contrasena_temporal as any) === 1 || (c.contrasena_temporal as any) === '1');
  });

  cargando = signal(false);
  errorMensaje = signal<string | null>(null);

  verActual = signal(false);
  verNueva = signal(false);
  verConfirmacion = signal(false);

  form: FormGroup = this.fb.group({
    contrasena_actual: ['', [Validators.required]],
    nueva_contrasena: ['', [Validators.required, Validators.minLength(8)]],
    nueva_contrasena_confirmation: ['', [Validators.required]],
  });

  ngOnInit(): void {
    if (this.auth.token) {
      this.auth.me().subscribe({ error: () => {} });
    }
  }

  get coinciden(): boolean {
    const n = this.form.get('nueva_contrasena')?.value;
    const c = this.form.get('nueva_contrasena_confirmation')?.value;
    return !!n && n === c;
  }

  submit(): void {
    if (this.form.invalid) {
      this.form.markAllAsTouched();
      return;
    }

    if (!this.coinciden) {
      this.errorMensaje.set('Las contraseñas no coinciden.');
      return;
    }

    this.cargando.set(true);
    this.errorMensaje.set(null);

    const { contrasena_actual, nueva_contrasena, nueva_contrasena_confirmation } = this.form.getRawValue();

    this.auth.cambiarContrasena(contrasena_actual, nueva_contrasena, nueva_contrasena_confirmation).subscribe({
      next: (res) => {
        this.cargando.set(false);
        this.toast.success('¡Contraseña actualizada con éxito!', 'Tu cuenta ahora está protegida con tu nueva clave.');
        this.form.reset();
      },
      error: (err) => {
        this.cargando.set(false);
        const msg = err.error?.message || 'Error al cambiar la contraseña. Verifica tu clave actual.';
        this.errorMensaje.set(msg);
      },
    });
  }

  cerrarSesion(): void {
    this.auth.logout().subscribe({
      next: () => this.router.navigate(['/login']),
      error: () => this.router.navigate(['/login']),
    });
  }
}
