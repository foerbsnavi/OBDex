// Einmal-Tool: löst die 17 großen Duplikat-Beschreibungs-Gruppen (>=5 Codes, 205 Codes)
// auf, indem jeder Code eine individuelle, modul-/zylinder-/spulen-spezifische
// DE/EN-Beschreibung erhält. Ersetzt chirurgisch nur die description.en/.de-Zeilen
// in den YAML-Quelldateien; alle anderen Felder bleiben unverändert.
import { readFileSync, writeFileSync } from "node:fs";
import { join } from "node:path";
import { fileURLToPath } from "node:url";
import { parse } from "yaml";

const root = fileURLToPath(new URL("../..", import.meta.url));
const dir = join(root, "data/generic");
const files = ["P0xxx_enriched.yaml","P2xxx_enriched.yaml","P3xxx_enriched.yaml",
  "U0xxx_enriched.yaml","U3xxx_enriched.yaml","B0xxx_enriched.yaml","C0xxx_enriched.yaml"];

// ---- Titel aus dem aktuellen dist laden (Quelle für Modul-/Bauteilnamen) ----
const codesArr = JSON.parse(readFileSync(join(root,"dist/generic.json"),"utf8"));
const titleByCode = Object.fromEntries(codesArr.map(c=>[c.code,c.title]));
const tEn = c => titleByCode[c].en;
const tDe = c => titleByCode[c].de;

const newDesc = {}; // code -> {en, de}

