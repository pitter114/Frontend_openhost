/**
 * Qué módulos del panel puede ver cada rol de staff. propietario/gerente ven
 * todo. 'panel' y 'habitaciones' están reservados a propietario/gerente/
 * contabilidad — así lo restringe el backend (routes/api.php).
 *
 * Esto es una decisión de producto del frontend, no algo que exponga la API —
 * los slugs de rol sí vienen del backend (tabla ROLES).
 */
export const MODULOS_POR_ROL: Record<string, string[]> = {
  propietario: ['*'],
  gerente: ['*'],

  contabilidad: ['panel', 'habitaciones', 'pagos', 'caja', 'informes'],

  administrador: [
    'reservas', 'calendario', 'registrarse', 'verificar',
    'clientes', 'inventario', 'pagos', 'caja', 'informes',
  ],
  recepcionista: ['reservas', 'calendario', 'registrarse', 'verificar', 'clientes'],
  supervisor: ['reservas', 'calendario', 'limpieza', 'mantenimiento', 'clientes', 'inventario'],
  caja: ['reservas', 'pagos', 'caja', 'informes'],
  limpieza: ['limpieza'],
  mantenimiento: ['mantenimiento'],
  marketing: ['clientes', 'informes'],
};

/** Módulos visibles dado un conjunto de roles activos (unión de todos). */
export function modulosVisibles(roles: string[]): Set<string> | 'todos' {
  if (roles.some((r) => r === 'propietario' || r === 'gerente')) return 'todos';

  const set = new Set<string>();
  for (const rol of roles) {
    for (const modulo of MODULOS_POR_ROL[rol] ?? []) {
      set.add(modulo);
    }
  }
  return set;
}
