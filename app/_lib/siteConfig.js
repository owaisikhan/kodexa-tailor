// Identity as data. Values marked PLACEHOLDER need real details before launch.
export const siteConfig = {
  name: "Kodexa",
  tagline: "Software studio",
  founder: "Hamid Javed",
  // PLACEHOLDER: international format without "+" or spaces, for wa.me links
  whatsapp: "920000000000",
  // PLACEHOLDER
  email: "hello@kodexa.example",
  location: "Pakistan · working worldwide",
  github: "https://github.com/EmeDev27",
  services: ["Websites", "Dashboards", "Online stores", "AI assistants", "Desktop and Android apps"],
};

export function whatsappLink(message = "Hi Kodexa, I have a product idea I'd like to talk through.") {
  return `https://wa.me/${siteConfig.whatsapp}?text=${encodeURIComponent(message)}`;
}
