# Microservicio `TaskManager`

## Instrucciones Generales

### Alcance

El objetivo es desarrollar exclusivamente el microservicio **`taskmanager`**, encargado de la gestión de tareas dentro de grupos de trabajo.

---

## Estructura del Proyecto

Tienes total libertad para definir la estructura del proyecto, siempre que se cumplan los requisitos funcionales descritos a continuación.

---

## Requisitos Funcionales

### 1. Entidades Principales

#### Grupos de Trabajo (`WorkGroup`)

- Debe existir una entidad `WorkGroup`.
- Cada grupo de trabajo debe tener:
  - `name` (Nombre del grupo)
  - `description` (Descripción del grupo)
- Los usuarios pueden pertenecer a uno o varios grupos de trabajo.
- Roles disponibles para usuarios dentro de un grupo:
  - **OWNER**
  - **MODERADOR**
  - **MIEMBRO**

##### Reglas de gestión por roles:

- **OWNER**
  - Puede transferir la propiedad del grupo a otro miembro.
  - Puede agregar y quitar moderadores.
  - Puede agregar y quitar miembros.

- **MODERADOR**
  - Puede agregar y quitar miembros.
  - Puede agregar nuevos moderadores, pero **no** puede quitar moderadores existentes ni al owner.

- **MIEMBRO**
  - Puede **crear nuevos grupos de trabajo**.
  - Puede **salir de cualquier grupo** en el que participe, excepto si es el `OWNER`.

- Un usuario puede tener distintos roles en diferentes grupos (ej.: `OWNER` en el Grupo A y `MIEMBRO` en el Grupo B).

#### Usuarios

- Se utilizarán los usuarios generados por JHipster con el rol `ROLE_USER` como miembros de los grupos de trabajo.
- Los usuarios con el rol `ROLE_ADMIN` tienen acceso completo al sistema, independientemente del grupo o rol asignado.

#### Tareas (`Task`)

- Cada tarea debe estar asociada a un `WorkGroup`.
- Puede tener asignados uno o varios miembros del grupo (no necesariamente el creador).
- Campos obligatorios:
  - `title` (Título)
  - `description` (Descripción)
  - `comments`: Comentarios realizados por miembros del grupo (se conservan incluso si el usuario abandona el grupo).
  - `priority`: Puede ser `LOW`, `NORMAL` o `HIGH`.
  - `status`: Puede ser `NOT_STARTED`, `WORKING_ON_IT`, `DONE`.
  - `createTime` y `updateTime`: Deben registrarse automáticamente.

#### Proyectos (`Project`)

- Cada proyecto debe contener:
  - `title` (Título)
  - `description` (Descripción)
  - Cada Proyecto debe estar asociada a un `WorkGroup`.
  - Puede tener asignados uno o varios miembros del grupo (no necesariamente el creador).
  - Lista de **subtareas**, que son instancias de `Task` con la misma estructura y comportamiento.

---

### 2. Gestión de Tareas Archivadas

- Las tareas con estado `DONE` tendrán la opción de ser **archivadas**.
- Una vez **archivada**, una tarea no puede ser editada, solo consultada en modo lectura.
- Las tareas archivadas deben almacenarse en un apartado separado del resto de tareas activas, idealmente mediante un **nuevo endpoint específico** para ellas.
- Solo los usuarios con rol **OWNER** o **MODERADOR** podrán **eliminar** tareas archivadas.

---

### 3. Gestión de Prioridades

- Las prioridades deben cargarse automáticamente en la base de datos mediante **Liquibase**, utilizando datos semilla simulados (similar a Faker).
- Solo los usuarios con rol `ROLE_ADMIN` pueden:
  - Agregar nuevas prioridades.
  - Editar, eliminar u ocultar prioridades existentes.

---

### 4. Gestión de Estados

- La lista de estados (`NOT_STARTED`, `WORKING_ON_IT`, `DONE`, etc.) puede ser gestionada (CRUD) únicamente por usuarios con rol **OWNER** o **MODERADOR** del grupo correspondiente.

---
