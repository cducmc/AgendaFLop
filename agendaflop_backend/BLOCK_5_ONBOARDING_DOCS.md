# BLOQUE 5: SISTEMA DE ONBOARDING - DOCUMENTACIÓN COMPLETA

## 📋 Resumen

El **Sistema de Onboarding** es un componente fundamental de AgendaFlop que guía a los nuevos usuarios a través de la configuración inicial de su negocio. Utiliza un sistema de seguimiento automático mediante signals de Django y proporciona dos interfaces visuales: un checklist compacto y un wizard guiado paso a paso.

---

## ✅ Estado de Implementación

### **COMPLETADO AL 100%** ✨

- ✅ **Backend**: Modelo, signals, serializers, viewset y URLs
- ✅ **Frontend**: API methods, OnboardingChecklist, OnboardingWizard
- ✅ **Integración**: Dashboard muestra checklist automáticamente
- ✅ **Rutas**: `/onboarding-wizard` disponible para wizard completo

---

## 🏗️ Arquitectura del Sistema

### Backend (Django + DRF)

```
business/
├── models.py
│   └── OnboardingProgress (modelo principal)
│       ├── 7 campos booleanos para pasos
│       ├── completion_percentage (propiedad calculada)
│       ├── pending_steps (pasos sin completar)
│       ├── completed_steps (pasos finalizados)
│       └── métodos: mark_step_completed(), dismiss_onboarding()
│
├── signals.py (auto-tracking)
│   ├── create_onboarding_progress → post_save Business
│   ├── mark_service_created → post_save Service
│   └── mark_professional_created → post_save Professional
│
├── serializers.py
│   ├── OnboardingProgressSerializer (respuesta completa)
│   └── OnboardingStepUpdateSerializer (actualización manual)
│
├── views.py
│   └── OnboardingProgressViewSet
│       ├── GET /api/onboarding/ → progreso completo
│       ├── GET /api/onboarding/status/ → quick check
│       ├── POST /api/onboarding/mark_step/ → marcar paso
│       └── POST /api/onboarding/dismiss/ → descartar wizard
│
└── urls.py
    └── router.register('onboarding', OnboardingProgressViewSet)
```

### Frontend (React 19)

```
components/
├── OnboardingChecklist.jsx (widget compacto)
│   ├── Barra de progreso visual
│   ├── Lista de pasos completados/pendientes
│   ├── Click en paso → navega a sección
│   ├── Botón "X" → descartar onboarding
│   ├── Animación confetti al 100%
│   └── Auto-refresh cada 10 segundos
│
└── OnboardingWizard.jsx (experiencia guiada)
    ├── 4 pasos principales obligatorios
    ├── Indicador de progreso con puntos
    ├── Navegación anterior/siguiente/saltar
    ├── Instrucciones detalladas por paso
    ├── Botones de acción directa
    ├── Auto-detección de pasos completados
    └── Redirección al dashboard al finalizar

services/
└── api.js
    └── onboardingAPI
        ├── getProgress() → GET /api/onboarding/
        ├── getStatus() → GET /api/onboarding/status/
        ├── markStep(stepKey, completed) → POST /api/onboarding/mark_step/
        └── dismiss() → POST /api/onboarding/dismiss/

pages/
└── Dashboard.jsx
    └── <OnboardingChecklist /> (integrado automáticamente)

App.jsx
└── Ruta /onboarding-wizard → <OnboardingWizard />
```

---

## 📊 Pasos del Onboarding

### Pasos Obligatorios (peso 1.0)

1. **has_created_service** ⚙️
   - Label: "Crear tu primer servicio"
   - Auto-tracking: Signal post_save Service
   - Link: `/services`

2. **has_configured_hours** 🕐
   - Label: "Configurar horario de atención"
   - Auto-tracking: Manual (marca desde configuración)
   - Link: `/settings`

3. **has_created_professional** 👥
   - Label: "Agregar profesionales"
   - Auto-tracking: Signal post_save Professional
   - Link: `/professionals`

