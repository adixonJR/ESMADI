import { LocalNotifications } from "@capacitor/local-notifications";

export async function prueba() {
  const permiso = await LocalNotifications.requestPermissions();

  console.log("Permiso:", permiso);

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
        body: "Esta es una prueba",
        channelId: "general",
        schedule: {
          at: new Date(Date.now() + 5000),
        },
      },
    ],
  });

  console.log("Notificación programada");
}