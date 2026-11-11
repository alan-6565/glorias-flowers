// Business details from her Instagram and flyer; confirm with the owner before launch.
export const shop = {
  name: "Gloria's Gift & Flower Shop",
  address: "2373 Market Ave",
  city: "San Pablo, CA",
  phone: "(510) 942-1009",
  phoneHref: "tel:+15109421009",
  smsHref: "sms:+15109421009",
  instagram: "flowershop2204",
  tiktok: "glorias.giftflower",
  mapsHref: "https://www.google.com/maps/search/?api=1&query=2373+Market+Ave+San+Pablo+CA",
  mapEmbed: "https://www.google.com/maps?q=2373+Market+Ave,+San+Pablo,+CA&z=16&output=embed",
  hours: "Horario por confirmar",
};

/** Her posted price list: roses with a personalized banner */
export const bannerSizes = [
  { roses: 12, price: 60, includes: "Banner personalizado, corona pequeña y mariposas" },
  { roses: 25, price: 95, includes: "Banner personalizado, corona mediana y mariposas" },
  { roses: 36, price: 140, includes: "Banner personalizado, tiara mediana y mariposas" },
  { roses: 50, price: 170, includes: "Banner personalizado, corona grande y mariposas" },
  { roses: 75, price: 250, includes: "Banner personalizado, corona grande y mariposas" },
  { roses: 100, price: 335, includes: "Banner personalizado, corona grande y mariposas" },
];

export const collections = [
  { id: "corazon", name: "Ramos buchones", line: "Rosas en forma de corazón, coronas y banner con tu mensaje." },
  { id: "azul", name: "Rosas azules", line: "Para quien merece algo fuera de lo común." },
  { id: "quince", name: "Quinceañeras", line: "Números, tiaras y mariposas para sus quince." },
  { id: "dinero", name: "Ramos de dinero", line: "Billetes doblados entre flores, el regalo que nunca falla." },
  { id: "peluche", name: "Peluches y ramos", line: "Un peluche abrazado por rosas." },
  { id: "caja", name: "Cajas sorpresa", line: "Rosas, luces y un mensaje que se ilumina." },
  { id: "fresco", name: "Arreglos frescos", line: "Lirios, rosas y gerberas para cualquier día." },
];

export const occasions = ["Cumpleaños", "Aniversarios", "Propuestas", "Quinceañeras", "Día de las Madres", "San Valentín", "Graduaciones", "Día del Padre"];

/** Ordering: pickup at the shop or delivery nearby. Zones, fees and times are
 *  placeholders until the shop confirms them. */
export const deliveryZones = [
  { zips: ["94806"], area: "San Pablo", fee: 10 },
  { zips: ["94801", "94803", "94804", "94805"], area: "Richmond y El Sobrante", fee: 15 },
  { zips: ["94530"], area: "El Cerrito", fee: 20 },
  { zips: ["94564"], area: "Pinole", fee: 20 },
  { zips: ["94547"], area: "Hercules", fee: 25 },
];

/** Pickup times, by the hour (24h clock) */
export const pickupHours = [10, 11, 12, 13, 14, 15, 16, 17, 18];

/** Delivery windows, by starting and ending hour */
export const deliveryWindows = [
  { start: 10, end: 13 },
  { start: 13, end: 16 },
  { start: 16, end: 19 },
];

/** Orders for today need this many hours to get ready */
export const prepHours = 2;
