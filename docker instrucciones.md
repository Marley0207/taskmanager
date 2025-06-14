# Instrucciones para Importar Contenedores Manualmente

Dado que los proyectos tienen Docker desactivado, será necesario importar los contenedores de forma manual. A continuación se detallan los comandos para levantar los servicios correspondientes a cada proyecto.

## Proyecto: `gateway`

Para iniciar los servicios del proyecto `gateway`, ejecuta el siguiente comando:

```bash
docker compose -f services.yml up -d
```

## Proyecto: `taskmanager`

Para iniciar los servicios del proyecto `taskmanager`, ejecuta el siguiente comando:

```bash
docker compose -f redis.yml up -d
```

---
💡 Asegúrate de estar ubicado en el directorio correcto antes de ejecutar cada comando.

