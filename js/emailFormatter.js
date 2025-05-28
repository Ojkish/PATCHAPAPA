// js/emailFormatter.js

/**
 * Génère un e-mail en texte brut formaté pour récapituler les résultats de patch DMX.
 * Utilise des caractères ASCII pour garantir la compatibilité avec tous les clients mail.
 * @param {Array<Object>} patchResults - Liste des résultats avec { name, universe, startAddress, endAddress, channels }
 * @returns {string} - Corps de l'email formaté
 */
export function generatePlainTextEmail(patchResults) {
  const H = {
    horizontal: '-',
    double: '=' ,
    bullet: '*',
    space: ' '
  };
  const SP = { indent: 2, colGap: 3, sectionGap: 2 };

  const repeat = (char, len) => char.repeat(len);
  const indent = (lvl) => H.space.repeat(SP.indent * lvl);
  const align = (text, width, alignType='left') => {
    const pad = width - text.length;
    if (alignType === 'right') return H.space.repeat(pad) + text;
    if (alignType === 'center') {
      const left = Math.floor(pad/2);
      return H.space.repeat(left) + text + H.space.repeat(pad-left);
    }
    return text + H.space.repeat(pad);
  };

  const widths = {
    name: Math.max(15, ...patchResults.map(r => r.name.length)),
    start: 8, // u.aaa
    end: 7,   // (-aaa)
    ch: 7     // (xxCh)
  };
  const totalW = Object.values(widths).reduce((a,b) => a+b, 0) + SP.colGap * (Object.keys(widths).length - 1);

  const date = new Date();
  const header = [];
  header.push(repeat(H.double, totalW));
  header.push(align('PATCH DMX - RÉCAPITULATIF', totalW, 'center'));
  header.push(align(date.toLocaleDateString('fr-FR') + ' - ' + date.toLocaleTimeString('fr-FR', {hour:'2-digit',minute:'2-digit'}), totalW, 'center'));
  header.push(repeat(H.double, totalW));
  header.push('');

  const hdrCols = [
    align('PROJECTEUR', widths.name),
    align('DÉBUT', widths.start),
    align('FIN', widths.end),
    align('CANAUX', widths.ch)
  ].join(H.space.repeat(SP.colGap));

  const lines = [ ...header, hdrCols, repeat(H.horizontal, totalW) ];

  // Trier par univers puis adresse
  const sorted = [...patchResults].sort((a,b) => a.universe - b.universe || a.startAddress - b.startAddress);
  let curUniv = null;
  sorted.forEach(r => {
    if (curUniv !== null && r.universe !== curUniv) lines.push(repeat(H.horizontal, totalW));
    curUniv = r.universe;
    const line = [
      align(r.name, widths.name),
      align(`${r.universe}.${String(r.startAddress).padStart(3,'0')}`, widths.start),
      align(`(-${String(r.endAddress).padStart(3,'0')})`, widths.end),
      align(`(${r.channels}Ch)`, widths.ch)
    ].join(H.space.repeat(SP.colGap));
    lines.push(line);
  });

  // Statistiques
  const totalProj = sorted.length;
  const totalChan = sorted.reduce((sum,r) => sum + r.channels, 0);
  const usedUnivs = new Set(sorted.map(r => r.universe)).size;

  lines.push('', repeat(H.double, totalW));
  lines.push(align('RÉCAPITULATIF', totalW, 'center'));
  lines.push(repeat(H.horizontal, totalW));
  lines.push(align(`${H.bullet} Total projecteurs : ${totalProj}`, totalW));
  lines.push(align(`${H.bullet} Total canaux     : ${totalChan}`, totalW));
  lines.push(align(`${H.bullet} Univers utilisés : ${usedUnivs}`, totalW));
  lines.push(repeat(H.double, totalW));

  return lines.join('\n');
}
