import response from './response'
import exclude from './exclude'
import { read } from './cache'

async function request (config, req) {
  config.debug('uuid', config.uuid)

  const next = (...args) => response(config, req, ...args)

  // await config.watch.setItem(config.uuid, true)
  // run invalidate function to check if any cache items need to be invalidated.
  await config.invalidate(config, req)

  if (exclude(config, req)) {
    return excludeFromCache()
  }

  try {
    const res = await read(config, req)

    res.config = req
    res.request = { fromCache: true }

    return { config, next: res }
  } catch (err) {
    // clean up cache if stale
    if (config.clearOnStale && err.reason === 'cache-stale') {
      await config.store.removeItem(config.uuid)
    }

    return { config, next }
  }

  // Helpers

  function excludeFromCache () {
    config.excludeFromCache = true
    config.debug('excludeFromCache', req.url)
    config.debug('excludeFromCache next')


    return { config, next }
  }
}

export default request
