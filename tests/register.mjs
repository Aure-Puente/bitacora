// Permite probar src/utils con node: los imports de la app no llevan extensión (los resuelve Metro).
import { registerHooks } from 'node:module';

registerHooks({
  resolve(specifier, context, nextResolve) {
    if (/^\.{1,2}\//.test(specifier) && !/\.(m?js|json)$/.test(specifier)) {
      return nextResolve(`${specifier}.js`, context);
    }
    return nextResolve(specifier, context);
  },
});
