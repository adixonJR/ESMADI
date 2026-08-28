import { LocalNotifications } from "@capacitor/local-notifications";

export async function pedirPermisoNotificaciones() {
  const permiso = await LocalNotifications.requestPermissions();

  console.log("Permiso:", permiso);

  if (permiso.display !== "granted") {
    console.log("Permiso denegado");
    return;
  }

  await LocalNotifications.createChannel({
    id: "general",
    name: "General",
    importance: 5,
  });

  await LocalNotifications.schedule({
    notifications: [
      {
        id: 100,
        title: "Hola ❤️",
        body: "Esta es una prueba de notificación",
        channelId: "general",
        schedule: {
          at: new Date(Date.now() + 5000),
        },
      },
    ],
  });

  console.log("Notificación programada");
}