// Loest die verbliebenen kleinen Duplikat-Gruppen (2-4 Codes) auf.
// Strategie: titelgefuehrt. Jede Beschreibung = "<Titel>: <Fehlerart-Klausel>. <gemeinsame Folge>".
// Der validierte Titel ist die Quelle der Wahrheit und je Code eindeutig -> korrekt + unique.
// Aufruf:  node fix_dup_small.mjs            -> nur Vorschau (preview_small.json)
//          node fix_dup_small.mjs --apply    -> patcht die YAML-Quelldateien
import { readFileSync, writeFileSync } from "node:fs";
import { join } from "node:path";
import { fileURLToPath } from "node:url";

const root = fileURLToPath(new URL("../..", import.meta.url));
const dir = join(root, "data/generic");
const apply = process.argv.includes("--apply");

const codes = JSON.parse(readFileSync(join(root,"dist/generic.json"),"utf8"));
const byCode = Object.fromEntries(codes.map(c=>[c.code,c]));
// Codes, deren EN- ODER DE-Beschreibung mit einem anderen Code identisch ist.
const descEn = {}, descDe = {};
for (const c of codes){
  const e=(c.description?.en||"").trim(); if(e)(descEn[e] ??= []).push(c.code);
  const d=(c.description?.de||"").trim(); if(d)(descDe[d] ??= []).push(c.code);
}
const dupCodes = new Set();
for (const a of Object.values(descEn)) if(a.length>1) a.forEach(c=>dupCodes.add(c));
for (const a of Object.values(descDe)) if(a.length>1) a.forEach(c=>dupCodes.add(c));
const targetCodes = [...dupCodes];

