export function reportHandledException(error, attributes = {}) {
    if (typeof window === 'undefined') {
      return
    }
  
    const hook = window.__workshopReportHandledException
    if (typeof hook !== 'function') {
      return
    }
  
    hook(error, {
      handled: true,
      handler: 'manual',
      attributes,
    })
  }