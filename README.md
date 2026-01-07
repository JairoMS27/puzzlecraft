# PuzzleCraft 3D 🧩

Un juego interactivo de puzzles que transforma tus fotos en rompecabezas personalizados con una experiencia 3D inmersiva.

## Características

- **Sube tu imagen**: Convierte cualquier foto en un puzzle personalizado
- **Niveles de dificultad**: Desde fácil (3x3) hasta experto (10x10)
- **Visualización 3D**: Inspecciona la caja del puzzle en un entorno 3D interactivo antes de empezar
- **Estantería 3D**: Visualiza tu colección de puzzles en una estantería tridimensional
- **Sistema de unión flexible**: Une piezas entre sí sin necesidad de colocarlas en el tablero
- **Biblioteca de puzzles**: Guarda y accede a tus puzzles anteriores
- **Comparte tus logros**: Descarga capturas y compártelas en X (Twitter)

## Tecnologías

- React 19
- Three.js / React Three Fiber (renderizado 3D)
- Canvas API (juego de puzzles)
- TypeScript
- Vite
- Tailwind CSS

## Ejecutar localmente

**Prerrequisitos:** Node.js

1. Instalar dependencias:
   ```bash
   npm install
   ```

2. Configurar la API key de Gemini en `.env.local`:
   ```
   GEMINI_API_KEY=tu_api_key
   ```

3. Ejecutar la aplicación:
   ```bash
   npm run dev
   ```

## Cómo jugar

1. **Sube una imagen** o selecciona una de tu biblioteca
2. **Elige la dificultad** del puzzle
3. **Explora la caja** del puzzle en 3D
4. **Resuelve el puzzle** arrastrando las piezas
   - Puedes unir piezas entre sí antes de colocarlas en el tablero
   - Las piezas se unen automáticamente cuando están cerca de sus vecinas
   - Arrastra grupos de piezas unidas como una sola unidad
5. **Comparte tu resultado** cuando lo completes

## Licencia

MIT