// ---- Fehlerart aus EM-Titel erkennen (Spezialfaelle zuerst, dann Schaltkreis-Typen) ----
const C = { // [enKlausel, deKlausel, enUrsacheWennKeineFolge, deUrsacheWennKeineFolge]
  LEARN_LOW:["the adaptive learning value has reached its lower limit, so the ECU can no longer compensate","der Adaptionswert hat seine untere Grenze erreicht, das Steuergerät kann nicht weiter kompensieren","",""],
  LEARN_HIGH:["the adaptive learning value has reached its upper limit, so the ECU can no longer compensate","der Adaptionswert hat seine obere Grenze erreicht, das Steuergerät kann nicht weiter kompensieren","",""],
  RICH:["the fuel-trim control is correcting for an over-rich mixture in this operating range","die Gemischregelung korrigiert ein zu fettes Gemisch in diesem Betriebsbereich","",""],
  LEAN:["the fuel-trim control is correcting for an over-lean mixture in this operating range","die Gemischregelung korrigiert ein zu mageres Gemisch in diesem Betriebsbereich","",""],
  DEPLOY:["the restraints module has detected a fault in this airbag/pretensioner deployment circuit, which may prevent correct deployment in a crash. Safety-critical","das Rückhaltesystem-Steuergerät hat einen Fehler in diesem Airbag-/Gurtstraffer-Auslösekreis erkannt, der die korrekte Auslösung im Crash verhindern kann. Sicherheitskritisch","",""],
  LEAK:["a leak has been detected in this brake-hydraulic circuit, which reduces braking pressure. Safety-critical","in diesem Brems-Hydraulikkreis wurde ein Leck erkannt, das den Bremsdruck verringert. Sicherheitskritisch","",""],
  STUCK_ENG:["the actuator stays engaged even when commanded off","das Stellglied bleibt trotz Abschaltbefehl eingerückt","",""],
  STUCK_DISENG:["the actuator will not engage when commanded","das Stellglied rückt auf Befehl nicht ein","",""],
  STUCK_ON:["the actuator is stuck in the on position","das Stellglied hängt in der Ein-Stellung","",""],
  STUCK_OFF:["the actuator is stuck in the off position","das Stellglied hängt in der Aus-Stellung","",""],
  OVERHEAT:["the component is overheating, typically from extended load or slip","das Bauteil überhitzt, meist durch andauernde Last oder Schlupf","",""],
  ENGAGE_FAULT:["engagement is sluggish, partial, or incomplete","das Einrücken ist träge, teilweise oder unvollständig","",""],
  POS_ERR:["the actual position deviates from the commanded position","die Ist-Position weicht von der Soll-Position ab","",""],
  CORR:["the value does not correlate with the related sensor or expected pattern","der Wert stimmt nicht mit dem zugehörigen Sensor oder dem erwarteten Muster überein","",""],
  MECH:["a mechanical fault is present — typically a damaged tone ring, excessive air gap, or loose mounting","es liegt ein mechanischer Fehler vor — meist beschädigtes Polrad, zu großer Luftspalt oder lose Befestigung","",""],
  INCORRECT:["the installed component does not match the type the vehicle expects","das verbaute Bauteil entspricht nicht dem vom Fahrzeug erwarteten Typ","",""],
  RANGE:["the signal is implausible or outside the valid range","das Signal ist unplausibel bzw. außerhalb des gültigen Bereichs","",""],
  INTERMITTENT:["the signal is intermittent or erratic","das Signal ist sporadisch oder unsauber","Often a loose connector or chafed wiring; a wiggle test often locates it.","Oft loser Stecker oder gescheuerte Leitung; ein Wackeltest lokalisiert ihn oft."],
  CTRL_OPEN:["the control circuit is open","der Steuerkreis ist unterbrochen","Likely a broken wire, disconnected connector, or failed actuator.","Wahrscheinlich unterbrochene Leitung, abgezogener Stecker oder defektes Stellglied."],
  CTRL_LOW:["the control-circuit voltage is below the expected range","die Spannung im Steuerkreis liegt unter dem erwarteten Bereich","Often a short to ground or high resistance in the wiring.","Oft Masseschluss oder hoher Übergangswiderstand in der Verkabelung."],
  CTRL_HIGH:["the control-circuit voltage is above the expected range","die Spannung im Steuerkreis liegt über dem erwarteten Bereich","Often an open circuit or a short to supply voltage.","Oft Unterbrechung oder Kurzschluss gegen die Versorgungsspannung."],
  CTRL:["the control circuit has an electrical fault","im Steuerkreis liegt ein elektrischer Fehler vor","",""],
  OPEN:["the circuit is open","der Stromkreis ist unterbrochen","Likely a broken wire, disconnected connector, or failed component.","Wahrscheinlich unterbrochene Leitung, abgezogener Stecker oder defektes Bauteil."],
  LOW:["the signal voltage is below the expected range","die Signalspannung liegt unter dem erwarteten Bereich","Often a short to ground or high resistance in the wiring.","Oft Masseschluss oder hoher Übergangswiderstand in der Verkabelung."],
  HIGH:["the signal voltage is above the expected range","die Signalspannung liegt über dem erwarteten Bereich","Often an open circuit or a short to supply voltage.","Oft Unterbrechung oder Kurzschluss gegen die Versorgungsspannung."],
  CIRCUIT:["an electrical fault is present in the circuit","im Stromkreis liegt ein elektrischer Fehler vor","",""],
  PERF:["the component is electrically intact but its response does not match the command","das Bauteil ist elektrisch in Ordnung, reagiert aber nicht wie vorgegeben","",""],
  MALF:["the component is malfunctioning","das Bauteil arbeitet fehlerhaft","",""],
  ELEC:["an electrical fault is present","es liegt ein elektrischer Fehler vor","Open winding, short to ground, or short to supply.","Offene Wicklung, Masseschluss oder Kurzschluss gegen Versorgung."],
  GENERIC:["the control module has detected this fault condition","das Steuergerät hat diesen Fehlerzustand erkannt","",""],
};
function faultKey(t){
  // Spezialfaelle
  if (/Exceeded Learning Limit.*Too Low|Learning Limits? - Too Low/i.test(t)) return "LEARN_LOW";
  if (/Exceeded Learning Limit.*Too High|Learning Limits? - Too High/i.test(t)) return "LEARN_HIGH";
  if (/Too Rich/i.test(t)) return "RICH";
  if (/Too Lean/i.test(t)) return "LEAN";
  if (/Deployment Control/i.test(t)) return "DEPLOY";
  if (/Leak/i.test(t)) return "LEAK";
  if (/Stuck Engaged/i.test(t)) return "STUCK_ENG";
  if (/Performance\/Stuck Disengaged|Stuck Disengaged/i.test(t)) return "STUCK_DISENG";
  if (/Stuck On/i.test(t)) return "STUCK_ON";
  if (/Stuck Off/i.test(t)) return "STUCK_OFF";
  if (/Temperature Too High|Over.?Temp/i.test(t)) return "OVERHEAT";
  if (/Engagement Fault/i.test(t)) return "ENGAGE_FAULT";
  if (/Position Control Error/i.test(t)) return "POS_ERR";
  if (/Correlation/i.test(t)) return "CORR";
  if (/- Mechanical|Mechanical$/i.test(t)) return "MECH";
  if (/Incorrect Component Installed/i.test(t)) return "INCORRECT";
  // Schaltkreis-Typen (Reihenfolge: spezifisch -> allgemein)
  if (/Range\/Performance/i.test(t)) return "RANGE";
  if (/Intermittent\/Erratic|Intermittent/i.test(t)) return "INTERMITTENT";
  if (/Control Circuit\/Open|Control Circuit Open/i.test(t)) return "CTRL_OPEN";
  if (/Control Circuit Low/i.test(t)) return "CTRL_LOW";
  if (/Control Circuit High/i.test(t)) return "CTRL_HIGH";
  if (/Circuit\/Open|Circuit Open/i.test(t)) return "OPEN";
  if (/Circuit Low|Low Voltage/i.test(t)) return "LOW";
  if (/Circuit High|High Voltage/i.test(t)) return "HIGH";
  if (/Control Circuit/i.test(t)) return "CTRL";
  if (/Performance/i.test(t)) return "PERF";
  if (/Malfunction/i.test(t)) return "MALF";
  if (/Electrical/i.test(t)) return "ELEC";
  if (/Circuit/i.test(t)) return "CIRCUIT";
  return "GENERIC";
}

