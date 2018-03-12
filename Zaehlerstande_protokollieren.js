//jshint maxerr:1000
// https://github.com/hdering/homematic_stromverbrauch_protokollieren

//----------------------------------------------------------------------------//

// Version: 1.1.0

//----------------------------------------------------------------------------//
// +++++++++  USER ANPASSUNGEN ++++++++++++++++++++++++

// debug logging
var logging = true;

// Aktivieren der History Instanz
var enable_history = false;

// history Instanz
var instance_history = 'history.0';

// Geräte können unterschiedliche Preise haben
var enable_unterschiedlichePreise = true;

// Speichern der Werte in zusätzlichen Objekten.
// Wenn 0, dann deaktiviert
var Tag_Anzahl_Werte_in_der_Vergangenheit       = 7;
var Woche_Anzahl_Werte_in_der_Vergangenheit     = 4;
var Monat_Anzahl_Werte_in_der_Vergangenheit     = 12;
var Quartal_Anzahl_Werte_in_der_Vergangenheit   = 4;
var Jahr_Anzahl_Werte_in_der_Vergangenheit      = 2;

var instance    = '0';
var instanz     = 'javascript.' + instance + '.';

// Pfad innerhalb der Instanz
var pfad        = 'Strom.';

// Diese Teile werden aus den Gerätenamen entfernt
var blacklist   = [':1', ':2', ':3', ':4', ':5', ':6', ':7', ':8'];

var AnzahlKommastellenKosten = 2;
var AnzahlKommastellenVerbrauch = 3;
var AnzahlKommastellenZaehlerstand = 3;

var eigeneDatenpunkte = [
    // Beispiel:
    // ['Datenpunkt', 'Aliasname'],
    
    // [ 'hm-rpc.2.NEQ0861663.1.ENERGY_COUNTER', 'Stromzaehler:1.ENERGY_COUNTER' ],
    // [ 'javascript.1.MeinePower', 'MeinSonoff' ],
    // [ 'javascript.1.MeinePower2', 'Sonoff.MeinZweiterSonoff' ],
];

// Pushmeldung
function send_message(text) {
    
    // Hier können die Pushmeldung über alle möglichen Wege verschickt werden.
    
    //console.log(text);
    
    sendTelegramToHermann(text);
}

// ++++ ENDE USER ANPASSUNGEN ++++++++++++++++++++++++
//----------------------------------------------------------------------------//

createState(pfad + 'Preis.aktuell.Arbeitspreis', {
    name: 'Strompreis - aktueller Arbeitspreis (brutto)',
    unit: '€/kWh',
    type: 'number',
    def:  0,
    min:  0
});

createState(pfad + 'Preis.aktuell.Grundpreis',  {                           
    name: 'Strompreis - aktueller Grundpreis (brutto)',
    unit: '€/Monat',
    type: 'number',
    def:  0,
    min: 0
});

//----------------------------------

createState(pfad + 'Preis.neu.Arbeitspreis', {
    name: 'Strompreis - neuer Arbeitspreis ab Datum (brutto)',
    unit: '€/kWh',
    type: 'number',
    def:  0,
    min:  0
});

createState(pfad + 'Preis.neu.Grundpreis',  {                           
    name: 'Strompreis - neuer Grundpreis ab Datum (brutto)',
    unit: '€/Monat',
    type: 'number',
    def:  0,
    min: 0
});

createState(pfad + 'Preis.neu.Datum',  {                           
    name: 'Strompreis und Grundpreis ab folgendem Datum zur Berechnung heranziehen (Beispiel 01.01.2019)',
    type: 'string',
    def: "01.01.1970",
});

createState(pfad + 'Preis.neu.PreisaenderungDurchgefuehrt', false, {
  read: true, 
  write: true, 
  type: "boolean", 
  def: false
});

//----------------------------------------------------------------------------//

var cacheSelectorStateMeter  = $('channel[state.id=*.METER]');
var cacheSelectorStateEnergyCounter  = $('channel[state.id=*.ENERGY_COUNTER$]');

//----------------------------------------------------------------------------//

function parseObjects(id) {
    var obj = getObject(id);

    return entferneDatenpunkt(obj.common.name);
}

function setRecognizedChange(type) {
    cacheSelectorStateMeter.each(function (id, i) {
        var geraetename = parseObjects(id);
        
        setState(pfad + geraetename + '.config.' + type, true);
    });

    cacheSelectorStateEnergyCounter.each(function (id, i) {
        var geraetename = parseObjects(id);

        setState(pfad + geraetename + '.config.' + type, true);
    });    
}

//----------------------------------------------------------------------------//

// Tageswechsel
schedule("0 0 * * *", function() {
    setRecognizedChange('Tag');
});

// Wochenwechsel
schedule("0 0 * * 1", function() {
    setRecognizedChange('Woche');
});

