export const sanitizeCommandLineArgument = (arg) => {
  if (typeof arg !== 'string') return ''

  return arg
    .trim() // Remove leading/trailing spaces
    .replace(/[^a-zA-Z0-9\/\-_]/g, '') // Remove unwanted characters
    .replace(/\/{2,}/g, '/') // Prevent double slashes
    .replace(/^-+|-+$/g, '') // Remove leading/trailing hyphens
}
