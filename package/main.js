const { app, BrowserWindow } = require('electron');
function createWindow () {
  const win = new BrowserWindow({ width: 1280, height: 800 });
  win.loadFile('dist/index.html'); // Points to your built React code
}
app.whenReady().then(createWindow);

#### **Step 3: Configure `package.json`**
Add the build configuration to your `package.json`:
```json
"build": {
  "appId": "com.psp.potentiostat",
  "win": {
    "target": "portable",
    "icon": "logo.ico"
  }
},
"scripts": {
  "dist": "electron-builder"
}

#### **Step 4: Package the App**
Run the distribution command:
`npm run dist`

This will generate a single, portable `.exe` file in a folder named `dist/` that you can copy to a USB drive or email to your testers. It will run on any Windows machine without requiring them to install anything else.