// ============ Gruppe 1: U01xx "Lost Communication with X" (70) ============
// Pro Code: modulspezifische Folge (effEn/effDe). Modulname aus dem Titel.
const g1eff = {
 U0100:["As this is the engine controller itself, the engine usually will not start or run while the message is missing.","Da es sich um das Motorsteuergerät selbst handelt, springt der Motor meist nicht an oder läuft nicht, solange die Botschaft fehlt."],
 U0102:["Four-wheel-drive range selection and torque distribution become unavailable.","Die Wahl der Verteilergetriebe-Stufe und die Momentverteilung des Allradantriebs stehen nicht mehr zur Verfügung."],
 U0103:["Shift-by-wire gear selection can fail and leave the transmission in a default position.","Die Shift-by-wire-Gangwahl kann ausfallen; das Getriebe verbleibt in einer Default-Stellung."],
 U0104:["Cruise control and speed-hold functions stop working.","Tempomat und Geschwindigkeitsregelung funktionieren nicht mehr."],
 U0105:["Injection-timing data is lost, which can stall the engine or prevent a start.","Die Daten der Einspritzsteuerung fehlen; der Motor kann ausgehen oder nicht starten."],
 U0106:["Cold-start pre-heating is no longer coordinated, causing hard diesel starts.","Die Vorglühsteuerung wird nicht mehr koordiniert, was zu schweren Kaltstarts beim Diesel führt."],
 U0107:["Electronic throttle control can drop to limp mode with sharply reduced power.","Die elektronische Drosselklappensteuerung kann in den Notlauf mit stark reduzierter Leistung gehen."],
 U0109:["Fuel-delivery control is lost, which can starve the engine of fuel.","Die Kraftstoffförderung wird nicht mehr geregelt; der Motor kann zu wenig Kraftstoff bekommen."],
 U0110:["On a hybrid or EV the electric drive can shut down or limit power.","Bei Hybrid oder Elektrofahrzeug kann der elektrische Antrieb abschalten oder die Leistung begrenzen."],
 U0111:["High-voltage battery-management data is lost; the hybrid/EV system may disable the drive.","Die Daten des Hochvolt-Batteriemanagements fehlen; das Hybrid-/EV-System kann den Antrieb abschalten."],
 U0112:["The second battery-energy controller is silent, limiting high-voltage system availability.","Das zweite Batterie-Energiesteuergerät meldet sich nicht; die Hochvolt-Verfügbarkeit ist eingeschränkt."],
 U0113:["Onboard charging control is lost, so the traction battery may not charge.","Die Ladesteuerung fällt aus; die Traktionsbatterie lädt möglicherweise nicht."],
 U0114:["Electronically controlled four-wheel-drive engagement is unavailable.","Die elektronisch gesteuerte Allrad-Zuschaltung steht nicht zur Verfügung."],
 U0115:["A second engine/powertrain controller is unreachable, which can prevent the engine from running.","Ein zweites Motor-/Antriebssteuergerät ist nicht erreichbar; der Motor läuft möglicherweise nicht."],
 U0116:["Speed-dependent steering assist is lost, changing the steering feel.","Die geschwindigkeitsabhängige Lenkunterstützung fällt aus; das Lenkgefühl ändert sich."],
 U0117:["The second drive-motor controller is silent, limiting electric drive on that axle.","Der zweite Antriebsmotor-Regler meldet sich nicht; der E-Antrieb dieser Achse ist eingeschränkt."],
 U0118:["Automatic air-recirculation control loses its air-quality input.","Die automatische Umluftsteuerung verliert ihr Luftgüte-Signal."],
 U0119:["Steering-column controls and the steering-lock function can fail.","Lenkstockschalter und die Lenkradschloss-Funktion können ausfallen."],
 U0120:["Stop-start and mild-hybrid generator functions stop working.","Start-Stopp- und Mildhybrid-Generatorfunktionen arbeiten nicht mehr."],
 U0122:["Stability control (ESC/ESP) is disabled, leaving the car without electronic stabilisation.","Die Fahrdynamikregelung (ESP) wird abgeschaltet; das Fahrzeug ist ohne elektronische Stabilisierung."],
 U0123:["Stability control loses its yaw input and typically disables ESC.","Die Stabilitätsregelung verliert das Giersignal und schaltet das ESP meist ab."],
 U0124:["Stability and rollover functions lose their lateral-acceleration input.","Stabilitäts- und Überschlagfunktionen verlieren das Querbeschleunigungs-Signal."],
 U0125:["Several stability and airbag functions lose their motion reference.","Mehrere Stabilitäts- und Airbagfunktionen verlieren ihre Bewegungsreferenz."],
 U0126:["Stability control loses the steering-angle reference and usually disables ESC.","Die Fahrdynamikregelung verliert die Lenkwinkel-Referenz und schaltet das ESP meist ab."],
 U0127:["Tire-pressure monitoring stops and warns the driver.","Die Reifendrucküberwachung fällt aus und warnt den Fahrer."],
 U0128:["The electronic parking brake may not release or apply correctly.","Die elektronische Feststellbremse lässt sich eventuell nicht korrekt lösen oder anlegen."],
 U0129:["ABS and electronic brake functions are lost; base braking remains but the assists are off.","ABS und elektronische Bremsfunktionen fallen aus; die Grundbremse bleibt, die Assistenten sind aus."],
 U0130:["The secondary steering-assist controller is unreachable, affecting power steering.","Der zweite Lenkkraft-Regler ist nicht erreichbar; die Servolenkung ist betroffen."],
 U0131:["Electric power steering can fail, requiring much higher steering effort.","Die elektrische Servolenkung kann ausfallen; die Lenkkräfte steigen stark an."],
 U0132:["Air or electronic suspension levelling stops working.","Die Luft- oder elektronische Niveauregulierung arbeitet nicht mehr."],
 U0136:["A second parking-brake actuator is unreachable, affecting the electric brake.","Ein zweiter Feststellbrems-Aktuator ist nicht erreichbar; die elektrische Parkbremse ist betroffen."],
 U0142:["A second body controller is silent; lighting, locks, or comfort functions can fail.","Ein zweites Karosseriesteuergerät meldet sich nicht; Licht, Verriegelung oder Komfort können ausfallen."],
 U0144:["Driver-profile settings (seats, mirrors, presets) are not applied.","Fahrerprofil-Einstellungen (Sitze, Spiegel, Vorwahlen) werden nicht übernommen."],
 U0148:["A third body controller is unreachable; its assigned body functions are affected.","Ein drittes Karosseriesteuergerät ist nicht erreichbar; die zugeordneten Funktionen sind betroffen."],
 U0149:["The driver-door module is silent; its window, lock, and mirror controls fail.","Das Fahrertürmodul meldet sich nicht; Fensterheber, Verriegelung und Spiegel der Tür fallen aus."],
 U0150:["Left-side blind-spot monitoring stops working.","Die Totwinkelüberwachung links fällt aus."],
 U0151:["The airbag/restraints controller is unreachable — airbags and belt tensioners may not deploy. Safety-critical.","Das Airbag-Steuergerät ist nicht erreichbar — Airbags und Gurtstraffer lösen eventuell nicht aus. Sicherheitskritisch."],
 U0152:["Left-side airbags may not deploy in a crash. Safety-critical.","Die Seitenairbags links lösen im Crash eventuell nicht aus. Sicherheitskritisch."],
 U0153:["A second restraints controller is unreachable, affecting airbag readiness. Safety-critical.","Ein zweites Airbag-Steuergerät ist nicht erreichbar; die Airbag-Bereitschaft ist betroffen. Sicherheitskritisch."],
 U0154:["Occupant detection is lost, so airbag suppression and staging may be wrong. Safety-critical.","Die Insassenerkennung fällt aus; die Airbag-Freigabe und -Stufung kann falsch sein. Sicherheitskritisch."],
 U0156:["The driver-information display loses data and may go blank.","Das Fahrer-Informationsdisplay verliert Daten und bleibt eventuell dunkel."],
 U0157:["Stored personalisation settings are not loaded.","Gespeicherte Personalisierungs-Einstellungen werden nicht geladen."],
 U0158:["The head-up display stops showing information.","Das Head-up-Display zeigt keine Informationen mehr an."],
 U0159:["Parking sensors and park-assist functions stop working.","Einparksensoren und Parkassistent funktionieren nicht mehr."],
 U0160:["Chimes and warning buzzers may not sound.","Warntöne und Signalgeber ertönen möglicherweise nicht."],
 U0161:["The compass and heading display loses its data.","Die Kompass- und Richtungsanzeige verliert ihre Daten."],
 U0162:["The navigation screen loses its display feed.","Der Navigationsbildschirm verliert seine Anzeigedaten."],
 U0163:["Navigation and route guidance stop working.","Navigation und Zielführung funktionieren nicht mehr."],
 U0164:["Automatic climate control stops responding.","Die automatische Klimasteuerung reagiert nicht mehr."],
 U0165:["Rear or auxiliary climate control stops working.","Die hintere bzw. Zusatz-Klimasteuerung arbeitet nicht mehr."],
 U0166:["The auxiliary or parking-heater control is lost.","Die Steuerung der Zusatz- bzw. Standheizung fällt aus."],
 U0167:["Immobiliser authorisation can fail, preventing engine start.","Die Wegfahrsperren-Freigabe kann ausfallen und den Motorstart verhindern."],
 U0169:["Powered sunroof operation stops working.","Die elektrische Schiebedachbetätigung funktioniert nicht mehr."],
 U0170:["A front crash sensor is unreachable, affecting airbag timing. Safety-critical.","Ein Front-Crashsensor ist nicht erreichbar; das Airbag-Timing ist betroffen. Sicherheitskritisch."],
 U0171:["A rear crash sensor is unreachable, affecting rear airbag deployment. Safety-critical.","Ein Heck-Crashsensor ist nicht erreichbar; die hintere Airbag-Auslösung ist betroffen. Sicherheitskritisch."],
 U0172:["A second rear crash sensor is unreachable, affecting airbag deployment. Safety-critical.","Ein zweiter Heck-Crashsensor ist nicht erreichbar; die Airbag-Auslösung ist betroffen. Sicherheitskritisch."],
 U0177:["Memory mirror positioning stops working.","Die Spiegel-Memory-Verstellung funktioniert nicht mehr."],
 U0179:["The powered tailgate stops operating automatically.","Die elektrische Heckklappe arbeitet nicht mehr automatisch."],
 U0180:["Automatic exterior lighting (auto headlamps) stops working.","Die automatische Außenbeleuchtung (Lichtautomatik) fällt aus."],
 U0181:["Automatic parking-brake functions stop working.","Die automatischen Feststellbrems-Funktionen fallen aus."],
 U0184:["The radio/head unit drops off the bus and may go silent.","Das Radio bzw. Hauptgerät fällt vom Bus ab und verstummt eventuell."],
 U0186:["The external audio amplifier stops producing sound.","Der externe Audioverstärker gibt keinen Ton mehr aus."],
 U0187:["The CD/DVD player is unreachable.","Der CD-/DVD-Player ist nicht erreichbar."],
 U0188:["Rear-seat audio controls stop working.","Die hintere Audiobedienung funktioniert nicht mehr."],
 U0190:["The subwoofer amplifier drops off the bus.","Der Subwoofer-Verstärker fällt vom Bus ab."],
 U0191:["The TV tuner is unreachable.","Der TV-Tuner ist nicht erreichbar."],
 U0193:["Hands-free phone integration stops working.","Die Freisprech-Telefonanbindung funktioniert nicht mehr."],
 U0195:["Satellite-radio reception is lost.","Der Satellitenradio-Empfang fällt aus."],
 U0196:["Rear-seat entertainment stops working.","Das Fond-Entertainment funktioniert nicht mehr."],
 U0199:["A door control module is silent; its window, lock, and mirror controls fail.","Ein Türsteuergerät meldet sich nicht; Fensterheber, Verriegelung und Spiegel fallen aus."],
};
for (const [code,[effEn,effDe]] of Object.entries(g1eff)) {
  const modEn = tEn(code).replace(/^Lost Communication [Ww]ith /,"");
  const modDe = tDe(code).replace(/^Kommunikation mit /,"").replace(/ verloren$/,"");
  newDesc[code] = {
    en:`The ${modEn} has stopped transmitting on the vehicle data bus, so other control units no longer receive its messages. ${effEn} Typical causes are loss of power or ground at the module, an open or shorted CAN/LIN bus wire, a connector fault, or an internal module failure.`,
    de:`${modDe} — diese Komponente sendet keine Botschaften mehr auf dem Datenbus, sodass andere Steuergeräte die benötigten Informationen nicht mehr erhalten. ${effDe} Typische Ursachen sind fehlende Spannungs- oder Masseversorgung, eine unterbrochene oder kurzgeschlossene CAN-/LIN-Leitung, ein Steckerfehler oder ein interner Defekt der Komponente.`
  };
}

