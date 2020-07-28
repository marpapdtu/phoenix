import filesize from 'filesize'

/**
 * Returns formatted size of the resource
 * @param {number} int Unformatted size of the resource
 * @returns {String} formatted size of the resource
 */
export function getResourceSize(int) {
  if (int < 0) {
    return ''
  }

  if (isNaN(int)) {
    return '?'
  }

  const mb = 1048576

  // TODO: Pass current language as locale to display correct separator
  return filesize(int, {
    round: int < mb ? 0 : 1
  })
}
