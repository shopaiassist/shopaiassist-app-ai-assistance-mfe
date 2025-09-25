// Regex for matching markdown anchor elements
export const unorderedListExpression =
  /([-+*]) ([[][a-zA-Z0-9 -/&/$/./(/)/_/%/#/@/!/^/*/?/+///:/"/'/;]*])([(][a-zA-Z0-9 :/\-.&?)=_%;]*)/g;
export const emailExpression = /([a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,})/g;
export const newlineExpression = /\n/g;
export const markdownTitleExpression = /## [\d\w]+\n/g;
export const urlExpression = /\((https|http):[^(]*\)/g;
export const bulletExpression = /- (?=\[[^[]*\])/g;
export const openTicketExpression = /## open_ticket/g; // Need this since '## open_ticket' isn't followed by \n and won't match 'markdownTitleExpression' regex
export const firmIdExpression = /^[a-zA-Z0-9]{4,}$/; // Firm ID must be at least 4 alphanumeric characters
