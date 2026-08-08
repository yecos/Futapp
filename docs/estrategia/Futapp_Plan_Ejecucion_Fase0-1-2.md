# Futapp — Plan de ejecución técnica
## Fase 0 (revisión), Fase 1 y Fase 2

Este documento traduce el roadmap de negocio en pasos de construcción concretos. Está escrito en
términos generales, sin asumir un stack específico, para que un agente de IA lo pueda ejecutar sobre
el código ya existente. Cada fase tiene el mismo orden interno: qué revisar o construir en el modelo
de datos, qué construir en el backend, qué construir en el frontend, qué probar antes de dar la fase
por terminada.

Antes de escribir código nuevo, el agente debe completar la Fase 0 completa. Las Fases 1 y 2 se
ejecutan después, en paralelo o en el orden que el equipo prefiera, porque no dependen una de la otra.

---

## Fase 0 — Auditoría del código existente

Objetivo: entender exactamente qué hay construido hoy antes de agregar nada, y dejar un inventario
escrito que sirva de referencia para las fases siguientes.

### Pasos

1. Identificar el stack completo: framework de frontend, framework de backend o si es serverless,
   base de datos, proveedor de autenticación, proveedor de hosting.
2. Mapear el modelo de datos actual: qué entidades existen hoy, por ejemplo usuario, equipo, jugador,
   carta, código de invitación. Documentar los campos de cada una y las relaciones entre ellas.
3. Mapear el flujo de autenticación: cómo funciona el login con Google, qué se guarda de sesión, cómo
   se identifica a un usuario en cada request.
4. Mapear el flujo de creación de equipo y de invitación por código: cómo se genera el código, cómo
   se valida, qué pasa si el código expira o se reutiliza, qué rol recibe un usuario que se une por
   código.
5. Mapear el sistema de roles actual: qué puede hacer un administrador que no puede hacer un jugador,
   y en qué parte del código se aplica esa restricción.
6. Mapear el componente de carta de jugador: qué campos tiene, quién la puede editar, cómo se
   renderiza.
7. Revisar si existe ya algún concepto de pago o de referencia a QR Bancolombia en el código o solo
   en la intención del producto. Confirmar el estado real.
8. Identificar deuda técnica que pueda bloquear la Fase 1 o la Fase 2: falta de tabla de
   transacciones, falta de tipos de usuario distintos a jugador de equipo, falta de manejo de
   archivos o media, ausencia de sistema de notificaciones.
9. Entregar como resultado de esta fase un documento corto con el inventario de los puntos 2 a 6 y la
   lista de deuda técnica del punto 8. Ese documento es el insumo directo para diseñar las Fases 1 y 2.

### Definición de terminado

El equipo tiene un inventario escrito del modelo de datos, la autenticación, los roles y el
componente de carta, más una lista explícita de lo que falta construir para soportar cobros y
jugadores libres.

---

## Fase 1 — Cobro de cuotas de equipo

Objetivo: que un administrador pueda cobrar la cuota del equipo dentro de la app y que el jugador
pueda ver y pagar lo que debe, sin fricción.

### Modelo de datos

1. Definir una entidad de cuota, con equipo al que pertenece, monto, periodo o fecha de vencimiento,
   y estado.
2. Definir una entidad de pago, con jugador que paga, cuota a la que corresponde, monto pagado, fecha,
   método de pago, y estado de confirmación.
3. Definir los roles necesarios para esta fase si no existen todavía: administrador, capitán,
   jugador. Confirmar qué puede crear una cuota, qué puede confirmar un pago, qué puede solo consultar.

### Backend

4. Crear el endpoint para que un administrador cree una cuota para todo el equipo o para jugadores
   específicos.
5. Crear el endpoint para generar o mostrar el QR de pago asociado a una cuota.
6. Crear el endpoint para registrar un pago, sea manual por parte del administrador o mediante
   confirmación automática si el proveedor de pago lo permite.
7. Crear el endpoint para consultar el historial de pagos de un jugador y el estado de cuentas de un
   equipo completo.