// Monatswechsel
schedule("0 0 1 * *", function() {
    setRecognizedChange('Monat');
});

// Quartalswechsel
schedule("0 0 1 */3 *", function() {
    setRecognizedChange('Quartal');
});

// Jahreswechsel
schedule("0 0 1 1 *", function() {
    setRecognizedChange('Jahr');
});

//----------------------------------------------------------------------------//

// Eigene Datenpunkte
function pruefeEigeneDatenpunkte() {
    
    if (eigeneDatenpunkte.length > 0) {
    
        for(var i = 0; i < eigeneDatenpunkte.length; i++) {
            
            var datenpunkt = eigeneDatenpunkte[i][0];
            var alias = eigeneDatenpunkte[i][1];
            
            if(logging) console.log("Alias:" + alias + " Datenpunkt:" + datenpunkt);

            on(datenpunkt, function(obj) {

                for(var i = 0; i < eigeneDatenpunkte.length; i++) {
                    
                    if(eigeneDatenpunkte[i][0] === obj.id)    
                        run(obj, eigeneDatenpunkte[i][1]);
                }
            });
        }
    }
}

pruefeEigeneDatenpunkte();

//----------------------------------------------------------------------------//

// Einlesen der aktuellen Daten vom Zähler
function run(obj, alias) {
    
    if(getState(instanz + pfad + 'Preis.aktuell.Arbeitspreis').val === 0) {
        
        var message0 = 'Achtung!' + '.\n'
                    + 'Es wurde noch kein Arbeitspreis angegeben.' + '\n' 
                    + 'Ohne Arbeitspreis kann das Skript keine Berechnungen durchführen.' + '\n'
                    + 'Diese Information ist zwingend notwendig!';
        
        log(message0, 'error');
        
    } else {

        if (logging) {   
            log('-------- Strommesser ---------');
            log('RegExp-Funktion ausgelöst');
            log('Gewerk:       ' + obj.role);   // undefined
            log('Beschreibung: ' + obj.desc);   // undefined
            log('id:           ' + obj.id);
            log('Name:         ' + obj.common.name);   // Waschmaschine Küche:2.ENERGY_COUNTER
            log('channel ID:   ' + obj.channelId);     // hm-rpc.0.MEQ0170864.2
            log('channel Name: ' + obj.channelName);   // Waschmaschine Küche:2
            log('device ID:    ' + obj.deviceId);      // hm-rpc.0.MEQ0170864
            log('device name:  ' + obj.deviceName);    // Küche Waschmaschine
            log('neuer Wert:   ' + obj.newState.val);  // 16499.699982
            log('alter Wert:   ' + obj.oldState.val);  // 16499.699982
            log('Einheit:      ' + obj.common.unit);   // Wh
        }

        // Gerätenamen erstellen
        if (logging) log('vor der Aufbereitung: ' + obj.common.name); 
        
        var geraetename = entferneDatenpunkt(obj.common.name);

        if(typeof alias !== "undefined")  {
            if(logging) console.log("Es wird der Aliasname gesetzt:" + alias);
            
            geraetename = alias;
        }
        
        if (logging) log('Nach der Aufbereitung: ' + geraetename); 
        
        if(typeof geraetename !== "undefined") {
            
            //------------------------------------------------------------------------//
            
            // States erstellen (CreateStates für dieses Gerät)
            erstelleStates(geraetename);
            
            //------------------------------------------------------------------------//
            
            // Schreiben der neuen Werte
        
            var idKumuliert =  instanz + pfad + geraetename + '.Zaehlerstand.kumuliert';
            
            var NeustartEventuellErkannt = false;
            var NeustartSicherErkannt = false;
            
            var oldState = obj.oldState.val;
            var newState = obj.newState.val;
            var difference = newState - oldState;
        
            if(difference > 0) {
                
                if(oldState !== 0) {
        
                    // Kumulierten Wert mit Ist-Wert (inkl. Backup) synchronisieren
                    var newValueKumuliert = getState(idKumuliert).val + difference;
                    
                    newValueKumuliert = parseFloat(newValueKumuliert);
        
                    setState(idKumuliert, newValueKumuliert);
                    
                } else {
                    
                    if(newState < getState(pfad + geraetename + '.config.NeustartErkanntAlterWert').val) {
        
                        NeustartSicherErkannt = true;
                    }
                }
                
            } else {
                
                // Fall 2 oder 3
                // Irgendetwas läuft außerplanmäßig. Wert wird sicherheitshalber gespeichert und nächster Lauf abgewartet
                NeustartEventuellErkannt = true;
                
                setState(pfad + geraetename + '.config.NeustartErkanntAlterWert', obj.oldState.val);
            }
            
            if(NeustartEventuellErkannt) {
                
                if(logging) {
                    var message =  geraetename + '\n'
                                    + 'Entweder die CCU oder Stromzähler wurden neugestartet/zurückgesetzt.\n'
                                    + 'Dieser Wert wird einmal ignoriert und auf den nächsten Wert gewartet.';
                
                    send_message(message);
                }
            }
            
            if(NeustartSicherErkannt) {
        
                // zurücksetzen der Variable
                setState(pfad + geraetename + '.config.NeustartErkanntAlterWert', 0);
                
                //----------------------------------------------------------------//
        
                var message2 = geraetename + '\n'
                            + 'Der Stromzähler (' + geraetename + ') ist übergelaufen, gelöscht oder neugestartet worden (ggf. Stromausfall).\n'
                            + 'newState:' + obj.newState.val + '\n' 
                            + 'oldState:' + obj.oldState.val + '\n'
                            + 'differenz:' + differenz + '\n'
                            + 'idKumuliert:' + getState(idKumuliert).val;
        
                send_message(message2);
            }
            
            //--------------------------------------------------------------------//
    
            pruefePreisaenderung();
            
            if(enable_unterschiedlichePreise)
                pruefePreisaenderung(geraetename);
            
            var idStrompreis = instanz + pfad + 'Preis.aktuell.Arbeitspreis';
            
            // aktualisiere den Verbrauch und die Kosten
            _zaehler    = (getState(idKumuliert).val / 1000).toFixed(AnzahlKommastellenKosten);
            _preis      = getState(idStrompreis).val;
            
            // Wenn das Gerät einen eigenen Strompreis hat
            if(enable_unterschiedlichePreise && getObject(instanz + pfad + geraetename + '.eigenerPreis.aktuell.Arbeitspreis')) {
                
                if(getState(instanz + pfad + geraetename + '.eigenerPreis.aktuell.Arbeitspreis').val > 0) {
                    _preis = getState(instanz + pfad + geraetename + '.eigenerPreis.aktuell.Arbeitspreis').val;
                    
                    if (logging) console.log("Das Gerät:" + geraetename + " hat eigenen Strompreis: " + _preis);
                }
            }
    
            berechneVerbrauchUndKosten(geraetename, _zaehler, _preis); // in kWh
           
            //--------------------------------------------------------------------//
            // Zurücksetzen der Werte
    
            if(getState(pfad + geraetename + '.config.Tag').val) {
                
                if (logging) send_message("Tageswechsel wurde erkannt. (" + geraetename + ")");
                
                setState(pfad + geraetename + '.config.Tag', false);
                
                rotateVerbrauchUndKosten(geraetename, 'Tag', Tag_Anzahl_Werte_in_der_Vergangenheit);
               
                resetVerbrauchUndKosten(geraetename, 'Tag');
        
                schreibeZaehlerstand(geraetename, 'Tag');
            }
            
            if(getState(pfad + geraetename + '.config.Woche').val) {
                
                if (logging) send_message("Wochenwechsel wurde erkannt. (" + geraetename + ")");
                
                setState(pfad + geraetename + '.config.Woche', false);
                
                rotateVerbrauchUndKosten(geraetename, 'Woche', Woche_Anzahl_Werte_in_der_Vergangenheit);
               
                resetVerbrauchUndKosten(geraetename, 'Woche');
                
                schreibeZaehlerstand(geraetename, 'Woche');
            }
            
            if(getState(pfad + geraetename + '.config.Monat').val) {
                
                if (logging) send_message("Monatswechsel wurde erkannt. (" + geraetename + ")");
                
                setState(pfad + geraetename + '.config.Monat', false);
                
                rotateVerbrauchUndKosten(geraetename, 'Monat', Monat_Anzahl_Werte_in_der_Vergangenheit);
               
                resetVerbrauchUndKosten(geraetename, 'Monat');
        
                schreibeZaehlerstand(geraetename, 'Monat');
            }
            
            if(getState(pfad + geraetename + '.config.Quartal').val) {
                
                if (logging) send_message("Quartalswechsel wurde erkannt. (" + geraetename + ")");
                
                setState(pfad + geraetename + '.config.Quartal', false);
                
                rotateVerbrauchUndKosten(geraetename, 'Quartal', Quartal_Anzahl_Werte_in_der_Vergangenheit);
                
                resetVerbrauchUndKosten(geraetename, 'Quartal');
        
                schreibeZaehlerstand(geraetename, 'Quartal');
            }
            
            if(getState(pfad + geraetename + '.config.Jahr').val) {
                
                if (logging) send_message("Jahreswechsel wurde erkannt. (" + geraetename + ")");
                
                setState(pfad + geraetename + '.config.Jahr', false);
                
                rotateVerbrauchUndKosten(geraetename, 'Jahr', Jahr_Anzahl_Werte_in_der_Vergangenheit);
               
                resetVerbrauchUndKosten(geraetename, 'Jahr');
        
                schreibeZaehlerstand(geraetename, 'Jahr');
            }
        
            //--------------------------------------------------------------------//
            
            if (logging) log('------------ ENDE ------------');
            
        } else {
            
            var message3 = 'Fehler beim Erstellen des Gerätenamens:\n'
                        + 'obj.common.name: ' + obj.common.name;
            
            send_message(message3);
        }
    }
}