// Kuratierter, korrekter Bauteil-Kontext (NICHT aus den Quelldaten uebernommen,
// da diese teils falsche Folge-Saetze enthalten, z.B. Turbo-Text bei Bremskraftverstaerker).
// Reihenfolge wichtig: spezifisch zuerst ("booster" vor "boost").
const CTX = [
  [/brake booster/i, "The electric brake booster generates the braking assist; a motor or sensor fault can reduce or disable power-assisted braking. Safety-relevant.", "Der elektrische Bremskraftverstärker erzeugt die Bremsunterstützung; ein Motor- oder Sensorfehler kann die Bremskraftunterstützung verringern oder ausschalten. Sicherheitsrelevant."],
  [/wheel speed/i, "Wheel-speed signals feed ABS, ESC, traction control and the speedometer.", "Raddrehzahlsignale speisen ABS, ESP, Traktionskontrolle und den Tacho."],
  [/exhaust gas recirculation|\bEGR\b/i, "Without valid EGR feedback the ECU disables exhaust gas recirculation and may set further EGR codes.", "Ohne gültige AGR-Rückmeldung deaktiviert das Steuergerät die Abgasrückführung und setzt eventuell weitere AGR-Codes."],
  [/exhaust gas temperature|\bEGT\b/i, "The ECU uses this temperature to protect the catalyst and diesel particulate filter.", "Das Steuergerät nutzt diese Temperatur zum Schutz von Katalysator und Dieselpartikelfilter."],
  [/NOx sensor heater/i, "The NOx sensor heater brings the sensor to operating temperature; a fault delays accurate NOx readings used for SCR control.", "Die NOx-Sensorheizung bringt den Sensor auf Betriebstemperatur; ein Fehler verzögert genaue NOx-Messwerte für die SCR-Regelung."],
  [/reductant heater/i, "The reductant (DEF/AdBlue) heater keeps the urea fluid from freezing; a fault can impair SCR dosing in cold conditions.", "Die Reduktionsmittel-Heizung (AdBlue) verhindert das Einfrieren der Harnstofflösung; ein Fehler kann die SCR-Dosierung bei Kälte beeinträchtigen."],
  [/(HO2S|oxygen sensor|O2 sensor).*heater|heater.*(HO2S|oxygen sensor|O2 sensor)/i, "The heater brings the oxygen sensor to operating temperature for closed-loop fuel control.", "Die Heizung bringt die Lambdasonde auf Betriebstemperatur für den Lambda-Regelbetrieb."],
  [/shift solenoid/i, "Shift solenoids route transmission hydraulic pressure to engage the gears; faults cause harsh, delayed, or missed shifts.", "Schaltmagnetventile leiten den Getriebe-Hydraulikdruck zum Einlegen der Gänge; Fehler führen zu harten, verzögerten oder fehlenden Schaltungen."],
  [/pressure control solenoid|line pressure/i, "It regulates transmission line pressure; faults cause slipping, harsh, or delayed shifts.", "Es regelt den Getriebe-Leitungsdruck; Fehler führen zu Schlupf, harten oder verzögerten Schaltungen."],
  [/cooling fan/i, "Reduced cooling-fan control can let the engine or A/C condenser overheat.", "Eingeschränkte Lüftersteuerung kann Motor oder Klimakondensator überhitzen lassen."],
  [/ignition coil/i, "This affects the spark on the cylinder driven by this coil; a misfire results.", "Dies betrifft den Zündfunken am von dieser Spule versorgten Zylinder; ein Zündaussetzer ist die Folge."],
  [/ignition [a-l] control|ignition control signal/i, "This line drives an ignition coil group; a fault causes misfire on those cylinders.", "Diese Leitung steuert eine Zündspulengruppe; ein Fehler verursacht Aussetzer an diesen Zylindern."],
  [/aftertreatment.*injector|exhaust.*fuel injector/i, "This injector doses fuel into the exhaust to raise temperature for diesel particulate-filter regeneration; it does not fuel the engine.", "Dieser Injektor dosiert Kraftstoff in den Abgasstrang, um die Temperatur für die Dieselpartikelfilter-Regeneration anzuheben; er versorgt nicht den Motor."],
  [/reductant inject/i, "This valve doses reductant (DEF/AdBlue) into the exhaust for SCR NOx reduction.", "Dieses Ventil dosiert Reduktionsmittel (AdBlue) in den Abgasstrang zur SCR-NOx-Minderung."],
  [/injector/i, "This affects fueling of the associated cylinders.", "Dies betrifft die Kraftstoffzufuhr der zugehörigen Zylinder."],
  [/glow plug/i, "This affects diesel cold-start preheating.", "Dies betrifft das Vorglühen beim Dieselkaltstart."],
  [/camshaft|crankshaft/i, "This relates to engine timing; a fault can cause rough running, a no-start, or timing errors.", "Dies betrifft die Motorsteuerzeiten; ein Fehler kann unrunden Lauf, Startverweigerung oder Steuerzeitenfehler verursachen."],
  [/grille|air shutter/i, "Active grille shutters manage airflow for engine cooling and aerodynamics.", "Aktive Kühlerklappen steuern den Luftstrom für Motorkühlung und Aerodynamik."],
  [/fuel pressure regulator/i, "This controls fuel-rail pressure.", "Dies regelt den Kraftstoff-Raildruck."],
  [/4wd|awd|clutch/i, "This affects engagement of the all-wheel-drive clutch.", "Dies betrifft das Einrücken der Allrad-Kupplung."],
  [/seat position/i, "The sensor reports seat position for the memory function and SRS occupant logic.", "Der Sensor meldet die Sitzposition für die Memory-Funktion und die SRS-Insassenlogik."],
  [/lock.*switch|lock\/unlock switch/i, "This affects central locking operated from this switch.", "Dies betrifft die von diesem Schalter ausgelöste Zentralverriegelung."],
  [/ride height/i, "Without this signal the suspension control module cannot self-level the vehicle.", "Ohne dieses Signal kann das Fahrwerks-Steuergerät das Fahrzeug nicht nivellieren."],
  [/steering/i, "This affects electric power-steering assist.", "Dies betrifft die elektrische Servolenkungsunterstützung."],
  [/battery monitor/i, "The module reports battery current, voltage and temperature for charge management.", "Das Modul meldet Batteriestrom, -spannung und -temperatur für das Lademanagement."],
  [/drive motor|excitation/i, "This affects electric-drive motor control.", "Dies betrifft die Regelung des Elektroantriebs."],
  [/intake air heater/i, "Used on diesel and some petrol engines for cold-start emissions and starting reliability.", "Wird bei Dieseln und manchen Benzinern für Kaltstart-Emission und Startsicherheit genutzt."],
  [/boost|turbocharger|supercharger|wastegate/i, "This affects turbo/supercharger boost-pressure control.", "Dies betrifft die Ladedruckregelung des Turbo-/Kompressors."],
  [/cruise control/i, "This affects cruise-control operation.", "Dies betrifft die Funktion des Tempomaten."],
  [/sensor power supply|sensor reference/i, "Sensors fed from this rail lose their supply and read invalid.", "Die aus dieser Schiene versorgten Sensoren verlieren ihre Versorgung und liefern ungültige Werte."],
];
function ctxFor(titleEn){
  for (const [re,en,de] of CTX) if (re.test(titleEn)) return [en,de];
  return null;
}

