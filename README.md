# 🧭 Bitácora

App de viajes en grupo: cuenta regresiva al vuelo, itinerario, votaciones, equipaje y tareas, gastos compartidos con calculadora de deudas, cuotas con confirmación y un tema (colores + ícono) distinto para cada viaje.

**Stack:** Expo (SDK 58) · React Native · JavaScript puro · React Navigation (TabNavigator + Stack) · React Native Paper (tema claro/oscuro) · Firebase nativo con `@react-native-firebase` (Auth + Firestore + Storage) · EAS Build y EAS Update.

---

## Puesta en marcha

### 1. Instalar

```bash
npm install
```

### 2. Crear el proyecto de Firebase

1. En la [consola de Firebase](https://console.firebase.google.com) creá un proyecto.
2. **Configuración del proyecto → Tus apps → Agregar app → Android**, con el paquete `com.bitacora.app`. Descargá `google-services.json` y dejalo en la raíz, junto a `app.json`: de ahí sale la configuración.
3. **Authentication → Método de acceso:** habilitá **Correo electrónico/contraseña** y **Google**.
4. **Firestore Database → Crear base de datos.** Después, en la pestaña **Reglas**, pegá el contenido de `firestore.rules` y publicá. **Hay que volver a publicarlo cada vez que ese archivo cambia.**
5. **Storage → Comenzar** (requiere el plan Blaze). Después, en la pestaña **Reglas**, pegá el contenido de `storage.rules` y publicá. Las reglas consultan `memberIds` en Firestore: si la consola pide permiso para conectar los dos servicios, aceptalo.

### 3. Primer build (development build)

Desde la Etapa 3 la app usa Firebase nativo: **no anda en Expo Go**. El build se hace en la nube, con EAS.

1. Vinculá el proyecto a tu cuenta de Expo (una sola vez):
   ```bash
   npx eas-cli@latest login
   npx eas-cli@latest init
   npx eas-cli@latest update:configure     # agrega updates.url a app.json; dejá runtimeVersion como está
   ```
2. Si la carpeta todavía no es un repositorio de git, en PowerShell: `$env:EAS_NO_VCS=1` antes de cada comando de EAS.
3. Generá el build e instalalo en el celular con el link que muestra al terminar:
   ```bash
   npm run build:dev
   ```
4. Para desarrollar: `npm start` y abrí la app Bitácora (no Expo Go).

Hay que generar otro build cuando cambian las librerías nativas, los permisos, el ícono, los plugins de `app.json` o la versión de Expo.

- Para probar la lógica pura (`src/utils`): `npm test` (Node 24 o superior).

### 4. Google Sign-In

1. Con el primer build ya hecho, buscá la huella **SHA-1**: `npx eas-cli@latest credentials` → Android.
2. En Firebase → **Configuración del proyecto → tu app Android → Agregar huella digital**, pegala y volvé a descargar `google-services.json`.
3. En **Authentication → Google → Configuración del SDK web**, copiá el **ID de cliente web** en `GOOGLE_WEB_CLIENT_ID` (`src/config/firebaseConfig.js`). De ese archivo es lo único que se usa.
4. Generá otro build.

### 5. APK para el grupo y actualizaciones automáticas

```bash
npm run build:apk                               # APK para instalar (canal production)
npm run update:apk -- --message "Qué cambió"    # actualización sin reinstalar
```

- La actualización se baja al abrir la app y se usa en el siguiente inicio. Si termina de bajar con la app abierta, aparece "Hay una versión nueva · Reiniciar".
- Solo sirve para cambios de JavaScript y de imágenes. Con `runtimeVersion: fingerprint`, una actualización nunca llega a un APK incompatible: en ese caso hay que generar uno nuevo.

> **iOS:** por ahora es solo Android. Para iPhone hacen falta `GoogleService-Info.plist`, `useFrameworks: "dynamic"` en `expo-build-properties` y una cuenta paga de Apple Developer.

---

## Estructura

```
App.js                      Providers (tema, auth, viaje), splash de 2 s y navegación
app.json                    Config de Expo (íconos, splash, plugins, actualizaciones)
eas.json                    Perfiles de build: development, preview y production
firestore.rules             Reglas de seguridad de Firestore
storage.rules               Reglas de seguridad de Storage
assets/                     Ícono, adaptive icon y splash (rosa de los vientos)
src/
  config/firebaseConfig.js  ← acá van tus claves de Firebase
  services/sdk/             auth, firestore y storage: la única puerta de entrada a Firebase
  services/                 firebase, syncService (conexión y cola de cambios), expenseBackupService,
                            authService, tripService, expenseService, planService (cuotas),
                            activityService, pollService, checklistService, taskService,
                            bookingService, contactService, fileService (subir y borrar),
                            fileCache (bajar, abrir, compartir, exportar), imageService (elegir y
                            comprimir), profileService
  context/                  AuthContext, TripContext (viajes + gastos en tiempo real), ThemeContext, UploadContext (cola del álbum),
                            ConnectionContext (conexión y pendientes), DownloadContext (para ver sin internet)
  navigation/               RootNavigator (Stack) y MainTabs (TabNavigator)
  screens/                  SplashScreen, LoginScreen, RegistroScreen, ViajesScreen,
                            CrearViajeScreen, UnirseViajeScreen, InicioScreen, GastosScreen,
                            AgregarGastoScreen, SaldosScreen, CuotasScreen, CrearCuotasScreen,
                            AjustesScreen, DineroScreen (Gastos, Saldos y Cuotas),
                            PlanScreen (ItinerarioScreen, VotacionesScreen, EquipajeScreen,
                            TareasScreen), AgregarActividadScreen, CrearVotacionScreen,
                            AgregarTareaScreen, ReservasScreen (ListaReservasScreen,
                            DocumentosScreen, ContactosScreen, AlbumScreen), AgregarReservaScreen,
                            AgregarContactoScreen, SubirArchivoScreen, VerArchivoScreen, PerfilScreen
  components/               Countdown, InstallmentBar, PlanCard (cuotas), ExpenseRow, DateTimeField,
                            TimeField, SelectorChips, DraggableList, ActivityCard, PollCard, BookingCard,
                            FileRow, StorageImage, ZoomableImage, SourceDialog, AvatarPicker, MemberChip,
                            ConnectionBar, UpdateNotice, UnconfirmedExpenses, ...
  constants/                categorías de gastos, estados de actividad, tipos de reserva, plantillas de equipaje
  hooks/                    useCountdown, usePlans, usePlanPayments (cuotas), useTripCollection,
                            useActivities, usePolls, useChecklist, useTasks, useBookings, useContacts,
                            useFiles, useLocalFile
  theme/                    colores, tema de Paper (claro/oscuro + override por viaje), temas de viaje
  utils/                    settle (algoritmo de saldos), money, dates, itinerary, reorder, polls,
                            checklist, tasks, bookings, files, downloads, writeTracker, expenseBackup, firebaseErrors, ...
tests/                      pruebas de src/utils con node
```

## Cómo funciona

- **Splash:** splash nativo (ícono sobre fondo crema/azul noche) + `SplashScreen` en JS. Dura **2 segundos** como mínimo (`SPLASH_MS` en `App.js`) y espera a que Firebase restaure la sesión.
- **Viajes:** cada viaje tiene nombre, emoji, colores (`primary` y `accent`), moneda, salida y regreso. Al abrir un viaje, toda la app se re-tematiza con sus colores. Se invita con un **código de 6 caracteres** (Ajustes → Código de invitación).
- **Pestañas:** Inicio · Plan · Dinero · Reservas · Ajustes. En el código, `plans` y `planService` son los planes de **cuotas**; la pestaña Plan usa `activities`, `polls`, `checklistItems` y `tasks`.
- **Inicio:** cuenta regresiva hasta el vuelo; durante el viaje muestra "Día X de Y"; después, un aviso para saldar cuentas. También la próxima actividad y el resumen de tareas.
- **Itinerario:** un día por chip, de la salida al regreso. Las actividades se reordenan arrastrando la manija; las nuevas con hora se ubican solas. **Ideas** es la lista de deseos (actividades sin día) y "Asignar día" las pasa al itinerario. Si cambian las fechas del viaje, lo que quede afuera aparece en "Fuera de las fechas".
- **Votaciones:** un voto por persona, que se puede cambiar hasta que quien la creó la cierra. Los votos se ven con nombre. La opción ganadora se puede llevar al itinerario (si hay empate, se elige).
- **Equipaje:** lista compartida (la editan todos) y una personal por integrante: el grupo la ve, pero solo la cambia su dueño. Las plantillas están en `src/constants/packingTemplates.js` y no repiten lo que ya está.
- **Tareas:** con responsable opcional; cualquiera puede tildarlas.
- **Reservas:** vuelos, alojamiento, excursiones, autos y otros, en orden cronológico; lo anterior a hoy va a "Ya pasaron". La hora es la local del lugar. Los vuelos suman aerolínea, número, terminal y puerta. El código se copia con un toque. La dirección se busca en Maps tal cual está escrita, sin agregarle el destino.
- **Cuenta regresiva:** hay una sola. Al cargar un vuelo se puede marcar "Es el vuelo de salida": la cuenta usa su fecha y hora, y las sigue si el vuelo cambia. Lo puede marcar cualquier integrante. Editar la salida a mano en Ajustes deja de seguirlo.
- **Contactos:** tocar uno llama.
- **Documentos:** fotos y PDF de hasta 10 MB. "Solo yo" los guarda en una carpeta que los demás no pueden leer; "El grupo" los comparte. No se cambia después de subir. No están cifrados de punta a punta: quien administra el proyecto de Firebase puede acceder. Solo quien subió un archivo puede borrarlo.
- **Adjuntos:** las reservas aceptan fotos y PDF (editando la reserva) y los gastos, una foto del ticket. Al borrar una reserva o un gasto, sus archivos quedan en Documentos.
- **Álbum:** fotos de hasta 4096 px más una miniatura, con link opcional a Drive o Google Photos. "Guardar todas" las copia a una carpeta del celular. Al convertirlas a JPEG se descartan datos ocultos, como la ubicación.
- **Archivos en el celular:** se bajan a la caché de la app y se borran al cerrar sesión. Los links de descarga no se guardan, salvo el de la foto de perfil.
- **Perfil:** foto y nombre, editables en Ajustes → tu tarjeta. Se copian a tu ficha de cada viaje.
- **Gastos:** descripción, monto, quién pagó, entre quiénes se divide (partes iguales), categoría y fecha.
- **Saldos:** saldo neto por persona y la lista **mínima de transferencias** para dejar todo en cero. "Marcar como pagado" registra el pago y recalcula. Todo se calcula en centavos para evitar errores de redondeo.
- **Cuotas:** alguien pagó por todos (ej. Valentín los vuelos). Se crea un plan (total, cantidad de cuotas, participantes) y cada deudor tiene su barra de progreso. El deudor toca **"Pagué una cuota"** → queda *pendiente* (color de acento) → quien cobró toca **OK** y pasa a *confirmada*. Las reglas de Firestore impiden que alguien confirme sus propias cuotas.

## Sin conexión

- **Leer:** Firestore guarda en el celular lo que ya se vio. Itinerario, reservas, contactos, equipaje, tareas, gastos y saldos se ven sin señal.
- **Escribir:** los cambios quedan en una cola que sobrevive a cerrar la app y se envían al volver la señal. Los formularios no esperan al servidor (`src/utils/writeTracker.js`). Un aviso al pie muestra "Sin conexión" y los cambios pendientes; los gastos pendientes llevan el ícono de una nube.
- **Conflictos:** gana la última escritura que llega al servidor.
- **Gastos:** además de la cola, cada gasto se copia en el celular hasta que el servidor lo confirma (`expenseBackupService`). Al volver la señal se revisa y, si falta, se vuelve a guardar con el mismo id, así que no se duplica. Si el servidor lo rechaza, aparece en Gastos para reintentar o descartar. No protege si se desinstala la app o se borran sus datos antes de sincronizar.
- **Archivos:** los documentos y adjuntos de reservas se descargan solos (se apaga en Ajustes); las fotos del álbum y los tickets, a mano. Se borran al cerrar sesión.
- **Necesitan conexión:** subir o borrar archivos, cambiar el perfil, crear un viaje y unirse a uno.

## Modelo de datos (Firestore)

```
users/{uid}                        perfil básico
tripCodes/{CÓDIGO}                 { tripId, ownerId }  (solo lectura exacta, no se puede listar)
trips/{tripId}                     { name, destination, emoji, theme{primary,accent}, currency,
                                     departureAt, returnAt, ownerId, memberIds[], code,
                                     departureBookingId?, albumUrl? }
  members/{uid}                    { displayName, email, color, photoURL }
  expenses/{id}                    { description, amount, paidBy, splitBetween[], category, date,
                                     receiptId | null, writeId }
  settlements/{id}                 { from, to, amount, date }
  plans/{id}                       { title, totalAmount, installments, creditorId, debtors[{uid,owed}] }
    payments/{id}                  { debtorId, status: 'pending' | 'confirmed' }
  activities/{id}                  { title, day: 'AAAA-MM-DD' | null (idea), time: 'HH:MM' | null, place,
                                     mapsUrl, notes, status: 'idea' | 'reservado' | 'hecho', order, pollId }
  polls/{id}                       { question, options[{id,text}], optionIds[], votes{uid: optionId},
                                     status: 'open' | 'closed', createdBy }
  checklistItems/{id}              { text, scope: 'shared' | 'personal', ownerId, done, doneBy, position }
  tasks/{id}                       { title, assigneeId, done, doneBy }
  bookings/{id}                    { type: 'vuelo' | 'alojamiento' | 'excursion' | 'auto' | 'otro', title, code,
                                     day: 'AAAA-MM-DD', time: 'HH:MM' | null, address, mapsUrl, notes,
                                     flight{airline, number, terminal, gate} | null }
  contacts/{id}                    { name, phone, note }
  files/{id}                       { name, contentType, size, width, height, path, thumbPath, ownerId, bookingId,
                                     kind: 'documento' | 'ticket' | 'album', visibility: 'group' | 'private' }
```

## Archivos (Storage)

```
trips/{tripId}/group/{uid}/{fileId}.jpg | .pdf | _mini.jpg     los lee todo el viaje
trips/{tripId}/private/{uid}/{fileId}.jpg | .pdf | _mini.jpg   los lee solo su dueño
avatars/{uid}/{fecha}.jpg                                      fotos de perfil
```

## Solución de problemas

- **`Component auth has not been registered yet`:** era del SDK anterior. Con Firebase nativo no hace falta `metro.config.js`.
- **"RNFBAppModule not found" o la app se cierra al abrir:** se está usando Expo Go o un build viejo. Generá un development build nuevo.
- **Error de Kotlin (`metadata version`) al compilar:** `react-native-firebase` necesita Kotlin 2.4.0. Está fijado en `app.json` con `expo-build-properties`.
- **La actualización no llega:** tiene que ser el canal `production` y el mismo `runtimeVersion` que el APK. Compará con `npx eas-cli@latest fingerprint:compare`.
- **Google: `DEVELOPER_ERROR`:** casi siempre es la huella SHA-1 o el nombre del paquete que no coinciden con los de Firebase, o un `GOOGLE_WEB_CLIENT_ID` incorrecto.
- **`permission-denied`:** falta publicar `firestore.rules` en la consola de Firebase.

## Ideas para las próximas versiones

División por porcentajes o montos exactos, gráficos de gastos, y resumen final del viaje.