// ============ Gruppe 2: U04xx "Invalid Data Received from X" (19) ============
const g2eff = {
 U0401:["Implausible engine data can force limp mode or stall the engine.","Unplausible Motordaten können den Notlauf erzwingen oder den Motor abstellen."],
 U0403:["Four-wheel-drive control becomes unreliable.","Die Allradsteuerung arbeitet unzuverlässig."],
 U0404:["Shift-by-wire gear selection may be wrong or blocked.","Die Shift-by-wire-Gangwahl kann falsch oder blockiert sein."],
 U0405:["Cruise control is disabled.","Der Tempomat wird deaktiviert."],
 U0414:["All-wheel-drive engagement becomes unreliable.","Die Allrad-Zuschaltung arbeitet unzuverlässig."],
 U0416:["Stability control (ESP) is disabled.","Die Fahrdynamikregelung (ESP) wird abgeschaltet."],
 U0418:["ABS and ESP functions are limited.","ABS- und ESP-Funktionen sind eingeschränkt."],
 U0419:["The redundant brake controller's data is rejected and the brake assists are limited.","Die Daten des redundanten Bremssteuergeräts werden verworfen; die Bremsassistenten sind eingeschränkt."],
 U0420:["Power-steering assist may be reduced or disabled.","Die Servolenkungsunterstützung kann reduziert oder abgeschaltet werden."],
 U0422:["Body functions such as lighting or central locking may misbehave.","Karosseriefunktionen wie Beleuchtung oder Zentralverriegelung können fehlerhaft arbeiten."],
 U0423:["Driver-display content may be wrong or missing.","Die Anzeige im Fahrerdisplay kann falsch sein oder fehlen."],
 U0424:["Automatic climate control behaves erratically.","Die automatische Klimasteuerung verhält sich unregelmäßig."],
 U0426:["Start authorisation may fail.","Die Startfreigabe kann ausbleiben."],
 U0428:["Stability control loses a trustworthy steering-angle value and usually disables ESC.","Die Stabilitätsregelung erhält keinen vertrauenswürdigen Lenkwinkel und schaltet das ESP meist ab."],
 U0429:["Stability control loses a trustworthy steering-angle value.","Die Stabilitätsregelung erhält keinen vertrauenswürdigen Lenkwinkel."],
 U0430:["Tire-pressure readings become unreliable.","Die Reifendruckwerte werden unzuverlässig."],
 U0438:["Electronic parking-brake operation may be limited.","Die Bedienung der elektronischen Feststellbremse kann eingeschränkt sein."],
 U0440:["Electric-drive torque control becomes unreliable.","Die Momentregelung des Elektroantriebs arbeitet unzuverlässig."],
 U0476:["Driver-assist features such as lane keeping or adaptive cruise are disabled.","Fahrerassistenz-Funktionen wie Spurhalter oder Abstandsregeltempomat werden deaktiviert."],
};
for (const [code,[effEn,effDe]] of Object.entries(g2eff)) {
  const modEn = tEn(code).replace(/^Invalid Data Received [Ff]rom /,"");
  const modDe = tDe(code).replace(/^Ungültige Daten vom /,"").replace(/ empfangen$/,"");
  newDesc[code] = {
    en:`The ${modEn} is present on the data bus but the values it reports are implausible — out of range, frozen, or failing the checksum or rolling-count check. The receiving modules reject the data. ${effEn} Causes include a faulty sensor feeding the module, internal computation errors, a software or calibration mismatch after a repair, or bus interference corrupting the frames.`,
    de:`${modDe} — diese Komponente ist zwar am Datenbus aktiv, liefert aber unplausible Werte (außerhalb des Bereichs, eingefroren oder mit fehlerhafter Prüfsumme bzw. Zählung). Die empfangenden Steuergeräte verwerfen die Daten. ${effDe} Ursachen sind ein fehlerhafter Sensor am Modul, interne Rechenfehler, eine falsche Software- oder Kalibrierungsversion nach einer Reparatur oder Störungen auf dem Bus.`
  };
}