const newDesc = {};
for (const code of targetCodes) {
  const tEn = byCode[code].title.en;
  const tDe = byCode[code].title.de;
  const k = faultKey(tEn);
  const [ceEn, ceDe, tailEn, tailDe] = C[k];
  const ctx = ctxFor(tEn);
  const enTail = ctx ? " " + ctx[0] : (tailEn ? " " + tailEn : "");
  const deTail = ctx ? " " + ctx[1] : (tailDe ? " " + tailDe : "");
  newDesc[code] = {
    en: `${tEn}: ${ceEn}.${enTail}`,
    de: `${tDe}: ${ceDe}.${deTail}`,
  };
}

// ---- Titel-Kollisionen eindeutig machen, pro Sprache getrennt ----
// Codes mit identischem Titel sind SAE-Synonyme; Code-Kennung anhaengen (faktisch korrekt).
// Abgeglichen wird gegen den GESAMTEN Datensatz (auch unveraenderte Codes).
const fullEn={}, fullDe={};
for(const c of codes){
  const e = newDesc[c.code]?.en ?? (c.description?.en||"").trim();
  const d = newDesc[c.code]?.de ?? (c.description?.de||"").trim();
  (fullEn[e]??=[]).push(c.code); (fullDe[d]??=[]).push(c.code);
}
for(const arr of Object.values(fullEn)) if(arr.length>1) for(const c of arr) if(newDesc[c]) newDesc[c].en += ` (Code ${c})`;
for(const arr of Object.values(fullDe)) if(arr.length>1) for(const c of arr) if(newDesc[c]) newDesc[c].de += ` (Code ${c})`;