4. **has_created_first_appointment** 📅
   - Label: "Crear tu primera cita"
   - Auto-tracking: Signal post_save Appointment
   - Link: `/appointments`

### Pasos Opcionales (peso 0.5)

5. **has_customized_branding** 🎨
   - Label: "Personalizar tu marca"
   - Auto-tracking: Manual
   - Link: `/settings`

6. **has_invited_team_member** 🤝
   - Label: "Invitar miembros del equipo"
   - Auto-tracking: Manual
   - Link: `/team`

7. **has_tested_public_booking** 🌐
   - Label: "Probar portal de reservas"
   - Auto-tracking: Manual
   - Link: `/public-portal`

---

## 🎯 Cálculo de Progreso

### Fórmula de Porcentaje

```python
# Pasos obligatorios × 1.0
obligatory_points = sum([
    1 if has_created_service else 0,
    1 if has_configured_hours else 0,
    1 if has_created_professional else 0,
    1 if has_created_first_appointment else 0
])  # Max: 4 puntos

# Pasos opcionales × 0.5
optional_points = sum([
    0.5 if has_customized_branding else 0,
    0.5 if has_invited_team_member else 0,
    0.5 if has_tested_public_booking else 0
])  # Max: 1.5 puntos

# Total: 5.5 puntos máximo
total_points = obligatory_points + optional_points
completion_percentage = (total_points / 5.5) * 100
```

**Ejemplo**:
- Solo pasos obligatorios completados: `(4 / 5.5) × 100 = 72.7%`
- Todos los pasos completados: `(5.5 / 5.5) × 100 = 100%`

---

## 🔄 Flujo de Usuario

### Nuevo Usuario (Primera vez)

1. Usuario se registra → `POST /api/auth/register/`
2. **Signal automático** crea `OnboardingProgress` vacío
3. Usuario accede al Dashboard → Ve `OnboardingChecklist` con 0%
4. Opciones:
   - **A)** Seguir checklist: Click en paso → Navega a sección
   - **B)** Abrir wizard: Click "asistente paso a paso" → `/onboarding-wizard`
   - **C)** Ignorar: Click "X" → Descarta onboarding

### Progreso Automático

5. Usuario crea servicio → **Signal detecta** → `has_created_service = True`
6. Frontend auto-refresh (10s) → Actualiza checklist
7. Barra de progreso: 0% → 18.2%
8. Paso marcado con ✅ verde, movido a "Completados"

### Completado al 100%

9. Usuario completa todos los pasos
10. `completion_percentage = 100%` → `is_completed = True`
11. Frontend muestra **animación de confetti** 🎉
12. Checklist desaparece automáticamente

---

## 🚀 Endpoints de la API

### 1. GET /api/onboarding/

**Descripción**: Obtener progreso completo del usuario actual

**Autenticación**: Bearer Token

**Respuesta**:
```json
{
  "success": true,
  "data": {
    "id": 1,
    "business": 1,
    "business_name": "Mi Barbería",
    "has_created_service": true,
    "has_configured_hours": false,
    "has_created_professional": true,
    "has_customized_branding": false,
    "has_created_first_appointment": false,
    "has_invited_team_member": false,
    "has_tested_public_booking": false,
    "is_completed": false,
    "is_dismissed": false,
    "completion_percentage": 36.36,
    "pending_steps": [
      {
        "key": "has_configured_hours",
        "label": "Configurar horario de atención",
        "description": "Establece tus horarios de trabajo"
      },
      // ...
    ],
    "completed_steps": [
      {
        "key": "has_created_service",
        "label": "Crear tu primer servicio",
        "description": "Define los servicios que ofrece tu negocio"
      }
    ]
  }
}
```

---

### 2. GET /api/onboarding/status/

**Descripción**: Quick check del estado (solo métricas clave)

**Uso**: Mostrar barra de progreso sin cargar detalles

**Respuesta**:
```json
{
  "success": true,
  "data": {
    "completion_percentage": 36.36,
    "is_completed": false,
    "is_dismissed": false,
    "pending_steps_count": 5,
    "completed_steps_count": 2
  }
}
```

---

### 3. POST /api/onboarding/mark_step/