// ============ Gruppe 3: P06xx "Internal Control Module ... Performance" (18) ============
const g3subj = {
 P060D:["accelerator pedal position","Gaspedalposition"],
 P060E:["throttle position","Drosselklappenposition"],
 P060F:["engine coolant temperature","Kühlmitteltemperatur"],
 P061A:["engine torque","Motordrehmoment"],
 P061B:["torque calculation","Drehmomentberechnung"],
 P061C:["engine speed (RPM)","Motordrehzahl"],
 P061D:["intake air mass","Luftmasse"],
 P061E:["brake signal","Bremssignal"],
 P061F:["throttle actuator control","Drosselsteller-Regelung"],
 P062B:["fuel injector control","Einspritzsteuerung"],
 P062C:["vehicle speed","Fahrzeuggeschwindigkeit"],
 P064D:["oxygen sensor processing, bank 1","Lambdasonden-Auswertung Bank 1"],
 P064E:["oxygen sensor processing, bank 2","Lambdasonden-Auswertung Bank 2"],
 P06B6:["knock sensor processing, channel 1","Klopfsensor-Auswertung Kanal 1"],
 P06B7:["knock sensor processing, channel 2","Klopfsensor-Auswertung Kanal 2"],
 P06D1:["ignition coil control","Zündspulen-Ansteuerung"],
 P06EA:["NOx sensor processing, bank 1 sensor 1","NOx-Sensor-Auswertung Bank 1 Sensor 1"],
 P23AB:["NOx sensor processing, bank 1 sensor 3","NOx-Sensor-Auswertung Bank 1 Sensor 3"],
};
for (const [code,[sEn,sDe]] of Object.entries(g3subj)) {
  newDesc[code] = {
    en:`An internal self-test in the control module reports a fault in its processing of the "${sEn}" value. The module computes and cross-checks this value redundantly inside its own processor; when the results disagree, the code sets. It points to a hardware or software fault inside the module itself, not to a defect of the external sensor. Causes are an internal processor or memory fault, corrupted control-module software, or low or disturbed module supply voltage.`,
    de:`Ein interner Selbsttest im Steuergerät meldet einen Fehler bei der Verarbeitung der Größe "${sDe}". Das Steuergerät berechnet und prüft diesen Wert intern redundant; bei Abweichung wird der Code gesetzt. Er weist auf einen Hardware- oder Softwarefehler im Steuergerät selbst hin, nicht auf einen Defekt des externen Sensors. Ursachen sind ein interner Prozessor- oder Speicherfehler, eine fehlerhafte Steuergeräte-Software oder eine zu niedrige bzw. gestörte Versorgungsspannung.`
  };
}