cacheSelectorStateMeter.on(function(obj) {
   run(obj);
});

cacheSelectorStateEnergyCounter.on(function(obj) {
   run(obj);
});

//----------------------------------------------------------------------------//

function entferneDatenpunkt(geraet) {
    
    var rueckgabe = geraet;
    
    // ":2.ENERGY_COUNTER" --> ".ENERGY_COUNTER"
    if (geraet.indexOf(".ENERGY_COUNTER") != -1) {
        
        rueckgabe = geraet.substring(0, geraet.indexOf(".ENERGY_COUNTER"));
        
    } else if (geraet.indexOf(".METER") != -1) {
        
        rueckgabe = geraet.substring(0, geraet.indexOf(".METER"));
    }
    
    if (logging) log('entferneDatenpunkt - rueckgabe1:' + rueckgabe);

    // Rückgabe sollte keine Sonderzeichen oder Leerzeichen enthalten. Wenn doch, werden die entfernt oder ersetzt

    try {
        rueckgabe = checkBlacklist(rueckgabe);
    }
    catch(err) {
        if (logging) log('entferneDatenpunkt - rueckgabe2:' + rueckgabe + ' error:' + err);
    }
    finally {
        if (logging) log('entferneDatenpunkt - rueckgabe2:' + rueckgabe);
    }

    try {
        if (rueckgabe.charAt(rueckgabe.length - 1) == "-") rueckgabe = rueckgabe.substr(0, rueckgabe.length - 1);
        if (rueckgabe.charAt(rueckgabe.length - 1) == "\\") rueckgabe = rueckgabe.substr(0, rueckgabe.length - 1);
        if (rueckgabe.charAt(rueckgabe.length - 1) == ":") rueckgabe = rueckgabe.substr(0, rueckgabe.length - 1);
    }
    catch(err) {
        if (logging) log('entferneDatenpunkt - rueckgabe3:' + rueckgabe + ' error:' + err);
    }
    finally {
        if (logging) log('entferneDatenpunkt - rueckgabe3:' + rueckgabe);
    }
    
    // per Regexp Leerzeichen entfernen
    try {
        rueckgabe = rueckgabe.replace(/\s/g, "");
    }
    catch(err) {
        if (logging) log('entferneDatenpunkt - rueckgabe4:' + rueckgabe + ' error:' + err);
    }
    finally {
        if (logging) log('entferneDatenpunkt - rueckgabe4:' + rueckgabe);
    }

    return rueckgabe;
}

