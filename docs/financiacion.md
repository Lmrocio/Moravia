# Financiación y capital de trabajo de Moravía

Queremos probar Moravía con hasta diez comunidades pequeñas antes de depender de las cuotas. Calculamos primero seis meses sin ingresos y después cuánto tendríamos que facturar para sostener la dedicación de los dos socios a tiempo parcial. El [presupuesto de la demo académica](recursos.md#4-servicios-externos-y-costes) corresponde a otro entorno.

## 1. Coste de la infraestructura

Consultamos las tarifas el 24 de noviembre de 2026. Para hacer las cuentas usamos **1 USD = 0,90 €** como tipo de cambio de presupuesto. Las cifras son antes de impuestos. Antes de contratar, comprobaremos el cambio, el importe final con la región elegida y los impuestos de cada factura.

| Partida | Qué presupuestamos | Piloto €/mes | Piloto €/año | Servicio de pago €/mes | Servicio de pago €/año |
| --- | --- | ---: | ---: | ---: | ---: |
| Frontend | Vercel Pro con dos personas con permisos de despliegue, 40 USD al mes. [Vercel](https://vercel.com/docs/plans/pro-plan) | 36,00 | 432,00 | 36,00 | 432,00 |
| API | Espacio de trabajo Pro de Render por 25 USD al mes. Empezaríamos con una instancia de 7 USD y pasaríamos a la de 25 USD si el uso lo exige. [Render](https://render.com/docs/new-workspace-plans) y [precio de las instancias](https://render.com/articles/set-up-self-hosted-github-actions-runners-on-render#3-choose-a-compute-plan) | 28,80 | 345,60 | 45,00 | 540,00 |
| Base de datos | Reservamos 60 USD al mes para Atlas dedicado. Cotizaremos la región y las copias antes de contratar. [Atlas](https://www.mongodb.com/pricing) | 54,00 | 648,00 | 54,00 | 648,00 |
| Correo | Resend Free para el piloto, dentro de sus límites. Presupuestamos el plan Pro de 20 USD al mes cuando el volumen lo justifique. [Resend](https://resend.com/pricing) | 0,00 | 0,00 | 18,00 | 216,00 |
| Fotografías | Probamos el flujo básico sin fotos en el piloto. Para el servicio de pago reservamos 99 USD al mes para Cloudinary Plus. [Cloudinary](https://cloudinary.com/pricing) | 0,00 | 0,00 | 89,10 | 1.069,20 |
| Dominio | Presupuestamos 18 € al año para un `.com`. Usaríamos subdominios para la API y el correo. [Tarifas de dominios](https://vercel.com/domains/pricing) | 1,50 | 18,00 | 1,50 | 18,00 |
| Copias y consumo extra | Reservamos 25 € al mes para copias, almacenamiento y tráfico adicional. | 25,00 | 300,00 | 25,00 | 300,00 |
| **Total** | | **145,30** | **1.743,60** | **268,60** | **3.223,20** |

Prorrateamos el dominio en la tabla para comparar los costes. Al calcular la caja, contamos el pago de los 18 € al inicio. Para activar las fotos, primero comprobaremos que solo puedan abrirlas las personas con acceso a la incidencia. [Control de acceso en Cloudinary](https://cloudinary.com/documentation/control_access_to_media).

## 2. Caja para seis meses sin ingresos

Durante el piloto contamos con **0 € de ingresos comerciales**. Trabajaríamos con nuestros equipos y sin remunerarnos, siempre que los dos podamos dedicarle tiempo en esas condiciones. Reservamos **350 € al mes por socio** como previsión para cotizaciones y otros costes asociados. Es una partida de presupuesto, no una cuota oficial. Confirmaremos con la gestoría el régimen que nos corresponde y ajustaremos la cifra antes de arrancar. [Seguridad Social](https://www.seg-social.es/wps/portal/wss/internet/Trabajadores/Afiliacion/10548/32825/625?changeLanguage=es).

| Partida | Base de cálculo | Salida de caja en 6 meses |
| --- | --- | ---: |
| Infraestructura | 143,80 € × 6 + 18 € del dominio | 880,80 € |
| Previsión de costes de los socios | 2 × 350 € × 6 | 4.200,00 € |
| Gestoría | 150 € × 6 para contabilidad y trámites periódicos | 900,00 € |
| Pilotos y visitas | 250 € × 6 para desplazamientos, materiales y sesiones con comunidades | 1.500,00 € |
| Herramientas y soporte | 100 € × 6 para herramientas internas y atención a los pilotos | 600,00 € |
| **Caja para operar seis meses** | | **8.080,80 €** |
| Puesta en marcha | 400 € para constitución y trámites, 600 € para preparar contratos y privacidad y 200 € para el material de inicio | 1.200,00 € |
| **Total antes de imprevistos** | | **9.280,80 €** |
| Colchón | 15 % sobre 9.280,80 € para variaciones de consumo y otros desvíos | 1.392,12 € |
| **Caja inicial estimada** | | **10.672,92 €** |

Redondeamos la previsión a **11.000 €**. Antes de empezar revisaremos cuánto tenemos disponible y qué pagos debemos realizar en cada mes. Si la aportación se queda corta, probaremos con menos comunidades o durante menos tiempo.

## 3. Servicio de pago con dos perfiles júnior

Para presupuestar nuestra dedicación tomamos **23.400 € brutos al año por perfil a jornada completa**, cerca de los 23.322 € que recoge Indeed para programación júnior en España a partir de 28 salarios publicados. A media jornada serían **975 € brutos al mes por persona** en doce mensualidades equivalentes. Usamos un 32 % adicional como referencia del coste empresarial de una contratación ordinaria, lo que da **1.287 € al mes por perfil** y **2.574 € entre los dos**. Si seguimos como socios trabajadores, sustituiremos en el presupuesto la previsión del piloto por el coste real de la remuneración y las cotizaciones que nos correspondan. [Salarios en Indeed](https://es.indeed.com/career/programador-junior/salaries) y [tipos de cotización de 2026](https://www.seg-social.es/wps/portal/wss/internet/Trabajadores/CotizacionRecaudacionTrabajadores/10721/10957/9932/4315).

Probaríamos una cuota media de **12 € al mes por comunidad, antes del IVA**. Como referencia, Comunidad App anuncia cuotas de 9,99 € y 14,99 € al mes para comunidades autogestionadas de hasta 25 y 50 viviendas, respectivamente. Vecinar anuncia tarifas anuales desde 0,15 € por vivienda y mes más IVA. Hay alternativas más baratas para comunidades pequeñas, de modo que comprobaremos con los pilotos si nuestra cuota tiene sentido y cuántas querrían seguir pagando. [Comunidad App](https://www.comunidadapp.es/precios/) y [Vecinar](https://vecinarapp.com/).

Calculamos **3.342,60 € de gasto fijo mensual**. Sumamos 2.574 € de dedicación, 268,60 € de infraestructura, 150 € de gestoría, 250 € de captación y visitas y 100 € de herramientas y soporte. Añadimos **1 € por comunidad al mes** como estimación para cobros y consumo adicional ligado a cada cliente. Como referencia, Stripe publica una comisión de 1,5 % más 0,25 € para tarjetas estándar del Espacio Económico Europeo. [Tarifas de Stripe](https://stripe.com/es/pricing).

| Comunidades de pago | Ingresos al mes | Gastos al mes | Resultado operativo mensual |
| ---: | ---: | ---: | ---: |
| 100 | 1.200,00 € | 3.442,60 € | −2.242,60 € |
| 200 | 2.400,00 € | 3.542,60 € | −1.142,60 € |
| 304 | 3.648,00 € | 3.646,60 € | 1,40 € |
| 350 | 4.200,00 € | 3.692,60 € | 507,40 € |

Con cada cuota nos quedan **11 € para cubrir los gastos fijos**. Necesitaríamos **304 comunidades de pago** para cubrirlos, o **372** si la cuota media baja a 10 €. Con 350 comunidades estimamos **507,40 € al mes de resultado operativo** antes de intereses e impuestos. No contamos ese importe como dinero disponible para repartir. Las cifras suponen que las comunidades están activas, pagan la cuota y podemos atenderlas sin ampliar el equipo.

## 4. Vías de financiación

| Vía | Qué nos aporta | Qué necesitaríamos | Qué riesgo vemos y cuándo la usaríamos |
| --- | --- | --- | --- |
| Aportaciones de los socios | Podemos empezar sin intereses ni entrada de terceros. | Acordar cuánto puede aportar cada uno, documentarlo y dejar claro el reparto. | Arriesgamos ahorros propios y la cantidad puede quedarse corta. La usaríamos para arrancar. |
| Inversor particular o *business angel* | Puede aportar capital y contactos para llegar a comunidades. | Mostrar el producto, resultados de los pilotos y un presupuesto defendible. Negociar la valoración y el pacto de socios. [Redes de inversores de AEBAN](https://www.aeban.es/inversor-bussines-angel/) | Cederíamos una parte de la empresa. Lo valoraríamos si vemos interés por pagar y el crecimiento necesita más caja de la que podemos aportar. |
| Préstamo participativo de ENISA | Podemos financiar una fase de crecimiento sin ceder participaciones. | La línea para startups y pymes parte de 25.000 €. Exige una empresa constituida en España, un proyecto viable e innovador y fondos propios al menos iguales al importe que pidamos. [Condiciones de ENISA](https://www.enisa.es/servicios/financiacion/startups-y-pymes/) | Es deuda con intereses y la aprobación lleva tiempo. La estudiaríamos después del piloto, si el crecimiento justifica el mínimo y tenemos los fondos propios necesarios en ese momento. |
| Préstamo bancario con línea ICO | Puede cubrir inversión o liquidez sin ceder participaciones. | Presentar el plan de negocio, el presupuesto y la capacidad de devolución a una entidad colaboradora. Confirmar la línea disponible y las garantías que pida el banco. [Líneas ICO](https://folletolineasico.ico.es/ico/folleto/es/lineas-ico.pdf) | Las cuotas empiezan según el contrato aunque los ingresos tarden. Lo valoraríamos cuando tengamos cobros recurrentes o compromisos de pago que sostengan las cuotas. |

## 5. Cómo conseguiríamos y usaríamos el dinero

1. **Arrancaríamos con fondos propios**, hasta 11.000 € si cada uno puede aportar 5.500 €. Separaríamos 8.080,80 € para operar seis meses, 1.200 € para los trámites y preparativos y 1.392,12 € para imprevistos. Quedarían 327,08 € de margen sobre la previsión.
2. **Empezaríamos a cobrar manteniendo la estructura pequeña.** Mediríamos cuántas comunidades aceptan la cuota, cuántas siguen pagando y cuánto tiempo nos ocupa atenderlas. Iríamos incorporando las fotos y ampliando los planes según el uso.
3. **Remuneraríamos la media jornada de los dos cuando la caja lo permita.** Si tenemos 200 comunidades de pago y ampliamos al presupuesto completo, quedarían 1.142,60 € al mes por cubrir. Para mantener ese nivel seis meses reservaríamos **unos 8.000 €**. La diferencia acumulada sería de 6.855,60 € más un 15 % de margen. Valoraríamos una aportación adicional o un inversor si los cobros son estables y vemos cómo acercarnos al punto de equilibrio. Si seguimos lejos, mantendríamos los gastos del piloto y aplazaríamos la ampliación.
