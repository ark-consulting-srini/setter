const { getDefaultConfig } = require('expo/metro-config')
const { withNativeWind } = require('nativewind/metro')
const path = require('path')

const projectRoot = __dirname
const monorepoRoot = path.resolve(projectRoot, '../..')

const config = getDefaultConfig(projectRoot)

config.watchFolders = [monorepoRoot]
config.resolver.nodeModulesPaths = [
  path.resolve(projectRoot, 'node_modules'),
  path.resolve(monorepoRoot, 'node_modules'),
]

// Explicitly map packages that Metro struggles to resolve in monorepo
config.resolver.extraNodeModules = {
  'react-native-css-interop': path.resolve(
    monorepoRoot,
    'node_modules/react-native-css-interop'
  ),
}

module.exports = withNativeWind(config, { input: './global.css' })
