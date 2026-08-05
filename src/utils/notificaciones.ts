import { LocalNotifications } from "@capacitor/local-notifications";

export async function pedirPermisoNotificaciones() {
  const permiso = await LocalNotifications.requestPermissions();

  if (permiso.display === "granted") {
    console.log("Permiso concedido");
  } else {
    console.log("Permiso denegado");
  }
}