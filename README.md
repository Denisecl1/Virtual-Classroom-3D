# 🏫 Proyecto WebXR: Aula Virtual 3D

Este proyecto es una aplicación web interactiva de Realidad Virtual desarrollada para la materia de **Ambientes Virtuales**. Consiste en la visualización e inmersión de un modelo 3D arquitectónico (un salón de clases) exportado desde SketchUp, renderizado directamente en el navegador web con soporte completo para visores móviles (como VR Box).

## ✨ Características Principales

* **Renderizado 3D Avanzado:** Iluminación global (Hemisphere Light) y direccional con cálculo de sombras en tiempo real para dar profundidad al entorno arquitectónico.
* **Controles en PC (Primera Persona):** Sistema de colisiones básicas y movimiento fluido utilizando teclado (`W`, `A`, `S`, `D`) y ratón (Point Lock Controls), simulando la vista en primera persona.
* **Soporte WebXR (Realidad Virtual):** Compatibilidad nativa para visores VR móviles.
* **Movimiento Gaze-to-Walk (VR):** Lógica personalizada para dispositivos sin mandos Bluetooth. El usuario avanza automáticamente al inclinar la mirada hacia el suelo dentro de la experiencia inmersiva.
* **Interfaz Adaptativa:** Menú de usuario e instrucciones estilizados con Bootstrap que se ocultan automáticamente al entrar en modo VR para no romper la inmersión, y reaparecen al salir.

## 🛠️ Tecnologías Utilizadas

* **Frontend:** HTML5, CSS3, JavaScript (ES6).
* **Framework CSS:** [Bootstrap 5](https://getbootstrap.com/) (CDN) para el diseño del Navbar y Footer.
* **Motor Gráfico 3D:** [Three.js](https://threejs.org/) (v0.165.0).
* **Módulos de Three.js:** * `GLTFLoader` (Para la lectura del modelo `.glb`).
  * `PointerLockControls` (Para el control en PC).
  * `VRButton` (Para la inicialización de WebXR).
* **Modelado 3D:** SketchUp (Exportado a formato estándar web `.glb`).

## 🚀 Cómo ejecutar el proyecto localmente

Debido a las políticas de seguridad de los navegadores web modernos (CORS), los modelos 3D locales no se cargarán si se abre el archivo `index.html` con doble clic (ruta `file:///`).

Para visualizar el proyecto correctamente:

1. Clona o descarga este repositorio en tu computadora.
2. Abre la carpeta del proyecto en **Visual Studio Code**.
3. Instala la extensión **Live Server**.
4. Haz clic derecho sobre el archivo `index.html` y selecciona **"Open with Live Server"**.
5. *Para probar en el móvil (VR):* Asegúrate de que tu celular y tu computadora estén en la misma red Wi-Fi y accede a la dirección IP local que genera Live Server desde el navegador de tu dispositivo móvil.

## 👩‍💻 Desarrolladora

**Diana Denise Campos Lozano** *Ingeniería en Tecnologías de la Información y Comunicaciones*