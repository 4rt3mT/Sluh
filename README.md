 # Sluh Audiobook Player
 
 ## About
 
 NeuroSluh is a web-based audiobook player application with a primary focus on helping users improve their high-speed information perception. It features a unique dynamic speed adjustment mechanism that intelligently increases playback speed over the duration of an audiobook, alongside standard playback controls, library management, and settings.
 
 ## Features
 
 *   **Local Library Management:** Add audiobooks from your local computer by selecting their main folder. The application scans the folder for audio files and cover art.
 *   **Dynamic Speed Training:** Configure settings (initial speed, maximum speed, ramp-up percentage, update interval) to gradually increase playback speed as you listen, training your brain to process audio information faster.
 *   **Standard Playback Controls:** Play, pause, seek forward/backward (30 seconds), skip to next/previous track.
 *   **Adjustable Playback Speed:** Manually set a fixed playback speed if dynamic speed is disabled.
 *   **Volume Control & Mute:** Adjust playback volume.
 *   **Sleep Timer:** Set a timer to automatically pause playback after a certain duration or at the end of the current chapter.
 *   **Progress Tracking:** Automatically saves your listening progress (current book, track, and time) and overall book completion percentage.
 *   **Persistence:** Your library, progress, and settings are saved locally in your browser's storage.
 *   **Theme Support:** Switch between Light, Dark, or System default themes.
 
 ## How Dynamic Speed Training Works
 
 The core idea is to gradually expose you to higher listening speeds. When enabled, the playback speed starts at your `Initial Speed` and linearly increases over the specified `Ramp-up Target Percentage` of the book's total duration until it reaches the `Maximum Speed`. After the ramp-up period, the speed remains at the maximum speed for the rest of the book. The speed is adjusted smoothly at regular `Update Intervals`. This gentle increase helps your brain adapt to faster processing without being overwhelmed immediately.
 
 ## Technology Stack
 
 *   **Frontend:** React with TypeScript
 *   **Styling:** Tailwind CSS
 *   **State Management:** React Context API
 *   **Routing:** React Router DOM (HashRouter)
 *   **Persistence:** Browser's Local Storage API
 *   **Audio Processing:** Native Browser Audio API, leveraging `URL.createObjectURL` for local files.
 *   **Build Tool:** Vite (implied by `index.tsx` and `import type="module"`)
 
 ## Installation & Setup
 
 This application is designed to run locally in your web browser.
 
 1.  **Clone the repository:**
     
bash
    git clone <repository_url>
    cd neurosluh-audiobook-player # Or the name of the cloned folder
     
 2.  **Install dependencies:**
     
bash
    npm install # or yarn install
     
 3.  **Start the development server:**
     
bash
    npm run dev # or yarn dev
     
This will typically open the application in your default web browser at a local address (e.g., `http://localhost:5173/`).
 
 4.  **Build for production (Optional):**
     
bash
     npm run build # or yarn build
     
This will create a `dist` folder with the production-ready files. You can then serve these files using any static file server or deploy them to a static hosting service (though local file access features (`webkitdirectory`) might have limitations depending on deployment environment and browser security policies).
 
 ## How to Use
 
 1.  **Go to the Library:** The application starts on the Library screen.
 2.  **Add an Audiobook:** Click the "Add Book" button. A file picker will appear. Select the **main folder** containing the audiobook's audio files (MP3, M4A, etc.) and optionally a cover image (like `cover.jpg`, `folder.jpeg`). The application will process the files and add the book to your library.
 3.  **Open a Book:** Click on a book cover or title in the Library to go to the Player screen.
 4.  **Control Playback:** Use the play/pause, seek (±30s), and track navigation buttons.
 5.  **Adjust Speed:** Click the speed indicator (e.g., "1.00x") to manually select a fixed speed.
 6.  **Manage Dynamic Speed:** Click the "Dynamic Speed: ON/OFF (Configure)" button to open the dynamic speed settings modal for the current book. You can enable/disable dynamic speed and adjust its parameters. These settings override the global defaults found in the Settings screen for this specific book.
 7.  **Set Sleep Timer:** Click the timer icon to set a sleep timer.
 8.  **Go to Settings:** Access the Settings screen from the navigation to change the theme and set default parameters for the dynamic speed feature for newly added books.
 
 ## Contributing
 
 Contributions are welcome! Please feel free to open issues or submit pull requests.
 
 ## License
 
 This project is licensed under the MIT License. See the `LICENSE` file for details.
