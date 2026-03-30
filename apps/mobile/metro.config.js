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
// Some packages land in mobile/node_modules, others in root — help Metro find both
config.resolver.extraNodeModules = new Proxy(
  {},
  {
    get: (target, name) => {
      // Check mobile node_modules first, then root
      const mobileModule = path.resolve(projectRoot, 'node_modules', String(name))
      const rootModule = path.resolve(monorepoRoot, 'node_modules', String(name))
      try { require.resolve(mobileModule); return mobileModule } catch {}
      return rootModule
    },
  }
)

module.exports = withNativeWind(config, { input: './global.css' })
