// Postinstall script for Windows monorepo compatibility
// Copies mobile-specific packages to root node_modules so Metro can resolve them
// Also patches metro-config for Windows ESM compatibility

const fs = require('fs')
const path = require('path')

const root = path.resolve(__dirname, '..')
const mobileNM = path.join(root, 'apps', 'mobile', 'node_modules')
const rootNM = path.join(root, 'node_modules')

// Packages that need to be at root for Metro resolution
const packagesToCopy = [
  'expo', 'react', 'react-native',
  'metro', 'metro-babel-transformer', 'metro-cache', 'metro-cache-key',
  'metro-config', 'metro-core', 'metro-file-map', 'metro-minify-terser',
  'metro-resolver', 'metro-runtime', 'metro-source-map', 'metro-symbolicate',
  'metro-transform-plugins', 'metro-transform-worker',
]

for (const pkg of packagesToCopy) {
  const src = path.join(mobileNM, pkg)
  const dest = path.join(rootNM, pkg)
  if (fs.existsSync(src) && !fs.existsSync(dest)) {
    try {
      fs.cpSync(src, dest, { recursive: true })
      console.log(`  copied ${pkg} to root`)
    } catch {}
  }
}

// Patch metro-config for Windows ESM compatibility (c: path issue)
const metroConfigPath = path.join(rootNM, '@expo', 'metro', 'node_modules', 'metro-config', 'src', 'loadConfig.js')
if (fs.existsSync(metroConfigPath)) {
  let content = fs.readFileSync(metroConfigPath, 'utf8')
  if (content.includes('await import(absolutePath)') && !content.includes('pathToFileURL')) {
    content = content.replace(
      'const configModule = await import(absolutePath)',
      'const { pathToFileURL } = require("url"); const configModule = await import(pathToFileURL(absolutePath).href)'
    )
    fs.writeFileSync(metroConfigPath, content)
    console.log('  patched metro-config for Windows ESM')
  }
}

console.log('postinstall complete')
