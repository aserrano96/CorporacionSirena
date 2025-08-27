🎬 Gestión de Películas y Turnos
Este es un sistema web para la gestión de películas y sus turnos asociados, diseñado para una sala de cine o plataforma similar. Permite a los administradores crear, editar y "eliminar lógicamente" (soft-delete) películas, así como gestionar los turnos de exhibición para cada una, con validaciones de solapamiento.

✨ Funcionalidades Principales
CRUD de Películas:

Crear: Registro de nuevas películas con título, fecha de estreno, sinopsis, duración, clasificación y géneros.

Ver/Listar: Visualización de todas las películas activas en una tabla, excluyendo las que han sido "eliminadas".

Editar: Modificación de los detalles de una película existente.

Soft-Delete: Eliminación lógica de una película y sus turnos asociados, marcando el estado del registro como "Eliminado" en la base de datos para preservar la integridad de los datos.

Gestión de Turnos:

Asignación de turnos: Vinculación de turnos a películas específicas.

Validaciones de Solapamiento: El sistema evita que se creen turnos para la misma sala en horarios superpuestos.

Soft-Delete en cascada: Al eliminar lógicamente una película, todos sus turnos se marcan también como "Eliminado".

Edición y Eliminación: Posibilidad de editar o eliminar turnos de forma individual.

⚙️ Tecnologías Utilizadas
Este proyecto está construido con una arquitectura de dos capas: un backend API y un frontend simple.

Backend
Node.js: Entorno de ejecución de JavaScript.

Express: Framework para construir la API REST.

Sequelize: ORM (Object-Relational Mapper) para la interacción con la base de datos.

PostgreSQL: Sistema de gestión de base de datos relacional.

cors: Middleware para habilitar la política CORS.

Frontend
HTML: Estructura de la aplicación.

CSS: Estilos y diseño.

JavaScript: Lógica del cliente, incluyendo peticiones fetch a la API.

🚀 Instalación y Puesta en Marcha
Sigue estos pasos para configurar y ejecutar el proyecto en tu entorno local.

Requisitos Previos
Node.js (v14.x o superior)

PostgreSQL (v12 o superior)

Pasos de Instalación
Clonar el repositorio:

Bash

git clone https://github.com/[nombre-de-usuario]/[nombre-de-tu-repositorio].git
cd [nombre-de-tu-repositorio]
Configurar la Base de Datos:

Crea una base de datos PostgreSQL con el nombre sirenadb.

Asegúrate de que la configuración en server.js coincida con las credenciales de tu base de datos.

Instalar dependencias del backend:

Bash

cd [nombre-de-tu-repositorio]
npm install
Iniciar el servidor:

Bash

node server.js
El servidor se ejecutará en http://localhost:3000.

Abrir la aplicación en el navegador:

Abre el archivo index.html en tu navegador para comenzar a usar la aplicación.

🤝 Contribuciones
Siéntete libre de contribuir a este proyecto. Para ello, por favor, sigue estos pasos:

Haz un fork del repositorio.

Crea una nueva rama (git checkout -b feature/nueva-funcionalidad).

Realiza tus cambios y commit con mensajes claros.

Haz push a tu rama (git push origin feature/nueva-funcionalidad).

Abre un Pull Request detallando tus cambios.

📄 Licencia
Este proyecto está bajo la Licencia MIT.