function checkBlacklist(name) {
    
    var _name = "";
    
    if (blacklist.length > 0) {

        for(var i = 0; i < blacklist.length; i++) {
          
            if (name.indexOf(blacklist[i]) != -1) {

                // Zeichenketten, die in der Blacklist stehen, aus dem Namen löschen
                _name = name.substring(0, name.indexOf(blacklist[i]));
            }
        }

        if(_name === "") {
            return name;
        } else {
            return _name;
        }
    
    } else return (name);
}

function schreibeZaehlerstand(geraet, zeitraum) { 
    
    var idKumuliert =    instanz + pfad + geraet + '.Zaehlerstand.kumuliert',
        idZaehlerstand = instanz + pfad + geraet + '.Zaehlerstand.' + zeitraum;
    
    // Zählerstand für übergebene Zeitraum und das Gerät in Wh auslesen und in kWh speichern (also durch 1000)
    setState(idZaehlerstand, parseFloat( (getState(idKumuliert).val / 1000).toFixed(AnzahlKommastellenZaehlerstand)) );  

    if (logging) log('Zählerstände für das Gerät ' + geraet + ' (' + zeitraum + ') in Objekten gespeichert');
}

function rotateVerbrauchUndKosten(geraet, zeitraum, anzahl) {

    // Verbrauch
    if(anzahl > 0) {
        
        for(var i = anzahl; i >= 0; i--) {
            
            var j = i;
            
            j++;
            
            if(getObject(instanz + pfad + geraet + '.Verbrauch._' + zeitraum + '.' + zeitraum + '_' + j)) {
                
                if(i === 0)
                    setState(instanz + pfad + geraet + '.Verbrauch._' + zeitraum + '.' + zeitraum + '_' + j, getState(instanz + pfad + geraet + '.Verbrauch.' + zeitraum).val);
                else
                    setState(instanz + pfad + geraet + '.Verbrauch._' + zeitraum + '.' + zeitraum + '_' + j, getState(instanz + pfad + geraet + '.Verbrauch._' + zeitraum + '.' + zeitraum + '_' + i).val);
            }
        }
    }
    
    // Kosten
    if(anzahl > 0) {
        
        for(var i = anzahl; i >= 0; i--) {
            
            var j = i;
            
            j++;
            
            if(getObject(instanz + pfad + geraet + '.Kosten._' + zeitraum + '.' + zeitraum + '_' + j)) {
                
                if(i === 0)
                    setState(instanz + pfad + geraet + '.Kosten._' + zeitraum + '.' + zeitraum + '_' + j, getState(instanz + pfad + geraet + '.Kosten.' + zeitraum).val);
                else
                    setState(instanz + pfad + geraet + '.Kosten._' + zeitraum + '.' + zeitraum + '_' + j, getState(instanz + pfad + geraet + '.Kosten._' + zeitraum + '.' + zeitraum + '_' + i).val);
            }
        }
    }
}

