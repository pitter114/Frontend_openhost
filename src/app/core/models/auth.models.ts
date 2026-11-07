export interface Persona {
  id: number;
  nombre: string;
  apellido: string;
  numero_documento: string;
  numero_telefono: string;
  tipo_documento: string | null;
}

export interface Cuenta {
  id: number;
  correo: string;
  correo_verificado: boolean;
  estado_cuenta: string | null;
  primer_login: boolean;
  contrasena_temporal?: boolean;
  dosfa_metodo: 'correo' | 'totp' | null;
  dosfa_confirmado: boolean;
  persona: Persona | null;
}

export interface HabilitarDosFactoresResponse {
  metodo: 'correo' | 'totp';
  secreto: string | null;
  qr_svg: string | null;
}

export interface LoginResponse {
  requiere_2fa?: true;
  metodo?: string;
  reto?: string;
  cuenta?: Cuenta;
  token?: string;
}

export interface SesionResponse {
  cuenta: Cuenta;
  token: string;
}

export interface RegistroCuentaPayload {
  nombre: string;
  apellido: string;
  tipo_documento_id: number;
  numero_documento: string;
  numero_telefono: string;
  fecha_nacimiento?: string | null;
  pais_id?: number | null;
  genero_id?: number | null;
  correo: string;
  contrasena: string;
  contrasena_confirmation: string;
}

/** Seeded by TipoDocumentoSeeder — no list endpoint exists yet on the API. */
export const TIPOS_DOCUMENTO = [
  { id: 1, nombre: 'DNI' },
  { id: 2, nombre: 'RUC' },
  { id: 3, nombre: 'Pasaporte' },
  { id: 4, nombre: 'Carné de Extranjería' },
];

export interface OrganizacionModulos {
  limpieza: boolean;
  mantenimiento: boolean;
  inventario: boolean;
  edificios: boolean;
  reservas_web: boolean;
  tienda?: boolean;
}

export interface Organizacion {
  id: number;
  nombre_legal: string | null;
  nombre_comercial: string;
  ruc: string | null;
  correo_contacto: string;
  telefono_contacto: string;
  tipo_organizacion: string | null;
  estado: string | null;
  fecha_registro: string | null;
  modulos_activos?: OrganizacionModulos | null;
  modulos_overrides?: Partial<OrganizacionModulos> | null;
  plan_actual?: {
    plan_id: number;
    nombre: string;
    precio: number;
    fecha_inicio: string;
    fecha_fin: string;
    estado: string;
    max_habitaciones: number;
  } | null;
}

export interface MiembroOrganizacion {
  id: number;
  organizacion_id: number;
  usuario_id: number;
  estado: string | null;
  fecha_ingreso: string | null;
}

export interface MiOrganizacion {
  id: number;
  organizacion: Organizacion;
  perfiles: string[];
  roles: string[];
}

export interface RegistrarOrganizacionPayload {
  tipo_organizacion_id: number;
  nombre_legal?: string | null;
  nombre_comercial: string;
  ruc?: string | null;
  correo_contacto: string;
  telefono_contacto: string;
}

/** Seeded by TipoOrganizacionSeeder — no list endpoint exists yet on the API. */
export const TIPOS_ORGANIZACION = [
  { id: 1, nombre: 'Hotel' },
  { id: 2, nombre: 'Casa' },
  { id: 3, nombre: 'Hostal' },
  { id: 4, nombre: 'Otro' },
];

export interface Empleado {
  id: number;
  nombre: string | null;
  apellido: string | null;
  correo: string | null;
  estado: string | null;
  fecha_ingreso: string | null;
  roles: string[];
}

export interface AgregarEmpleadoPayload {
  nombre: string;
  apellido: string;
  tipo_documento_id: number;
  numero_documento: string;
  numero_telefono: string;
  correo: string;
  rol_slug: string;
}

export interface AgregarEmpleadoResponse {
  miembro: MiembroOrganizacion;
  token_invitacion: string | null;
}

/** Seeded by RolSeeder — no list endpoint exists yet on the API. Solo roles de staff, no los openhost-*. */
export const ROLES_EMPLEADO = [
  { slug: 'gerente', nombre: 'Gerente' },
  { slug: 'administrador', nombre: 'Administrador' },
  { slug: 'recepcionista', nombre: 'Recepcionista' },
  { slug: 'supervisor', nombre: 'Supervisor' },
  { slug: 'caja', nombre: 'Caja' },
  { slug: 'contabilidad', nombre: 'Contabilidad' },
  { slug: 'limpieza', nombre: 'Limpieza' },
  { slug: 'mantenimiento', nombre: 'Mantenimiento' },
  { slug: 'marketing', nombre: 'Marketing' },
];