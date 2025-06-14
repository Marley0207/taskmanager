# Instrucciones de Uso del Gateway

---

Este proyecto Gateway ya está configurado para enrutar tus solicitudes a los diferentes servicios.

## Accediendo a Endpoints

Para acceder a un endpoint de un servicio, usarás el **dominio del Gateway** seguido del **nombre del servicio** y la **ruta original del endpoint**.

**Ejemplo con el servicio `taskmanager`:**

* **Endpoint original de `taskmanager`:** `GET localhost:8081/api/users`
* **Cómo acceder a través del Gateway:** `GET http://localhost:8080/services/taskmanager/api/users`

## Uso con Axios en React

Si estás utilizando Axios en un proyecto React, te recomendamos crear un archivo TypeScript, por ejemplo, `TaskManagerApiService.ts`. Dentro de este archivo, definirás la `baseURL` de Axios de la siguiente manera:

```typescript
// TaskManagerApiService.ts
import axios, { AxiosInstance, AxiosResponse } from 'axios';

// Define una interfaz para los datos de los usuarios
// Esto es una buena práctica para asegurar la tipificación de tus datos.
interface User {
  id: string; // Asumiendo que el ID es un string según el ejemplo JSON
  login: string;
}

/**
 * Clase de servicio para interactuar con la API de TaskManager a través del Gateway.
 * Centraliza las llamadas a la API y mejora la organización del código.
 */
class TaskManagerApiService {
  private api: AxiosInstance;

  constructor() {
    // Inicializa la instancia de Axios con la base URL del Gateway para el servicio taskmanager.
    this.api = axios.create({
      baseURL: 'http://localhost:8080/services/taskmanager'
    });
  }

  /**
   * Obtiene la lista de usuarios del servicio taskmanager.
   * Utiliza la ruta '/api/users' relativa a la baseURL configurada.
   * @returns {Promise<AxiosResponse<User[]>>} Una promesa que resuelve con la respuesta de la API,
   * conteniendo un array de objetos User.
   */
  public getUsers(): Promise<AxiosResponse<User[]>> {
    // Usa `this.api.get` para hacer la solicitud GET.
    // `<User[]>` tipifica la respuesta esperada como un array de objetos User.
    return this.api.get<User[]>('/api/users');
  }

  // Aquí puedes añadir más métodos para otras operaciones relacionadas con TaskManager,
  // por ejemplo, createUser, updateUser, deleteTask, etc.
  /*
  public createUser(userData: Partial<User>): Promise<AxiosResponse<User>> {
    return this.api.post<User>('/api/users', userData);
  }

  public getUserById(id: string): Promise<AxiosResponse<User>> {
    return this.api.get<User>(`/api/users/${id}`);
  }
  */
}

// Exporta una única instancia de la clase para ser usada en toda tu aplicación.
// Esto sigue el patrón Singleton, asegurando que solo haya una instancia del servicio.
const taskManagerApi = new TaskManagerApiService();

export default taskManagerApi;
```

### Cómo usar esta nueva clase:
Ahora, en cualquier parte de tu aplicación donde necesites interactuar con el servicio TaskManager, simplemente importas y usas la instancia taskManagerApi:

```typescript
// Por ejemplo, en un componente React o un servicio de datos
import taskManagerApi from './TaskManagerApiService'; // Asegúrate de que la ruta sea correcta

async function fetchUsers() {
  try {
    const response = await taskManagerApi.getUsers();
    console.log('Usuarios obtenidos:', response.data);
    // response.data contendrá un array como:
    // [ { id: "admin", login: "admin" }, { id: "user", login: "user" } ]
  } catch (error) {
    console.error('Error al obtener usuarios:', error);
    // Aquí puedes manejar errores, mostrar un mensaje al usuario, etc.
  }
}

fetchUsers();
