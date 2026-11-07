import { Component } from '@angular/core';
import { RouterOutlet } from '@angular/router';
import { CambioContrasenaModalComponent } from './shared/cambio-contrasena-modal/cambio-contrasena-modal.component';

@Component({
  selector: 'app-root',
  standalone: true,
  imports: [RouterOutlet, CambioContrasenaModalComponent],
  template: `
    <router-outlet></router-outlet>
    <app-cambio-contrasena-modal />
  `,
})
export class AppComponent {}
