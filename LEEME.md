# KUBI · Filtro de maquillaje

Nicolás Sánchez · Realidades Expandidas · Ejercicio individual

## Qué hace

Aplica un maquillaje de fresa con cinco capas: rubor, semillas doradas, tinte de
labios, hojas en la frente y pequeños destellos. Usa transparencia para conservar
el rostro y se deforma con sus expresiones. Tiene controles de intensidad y visibilidad.
Este ejercicio no necesita sonidos: la rúbrica de maquillaje no los solicita.

## Cómo demostrarlo

1. Inicia y permite la cámara.
2. Gira suavemente la cabeza a izquierda y derecha.
3. Sonríe y abre la boca: el maquillaje debe acompañar la deformación facial.
4. Ajusta la intensidad o desactiva Mostrar maquillaje para comparar.
5. Abre Studio para mostrar las cinco capas editables y las guías UV.

## Studio incluido

studio.html conserva el editor de texturas de la base recibida y abre el diseño KUBI
por defecto. Puedes seleccionar, mover, escalar y ocultar sus capas; ajustar sus
propiedades; añadir pintura y exportar. Diseño KUBI restaura las cinco capas iniciales.
Es preferible editar en computador por el espacio que necesita la interfaz del Studio.

La textura entregada se generó con el motor TextureStudio de esa misma base:
addImageLayer / addRegionLayer → composición de capas → exportCanvas(1024).
La composición está definida en js/studio/preset_kubi.js y se reconstruye al abrirlo.

Exportar → Solo la textura descarga un PNG transparente.
Exportar → Máscara para el editor descarga mesh_0 en JSON con su textura.
Para que el filtro use una edición nueva, importa esa máscara en el editor Three.js
y guarda la escena como app.json, conservando el nombre mesh_0. Cambiar únicamente
el PNG independiente no actualiza app.json: la escena entregada contiene su textura.

## Cómo explicarlo

“Creé una composición frutal en el Studio usando el mapa UV del rostro. Exporté
la textura transparente y la apliqué a una máscara de 468 vértices llamada mesh_0.
MediaPipe detecta la cara y main.js actualiza cada vértice con el punto facial
correspondiente. Así el maquillaje acompaña los movimientos y las expresiones,
en lugar de ser una imagen fija sobre el vídeo. Three.js dibuja la malla con un
material transparente y sin iluminación, para conservar los colores del diseño.”

## Dónde está cada parte

- js/studio/preset_kubi.js: composición propia de cinco capas.
- js/studio/texture_studio.js: motor del Studio de la base compartida.
- js/base/canonical_face_model.js: posiciones, UV e índices de la malla facial.
- assets/texturas/maquillaje_kubi.png: textura transparente de 1024 × 1024 px.
- assets/texturas/capas_maquillaje_kubi.json: descripción y fuentes de las capas.
- mascara_facial.json: máscara aislada, importable en el editor Three.js.
- app.json: escena del ejercicio con la máscara y su textura incorporada.
- js/main.js → updateMakeup: actualización de los vértices con el rostro detectado.

## Subir a GitHub y Vercel

1. Descomprime este ZIP.
2. Crea un repositorio NUEVO en GitHub para este ejercicio.
3. En Add file → Upload files, arrastra el CONTENIDO de la carpeta: index.html,
   app.json, js, css, assets, vercel.json y los demás archivos. El index.html debe
   quedar visible en la raíz del repositorio, sin una carpeta adicional encima.
4. Pulsa Commit changes.
5. En Vercel, crea un proyecto nuevo e importa ese repositorio.
6. Framework Preset: Other. Root Directory: raíz del repositorio.
   No escribas un Build Command ni un Install Command personalizado.
   vercel.json ya indica que la salida es la carpeta actual (.).
7. Pulsa Deploy. Abre el enlace HTTPS en el navegador del celular y permite la cámara.
8. Prueba el ejercicio y entrega ese enlace en su actividad correspondiente.

Hazlo por separado para cada ejercicio. No reemplaces el repositorio de KUBI final.
Si subes una carpeta exterior por accidente, selecciona esa carpeta como Root Directory.
Para futuras correcciones en el mismo repositorio, carga los archivos modificados y
confirma el commit; el proyecto de Vercel conectado podrá volver a desplegarse.

## Uso y requisitos del equipo

- Abrir desde HTTPS en un navegador con cámara y WebGL habilitado.
- No abrir index.html con doble clic: usa Vercel o un servidor local.
- Pulsar Iniciar cámara antes de probar el filtro.
- Tener buena luz de frente y un solo rostro visible.
- La cámara se procesa en el navegador; el código no envía ni guarda fotos.
- Las bibliotecas, el modelo y los recursos del ejercicio están incluidos.
- No necesita claves, cuentas de servicios de IA ni una tarjeta de activación.
- Detener libera la cámara. Puedes volver a iniciar.

## Archivos principales

- index.html: estructura de la página y controles.
- css/app.css: diseño adaptable a celular y computador.
- js/main.js: cámara, MediaPipe, encuadre y renderizado Three.js.
- js/config.js: identifica el ejercicio que se carga.
- app.json: escena propia en el formato de proyecto del editor Three.js.
- js/vendor: bibliotecas locales; conservar esta carpeta completa, incluido wasm.
- assets/mediapipe/face_landmarker.task: modelo de detección facial.
- vercel.json: configuración de despliegue estático.

## Procedencia de la base

Se tomó como referencia técnica el ZIP Filtro-main.zip compartido por el estudiante.
No se ha confirmado qué partes de esa base proceden del docente y cuáles de terceros.
Se conserva el modelo facial y, en maquillaje, el motor TextureStudio y sus utilidades.
La escena, la interfaz de estos ejercicios, el maquillaje KUBI, la lógica de gestos y
los dos sonidos se prepararon para esta adaptación. No se reutilizan las gafas,
la nariz, la flecha, los audios ni las URLs de la escena del archivo de referencia.

Three.js se distribuye bajo MIT. MediaPipe y su modelo facial canónico proceden
de Google y se distribuyen bajo sus licencias correspondientes (Apache 2.0).
Las licencias incluidas se encuentran en js/vendor.

## Verificación antes de entregar

Se comprobaron la sintaxis, los archivos e importaciones locales, la geometría,
la textura y la lógica de eventos. Las páginas y el Studio se revisaron en navegador.
El navegador de prueba no dispone de WebGL operativo, por lo que no fue posible
validar aquí el filtro completo, el detector ni la cámara en vivo.
La comprobación final debe hacerse con tu celular en el enlace HTTPS desplegado.
