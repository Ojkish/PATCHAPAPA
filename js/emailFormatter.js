// js/emailFormatter.js

/**
 * Génère un e-mail en texte brut formaté pour récapituler le patch DMX.
 * @param {Array<Object>} patchResults - Liste d'objets { name, universe, address, endAddress, channels }
 * @returns {string} - Le corps du mail formaté en ASCII
 */
export function generatePlainTextEmail(patchResults) {
  if (!patchResults || patchResults.length === 0) return "Aucun patch trouvé.";

  const H = { horizontal: '-', double: '=', bullet: '*', space: ' ' };
  const SP = { colGap: 3 };

  // Outils de formatage
  const repeat = (char, len) => char.repeat(Math.max(0, len));
  const align = (text, width, alignType = 'left') => {
    const str = String(text);
    const pad = width - str.length;
    if (pad <= 0) return str;
    if (alignType === 'right') return H.space.repeat(pad) + str;
    if (alignType === 'center') {
      const left = Math.floor(pad / 2);
      return H.space.repeat(left) + str + H.space.repeat(pad - left);
    }
    return str + H.space.repeat(pad);
  };

  // Calcul des largeurs de colonnes dynamiques
  const widths = {
    name: Math.max(15, ...patchResults.map(r => r.name.length)),
    start: 8,  // Format "U.AAA"
    end: 7,    // Format "(-AAA)"
    ch: 7      // Format "(XXCh)"
  };
  
  const totalW = Object.values(widths).reduce((a, b) => a + b, 0) + SP.colGap * (Object.keys(widths).length - 1);

  const date = new Date();
  const lines = [];

  // En-tête
  lines.push(repeat(H.double, totalW));
  lines.push(align('PATCH DMX - RÉCAPITULATIF', totalW, 'center'));
  lines.push(align(`${date.toLocaleDateString('fr-FR')} - ${date.toLocaleTimeString('fr-FR')}`, totalW, 'center'));
  lines.push(repeat(H.double, totalW), "");

  // Titres des colonnes
  const hdrCols = [
    align('PROJECTEUR', widths.name),
    align('DÉBUT', widths.start),
    align('FIN', widths.end),
    align('CANAUX', widths.ch)
  ].join(H.space.repeat(SP.colGap));

  lines.push(hdrCols, repeat(H.horizontal, totalW));

  // Tri des données (Univers puis Adresse)
  const sorted = [...patchResults].sort((a, b) => a.universe - b.universe || a.address - b.address);
  
  let curUniv = null;
  sorted.forEach(r => {
    // Ligne de séparation entre les univers
    if (curUniv !== null && r.universe !== curUniv) {
      lines.push(repeat(H.horizontal, totalW));
    }
    curUniv = r.universe;

    // On nettoie l'adresse de fin pour n'avoir que le numéro (ex: "1.512" -> "512")
    const cleanEnd = String(r.endAddress).includes('.') ? r.endAddress.split('.')[1] : r.endAddress;

    lines.push([
      align(r.name, widths.name),
      align(`${r.universe}.${String(r.address).padStart(3, '0')}`, widths.start),
      align(`(-${String(cleanEnd).padStart(3, '0')})`, widths.end),
      align(`(${r.channels}Ch)`, widths.ch)
    ].join(H.space.repeat(SP.colGap)));
  });

  // Statistiques finales
  const totalProj = sorted.length;
  const totalChan = sorted.reduce((sum, r) => sum + parseInt(r.channels), 0);
  const usedUnivs = new Set(sorted.map(r => r.universe)).size;

  lines.push('', repeat(H.double, totalW));
  lines.push(align('STATISTIQUES', totalW, 'center'));
  lines.push(repeat(H.horizontal, totalW));
  lines.push(`${H.bullet} Total machines   : ${totalProj}`);
  lines.push(`${H.bullet} Total canaux     : ${totalChan}`);
  lines.push(`${H.bullet} Univers utilisés : ${usedUnivs}`);
  lines.push(repeat(H.double, totalW));

  return lines.join('\n');
}
