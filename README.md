# apiFiles  
API backend para el desarrollo de Archivo de Gestión Documental

## Instalar

Para instalar las dependencias principales:
```bash
npm i express cors
```

instalar dependencias dentro de functions
```bash
cd functions
npm install
```
Regresa a la raíz de tu proyecto y prueba
```bash
firebase serve
```
---
# GIT
Agregar cambios
```bash
git add .
git commit -m "Descripción de los cambios"
git push origin main
```
Actualizar cambios
Verificar en que rama estas
```bash
git status
```
Ejecutar el pull
```bash
git pull origin main
```
  
# Liberar el puerto 5000


Identifica el proceso que usa el puerto 5000:

En Windows, abre PowerShell y ejecuta:
```bash
  netstat -ano | findstr :5000
```
Esto te mostrará el ID del proceso (PID) que está utilizando ese puerto.
Termina el proceso:
Si confirmas que puedes cerrar ese proceso, usa:
```bash
  taskkill /PID <PID> /F
```
Reemplaza < PID > por el número correspondiente.