**Descripción**: Marcar paso manualmente (pasos que no se auto-detectan)

**Body**:
```json
{
  "step_key": "has_customized_branding",
  "completed": true
}
```

**Validación**:
- `step_key`: Debe ser uno de los 7 pasos válidos
- `completed`: Boolean

**Respuesta**:
```json
{
  "success": true,
  "data": { /* OnboardingProgress actualizado */ },
  "message": "Paso \"has_customized_branding\" completado correctamente"
}
```

---

### 4. POST /api/onboarding/dismiss/

**Descripción**: Descartar wizard (usuario no quiere seguir guía)

**Efecto**:
- `is_dismissed = True`
- Checklist desaparece del Dashboard
- Usuario puede retomar desde "Setup Guide"

**Respuesta**:
```json
{
  "success": true,
  "data": { /* OnboardingProgress con is_dismissed=true */ },
  "message": "Onboarding descartado. Puedes retomarlo en cualquier momento desde el dashboard."
}
```

---

## 🎨 Componentes Visuales

### OnboardingChecklist (Dashboard Widget)

**Características**:
- 🎯 Barra de progreso con gradiente indigo→purple
- 📋 Secciones "Completados" (verde) y "Pendientes" (gris)
- ✅ Iconos visuales por cada paso
- 🔗 Click en paso → Navega a sección correspondiente
- ❌ Botón "X" → Descartar onboarding
- 🎊 Confetti animation al alcanzar 100%
- 🔄 Auto-refresh cada 10 segundos

**Auto-ocultamiento**:
```jsx
if (progress.is_completed || progress.is_dismissed) {
  return null; // No mostrar
}
```

---

### OnboardingWizard (Experiencia Guiada)

**Características**:
- 🎯 Indicador de progreso con 4 puntos
- 📝 Instrucciones paso a paso numeradas
- ➡️ Botones: Anterior / Siguiente / Saltar
- 🎨 Colores por paso (indigo, purple, pink, green)
- 🔘 Click en punto → Saltar a ese paso
- ✅ Badge "Completado" cuando paso finalizado
- 🏁 Redirección automática al completar wizard

**Navegación**:
- Paso 1-3: Botón "Siguiente"
- Paso 4: Botón "Finalizar" → `/dashboard`
- Cualquier paso: "Saltar" → Siguiente paso

---

## 🧪 Casos de Uso

### Caso 1: Usuario Completa Todo Manualmente

```
1. Usuario abre /onboarding-wizard
2. Paso 1: Click "Ir a Servicios" → Crea servicio
3. Paso 2: Click "Ir a Configuración" → Configura horarios
4. Paso 3: Click "Ir a Profesionales" → Agrega profesional
5. Paso 4: Click "Ir a Citas" → Crea primera cita
6. Wizard detecta 100% → Muestra confetti → Redirige
```

### Caso 2: Usuario Usa Solo Checklist

```
1. Dashboard muestra OnboardingChecklist (0%)
2. Usuario crea servicio desde menú → Signal auto-marca
3. Checklist auto-refresh → Actualiza a 18.2%
4. Usuario completa resto de pasos naturalmente
5. Checklist desaparece al llegar a 100%
```

### Caso 3: Usuario Descarta Onboarding

```
1. Usuario ve checklist → Click "X"
2. POST /api/onboarding/dismiss/
3. Checklist desaparece
4. Más tarde: Click "Setup Guide" → Re-abre wizard
```

---

## 🔧 Configuración de Signals

### business/apps.py

```python
class BusinessConfig(AppConfig):
    default_auto_field = 'django.db.models.BigAutoField'
    name = 'business'
    
    def ready(self):
        # Importar signals para registrarlos
        import business.signals
```

### business/signals.py

