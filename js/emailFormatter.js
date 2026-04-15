// js/emailFormatter.js

/**
 * Génère un e-mail formaté avec listing technique et vue par univers.
 * @param {Array} patchResults - Données provenant du localStorage
 */
export function generatePlainTextEmail(patchResults) {
  if (!patchResults || patchResults.length === 0) return "Patch vide.";

  // Groupage par modèle pour le listing technique
  const modelGroups = patchResults.reduce((acc, item) => {
    const baseName = item.name.replace(/\s+\d+$/, '').trim();
    const key = `${baseName}_${item.channels}`;
    if (!acc[key]) acc[key] = { name: baseName, ch: item.channels, items: [] };
    acc[key].items.push(item);
    return acc;
  }, {});

  // Groupage par Univers pour la vue simplifiée
  const univGroups = patchResults.reduce((acc, item) => {
    if (!acc[item.universe]) acc[item.universe] = {};
    const baseName = item.name.replace(/\s+\d+$/, '').trim();
    const key = `${baseName}_${item.channels}`;
    if (!acc[item.universe][key]) acc[item.universe][key] = { name: baseName, ch: item.channels, items: [] };
    acc[item.universe][key].items.push(item);
    return acc;
  }, {});

  let lines = [];
  const divider = "============================================================";
  const subDivider = "------------------------------------------------------------";

  // Entête
  lines.push(divider);
  lines.push("   PATCH DMX - RÉCAPITULATIF");
  lines.push(divider, "");

  // Listing technique (Ancienne partie E sans barres)
  lines.push("ID     ADDR      MODEL               MODE         END");
  lines.push(subDivider);

  for (const key in modelGroups) {
    const g = modelGroups[key];
    lines.push(`${g.name} (x${g.items.length})`);
    
    g.items.forEach((r, idx) => {
      const id = String(idx + 1).padStart(2, '0');
      const addr = `${r.universe}.${String(r.address).padStart(3, '0')}`;
      const name = g.name.padEnd(20).substring(0, 20);
      const mode = `${g.ch}ch`.padEnd(12);
      const end = String(r.endAddress).includes('.') ? r.endAddress.split('.')[1] : r.endAddress;
      
      lines.push(`${id}     ${addr.padEnd(10)} ${name} ${mode} ${String(end).padStart(3, '0')}`);
    });
    lines.push("");
  }

  // Vue par univers formatée (Ancienne partie H)
  lines.push(divider);
  lines.push("   VUE PAR UNIVERS");
  lines.push(divider, "");

  const sortedUniverses = Object.keys(univGroups).sort((a, b) => a - b);
  sortedUniverses.forEach(u => {
    lines.push(`[ UNIVERS ${u} ]`);
    lines.push(subDivider);
    
    for (const key in univGroups[u]) {
      const g = univGroups[u][key];
      lines.push(`${g.name} (${g.ch}ch) :`);
      
      g.items.sort((a, b) => a.address - b.address).forEach((r, idx) => {
        const fixtureNum = `#${idx + 1}`.padEnd(6);
        const addr = `${r.universe}.${String(r.address).padStart(3, '0')}`;
        lines.push(`  ${fixtureNum} ${addr}`);
      });
      lines.push("");
    }
  });

  // Statistiques finales
  lines.push(divider);
  lines.push("   RÉCAPITULATIF FINAL");
  lines.push(divider);
  for (const key in modelGroups) {
    lines.push(`* ${modelGroups[key].name} : ${modelGroups[key].items.length} machines`);
  }
  const totalMachines = patchResults.length;
  const totalChannels = patchResults.reduce((sum, r) => sum + parseInt(r.channels), 0);
  lines.push(subDivider);
  lines.push(`TOTAL : ${totalMachines} machines | ${totalChannels} canaux | ${sortedUniverses.length} Univers utilisé(s)`);
  lines.push(divider);

  return lines.join('\n');
}
