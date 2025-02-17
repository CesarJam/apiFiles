# apiFiles
API backend para el desarrollo de Archivo de Gestión Documental

Instalar
  npm i express cors

instalar dependencias dentro de functions
  cd functions
  npm install

Regresa a la raíz de tu proyecto y prueba 
  firebase serve


-------
GIT

  git add .
  git commit -m "Descripción de los cambios"
  git push origin main

---

Liberar el puerto 5000
Identifica el proceso que usa el puerto 5000:

En Windows, abre PowerShell y ejecuta:

  netstat -ano | findstr :5000

Esto te mostrará el ID del proceso (PID) que está utilizando ese puerto.

Termina el proceso:
Si confirmas que puedes cerrar ese proceso, usa:

  taskkill /PID <PID> /F

Reemplaza <PID> por el número correspondiente.