```python
from django.db.models.signals import post_save
from django.dispatch import receiver
from .models import Business, Service, Professional, OnboardingProgress

@receiver(post_save, sender=Business)
def create_onboarding_progress(sender, instance, created, **kwargs):
    """Crear OnboardingProgress al crear nuevo negocio"""
    if created:
        OnboardingProgress.objects.create(business=instance)

@receiver(post_save, sender=Service)
def mark_service_created(sender, instance, created, **kwargs):
    """Marcar paso cuando se crea primer servicio"""
    if created:
        try:
            onboarding = OnboardingProgress.objects.get(business=instance.business)
            if not onboarding.has_created_service:
                onboarding.mark_step_completed('has_created_service')
        except OnboardingProgress.DoesNotExist:
            pass
```

---

## 📈 Métricas de Éxito

### KPIs a Medir

1. **Tasa de Completado**: % de usuarios que llegan a 100%
2. **Tiempo Promedio**: Tiempo desde registro hasta completar onboarding
3. **Tasa de Descarte**: % de usuarios que descartan wizard
4. **Pasos Más Omitidos**: Identificar pasos que causan abandono
5. **Uso de Wizard vs Checklist**: Preferencia de usuarios

### Queries Django para Analytics

```python
# Total de negocios con onboarding completado
OnboardingProgress.objects.filter(is_completed=True).count()

# Progreso promedio
from django.db.models import Avg
OnboardingProgress.objects.aggregate(Avg('completion_percentage'))

# Negocios con pasos específicos completados
OnboardingProgress.objects.filter(has_created_service=True).count()
```

---

## 🚧 Próximos Pasos (Expansión Futura)

### Bloque 6: Sistema de Reportes
- Dashboard de analytics de onboarding para super_admin
- Gráficas de embudo (funnel) de conversión
- Identificar puntos de abandono

### Mejoras Incrementales
1. **Tooltips contextuales**: Hints sobre cada paso
2. **Video tutoriales**: Embeds de YouTube por paso
3. **Gamificación**: Badges y recompensas
4. **Email drip campaign**: Recordatorios si no completa
5. **Onboarding personalizado**: Según tipo de negocio

---

## 📝 Notas Técnicas

### Weighted Scoring Rationale

**¿Por qué pesos diferentes?**
- Pasos obligatorios (1.0): Críticos para funcionamiento básico
- Pasos opcionales (0.5): Mejoran experiencia pero no esenciales
- Usuario completa obligatorios → 72.7% → Sensación de buen progreso
- 100% requiere explorar funciones avanzadas

### Auto-refresh Strategy

**Frontend**: Polling cada 10 segundos
- ✅ Simple de implementar
- ✅ No requiere WebSockets
- ⚠️ Puede generar tráfico innecesario

**Alternativa futura**: Django Channels + WebSockets
- Real-time updates sin polling
- Más eficiente a escala

### Error Handling en Signals

```python
try:
    onboarding.mark_step_completed('has_created_service')
except OnboardingProgress.DoesNotExist:
    pass  # No fallar si onboarding no existe
```

**Rationale**: Prevenir errores en cascada si algo sale mal con onboarding

---

## ✅ Checklist de Verificación

- [x] Modelo `OnboardingProgress` creado y migrado
- [x] Signals registrados en `apps.py`
- [x] Serializers implementados
- [x] ViewSet con 4 endpoints funcionando
- [x] URLs registradas en router
- [x] API methods en `services/api.js`
- [x] Componente `OnboardingChecklist` funcional
- [x] Componente `OnboardingWizard` funcional
- [x] Integración en Dashboard
- [x] Ruta `/onboarding-wizard` configurada
- [x] Sin errores de linting/compilación
- [x] Django check pasa sin problemas

---

## 🎉 Conclusión

El **Sistema de Onboarding** está **100% implementado** y listo para usar. Los nuevos usuarios de AgendaFlop serán guiados automáticamente a través de la configuración inicial con un sistema elegante que combina:

1. **Tracking automático** mediante signals de Django
2. **Checklist visual** siempre presente en el dashboard
3. **Wizard interactivo** para experiencia guiada paso a paso
4. **Progreso ponderado** que refleja importancia de cada tarea

Este bloque mejora dramáticamente la **retención de usuarios nuevos** al eliminar la confusión inicial y garantizar que todos los negocios completen la configuración básica.

**Próximo bloque**: Sistema de Reportes Avanzados 📊