// ============ Gruppe 4: P0670 + P0671-P0678 Glühkerzen (9) ============
newDesc.P0670 = {
  en:`The control circuit between the engine controller and the glow plug control module reports a fault. The ECU can no longer reliably command the module that drives the glow plugs, so cold-start pre-heating may not run. On a diesel this causes hard starting, white smoke, and rough running until warm. Causes: open or shorted wiring between ECU and glow plug module, a failed module, or a power/ground fault at the module.`,
  de:`Der Steuerkreis zwischen Motorsteuergerät und Glühkerzenmodul meldet einen Fehler. Die Motorsteuerung kann das Modul, das die Glühkerzen ansteuert, nicht mehr zuverlässig kommandieren; das Vorglühen läuft eventuell nicht. Beim Diesel führt das zu schwerem Start, weißem Rauch und unrundem Lauf bis zur Betriebstemperatur. Ursachen: unterbrochene oder kurzgeschlossene Leitung zwischen Steuergerät und Glühkerzenmodul, ein defektes Modul oder ein Versorgungs-/Massefehler am Modul.`
};
for (let n=1;n<=8;n++){
  const code = "P067"+n; // P0671..P0678
  newDesc[code] = {
    en:`An electrical fault is present in the glow plug circuit for cylinder ${n}. The glow plug control module cannot drive this plug correctly — open circuit, short, or out-of-range resistance — so cylinder ${n} is not pre-heated. On a cold start this causes hard starting, white smoke, and a misfire-like rough run until the engine warms. Causes: a failed glow plug, a broken supply lead to that plug, corrosion at the plug connector, or a faulty module output for cylinder ${n}.`,
    de:`Im Glühkerzen-Schaltkreis von Zylinder ${n} liegt ein elektrischer Fehler vor. Das Glühkerzenmodul kann diese Kerze nicht korrekt ansteuern — Unterbrechung, Kurzschluss oder Widerstand außerhalb des Bereichs — sodass Zylinder ${n} nicht vorgeglüht wird. Beim Kaltstart führt das zu schwerem Start, weißem Rauch und unrundem Lauf bis zur Betriebstemperatur. Ursachen: defekte Glühkerze, unterbrochene Zuleitung zur Kerze, Korrosion am Kerzenstecker oder ein fehlerhafter Modulausgang für Zylinder ${n}.`
  };
}

// ============ Gruppen 5/6/7: Zündspule A-L Primär niedrig/hoch/Sekundär (27) ============
const coilLetter = c => (tEn(c).match(/Ignition Coil "?([A-L])"?/)||[])[1];
const g5 = ["P2300","P2312","P2315","P2318","P2321","P2324","P2327","P2330","P2333"]; // primary low
const g6 = ["P2301","P2313","P2316","P2319","P2322","P2325","P2328","P2331","P2334"]; // primary high
const g7 = ["P2302","P2314","P2317","P2320","P2323","P2326","P2329","P2332","P2335"]; // secondary
for (const c of g5){ const L=coilLetter(c);
  newDesc[c]={
    en:`The primary control circuit of ignition coil ${L} reads a voltage below the expected level — usually a short to ground on the primary driver wire or a low-resistance fault in the coil primary winding. Coil ${L} cannot build a normal charge, so the cylinder it fires misfires, especially under load. Causes: short to ground in the primary wiring, an internal coil primary fault, or a faulty ECU/igniter driver.`,
    de:`Der Primär-Steuerkreis der Zündspule ${L} liegt unter dem erwarteten Spannungswert — meist Masseschluss an der Primär-Steuerleitung oder ein niederohmiger Fehler in der Primärwicklung. Spule ${L} kann keine normale Ladung aufbauen, der zugehörige Zylinder setzt aus, besonders unter Last. Ursachen: Masseschluss in der Primärverkabelung, interner Fehler der Primärwicklung oder eine defekte Endstufe im Steuergerät/Zündmodul.`
  };
}
for (const c of g6){ const L=coilLetter(c);
  newDesc[c]={
    en:`The primary control circuit of ignition coil ${L} reads a voltage above the expected level — typically an open primary circuit or a short to battery voltage on the primary control wire. The ECU sees no normal current flow, coil ${L} does not fire, and the cylinder misfires. Causes: an open or disconnected primary wire, an internal open in the coil, or a faulty ECU driver.`,
    de:`Der Primär-Steuerkreis der Zündspule ${L} liegt über dem erwarteten Spannungswert — typischerweise eine Unterbrechung im Primärkreis oder ein Kurzschluss gegen Batteriespannung an der Primär-Steuerleitung. Das Steuergerät erkennt keinen normalen Stromfluss, Spule ${L} zündet nicht, der Zylinder setzt aus. Ursachen: unterbrochene oder abgesteckte Primärleitung, interne Unterbrechung in der Spule oder eine defekte Endstufe im Steuergerät.`
  };
}
for (const c of g7){ const L=coilLetter(c);
  newDesc[c]={
    en:`A fault is detected on the secondary (high-voltage) side of ignition coil ${L}. The spark delivered to the plug is missing or too weak, causing a misfire on the cylinder served by coil ${L}. Causes: a worn spark plug or wide gap, a cracked coil or boot, carbon tracking, or an open or leaking secondary winding.`,
    de:`Auf der Sekundärseite (Hochspannung) der Zündspule ${L} wird ein Fehler erkannt. Der an die Kerze gelieferte Zündfunke fehlt oder ist zu schwach, der von Spule ${L} versorgte Zylinder setzt aus. Ursachen: verschlissene Zündkerze oder zu großer Elektrodenabstand, gerissene Spule oder gerissener Kerzenschacht, Kriechströme oder eine unterbrochene bzw. durchschlagende Sekundärwicklung.`
  };
}

