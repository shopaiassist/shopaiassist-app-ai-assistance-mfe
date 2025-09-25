/** Parses a date range (in years) for displaying to the user */
export const getDateRangeString = (start?: string, end?: string, all?: string): string => {
  let str = all || 'All dates';

  if (!!start && !!end) {
    str = start === end ? `In ${end}` : `${start} - ${end}`;
  } else if (!!start) {
    str = `Since ${start}`;
  } else if (!!end) {
    str = `Before ${end}`;
  }

  return str;
};
