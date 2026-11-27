# Estilo documental de Moravía

Usamos Markdown de GitHub para que la memoria y las guías técnicas se puedan consultar tanto en el repositorio como en local.

## Estructura y navegación

- Un título de nivel 1 por documento. Los apartados usan nivel 2 y sus subdivisiones, nivel 3. No ponemos punto al final de los títulos.
- Incluimos un índice con enlaces internos cuando el documento tiene varios apartados largos. Desde el README principal distinguimos la propuesta, el seguimiento y las guías de uso.
- Usamos nombres de archivo en minúsculas, separados con guiones. Los registros semanales mantienen su fecha en formato `AAAA-MM-DD`.
- Los enlaces a archivos e imágenes del proyecto son relativos y tienen un texto que describe el destino. Enlazamos a una sección si ayuda a encontrar la información.

## Color y recursos gráficos

Tomamos los tonos del [diseño del frontend](https://github.com/Lmrocio/Moravia/tree/feature/52-vistas-acceso-registro/frontend/src/styles) como referencia para los recursos de la memoria.

| Uso | Color | Aplicación |
| --- | --- | --- |
| Identidad | Morado `#68169e` | Etiqueta de documentos principales. |
| Información secundaria | Neutro `#4d4657` | Etiqueta de seguimiento y otros recursos de apoyo. |
| Atención | Fondo `#fff5ed` y texto `#352f3d` | Avisos en soportes que permitan controlar el estilo. En GitHub usamos el bloque `[!IMPORTANT]`. |

Las etiquetas son pequeñas, de color plano y llevan texto. Usamos recursos SVG locales para que se vean sin servicios externos. El contenido debe entenderse también sin imágenes ni color.

Las tablas tienen encabezados claros, columnas numéricas alineadas a la derecha cuando procede y unidades en el encabezado o en la celda. Usamos los bloques `[!NOTE]` y `[!IMPORTANT]` cuando una condición afecta a cómo se interpreta o se sigue un apartado.

Los diagramas Mermaid llevan una frase que indica qué representan y si describen el sistema actual o el previsto. Las capturas usan texto alternativo descriptivo y un pie breve que explica qué se está mostrando. Los ejemplos de código indican el lenguaje del bloque.

## Redacción y revisión

Escribimos desde la perspectiva del equipo y diferenciamos implementación, previsiones y resultados. Comprobamos rutas y ejemplos contra el código. Conservamos las fuentes y fechas de los estudios y las aportaciones individuales del seguimiento.

Antes de incorporar un documento, comprobamos sus enlaces y su vista de lectura en GitHub. Si se exporta a PDF, mantenemos la jerarquía visual y añadimos pies a las figuras sin depender de imágenes alojadas fuera del proyecto.