// ============ Gruppe 8: P072C-P073C "Stuck in Gear N" (7) ============
for (const c of ["P072C","P072D","P072E","P072F","P073A","P073B","P073C"]){
  const n=(tEn(c).match(/Gear (\d)/)||[])[1];
  newDesc[c]={
    en:`The transmission is mechanically stuck in gear ${n} and will not shift out of it. A shift solenoid or hydraulic valve on the gear-${n} circuit has jammed, or a clutch/band has failed to release. Symptoms are no up- or downshifts, harsh behaviour, and often limp mode. Causes: a stuck or failed shift solenoid, a valve-body fault, a hydraulic pressure problem, or internal mechanical damage.`,
    de:`Das Getriebe ist mechanisch in Gang ${n} festgefahren und schaltet nicht mehr heraus. Ein Schaltmagnet oder Hydraulikventil im Gang-${n}-Kreis klemmt, oder eine Kupplung bzw. Bremsband löst nicht. Symptome: keine Hoch- oder Rückschaltungen, hartes Verhalten und oft Notlauf. Ursachen: klemmender oder defekter Schaltmagnet, Fehler im Ventilkörper, Hydraulikdruckproblem oder interner mechanischer Schaden.`
  };
}
// ============ Gruppe 9: P073F-P074F "Unable to Engage Gear N" (7) ============
for (const c of ["P073F","P074A","P074B","P074C","P074D","P074E","P074F"]){
  const n=(tEn(c).match(/Gear (\d)/)||[])[1];
  newDesc[c]={
    en:`The transmission cannot engage gear ${n} when it is commanded. The element that should apply for gear ${n} — shift solenoid, clutch pack, or band — does not build or hold pressure, so the gear never locks in. Symptoms are slipping, no power transfer in that gear, or a forced limp mode. Causes: a failed shift solenoid, a worn clutch pack, or a valve-body or hydraulic-supply fault on the gear-${n} circuit.`,
    de:`Das Getriebe kann Gang ${n} bei Anforderung nicht einlegen. Das für Gang ${n} zuständige Element — Schaltmagnet, Lamellenkupplung oder Bremsband — baut keinen Druck auf oder hält ihn nicht, der Gang rastet nicht ein. Symptome: Durchrutschen, keine Kraftübertragung in diesem Gang oder erzwungener Notlauf. Ursachen: defekter Schaltmagnet, verschlissene Lamellenkupplung oder ein Fehler im Ventilkörper bzw. in der Hydraulikversorgung des Gang-${n}-Kreises.`
  };
}