8. Definir el mecanismo de recordatorio automático: qué dispara el recordatorio, con qué frecuencia,
   por qué canal se envía.

### Frontend

9. Construir la vista de administrador para crear una cuota y ver el estado de pago de cada jugador
   del equipo.
10. Construir la vista de jugador para ver sus cuotas pendientes, su historial de pagos, y el QR para
    pagar.
11. Construir el estado visual de cuota pagada, pendiente y vencida, visible tanto para el
    administrador como para el jugador.

### Pruebas antes de cerrar la fase

12. Un administrador puede crear una cuota y esta aparece correctamente para todos los jugadores del
    equipo.
13. Un jugador puede ver su cuota pendiente y el QR de pago sin errores.
14. Un pago registrado actualiza correctamente el estado de la cuota y el historial.
15. Un recordatorio se dispara correctamente para una cuota vencida.
16. Un jugador sin rol de administrador no puede crear ni editar cuotas.

### Definición de terminado

Un equipo real puede cobrar y pagar una cuota completa dentro de la app, de principio a fin, sin salir
a WhatsApp ni a una hoja de cálculo.

---

## Fase 2 — Perfil de jugador libre

Objetivo: que una persona sin equipo se registre, tenga una carta básica, complete un test simple
grabado dentro de la app, y pueda compartir su resultado.

### Modelo de datos

1. Definir el tipo de usuario jugador libre, separado de jugador de equipo, o extender el modelo de
   usuario actual para que un usuario pueda existir sin pertenecer a ningún equipo.
2. Definir la entidad de carta de jugador libre: datos de perfil básico, posición, edad, zona, y
   espacio para el resultado del test.
3. Definir la entidad de resultado de test: tipo de test, valor medido, fecha, y referencia al video o
   dato crudo capturado.

### Backend

4. Crear el endpoint de registro de jugador libre, reutilizando el login con Google ya existente pero
   sin requerir código de equipo.
5. Crear el endpoint para guardar el resultado de un test simple, aceptando el archivo de video o los
   datos del sensor capturado desde el frontend.
6. Crear el endpoint para generar la carta pública del jugador libre en un formato que se pueda
   compartir fuera de la app, por ejemplo una imagen o un enlace.

### Frontend

7. Construir el flujo de registro de jugador libre como una entrada independiente desde la pantalla de
   inicio, separada del flujo de crear o unirse a un equipo.
8. Construir la pantalla del test simple: instrucción clara, grabación de video o captura de sensor
   dentro de la app, sin permitir subir un archivo ya existente desde la galería.
9. Construir la carta de jugador libre con el resultado del test, con un botón directo para
   compartir en redes.

### Pruebas antes de cerrar la fase

10. Una persona nueva puede registrarse como jugador libre sin necesidad de código de equipo.
11. El test se puede completar únicamente con grabación en vivo dentro de la app, y el sistema
    rechaza intentos de subir un video ya grabado desde el dispositivo.
12. El resultado del test se guarda correctamente y aparece en la carta del jugador.
13. La carta se puede compartir fuera de la app y se ve completa para alguien que no tiene la
    aplicación instalada.

### Definición de terminado

Una persona sin equipo puede registrarse, grabar un test dentro de la app, y compartir su carta,
todo en una sola sesión de uso y sin fricción.

---

## Orden recomendado de ejecución para el agente de IA

1. Ejecutar completa la Fase 0 y producir el documento de inventario.
2. Con el inventario en mano, confirmar qué partes del modelo de datos de la Fase 1 y la Fase 2 se
   pueden apoyar en lo que ya existe y cuáles requieren tablas o entidades nuevas.
3. Ejecutar la Fase 1 completa, de modelo de datos a pruebas.
4. Ejecutar la Fase 2 completa, de modelo de datos a pruebas.
5. No iniciar la Fase 4 del roadmap de negocio, el marketplace de conexión entre equipos y jugadores
   libres, hasta que la Fase 1 y la Fase 2 estén ambas en producción y con uso real.