function resetVerbrauchUndKosten(geraet, zeitraum) {
    
    // Reset der Stromkosten für den übergebenen Zeitraum
    // Reset des Stromverbrauchs für den übergebenen Zeitraum 
    setState(instanz + pfad + geraet + '.Kosten.' + zeitraum, 0);     
    setState(instanz + pfad + geraet + '.Verbrauch.' + zeitraum, 0);
    
    if (logging) log('Stromkosten und Stromverbrauch für das Gerät ' + geraet + ' (' + zeitraum + ') zurückgesetzt');
} 

function berechneVerbrauchUndKosten(geraet, zaehler, preis) {                      
    
    // bei jedem eingehenden Wert pro Gerät
    
    // Tag [Verbrauchskosten = (Zähler_ist - Zähler_Tagesbeginn) * Preis ] --- zaehler muss immer größer sein als Tages, Wochen, etc.-Wert
    setState(instanz + pfad + geraet + '.Verbrauch.Tag',     parseFloat(  (zaehler - getState(instanz + pfad + geraet + '.Zaehlerstand.Tag').val).toFixed(AnzahlKommastellenVerbrauch) ) );           // Verbrauch an diesem Tag in kWh
    setState(instanz + pfad + geraet + '.Kosten.Tag',        parseFloat( ((zaehler - getState(instanz + pfad + geraet + '.Zaehlerstand.Tag').val) * preis).toFixed(AnzahlKommastellenKosten) ) );  // Kosten an diesem Tag in €
    
    // Woche    
    setState(instanz + pfad + geraet + '.Verbrauch.Woche',   parseFloat(  (zaehler - getState(instanz + pfad + geraet + '.Zaehlerstand.Woche').val).toFixed(AnzahlKommastellenVerbrauch) ) );
    setState(instanz + pfad + geraet + '.Kosten.Woche',      parseFloat( ((zaehler - getState(instanz + pfad + geraet + '.Zaehlerstand.Woche').val) * preis).toFixed(AnzahlKommastellenKosten) ) );
    
    // Monat    
    setState(instanz + pfad + geraet + '.Verbrauch.Monat',   parseFloat(  (zaehler - getState(instanz + pfad + geraet + '.Zaehlerstand.Monat').val).toFixed(AnzahlKommastellenVerbrauch) ) );
    setState(instanz + pfad + geraet + '.Kosten.Monat',      parseFloat( ((zaehler - getState(instanz + pfad + geraet + '.Zaehlerstand.Monat').val) * preis).toFixed(AnzahlKommastellenKosten) ) );
    
    // Quartal    
    setState(instanz + pfad + geraet + '.Verbrauch.Quartal', parseFloat(  (zaehler - getState(instanz + pfad + geraet + '.Zaehlerstand.Quartal').val).toFixed(AnzahlKommastellenVerbrauch) ) );
    setState(instanz + pfad + geraet + '.Kosten.Quartal',    parseFloat( ((zaehler - getState(instanz + pfad + geraet + '.Zaehlerstand.Quartal').val) * preis).toFixed(AnzahlKommastellenKosten) ) );
    
    // Jahr    
    setState(instanz + pfad + geraet + '.Verbrauch.Jahr',    parseFloat(  (zaehler - getState(instanz + pfad + geraet + '.Zaehlerstand.Jahr').val).toFixed(AnzahlKommastellenVerbrauch) ) );
    setState(instanz + pfad + geraet + '.Kosten.Jahr',       parseFloat( ((zaehler - getState(instanz + pfad + geraet + '.Zaehlerstand.Jahr').val) * preis).toFixed(AnzahlKommastellenKosten) ) );  
    
    if (logging) log('Stromverbrauch und -kosten (' + geraet + ') aktualisiert');
}

