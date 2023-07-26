export interface TimelinesSettings {
  timelineTag: string,
  sortDirection: boolean,
  eventElement: AcceptableEventElements,
  showRibbonCommand: boolean
}

export interface TimelineArgs {
  [key: string]: string
}

export interface CardContainer {
  startDate: string,
  title: string,
  img: string,
  innerHTML: string,
  path: string,
  endDate: string,
  type: string,
  class: string,
  era: string
}

export interface EventItem {
  id: number,
  content: string,
  title: string,
  start: Date,
  className: string,
  type: string,
  end: Date
}

export type NoteData = CardContainer[]
export type AllNotesData = NoteData[]

export enum AcceptableEventElements {
  div = 'div',
  span = 'span',
}
