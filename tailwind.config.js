module.exports = {
  content: [
    "./components/**/*.{js,vue}",
    "./layouts/**/*.vue",
    "./pages/**/*.vue",
    "./plugins/**/*.js",
    "./app.vue",
  ],
  darkMode: 'class',
  theme: {
    extend: {
      colors: {
        primary: '#0ea5e9',      
        secondary: '#a855f7',    
        accent: '#f59e0b',       
        dark: '#1e293b',         
        light: '#f8fafc',        
      },
    },
  },
  plugins: [],
}