import type { MenuItem } from "./types";

export const MENU_PRESETS: Record<string, MenuItem[]> = {
  classic: [
    {
      id: "c1",
      name: "Classic Pearl Black Milk Tea",
      description:
        "Ceylon and Assam brew, cane sugar ice level, boba simmered in honey syrup.",
      price: "$5.75",
      category: "signature",
      customization: {
        sweetnessLevels: ["0%", "25%", "50%", "75%", "100%"],
        toppings: [
          { id: "tapioca-pearls", name: "Tapioca Pearls", priceDelta: 0.75 },
          { id: "lychee-jelly", name: "Lychee Jelly", priceDelta: 0.85 },
          { id: "cheese-foam", name: "Cheese Foam", priceDelta: 1.25 },
        ],
      },
    },
    {
      id: "c2",
      name: "Okinawa Roast Milk Tea",
      description:
        "Roasted Okinawa brown sugar swirl, oat or whole milk, hot or cold.",
      price: "$6.25",
      category: "signature",
      customization: {
        sweetnessLevels: ["0%", "25%", "50%", "75%", "100%"],
        toppings: [
          { id: "tapioca-pearls", name: "Tapioca Pearls", priceDelta: 0.75 },
          { id: "pudding", name: "Pudding", priceDelta: 0.8 },
          { id: "cheese-foam", name: "Cheese Foam", priceDelta: 1.25 },
        ],
      },
    },
    {
      id: "c3",
      name: "Winter Melon Lemonade QQ",
      description:
        "Light winter melon tea, calamansi, basil seed, and coconut jelly.",
      price: "$5.95",
      category: "house",
      customization: {
        sweetnessLevels: ["0%", "25%", "50%", "75%", "100%"],
        toppings: [
          { id: "coconut-jelly", name: "Coconut Jelly", priceDelta: 0.85 },
          { id: "aloe-vera", name: "Aloe Vera", priceDelta: 0.7 },
          { id: "lychee-jelly", name: "Lychee Jelly", priceDelta: 0.85 },
        ],
      },
    },
    {
      id: "c4",
      name: "Taiwanese Popcorn Chicken",
      description:
        "Shatter-crisp marinade, plum powder shaker, pickled radish bites.",
      price: "$8.95",
      category: "seasonal",
    },
  ],
};

export type MenuPresetId = keyof typeof MENU_PRESETS;
