export const levenshteinDistance = (source: string, target: string): number => {
    if (!source.length) return target.length;
    if (!target.length) return source.length;
 
    const matrix = Array(target.length + 1).fill(null).map((_, i) => [i]);
    matrix[0] = Array(source.length + 1).fill(null).map((_, i) => i);
 
    for (let i = 1; i <= target.length; i++) {
        for (let j = 1; j <= source.length; j++) {
            const cost = target[i - 1] === source[j - 1] ? 0 : 1;
            matrix[i][j] = Math.min(
                matrix[i - 1][j] + 1,
                matrix[i][j - 1] + 1, 
                matrix[i - 1][j - 1] + cost
            );
        }
    }
 
    return matrix[target.length][source.length];
 };
 
 export const normalizeToken = (token: string, spaceSymbol: string): string => {
    const trimmedToken = token.startsWith(spaceSymbol) ? token.slice(1) : token;
    
    const hyphenReplacements = {
        '\u2012': '-',
        '\u2013': '-',
        '\u2014': '-', 
        '\u2015': '-',
        '\u2043': '-',
        '\u02D7': '-',
        '\u2212': '-'
    };
 
    const regex = new RegExp(`[${Object.keys(hyphenReplacements).join('')}]`, 'g');
    return trimmedToken.replace(regex, '-');
 };
 
 export default normalizeToken;