function erstelleStates (geraet) {
    
    // Kumulierter Zählerstand (wird nie kleiner)
    createState(pfad + geraet + '.Zaehlerstand.kumuliert', 0, {name: 'Kumulierter Zählerstand (' + geraet + ')', type: 'number', unit:'Wh'});
            
    // Zählerstand
    createState(pfad + geraet + '.Zaehlerstand.Tag',     0, {name: 'Zählerstand Tagesbeginn ('       + geraet + ')', type: 'number', unit:'kWh'});
    createState(pfad + geraet + '.Zaehlerstand.Woche',   0, {name: 'Zählerstand Wochenbeginn ('      + geraet + ')', type: 'number', unit:'kWh'});
    createState(pfad + geraet + '.Zaehlerstand.Monat',   0, {name: 'Zählerstand Monatsbeginn ('      + geraet + ')', type: 'number', unit:'kWh'});
    createState(pfad + geraet + '.Zaehlerstand.Quartal', 0, {name: 'Zählerstand Quartalsbeginn ('    + geraet + ')', type: 'number', unit:'kWh'});
    createState(pfad + geraet + '.Zaehlerstand.Jahr',    0, {name: 'Zählerstand Jahresbeginn ('      + geraet + ')', type: 'number', unit:'kWh'});
    
    // Verbrauch 
    createState(pfad + geraet + '.Verbrauch.Tag',        0, {name: 'Verbrauch seit Tagesbeginn ('    + geraet + ')', type: 'number', unit:'kWh'});
    createState(pfad + geraet + '.Verbrauch.Woche',      0, {name: 'Verbrauch seit Wochenbeginn ('   + geraet + ')', type: 'number', unit:'kWh'});
    createState(pfad + geraet + '.Verbrauch.Monat',      0, {name: 'Verbrauch seit Monatsbeginn ('   + geraet + ')', type: 'number', unit:'kWh'});
    createState(pfad + geraet + '.Verbrauch.Quartal',    0, {name: 'Verbrauch seit Quartalsbeginn (' + geraet + ')', type: 'number', unit:'kWh'});
    createState(pfad + geraet + '.Verbrauch.Jahr',       0, {name: 'Verbrauch seit Jahresbeginn ('   + geraet + ')', type: 'number', unit:'kWh'});
            
    // Stromkosten
    createState(pfad + geraet + '.Kosten.Tag',           0, {name: 'Stromkosten heute ('             + geraet + ')', type: 'number', unit:'€'  });
    createState(pfad + geraet + '.Kosten.Woche',         0, {name: 'Stromkosten Woche ('             + geraet + ')', type: 'number', unit:'€'  });
    createState(pfad + geraet + '.Kosten.Monat',         0, {name: 'Stromkosten Monat ('             + geraet + ')', type: 'number', unit:'€'  });
    createState(pfad + geraet + '.Kosten.Quartal',       0, {name: 'Stromkosten Quartal ('           + geraet + ')', type: 'number', unit:'€'  });
    createState(pfad + geraet + '.Kosten.Jahr',          0, {name: 'Stromkosten Jahr ('              + geraet + ')', type: 'number', unit:'€'  });
    
    // Speichern der Werte in zusätzlichen Variablen
    if(Tag_Anzahl_Werte_in_der_Vergangenheit > 0) {
        
        for(var i = 1; i <= Tag_Anzahl_Werte_in_der_Vergangenheit; i++) {
            createState(pfad + geraet + '.Verbrauch._Tag.Tag_' + i,             0, {name: 'Verbrauch vor ' + i + ' Tag(en) ('    + geraet + ')', type: 'number', unit:'kWh'});
            createState(pfad + geraet + '.Kosten._Tag.Tag_' + i,                0, {name: 'Stromkosten vor ' + i + ' Tag(en) ('  + geraet + ')', type: 'number', unit:'€'  });
        }
    }
    
    if(Woche_Anzahl_Werte_in_der_Vergangenheit > 0) {
        
        for(var i = 1; i <= Woche_Anzahl_Werte_in_der_Vergangenheit; i++) {
            createState(pfad + geraet + '.Verbrauch._Woche.Woche_' + i,         0, {name: 'Verbrauch vor ' + i + ' Woche(n) ('    + geraet + ')', type: 'number', unit:'kWh'});
            createState(pfad + geraet + '.Kosten._Woche.Woche_' + i,            0, {name: 'Stromkosten vor ' + i + ' Woche(n) ('  + geraet + ')', type: 'number', unit:'€'  });
        }
    }
    
    if(Monat_Anzahl_Werte_in_der_Vergangenheit > 0) {

        for(var i = 1; i <= Monat_Anzahl_Werte_in_der_Vergangenheit; i++) {
            createState(pfad + geraet + '.Verbrauch._Monat.Monat_' + i,         0, {name: 'Verbrauch vor ' + i + ' Monat(en) ('    + geraet + ')', type: 'number', unit:'kWh'});
            createState(pfad + geraet + '.Kosten._Monat.Monat_' + i,            0, {name: 'Stromkosten vor ' + i + ' Monat(en) ('  + geraet + ')', type: 'number', unit:'€'  });
        }
    }
    
    if(Quartal_Anzahl_Werte_in_der_Vergangenheit > 0) {
        
        for(var i = 1; i <= Quartal_Anzahl_Werte_in_der_Vergangenheit; i++) {
            createState(pfad + geraet + '.Verbrauch._Quartal.Quartal_' + i,     0, {name: 'Verbrauch vor ' + i + ' Quartal(en) ('    + geraet + ')', type: 'number', unit:'kWh'});
            createState(pfad + geraet + '.Kosten._Quartal.Quartal_' + i,        0, {name: 'Stromkosten vor ' + i + ' Quartal(en) ('  + geraet + ')', type: 'number', unit:'€'  });
        }
    }
    
    if(Jahr_Anzahl_Werte_in_der_Vergangenheit > 0) {

        for(var i = 1; i <= Jahr_Anzahl_Werte_in_der_Vergangenheit; i++) {
            createState(pfad + geraet + '.Verbrauch._Jahr.Jahr_' + i,           0, {name: 'Verbrauch vor ' + i + ' Jahr(en) ('    + geraet + ')', type: 'number', unit:'kWh'});
            createState(pfad + geraet + '.Kosten._Jahr.Jahr_' + i,              0, {name: 'Stromkosten vor ' + i + ' Jahr(en) ('  + geraet + ')', type: 'number', unit:'€'  });
        }
    }
    
    // Tages-, Wochen-, Monats-, Quartal-, Jahreswechsel erkennen
    createState(pfad + geraet + '.config.Tag',      false, { read: true, write: true, type: "boolean", def: false });
    createState(pfad + geraet + '.config.Woche',    false, { read: true, write: true, type: "boolean", def: false });
    createState(pfad + geraet + '.config.Monat',    false, { read: true, write: true, type: "boolean", def: false });
    createState(pfad + geraet + '.config.Quartal',  false, { read: true, write: true, type: "boolean", def: false });
    createState(pfad + geraet + '.config.Jahr',     false, { read: true, write: true, type: "boolean", def: false });

    // Neustart von CCU oder Gerät erkannt
    createState(pfad + geraet + '.config.NeustartErkanntAlterWert', 0);
    
    // Gerät hat eigenen Strompreis
    if(enable_unterschiedlichePreise) {
        createState(pfad + geraet + '.eigenerPreis.aktuell.Arbeitspreis'            , { name: 'Strompreis - aktueller Arbeitspreis ab Datum (brutto)' ,     unit: '€/kWh',      type: 'number', def: 0 });
        createState(pfad + geraet + '.eigenerPreis.aktuell.Grundpreis'              , { name: 'Strompreis - aktueller Grundpreis ab Datum (brutto)'   ,     unit: '€/Monat',    type: 'number', def: 0 });
        createState(pfad + geraet + '.eigenerPreis.neu.Arbeitspreis'                , { name: 'Strompreis - neuer Arbeitspreis ab Datum (brutto)' ,         unit: '€/kWh',      type: 'number', def: 0 });
        createState(pfad + geraet + '.eigenerPreis.neu.Grundpreis'                  , { name: 'Strompreis - neuer Grundpreis ab Datum (brutto)'   ,         unit: '€/Monat',    type: 'number', def: 0 });
        createState(pfad + geraet + '.eigenerPreis.neu.Datum'                       , { name: 'Strompreis und Grundpreis ab folgendem Datum zur Berechnung heranziehen (Beispiel 01.01.2019)', def: "01.01.1970", type: 'string' });
        
        createState(pfad + geraet + '.eigenerPreis.neu.PreisaenderungDurchgefuehrt' ,     false, { read: true, write: true, type: "boolean", def: false });
    }
    
    // history bei allen Datenpunkten aktivieren
    if(enable_history) {
        enableHistory(geraet, 'Tag');
        enableHistory(geraet, 'Woche');
        enableHistory(geraet, 'Monat');
        enableHistory(geraet, 'Quartal');
        enableHistory(geraet, 'Jahr');
    }

    if (logging) log('States in der Instanz ' + instanz + pfad + ' erstellt');   
}

