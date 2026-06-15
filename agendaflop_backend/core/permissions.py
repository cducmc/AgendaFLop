"""
Permisos reutilizables para control de acceso por roles (Bloque 7).
"""

from rest_framework import permissions


def role_in(user, roles):
    return user.is_authenticated and getattr(user, 'role', None) in roles


class IsOwnerOrManagerOrSuperAdmin(permissions.BasePermission):
    """Permite acceso a dueños, managers o super admin."""

    def has_permission(self, request, view):
        return role_in(request.user, {'business_owner', 'manager', 'super_admin'})


class IsSuperAdmin(permissions.BasePermission):
    """Permite acceso solo a super admin."""

    def has_permission(self, request, view):
        return role_in(request.user, {'super_admin'})


class IsBusinessStaff(permissions.BasePermission):
    """Permite acceso a staff de negocio y super admin."""

    def has_permission(self, request, view):
        return role_in(
            request.user,
            {'business_owner', 'manager', 'receptionist', 'professional', 'super_admin'}
        )


class CanManageCatalog(permissions.BasePermission):
    """Permite mutaciones de servicios/profesionales a owner/manager/super_admin."""

    def has_permission(self, request, view):
        return role_in(request.user, {'business_owner', 'manager', 'super_admin'})


class CanManageClients(permissions.BasePermission):
    """Permite crear/editar clientes a owner/manager/receptionist/super_admin."""

    def has_permission(self, request, view):
        return role_in(request.user, {'business_owner', 'manager', 'receptionist', 'super_admin'})


class AppointmentAccessPermission(permissions.BasePermission):
    """
    Permiso avanzado para citas.

    Reglas:
    - Staff del negocio puede acceder a operaciones de citas.
    - Solo business_owner/manager/super_admin pueden eliminar.
    - Profesionales solo pueden modificar/ver sus propias citas.
    """

    STAFF_ROLES = {'business_owner', 'manager', 'receptionist', 'professional', 'super_admin'}
    DELETE_ROLES = {'business_owner', 'manager', 'super_admin'}

    def has_permission(self, request, view):
        if not role_in(request.user, self.STAFF_ROLES):
            return False

        # Permisos por acción (ViewSet)
        action = getattr(view, 'action', None)
        if action == 'destroy':
            return role_in(request.user, self.DELETE_ROLES)

        return True

    def has_object_permission(self, request, view, obj):
        user = request.user
        role = getattr(user, 'role', None)

        # Super admin y management tienen acceso total al objeto
        if role in {'super_admin', 'business_owner', 'manager', 'receptionist'}:
            return True

        # Profesional: solo citas asignadas a su perfil
        if role == 'professional':
            if not obj.professional or not obj.professional.user_id:
                return False
            return obj.professional.user_id == user.id

        return False