// ============ Gruppen 10/11/14: Injektorgruppe B-H Versorgung niedrig/hoch/offen (20) ============
const injG = c => (tEn(c).match(/Group ([B-H])/)||[])[1];
for (const c of ["P2150","P2153","P2156","P216B","P216E","P217B","P217E"]){ const G=injG(c);
  newDesc[c]={
    en:`The supply voltage feeding injector group ${G} has dropped below the lower limit. The injectors in this group lose drive voltage and may stop firing, so the cylinders they serve run lean or cut out. Causes: a blown fuse, a failed injector supply relay, a voltage drop in the supply harness, or a poor ground or connector on the group-${G} supply.`,
    de:`Die Versorgungsspannung der Injektorgruppe ${G} ist unter den unteren Grenzwert gefallen. Die Injektoren dieser Gruppe verlieren die Ansteuerspannung und spritzen eventuell nicht mehr ein; die zugehörigen Zylinder laufen mager oder setzen aus. Ursachen: durchgebrannte Sicherung, defektes Injektor-Versorgungsrelais, Spannungsabfall im Versorgungskabelbaum oder schlechte Masse bzw. ein Steckerfehler in der Versorgung der Gruppe ${G}.`
  };
}
for (const c of ["P2151","P2154","P2157","P216C","P216F","P217C","P217F"]){ const G=injG(c);
  newDesc[c]={
    en:`The supply voltage on injector group ${G} is above the upper limit. Overvoltage on the group-${G} supply can mis-time or damage the injectors. Causes: charging-system overvoltage, a stuck supply relay or regulator, or a wiring fault shorting the group-${G} supply to a higher voltage.`,
    de:`Die Versorgungsspannung der Injektorgruppe ${G} liegt über dem oberen Grenzwert. Überspannung auf der Versorgung der Gruppe ${G} kann die Injektoren falsch ansteuern oder beschädigen. Ursachen: Überspannung des Ladesystems, ein hängendes Versorgungsrelais bzw. ein defekter Regler oder ein Verdrahtungsfehler, der die Versorgung der Gruppe ${G} auf eine höhere Spannung kurzschließt.`
  };
}
for (const c of ["P2152","P2155","P216A","P216D","P217A","P217D"]){ const G=injG(c);
  newDesc[c]={
    en:`The supply rail to injector group ${G} is open, so none of the injectors in this group can fire. The affected cylinders produce no power and the engine runs rough or on reduced cylinders. Causes: a broken supply wire, an open relay or fuse, or a disconnected group-${G} supply connector.`,
    de:`Die Versorgungsleitung der Injektorgruppe ${G} ist unterbrochen, sodass keiner der Injektoren dieser Gruppe einspritzen kann. Die betroffenen Zylinder liefern keine Leistung; der Motor läuft unrund oder nur auf den verbleibenden Zylindern. Ursachen: unterbrochene Versorgungsleitung, offenes Relais oder offene Sicherung oder ein abgezogener Versorgungsstecker der Gruppe ${G}.`
  };
}

// ============ Gruppe 12: P06xx Sensor Reference Voltage X Range/Performance (6) ============
const refLetter = c => (tEn(c).match(/Reference Voltage ([A-F])/)||[])[1];
for (const c of ["P06A6","P06A7","P06A8","P06A9","P06D5","P06D9"]){ const X=refLetter(c);
  newDesc[c]={
    en:`The 5-volt sensor reference rail ${X} is electrically connected but its voltage is out of tolerance — drifting, sagging under load, or noisy instead of a stable 5.00 V. Every sensor fed from reference ${X} then reports skewed readings, which can trigger secondary faults. Causes: a partial short or high resistance on the reference-${X} circuit, an overloaded rail caused by a shorted sensor, or an internal regulator fault in the module.`,
    de:`Die 5-Volt-Sensorreferenz ${X} ist elektrisch verbunden, ihre Spannung liegt jedoch außerhalb der Toleranz — sie driftet, bricht unter Last ein oder ist verrauscht statt stabil bei 5,00 V. Jeder aus Referenz ${X} versorgte Sensor liefert dann verschobene Werte, was Folgefehler auslösen kann. Ursachen: ein teilweiser Kurzschluss oder hoher Widerstand im Referenzkreis ${X}, eine durch einen kurzgeschlossenen Sensor überlastete Leitung oder ein interner Reglerfehler im Steuergerät.`
  };
}
// ============ Gruppe 17: P06xx Sensor Reference Voltage X Circuit Open (5) ============
for (const c of ["P0651","P0697","P06A3","P06D2","P06D6"]){ const X=refLetter(c);
  newDesc[c]={
    en:`The 5-volt sensor reference rail ${X} is open — the module supplies no voltage on this circuit. Every sensor powered from reference ${X} loses its supply and reads invalid, so the ECU substitutes default values and may limit engine operation. Causes: a broken reference wire, a disconnected connector, or an internal open in the module's voltage regulator for rail ${X}.`,
    de:`Die 5-Volt-Sensorreferenz ${X} ist unterbrochen — das Steuergerät liefert auf diesem Kreis keine Spannung. Jeder aus Referenz ${X} versorgte Sensor verliert seine Versorgung und meldet ungültige Werte; das Steuergerät setzt Ersatzwerte ein und begrenzt unter Umständen den Motorbetrieb. Ursachen: unterbrochene Referenzleitung, abgezogener Stecker oder eine interne Unterbrechung im Spannungsregler des Steuergeräts für die Referenz ${X}.`
  };
}

// ============ Gruppe 13: P0729-P0735 Gear N Incorrect Ratio (6) ============
for (const c of ["P0729","P0731","P0732","P0733","P0734","P0735"]){
  const n=(tEn(c).match(/Gear (\d)/)||[])[1];
  newDesc[c]={
    en:`When gear ${n} is engaged, the measured ratio between the input- and output-shaft speed sensors does not match the expected ratio for that gear. This means the transmission is slipping in gear ${n} rather than transmitting power solidly. Causes: worn clutch packs or bands, low fluid level or pressure, a stuck shift solenoid, or a valve-body fault affecting gear ${n}.`,
    de:`Bei eingelegtem Gang ${n} stimmt das gemessene Verhältnis zwischen Eingangs- und Ausgangsdrehzahlsensor nicht mit dem Sollwert dieses Gangs überein. Das Getriebe rutscht in Gang ${n} durch, statt die Kraft fest zu übertragen. Ursachen: verschlissene Lamellenkupplungen oder Bremsbänder, zu niedriger Ölstand oder Öldruck, ein klemmender Schaltmagnet oder ein Fehler im Ventilkörper, der Gang ${n} betrifft.`
  };
}