function enableHistory(geraet, zeitraum) {

    if(instance_history !== '') {
        
        sendTo(instance_history, 'enableHistory', {
            id: instanz + pfad + geraet + '.Kosten.' + zeitraum,
            options: {
                changesOnly:  true,
                debounce:     0,
                retention:    31536000,
                maxLength:    3,
                changesMinDelta: 0.5
            }
        }, function (result) {
            if (result.error) {
                if (logging) log("Fehler beim Aktivieren von History: " + result.error);
            }
        });
        
        sendTo(instance_history, 'enableHistory', {
            id: instanz + pfad + geraet + '.Verbrauch.' + zeitraum,
            options: {
                changesOnly:  true,
                debounce:     0,
                retention:    31536000,
                maxLength:    3,
                changesMinDelta: 0.5
            }
        }, function (result) {
            if (result.error) {
                if (logging) log("Fehler beim Aktivieren von History: " + result.error);
            }
        });
        
        sendTo(instance_history, 'enableHistory', {
            id: instanz + pfad + geraet + '.Zaehlerstand.' + zeitraum,
            options: {
                changesOnly:  true,
                debounce:     0,
                retention:    31536000,
                maxLength:    3,
                changesMinDelta: 0.5
            }
        }, function (result) {
            if (result.error) {
                if (logging) log("Fehler beim Aktivieren von History: " + result.error);
            }
        });
    }
}

