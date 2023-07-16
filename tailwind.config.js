/** @type {import('tailwindcss').Config} */
export default {
    content: [
      "./src/**/**/*.(j|t)sx",
      "./src/**/*.(j|t)sx",
      "./src/*.(j|t)sx",
      "./*.(j|t)sx",
      "./*.html"
    ],
    theme: {
      extend: {
        colors: {
          'blue-bubble': '#0a84ff',
          'green-bubble': '#34c759',
        },
      },
    },
    plugins: [require("daisyui")],
}
  