// ---- Vorschau immer schreiben ----
const preview = targetCodes.map(c=>({code:c, fault:faultKey(byCode[c].title.en), en:newDesc[c].en, de:newDesc[c].de}));
writeFileSync(join(root,"preview_small.json"), JSON.stringify(preview,null,1));

// Validierung
let bad=0;
for (const [code,d] of Object.entries(newDesc)){
  if(!d.en||!d.de||d.en.length<10||d.de.length<10||d.en.length>2000||d.de.length>2000){console.error("Laenge:",code);bad++;}
  if(/undefined/.test(d.en+d.de)){console.error("undefined:",code);bad++;}
}
// Dedup-Selbsttest
const seenEn={}, seenDe={};
for(const [c,d] of Object.entries(newDesc)){(seenEn[d.en]??=[]).push(c);(seenDe[d.de]??=[]).push(c);}
const dEn=Object.values(seenEn).filter(a=>a.length>1).length;
const dDe=Object.values(seenDe).filter(a=>a.length>1).length;
console.log(`Vorbereitet: ${Object.keys(newDesc).length} Codes (Ziel: EN- oder DE-Dubletten)`);
console.log(`Verbleibende EN-Dubletten unter den neuen Texten: ${dEn} | DE: ${dDe}`);
console.log(`Validierungs-Probleme: ${bad}`);
console.log(`Vorschau -> preview_small.json`);

if (!apply){ console.log("\n(Nur Vorschau. Mit --apply patchen.)"); process.exit(0); }
if (bad>0 || dEn>0 || dDe>0){ console.error("Abbruch: erst Probleme beheben."); process.exit(1); }

// ---- YAML chirurgisch patchen ----
const q = s => "'" + s.replace(/'/g,"''") + "'";
const files = ["P0xxx_enriched.yaml","P2xxx_enriched.yaml","P3xxx_enriched.yaml","U0xxx_enriched.yaml","U3xxx_enriched.yaml","B0xxx_enriched.yaml","C0xxx_enriched.yaml"];
let patched=0; const seen=new Set();
for (const fname of files){
  const path=join(dir,fname);
  const lines=readFileSync(path,"utf8").split("\n");
  let cur=null,inDesc=false;
  for(let i=0;i<lines.length;i++){
    const m=lines[i].match(/^- code:\s*(\S+)/);
    if(m){cur=m[1];inDesc=false;continue;}
    if(/^  description:\s*$/.test(lines[i])){inDesc=!!(cur&&newDesc[cur]);continue;}
    if(/^  \S/.test(lines[i])&&!/^  description:/.test(lines[i]))inDesc=false;
    if(inDesc&&cur&&newDesc[cur]){
      if(/^    en:\s/.test(lines[i])) lines[i]="    en: "+q(newDesc[cur].en);
      else if(/^    de:\s/.test(lines[i])){lines[i]="    de: "+q(newDesc[cur].de);seen.add(cur);patched++;}
    }
  }
  writeFileSync(path,lines.join("\n"));
}
const missing=Object.keys(newDesc).filter(c=>!seen.has(c));
console.log(`Gepatcht: ${patched}`);
if(missing.length){console.error("NICHT gepatcht:",missing.join(", "));process.exit(1);}
console.log("Alle Ziel-Codes gepatcht.");
