# Uso de `with builtInEntity` en JDL

## 📘 ¿Qué es `with builtInEntity`?

`with builtInEntity` es una instrucción de JDL (JHipster Domain Language) que se usa para **crear relaciones con entidades ya existentes en el proyecto**, como la entidad `User`, aunque **no estén definidas en el archivo JDL**.

---

## 👤 ¿Por qué usarlo con `User`?

En el microservicio `taskmanager`, la entidad `User` ya está incluida automáticamente por JHipster, ya que es parte del sistema de autenticación.

Sin embargo, como **no se define manualmente en el archivo JDL**, si intentas hacer una relación hacia `User` sin indicar que ya existe, **JHipster lanzará un error** diciendo que no puede encontrar esa entidad.

---

## 🛠️ Ejemplo correcto en JDL

```jdl
relationship ManyToOne {
  Task{assignedTo(login)} to User with builtInEntity,
  Comment{author(login)} to User with builtInEntity
}