// ============ Gruppe 16: P0351/P0355-P0358 Zündspule X Primär/Sekundär (5) ============
const g16 = {P0351:"A",P0355:"E",P0356:"F",P0357:"G",P0358:"H"};
const g16cyl = {P0351:"1"};
for (const [c,L] of Object.entries(g16)){
  const cyl = g16cyl[c] ? ` (cylinder ${g16cyl[c]})` : "";
  const cylDe = g16cyl[c] ? ` (Zylinder ${g16cyl[c]})` : "";
  newDesc[c]={
    en:`An electrical fault is detected in both the primary and the secondary circuit of ignition coil ${L}${cyl}. The ECU cannot drive the coil correctly, so the cylinder served by coil ${L} misfires or does not fire at all. Causes: an open or shorted primary control wire, an internal coil winding fault, a failed igniter/driver, or wiring or connector damage at the coil.`,
    de:`Im Primär- und im Sekundärkreis der Zündspule ${L}${cylDe} wird ein elektrischer Fehler erkannt. Das Steuergerät kann die Spule nicht korrekt ansteuern, der von Spule ${L} versorgte Zylinder setzt aus oder zündet gar nicht. Ursachen: unterbrochene oder kurzgeschlossene Primär-Steuerleitung, interner Wicklungsfehler, defekte Endstufe/Zündmodul oder beschädigte Verkabelung bzw. Stecker an der Spule.`
  };
}

// ============ Gruppe 15: U0223-U0228 Fensterhebermotor B-G (6) ============
for (const c of ["U0223","U0224","U0225","U0226","U0227","U0228"]){
  const L=(tEn(c).match(/Motor ([A-G])/)||[])[1];
  newDesc[c]={
    en:`The ECU has lost communication with door window motor ${L}, a smart window motor with its own bus interface. One-touch and anti-pinch operation of that window stops, and it may work only manually, if at all. Causes: loss of power or ground at the motor, a broken bus or supply wire in the door harness, a damaged door connector, or a failed motor module.`,
    de:`Die Verbindung zum Fensterhebermotor ${L} — einem intelligenten Motor mit eigener Busanbindung — ist unterbrochen. Komfort- und Einklemmschutz-Funktionen dieses Fensters fallen aus; es lässt sich allenfalls noch manuell betätigen. Ursachen: fehlende Spannungs- oder Masseversorgung am Motor, eine unterbrochene Bus- oder Versorgungsleitung im Türkabelbaum, ein beschädigter Türstecker oder ein defektes Motormodul.`
  };
}

// ---------- Validierung der Abdeckung ----------
const wantCount = 205;
const have = Object.keys(newDesc).length;
console.log(`Vorbereitete Beschreibungen: ${have} (Soll: ${wantCount})`);
if (have !== wantCount) { console.error("FEHLER: Anzahl weicht ab!"); process.exit(1); }
for (const [code,d] of Object.entries(newDesc)) {
  if (!d.en || !d.de || d.en.length<10 || d.de.length<10 || d.en.length>2000 || d.de.length>2000)
    { console.error("FEHLER Länge/leer:", code); process.exit(1); }
  if (/undefined/.test(d.en)||/undefined/.test(d.de))
    { console.error("FEHLER undefined im Text:", code, d.en); process.exit(1); }
}

// ---------- YAML chirurgisch patchen ----------
const q = s => "'" + s.replace(/'/g,"''") + "'";
let patched = 0;
const seen = new Set();
for (const fname of files) {
  const path = join(dir, fname);
  const lines = readFileSync(path,"utf8").split("\n");
  let curCode = null, inDesc = false;
  for (let i=0;i<lines.length;i++){
    const line = lines[i];
    const m = line.match(/^- code:\s*(\S+)/);
    if (m){ curCode = m[1]; inDesc = false; continue; }
    if (/^  description:\s*$/.test(line)) { inDesc = (curCode && newDesc[curCode]); continue; }
    if (/^  \S/.test(line) && !/^  description:/.test(line)) inDesc = false; // anderes Top-Feld
    if (inDesc && curCode && newDesc[curCode]) {
      if (/^    en:\s/.test(line)) { lines[i] = "    en: " + q(newDesc[curCode].en); }
      else if (/^    de:\s/.test(line)) { lines[i] = "    de: " + q(newDesc[curCode].de); seen.add(curCode); patched++; }
    }
  }
  writeFileSync(path, lines.join("\n"));
}
console.log(`Gepatchte Codes (de gesetzt): ${patched}`);
const missing = Object.keys(newDesc).filter(c=>!seen.has(c));
if (missing.length){ console.error("NICHT gepatcht:", missing.join(", ")); process.exit(1); }
console.log("Alle Ziel-Codes erfolgreich gepatcht.");
