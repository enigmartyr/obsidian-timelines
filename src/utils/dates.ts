import { DateTime } from 'luxon'

import { logger } from './debug'
import { DEFAULT_SETTINGS } from '../constants'
import { CleanedDateResultObject } from '../types'

/**
 * Take a normalizedDate and clean it of leading zeros, the return all the various
 * parts needed for buildTimelineDate
 * 
 * @param {string} normalizedDate
 * 
 * @returns {CleanedDateResultObject}
 */
const cleanDate = ( normalizedDate: string ): CleanedDateResultObject => {
  const isNegative = normalizedDate[0] === '-'
  const parts = normalizedDate.slice( 1 ).split( '-' )

  const numParts: number[] = parts.map(( part ) => {
    return parseInt( part, 10 )
  })
  
  const cleanedDateString = isNegative ? '-' + numParts.join( '-' ) : numParts.join( '-' )
  const year  = numParts[0] * ( isNegative ? -1 : 1 )
  const month = ( numParts[1] ?? 1 ) - 1
  const day   = numParts[2]
  const hour  = numParts[3] ?? 1

  const resultObject: CleanedDateResultObject = {
    cleanedDateString,
    year,
    month,
    day,
    hour
  }
  
  return resultObject
}

/**
 * Takes a date string and normalizes it so there are always 4 sections, each the length specified by maxDigits
 * If there are missing sections, they will be inserted with a value of 01 (except for hours, which will be 00)
 *
 * @param date - a date string of some nebulous format
 * @param maxDigits - the number of digits to pad each section to
 *
 * @returns {string}
 */
export const normalizeDate = (
  date: string,
  maxDigits: number = parseInt( DEFAULT_SETTINGS.maxDigits )
): string | null => {
  if ( !date ) {
    return null 
  }

  // todo: handle sections of arbitrary length
  let isNegativeYear = false
  if ( date[0] === '-' ) {
    isNegativeYear = true
    date = date.substring( 1 )
  }

  const sections = date.split( '-' )

  // cases:
  // 4 sections: YYYY-MM-DD-HH (perfect, send it off as is)
  // 3 sections: YYYY-MM-DD (add 01 at the end)
  // 2 sections: YYYY-MM (add 01-01 at the end)
  // 1 section: YYYY (add 01-01-01 at the end)

  switch ( sections.length ) {
  case 1:
    sections.push( '01' ) // MM
  case 2:
    sections.push( '01' ) // DD
  case 3:
    sections.push( '01' ) // HH
    break
  }

  const paddedSections = sections.map(( section ) => {
    return section.padStart( maxDigits, '0' )
  })

  if ( isNegativeYear ) {
    paddedSections[0] = `-${paddedSections[0]}`
  }

  return paddedSections.join( '-' )
}

/**
 * Format an event date for display
 *
 * @param {string} rawDate - string from of date in format "YYYY-MM-DD-HH"
 * @returns {Date | null}
 */
export const buildTimelineDate = (
  rawDate: string,
  maxDigits?: number
): Date | null => {
  const normalizedDate = normalizeDate( rawDate, maxDigits ?? parseInt( DEFAULT_SETTINGS.maxDigits ))
  if ( !normalizedDate ) {
    return null
  }
  
  const cleanedDateObject = cleanDate( normalizedDate )
  if ( !normalizedDate ) {
    return null
  }
  const { cleanedDateString, year, month, day, hour } = cleanedDateObject

  // native JS Date handles negative years and recent dates pretty decent
  // so if year is negative, or if the year is recent (past 1900)
  // we can just use the JS Date directly with no workarounds
  let returnDate: Date
  let luxonDateTime: DateTime
  let luxonDateString: string
  if ( year < 0 || year > 1900 ) {
    returnDate = new Date( year, month, day, hour )
  } else {
    // but if date is positive, well, then we need to make sure we're actually getting
    // the date that we want. JS Date will change "0001-00-01" to "Jan 1st 1970"
    luxonDateTime = DateTime.fromFormat( cleanedDateString, 'y-M-d-H' )
    luxonDateString = luxonDateTime.toISO()
    returnDate = new Date( luxonDateString )
  }

  logger( 'date variables inside of buildTimelineDate', {
    rawDate,
    normalizedDate,
    cleanedDateString,
    luxonDateTime,
    luxonDateString,
    returnDate
  })

  return returnDate
}

/**
 * Correctly sort our timeline dates, taking heed of negative dates
 *
 * @param {string[]} timelineDates the array of event dates for the timeline
 * @param {boolean} sortDirection false for descending, true for ascending
 */
export const sortTimelineDates = ( timelineDates: string[], sortDirection: boolean ): string[] => {
  const filterFunc = ( dateStr: string ) => {
    return dateStr[0] === '-' 
  }

  const negativeDatesUnsorted = timelineDates.filter( filterFunc )
  const positiveDates = timelineDates.filter(( date ) => {
    return !filterFunc( date ) 
  }).sort()

  const strippedNegativeDates = negativeDatesUnsorted.map(( date ) => {
    return date.slice( 1 ) 
  }).sort().reverse()
  
  let sortedTimelineDates: string[] = []
  if ( sortDirection ) {
    const negativeDates = strippedNegativeDates.map(( date ) => {
      return `-${date}` 
    })

    sortedTimelineDates = [...negativeDates, ...positiveDates]
  } else {
    const negativeDates = strippedNegativeDates.reverse().map(( date ) => {
      return `-${date}` 
    })

    sortedTimelineDates = [...positiveDates.reverse(), ...negativeDates]
  }
  
  return sortedTimelineDates
}