function pruefePreisaenderung(geraet) {
    
    var _Datum = "";
    var _PreisaenderungDurchgefuehrt = "";
    var _Arbeitspreis = "";
    var _Grundpreis = "";
    var _ArbeitspreisNeu = "";
    var _GrundpreisNeu = "";
    
    if(typeof geraet === "undefined") {
        
         // Default Arbeitspreis ändern

        _Datum                          = instanz + pfad + '.Preis.neu.Datum';
        _PreisaenderungDurchgefuehrt    = instanz + pfad + '.Preis.neu.PreisaenderungDurchgefuehrt';
        
        _Arbeitspreis       = instanz + pfad + '.Preis.aktuell.Arbeitspreis';
        _Grundpreis         = instanz + pfad + '.Preis.aktuell.Grundpreis';
        _ArbeitspreisNeu    = instanz + pfad + '.Preis.neu.Arbeitspreis';
        _GrundpreisNeu      = instanz + pfad + '.Preis.neu.Grundpreis';
        
    } else {

        // Arbeitspreis für Gerät ändern
        
        _Datum                          = instanz + pfad + geraet + '.eigenerPreis.neu.Datum';
        _PreisaenderungDurchgefuehrt    = instanz + pfad + geraet + '.eigenerPreis.neu.PreisaenderungDurchgefuehrt';
        
        _Arbeitspreis       = instanz + pfad + geraet + '.eigenerPreis.aktuell.Arbeitspreis';
        _Grundpreis         = instanz + pfad + geraet + '.eigenerPreis.aktuell.Grundpreis';
        _ArbeitspreisNeu    = instanz + pfad + geraet + '.eigenerPreis.neu.Arbeitspreis';
        _GrundpreisNeu      = instanz + pfad + geraet + '.eigenerPreis.neu.Grundpreis';
    }

    if(getObject(_Datum)) {
        
        var date = getState(_Datum).val;
        
        var Datum_Tag;
        var Datum_Monat;
        var Datum_Jahr;

        try {
            var Datum = date.match(/\d{2}(\.|-)\d{2}(\.|-)\d{4}/g).toString();
            
            Datum_Tag = Datum.split(".")[0];
            Datum_Monat = Datum.split(".")[1];
            Datum_Jahr = Datum.split(".")[2];
            
        } catch (err) {
            console.log("Fehler beim Auslesen des Datums. Eventuell falsche Syntax? " + date + " (Error:" + err + ")");
        }
        
        newdate = new Date(Datum_Monat + " " + Datum_Tag + " " + Datum_Jahr);

        var today = new Date();
        today.setHours(0,0,0,0);

        if(today.getTime() === newdate.getTime()) {
            
            if(!getState(_PreisaenderungDurchgefuehrt).val) {

                setState(_PreisaenderungDurchgefuehrt, true);
                
                var alterArbeitspreis = getState(_Arbeitspreis).val;
                var alterGrundpreis = getState(_Grundpreis).val;
                
                var neuerArbeitspreis = getState(_ArbeitspreisNeu).val;
                var neuerGrundpreis = getState(_GrundpreisNeu).val;
                
                setState(_Arbeitspreis, neuerArbeitspreis);
                setState(_Grundpreis, neuerGrundpreis);
                
                var message =  'Preisänderung für ' + geraet + ' wurde durchgeführt:' + '\n'
                            + 'alter Arbeitspreis:' + alterArbeitspreis + '.\n'
                            + 'alter Grundpeis:' + alterGrundpreis + '.\n'
                            + 'neuer Arbeitspreis:' + neuerArbeitspreis + '.\n'
                            + 'neuer Grundpreis:' + neuerGrundpreis;
                
                send_message(message);
            }
            
        } else if(today.getTime() > newdate.getTime()) {

            // Variable zurücksetzen
            setState(_PreisaenderungDurchgefuehrt, false);
        }
    }
}

//----------------------------------------------------------------------------//
