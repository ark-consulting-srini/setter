const { getDefaultConfig } = require('expo/metro-config')
const path = require('path')

const projectRoot = __dirname
const monorepoRoot = path.resolve(projectRoot, '../..')

const config = getDefaultConfig(projectRoot)

config.watchFolders = [monorepoRoot]
config.resolver.nodeModulesPaths = [
  path.resolve(projectRoot, 'node_modules'),
  path.resolve(monorepoRoot, 'node_modules'),
]

config.resolver.extraNodeModules = new Proxy(
  {},
  {
    get: (target, name) => {
      const mobileModule = path.resolve(projectRoot, 'node_modules', String(name))
      const rootModule = path.resolve(monorepoRoot, 'node_modules', String(name))
      try { require.resolve(mobileModule); return mobileModule } catch {}
      return rootModule
    },
  }
)

module.exports = config
