//jshint maxerr:1000
// https://github.com/hdering/homematic_stromverbrauch_protokollieren

//----------------------------------------------------------------------------//

// Version: 1.3.3
// https://github.com/hdering/homematic_stromverbrauch_protokollieren

// Version: 1.5.0

//----------------------------------------------------------------------------//
// +++++++++  USER CONFIG ++++++++++++++++++++++++

// debug logging
var logging = true;

// activate hitsory instance
var enableHistory = false;

// history instance
var historyInstance = 'history.0';

// devices can have different prices
var enableDifferentPrices = true;

// include base price
var enableIncludeBasePrice = true;

// enable factor
var enableFactor = true;

// instance
var saveInstance = 'javascript.0';

// instance path
var pathInstance = 'Verbrauchszaehler';
var pathConsumption = 'Verbrauch';
var pathCosts = 'Kosten';
var pathCounter = 'Zaehlerstand';
var pathCumulated = 'kumuliert';

var pathDay = 'Tag';
var pathWeek = 'Woche';
var pathMonth = 'Monat';
var pathQuarter = 'Quartal';
var pathYear = 'Jahr';


var pathPrice = 'Preis';
var pathCustomPrice = 'eigenerPreis';
var pathCurrent = 'aktuell';
var pathNew = 'new';
var pathWorkingPrice = 'Arbeitspreis';
var pathBasePrice = 'Grundpreis';
var pathDate = 'Datum';
var pathChanged = 'Geaendert';
var pathFactor = 'Faktor';

// saving the values in additional objects
// if 0, then disabled
var dayPeriod = 7;
var weekPeriod = 4;
var monthPeriod = 12;
var quarterPeriod = 4;
var yearPeriod = 2;

var currency = '€';
var defaultUnit = 'kWh';

// remove from device name
var blacklist = [':1', ':2', ':3', ':4', ':5', ':6', ':7', ':8'];

//decimal 
var decimalCost = 2;
var decimalConsumption = 3;
var decimalFactor = 3;
var decimalCounterReading = 1;

var customData = [
	[ 'mqtt.0.GASZAEHLER.main.value', 'GASZAEHLER.main.value', 'm3'],
];

var LABEL_COUNTER = 'Zählerstand';
var LABEL_CONSUMPTION = 'Verbrauch';
var LABEL_COST = 'Kosten';
var LABEL_CUMULATED = 'Kumulierter';
var LABEL_SINCE = 'seit';
var LABEL_BEFORE = 'vor';
var LABEL_DAY_BEGIN = 'Tagesbeginn';
var LABEL_WEEK_BEGIN = 'Wochenbeginn';
var LABEL_MONTH_BEGIN = 'Monatsbeginn';
var LABEL_QUARTER_BEGIN = 'Quartalsbeginn';
var LABEL_YEAR_BEGIN = 'Jahresbeginn';
var LABEL_TODAY = 'heute';
var LABEL_DAY = 'Tag';
var LABEL_WEEK = 'Woche';
var LABEL_MONTH = 'Monat';
var LABEL_QUARTER = 'Quartal';
var LABEL_YEAR = 'Jahr';
var LABEL_DAYS = 'Tagen';
var LABEL_WEEKS = 'Wochen';
var LABEL_MONTHS = 'Monaten';
var LABEL_QUARTERS = 'Quartalen';
var LABEL_YEARS = 'Jahren';
var LABEL_PRICE = 'Preis';
var LABEL_CURRENT = 'aktueller';
var LABEL_NEW = 'neuer';
var LABEL_FACTOR = 'Faktor';
var LABEL_WORKING_PRICE = 'Arbeitspreis (brutto)';
var LABEL_BASE_PRICE = 'Grundpreis (brutto)';
var LABEL_START_DATE = 'ab Datum';
var LABEL_CHANGE_PRICE = 'Arbeitspreis und Grundpreis ab folgendem Datum zur Berechnung heranziehen (Beispiel 01.01.2019)';

// Push-Message
function sendMessage(text) {

// send Push-Messages

//console.log(text);

//sendTelegram(text);
}

// ++++ END USER CONFIG ++++++++++++++++++++++++
//----------------------------------------------------------------------------//


createState(pathInstance + '.' + pathPrice + '.' + pathCurrent + '.' + pathWorkingPrice, {
  name: LABEL_PRICE + ' - ' + LABEL_CURRENT + ' ' + LABEL_WORKING_PRICE,
  unit: currency + '/' + defaultUnit,
  type: 'number',
  def:  0,
  min:  0
});

createState(pathInstance + '.' + pathPrice + '.' + pathCurrent + '.' + pathBasePrice,  {
  name: LABEL_PRICE + ' - ' + LABEL_CURRENT + ' ' + LABEL_BASE_PRICE,
  unit: currency + '/' + LABEL_MONTH,
  type: 'number',
  def:  0,
  min: 0
});
		
createState(pathInstance + '.' + pathPrice + '.' + pathCurrent + '.' + pathFactor,  {
  name: LABEL_PRICE + ' - ' + LABEL_CURRENT + ' ' + LABEL_FACTOR,
  type: 'number',
  def:  0,
  min: 0
});

createState(pathInstance + '.' + pathPrice + '.' + pathNew + '.' + pathWorkingPrice, {
  name: LABEL_PRICE + ' - ' + LABEL_NEW + ' ' + LABEL_WORKING_PRICE + ' ' + LABEL_START_DATE,
  unit: currency + '/' + defaultUnit,
  type: 'number',
  def:  0,
  min:  0
});

createState(pathInstance + '.' + pathPrice + '.' + pathNew + '.' + pathBasePrice,  {
  name: LABEL_PRICE + ' - ' + LABEL_NEW + ' ' + LABEL_BASE_PRICE + ' ' + LABEL_START_DATE,
  unit: currency + '/' + LABEL_MONTH,
  type: 'number',
  def:  0,
  min: 0
});

createState(pathInstance + '.' + pathPrice + '.' + pathNew + '.' + pathFactor,  {
  name: LABEL_PRICE + ' - ' + LABEL_NEW + ' ' + LABEL_FACTOR,
  type: 'number',
  def:  0,
  min: 0
});

createState(pathInstance + '.' + pathPrice + '.' + pathNew + '.' + pathDate,  {                           
  name: LABEL_CHANGE_PRICE,
  type: 'string',
  def: "01.01.1970",
});

createState(pathInstance + '.' + pathPrice + '.' + pathNew + '.' + pathChanged, false, {
  read: true, 
  write: true, 
  type: 'boolean', 
  def: false
});

//----------------------------------------------------------------------------//

var cacheSelectorStateMeter  = $('channel[state.id=*.METER]');
var cacheSelectorStateEnergyCounter  = $('channel[state.id=*.ENERGY_COUNTER]');

//----------------------------------------------------------------------------//

//----------------------------------------------------------------------------//

// day change
schedule("0 0 * * *", function() {
	setRecognizedChange(pathDay, dayPeriod);
});

// week change
schedule("0 0 * * 1", function() {
	setRecognizedChange(pathWeek, weekPeriod);
});

// month change
schedule("0 0 1 * *", function() {
	setRecognizedChange(pathMonth, monthPeriod);
});

// quarter change
schedule("0 0 1 */3 *", function() {
	setRecognizedChange(pathQuarter, quarterPeriod);
});

// year change
schedule("0 0 1 1 *", function() {
	setRecognizedChange(pathYear, yearPeriod);
});

//----------------------------------------------------------------------------//


runCustomData();
cacheSelectorStateMeter.on(function(obj) { run(obj); });
cacheSelectorStateEnergyCounter.on(function(obj) { run(obj); });


//----------------------------------------------------------------------------//

function calculateCosts(device, counter, price, basePrice, factor) {

	if(price === 0) {
		var message = 'Attention!' + '.\n'
		    + 'No labor price has been specified yet.' + '\n' 
		    + 'Without a labor price, the script cannot perform any calculations.' + '\n'
		    + 'This information is mandatory!';
		log(message, 'error');
	} else {
	
		var _basePrice = 0;
		
		if(enableIncludeBasePrice) {
			_basePrice = basePrice * 12 / 365;
			_basePrice = parseFloat(_basePrice.toFixed(3));
		}
		
		var _basePriceDay = _basePrice;
		var _basePriceWeek = _basePrice * 7;
		var _basePriceMonth = _basePrice * 30; 
		var _basePriceQuarter = _basePrice * 90;
		var _basePriceYear = _basePrice * 365;
		
		var _pathCosts = saveInstance + '.' + pathInstance + '.' + device + '.' + pathCosts;
		var _pathConsumption = saveInstance + '.' + pathInstance + '.' + device + '.' + pathConsumption;
		var _pathFactor = saveInstance + '.' + pathInstance + '.' + device + '.' + pathFactor;
		var _pathCounter = saveInstance + '.' + pathInstance + '.' + device + '.' + pathCounter;
		
		var _counterDay = counter - getState(_pathCounter + '.' + pathDay).val;
		var _counterWeek = counter - getState(_pathCounter + '.' + pathWeek).val;
		var _counterMonth = counter - getState(_pathCounter + '.' + pathMonth).val;
		var _counterQuarter = counter - getState(_pathCounter + '.' + pathQuarter).val;
		var _counterYear = counter - getState(_pathCounter + '.' + pathYear).val;
		
		if (factor > 0){
			setState(_pathFactor + '.' + pathDay, parseFloat((_counterDay * factor).toFixed(decimalFactor)));
			setState(_pathFactor + '.' + pathWeek, parseFloat((_counterWeek * factor).toFixed(decimalFactor)));
			setState(_pathFactor + '.' + pathMonth, parseFloat((_counterMonth * factor).toFixed(decimalFactor)));
			setState(_pathFactor + '.' + pathQuarter, parseFloat((_counterQuarter * factor).toFixed(decimalFactor)));
			setState(_pathFactor + '.' + pathYear, parseFloat((_counterYear * factor).toFixed(decimalFactor)));
		}
		
		setState(_pathCosts + '.' + pathDay, parseFloat((_counterDay * factor * price + _basePriceDay).toFixed(decimalCost)));
		setState(_pathCosts + '.' + pathWeek, parseFloat((_counterWeek * factor * price + _basePriceWeek).toFixed(decimalCost)));
		setState(_pathCosts + '.' + pathMonth, parseFloat((_counterMonth * factor * price + _basePriceMonth).toFixed(decimalCost)));
		setState(_pathCosts + '.' + pathQuarter, parseFloat((_counterQuarter * factor * price + price + _basePriceQuarter).toFixed(decimalCost)));
		setState(_pathCosts + '.' + pathYear, parseFloat((_counterYear * factor * price + _basePriceYear).toFixed(decimalCost)));
		if (logging) log('costs (' + device + ') updated');
	}
	
	setState(_pathConsumption + '.' + pathDay, parseFloat(_counterDay.toFixed(decimalConsumption)));
	setState(_pathConsumption + '.' + pathWeek, parseFloat(_counterWeek.toFixed(decimalConsumption)));
	setState(_pathConsumption + '.' + pathMonth, parseFloat(_counterMonth.toFixed(decimalConsumption)));
	setState(_pathConsumption + '.' + pathQuarter, parseFloat(_counterQuarter.toFixed(decimalConsumption)));
	setState(_pathConsumption + '.' + pathYear, parseFloat(_counterYear.toFixed(decimalConsumption)));
	
	if (logging) log('consumption (' + device + ') updated');
}

// read current data
function run(obj, alias, unit) {

	if (logging) {   
		log('-------- COUNTER ---------');
		log('RegExp-Function called');
		log('id:           ' + obj.id);
		log('name:         ' + obj.common.name);   // Waschmaschine Küche:2.ENERGY_COUNTER
		log('channel ID:   ' + obj.channelId);     // hm-rpc.0.MEQ0170864.2
		log('channel name: ' + obj.channelName);   // Waschmaschine Küche:2
		log('device ID:    ' + obj.deviceId);      // hm-rpc.0.MEQ0170864
		log('device name:  ' + obj.deviceName);    // Küche Waschmaschine
		log('new value:    ' + obj.newState.val);  // 16499.699982
		log('old value:    ' + obj.oldState.val);  // 16499.699982
		
		log('before preparation: ' + obj.common.name); 
	}
	
	var _deviceName = removeDatapoint(obj.common.name);
	
	if(typeof alias !== "undefined")  {
		if(logging) console.log("the alias name is set:" + alias);
		_deviceName = alias;
	}
	
	if (logging) log('after preparation: ' + _deviceName); 
	
	if(typeof _deviceName !== "undefined") {
	
		var _unit = defaultUnit;
		
		if(typeof unit !== "undefined")  {
			_unit = unit;
		}
		
		// create states
		createStates(_deviceName, _unit);
		
		setTimeout(function() {
		// write new values
			var _pathCumulated = saveInstance + '.' + pathInstance + '.' + _deviceName + '.' + pathCounter + '.' + pathCumulated;
			
			var recognizedRebootPossible = false;
			var recognizedReboot = false;
			
			var oldState = obj.oldState.val;
			var newState = obj.newState.val;
			var difference = newState - oldState;
		
			if(difference > 0) {
				if(oldState !== 0) {
					// synchronize accumulated value with actual value (incl. backup)
					var newValue = getState(_pathCumulated).val + difference;
					newValue = parseFloat(newValue.toFixed(decimalCounterReading));
					setState(_pathCumulated, newValue);
				
				} else {
					if(newState < getState(saveInstance + '.' + pathInstance + '.' + _deviceName + '.config.rebootRecognized').val) {
						recognizedReboot = true;
					}
				}
				
			} else {
				// something is running out of schedule. value is saved to be on the safe side and the next run is awaited.
				recognizedRebootPossible = true;
				setState(saveInstance + '.' + pathInstance + '.' + _deviceName + '.config.rebootRecognized', obj.oldState.val);
			}
		
			if(recognizedRebootPossible) {
				if(logging) {
					var message = _deviceName + '\n'
					+ 'Either the CCU or meter has been restarted/reset.\n'
					+ 'This value is ignored once and waited for the next value.';
					sendMessage(message);
				}
			}
		
			if(recognizedReboot) {
				setState(saveInstance + '.' +pathInstance + '.' + _deviceName + '.config.rebootRecognized', 0);
				var message = _deviceName + '\n'
				+ 'the counter (' + _deviceName + ') has overflowed, been deleted or restarted (possibly power failure).\n'
				+ 'newState:' + obj.newState.val + '\n' 
				+ 'oldState:' + obj.oldState.val + '\n'
				+ 'difference:' + difference + '\n'
				+ 'idCumulated:' + getState(_pathCumulated).val;
				sendMessage(message);
			}
			
			checkPriceChange();
			if(enableDifferentPrices) checkPriceChange(_deviceName);
			
			var _pathWorkingPrice = pathInstance + '.' + pathPrice + '.' + pathCurrent + '.' + pathWorkingPrice;
			var _pathBasePrice = pathInstance + '.' + pathPrice + '.' + pathCurrent + '.' + pathBasePrice;
			var _pathFactor = pathInstance + '.' + pathPrice + '.' + pathCurrent + '.' + pathFactor;
			
			var _counter = (getState(_pathCumulated).val).toFixed(decimalCounterReading);
			var _workingPrice = getState(_pathWorkingPrice).val;
			var _basePrice= getState(_pathBasePrice).val;
			var _factor= getState(_pathFactor).val;
			
			if(enableDifferentPrices) {
				if(getState(pathInstance + '.' + _deviceName + '.' + pathCustomPrice + '.' + pathCurrent + '.' + pathWorkingPrice).val > 0) {
					_workingPrice = getState(pathInstance + '.' + _deviceName + '.' + pathCustomPrice + '.' + pathCurrent + '.' + pathWorkingPrice).val;
					
					if (logging) console.log("the device:" + _deviceName + " has an custom working price: " + _basePrice);
				}
				
				if(getState(pathInstance + '.' + _deviceName + '.' + pathCustomPrice + '.' + pathCurrent + '.' + pathBasePrice).val > 0) {
					_basePrice = getState(pathInstance + '.' + _deviceName + '.' + pathCustomPrice + '.' + pathCurrent + '.' + pathBasePrice).val;
					
					if (logging) console.log("the device:" + _deviceName + " has an custom base price: " + _basePrice);
				}
				
				if(getState(pathInstance + '.' + _deviceName + '.' + pathCustomPrice + '.' + pathCurrent + '.' + pathFactor).val > 0) {
					_factor = getState(pathInstance + '.' + _deviceName + '.' + pathCustomPrice + '.' + pathCurrent + '.' + pathFactor).val;
					
					if (logging) console.log("the device:" + _deviceName + " has an custom factor: " + _factor);
				}
			}
			
			calculateCosts(_deviceName, _counter, _workingPrice, _basePrice, _factor); // in kWh
			
			if (logging) log('------------ END ------------');
		}, 200);
		
	} else {
		var message = 'error when creating the device name:\n'
		+ 'obj.common.name: ' + obj.common.name;
		
		sendMessage(message);
	}
}

//----------------------------------------------------------------------------//

function createStates(device, dUnit) {
	var _pathCounter = pathInstance + '.' + device + '.' + pathCounter;
	var _pathConsumption = pathInstance + '.' + device + '.' + pathConsumption;
	var _pathCosts = pathInstance + '.' + device + '.' + pathCosts;
	var _pathFactor = pathInstance + '.' + device + '.' + pathFactor;

	createState(_pathCounter + '.' + pathCumulated, 0, {name: LABEL_CUMULATED + ' ' + LABEL_COUNTER + ' (' + device + ')', type: 'number', unit: dUnit });
	
	createState(_pathCounter + '.' + pathDay, 0, {name: LABEL_COUNTER + ' ' + LABEL_DAY_BEGIN + ' (' + device + ')', type: 'number', unit: dUnit });
	createState(_pathCounter + '.' + pathWeek, 0, {name: LABEL_COUNTER + ' ' + LABEL_WEEK_BEGIN + ' (' + device + ')', type: 'number', unit: dUnit });
	createState(_pathCounter + '.' + pathMonth, 0, {name: LABEL_COUNTER + ' ' + LABEL_MONTH_BEGIN + ' (' + device + ')', type: 'number', unit: dUnit });
	createState(_pathCounter + '.' + pathQuarter, 0, {name: LABEL_COUNTER + ' ' + LABEL_QUARTER_BEGIN + ' (' + device + ')', type: 'number', unit: dUnit });
	createState(_pathCounter + '.' + pathYear, 0, {name: LABEL_COUNTER + ' ' + LABEL_YEAR_BEGIN + ' (' + device + ')', type: 'number', unit: dUnit });
	
	createState(_pathConsumption + '.' + pathDay, 0, {name: LABEL_CONSUMPTION + ' ' + LABEL_SINCE + ' ' + LABEL_DAY_BEGIN + ' (' + device + ')', type: 'number', unit: dUnit });
	createState(_pathConsumption + '.' + pathWeek, 0, {name: LABEL_CONSUMPTION + ' ' + LABEL_SINCE + ' ' + LABEL_WEEK_BEGIN + ' (' + device + ')', type: 'number', unit: dUnit });
	createState(_pathConsumption + '.' + pathMonth, 0, {name: LABEL_CONSUMPTION + ' ' + LABEL_SINCE + ' ' + LABEL_MONTH_BEGIN + ' (' + device + ')', type: 'number', unit: dUnit });
	createState(_pathConsumption + '.' + pathQuarter, 0, {name: LABEL_CONSUMPTION + ' ' + LABEL_SINCE + ' ' + LABEL_QUARTER_BEGIN + ' (' + device + ')', type: 'number', unit: dUnit });
	createState(_pathConsumption + '.' + pathYear, 0, {name: LABEL_CONSUMPTION + ' ' + LABEL_SINCE + ' ' + LABEL_YEAR_BEGIN + ' (' + device + ')', type: 'number', unit: dUnit });
	
	createState(_pathCosts + '.' + pathDay, 0, {name: LABEL_COST + ' ' + LABEL_TODAY + ' (' + device + ')', type: 'number', unit: currency });
	createState(_pathCosts + '.' + pathWeek, 0, {name: LABEL_COST + ' ' + LABEL_WEEK + ' (' + device + ')', type: 'number', unit: currency });
	createState(_pathCosts + '.' + pathMonth, 0, {name: LABEL_COST + ' ' + LABEL_MONTH + ' (' + device + ')', type: 'number', unit: currency });
	createState(_pathCosts + '.' + pathQuarter, 0, {name: LABEL_COST + ' ' + LABEL_QUARTER + ' (' + device + ')', type: 'number', unit: currency });
	createState(_pathCosts + '.' + pathYear, 0, {name: LABEL_COST + ' ' + LABEL_YEAR + ' (' + device + ')', type: 'number', unit: currency });
	
	if (enableFactor){
		createState(_pathFactor + '.' + pathDay, 0, {name: LABEL_FACTOR + ' ' + LABEL_SINCE + ' ' + LABEL_DAY_BEGIN + ' (' + device + ')', type: 'number', unit: defaultUnit });
		createState(_pathFactor + '.' + pathWeek, 0, {name: LABEL_FACTOR + ' ' + LABEL_SINCE + ' ' + LABEL_WEEK_BEGIN + ' (' + device + ')', type: 'number', unit: defaultUnit });
		createState(_pathFactor + '.' + pathMonth, 0, {name: LABEL_FACTOR + ' ' + LABEL_SINCE + ' ' + LABEL_MONTH_BEGIN + ' (' + device + ')', type: 'number', unit: defaultUnit });
		createState(_pathFactor + '.' + pathQuarter, 0, {name: LABEL_FACTOR + ' ' + LABEL_SINCE + ' ' + LABEL_QUARTER_BEGIN + ' (' + device + ')', type: 'number', unit: defaultUnit });
		createState(_pathFactor + '.' + pathYear, 0, {name: LABEL_FACTOR + ' ' + LABEL_SINCE + ' ' + LABEL_YEAR_BEGIN + ' (' + device + ')', type: 'number', unit: defaultUnit });
	}
    
	// saving the values in additional variables
	if(dayPeriod > 0) {
		for(var i = 1; i <= dayPeriod; i++) {
			if (i == 1) {
				createState(_pathConsumption + '._' + pathDay + '.' + pathDay + '_' + i, 0, {name: LABEL_CONSUMPTION + ' ' + LABEL_BEFORE + ' ' + i + ' ' + LABEL_DAY + ' (' + device + ')', type: 'number', unit: dUnit });
				createState(_pathCosts + '._' + pathDay + '.' + pathDay + '_' + i, 0, {name: LABEL_COST + ' ' + LABEL_BEFORE + ' ' + i + ' ' + LABEL_DAY + ' (' + device + ')', type: 'number', unit: currency });
				if (enableFactor) createState(_pathFactor + '._' + pathDay + '.' + pathDay + '_' + i, 0, {name: LABEL_FACTOR + ' ' + LABEL_BEFORE + ' ' + i + ' ' + LABEL_DAY + ' (' + device + ')', type: 'number', unit: defaultUnit });
			} else {
				createState(_pathConsumption + '._' + pathDay + '.' + pathDay + '_' + i, 0, {name: LABEL_CONSUMPTION + ' ' + LABEL_BEFORE + ' ' + i + ' ' + LABEL_DAYS + ' (' + device + ')', type: 'number', unit: dUnit });
				createState(_pathCosts + '._' + pathDay + '.' + pathDay + '_' + i, 0, {name: LABEL_COST + ' ' + LABEL_BEFORE + ' ' + i + ' ' + LABEL_DAYS + ' (' + device + ')', type: 'number', unit: currency });
				if (enableFactor) createState(_pathFactor + '._' + pathDay + '.' + pathDay + '_' + i, 0, {name: LABEL_FACTOR + ' ' + LABEL_BEFORE + ' ' + i + ' ' + LABEL_DAYS + ' (' + device + ')', type: 'number', unit: defaultUnit });
			}
		}
	}
	
	if(weekPeriod > 0) {
		for(var i = 1; i <= weekPeriod; i++) {
			if (i == 1) {
				createState(_pathConsumption + '._' + pathWeek + '.' + pathWeek + '_' + i, 0, {name: LABEL_CONSUMPTION + ' ' + LABEL_BEFORE + ' ' + i + ' ' + LABEL_WEEK + ' (' + device + ')', type: 'number', unit: dUnit });
				createState(_pathCosts + '._' + pathWeek + '.' + pathWeek + '_' + i, 0, {name: LABEL_COST + ' ' + LABEL_BEFORE + ' ' + i + ' ' + LABEL_WEEK + ' (' + device + ')', type: 'number', unit: currency });
				if (enableFactor) createState(_pathFactor + '._' + pathWeek + '.' + pathWeek + '_' + i, 0, {name: LABEL_FACTOR + ' ' + LABEL_BEFORE + ' ' + i + ' ' + LABEL_WEEK + ' (' + device + ')', type: 'number', unit: defaultUnit });
			} else {
				createState(_pathConsumption + '._' + pathWeek + '.' + pathWeek + '_' + i, 0, {name: LABEL_CONSUMPTION + ' ' + LABEL_BEFORE + ' ' + i + ' ' + LABEL_WEEKS + ' (' + device + ')', type: 'number', unit: dUnit });
				createState(_pathCosts + '._' + pathWeek + '.' + pathWeek + '_' + i, 0, {name: LABEL_COST + ' ' + LABEL_BEFORE + ' ' + i + ' ' + LABEL_WEEKS + ' (' + device + ')', type: 'number', unit: currency });
				if (enableFactor) createState(_pathFactor + '._' + pathWeek + '.' + pathWeek + '_' + i, 0, {name: LABEL_FACTOR + ' ' + LABEL_BEFORE + ' ' + i + ' ' + LABEL_WEEKS + ' (' + device + ')', type: 'number', unit: defaultUnit });
			}
		}
	}
	
	if(monthPeriod > 0) {
		for(var i = 1; i <= monthPeriod; i++) {
			if (i == 1) {
				createState(_pathConsumption + '._' + pathMonth + '.' + pathMonth + '_' + i, 0, {name: LABEL_CONSUMPTION + ' ' + LABEL_BEFORE + ' ' + i + ' ' + LABEL_MONTH + ' (' + device + ')', type: 'number', unit: dUnit });
				createState(_pathCosts + '._' + pathMonth + '.' + pathMonth + '_' + i, 0, {name: LABEL_COST + ' ' + LABEL_BEFORE + ' ' + i + ' ' + LABEL_MONTH + ' (' + device + ')', type: 'number', unit: currency });
				if (enableFactor) createState(_pathFactor + '._' + pathMonth + '.' + pathMonth + '_' + i, 0, {name: LABEL_FACTOR + ' ' + LABEL_BEFORE + ' ' + i + ' ' + LABEL_MONTH + ' (' + device + ')', type: 'number', unit: defaultUnit });
			} else {
				createState(_pathConsumption + '._' + pathMonth + '.' + pathMonth + '_' + i, 0, {name: LABEL_CONSUMPTION + ' ' + LABEL_BEFORE + ' ' + i + ' ' + LABEL_MONTHS + ' (' + device + ')', type: 'number', unit: dUnit });
				createState(_pathCosts + '._' + pathMonth + '.' + pathMonth + '_' + i, 0, {name: LABEL_COST + ' ' + LABEL_BEFORE + ' ' + i + ' ' + LABEL_MONTHS + ' (' + device + ')', type: 'number', unit: currency });
				if (enableFactor) createState(_pathFactor + '._' + pathMonth + '.' + pathMonth + '_' + i, 0, {name: LABEL_FACTOR + ' ' + LABEL_BEFORE + ' ' + i + ' ' + LABEL_MONTHS + ' (' + device + ')', type: 'number', unit: defaultUnit });
			}
		}
	}
	
	if(quarterPeriod > 0) {
		for(var i = 1; i <= quarterPeriod; i++) {
			if (i == 1) {
				createState(_pathConsumption + '._' + pathQuarter + '.' + pathQuarter + '_' + i, 0, {name: LABEL_CONSUMPTION + ' ' + LABEL_BEFORE + ' ' + i + ' ' + LABEL_QUARTER + ' (' + device + ')', type: 'number', unit: dUnit });
				createState(_pathCosts + '._' + pathQuarter + '.' + pathQuarter + '_' + i, 0, {name: LABEL_COST + ' ' + LABEL_BEFORE + ' ' + i + ' ' + LABEL_QUARTER + ' (' + device + ')', type: 'number', unit: currency });
				if (enableFactor) createState(_pathFactor + '._' + pathQuarter + '.' + pathQuarter + '_' + i, 0, {name: LABEL_FACTOR + ' ' + LABEL_BEFORE + ' ' + i + ' ' + LABEL_QUARTER + ' (' + device + ')', type: 'number', unit: defaultUnit });
			} else {
				createState(_pathConsumption + '._' + pathQuarter + '.' + pathQuarter + '_' + i, 0, {name: LABEL_CONSUMPTION + ' ' + LABEL_BEFORE + ' ' + i + ' ' + LABEL_QUARTERS + ' (' + device + ')', type: 'number', unit: dUnit });
				createState(_pathCosts + '._' + pathQuarter + '.' + pathQuarter + '_' + i, 0, {name: LABEL_COST + ' ' + LABEL_BEFORE + ' ' + i + ' ' + LABEL_QUARTERS + ' (' + device + ')', type: 'number', unit: currency });
				if (enableFactor) createState(_pathFactor + '._' + pathQuarter + '.' + pathQuarter + '_' + i, 0, {name: LABEL_FACTOR + ' ' + LABEL_BEFORE + ' ' + i + ' ' + LABEL_QUARTERS + ' (' + device + ')', type: 'number', unit: defaultUnit });
			}
		}
	}
	
	if(yearPeriod > 0) {
		for(var i = 1; i <= yearPeriod; i++) {
			if (i == 1) {
				createState(_pathConsumption + '._' + pathYear + '.' + pathYear + '_' + i, 0, {name: LABEL_CONSUMPTION + ' ' + LABEL_BEFORE + ' ' + i + ' ' + LABEL_YEAR + ' (' + device + ')', type: 'number', unit: dUnit });
				createState(_pathCosts + '._' + pathYear + '.' + pathYear + '_' + i, 0, {name: LABEL_COST + ' ' + LABEL_BEFORE + ' ' + i + ' ' + LABEL_YEAR + ' (' + device + ')', type: 'number', unit: currency });
				if (enableFactor) createState(_pathFactor + '._' + pathYear + '.' + pathYear + '_' + i, 0, {name: LABEL_FACTOR + ' ' + LABEL_BEFORE + ' ' + i + ' ' + LABEL_YEAR + ' (' + device + ')', type: 'number', unit: defaultUnit });
			} else {
				createState(_pathConsumption + '._' + pathYear + '.' + pathYear + '_' + i, 0, {name: LABEL_CONSUMPTION + ' ' + LABEL_BEFORE + ' ' + i + ' ' + LABEL_YEARS + ' (' + device + ')', type: 'number', unit: dUnit });
				createState(_pathCosts + '._' + pathYear + '.' + pathYear + '_' + i, 0, {name: LABEL_COST + ' ' + LABEL_BEFORE + ' ' + i + ' ' + LABEL_YEARS + ' (' + device + ')', type: 'number', unit: currency });
				if (enableFactor) createState(_pathFactor + '._' + pathYear + '.' + pathYear + '_' + i, 0, {name: LABEL_FACTOR + ' ' + LABEL_BEFORE + ' ' + i + ' ' + LABEL_YEARS + ' (' + device + ')', type: 'number', unit: defaultUnit });
			}
		}
	}

  // restart of CCU or device detected
	createState(pathInstance + '.' + device + '.config.rebootRecognized', 0, {name: 'reboot', type: 'number'});
    
  // device has different price
  if(enableDifferentPrices) {
    createState(pathInstance + '.' + device + '.' + pathCustomPrice + '.' + pathCurrent + '.' + pathWorkingPrice, { 
			name: LABEL_PRICE + ' - ' + LABEL_CURRENT + ' ' + LABEL_WORKING_PRICE,
		  unit: currency + '/' + dUnit,
		  type: 'number',
		  def:  0,
		  min:  0
		});

		createState(pathInstance + '.' + device + '.' + pathCustomPrice + '.' + pathCurrent + '.' + pathBasePrice,  {
		  name: LABEL_PRICE + ' - ' + LABEL_CURRENT + ' ' + LABEL_BASE_PRICE,
		  unit: currency + '/' + LABEL_MONTH,
		  type: 'number',
		  def:  0,
		  min: 0
		});
		
		createState(pathInstance + '.' + device + '.' + pathCustomPrice + '.' + pathCurrent + '.' + pathFactor,  {
		  name: LABEL_PRICE + ' - ' + LABEL_CURRENT + ' ' + LABEL_FACTOR,
		  type: 'number',
		  def:  0,
		  min: 0
		});

		createState(pathInstance + '.' + device + '.' + pathCustomPrice + '.' + pathNew + '.' + pathWorkingPrice, {
		  name: LABEL_PRICE + ' - ' + LABEL_NEW + ' ' + LABEL_WORKING_PRICE + ' ' + LABEL_START_DATE,
		  unit: currency + '/' + dUnit,
		  type: 'number',
		  def:  0,
		  min:  0
		});
		
		createState(pathInstance + '.' + device + '.' + pathCustomPrice + '.' + pathNew + '.' + pathBasePrice,  {
		  name: LABEL_PRICE + ' - ' + LABEL_NEW + ' ' + LABEL_BASE_PRICE + ' ' + LABEL_START_DATE,
		  unit: currency + '/' + LABEL_MONTH,
		  type: 'number',
		  def:  0,
		  min: 0
		});
		
		createState(pathInstance + '.' + device + '.' + pathCustomPrice + '.' + pathNew + '.' + pathFactor,  {
		  name: LABEL_PRICE + ' - ' + LABEL_NEW + ' ' + LABEL_FACTOR,
		  type: 'number',
		  def:  0,
		  min: 0
		});

		createState(pathInstance + '.' + device + '.' + pathCustomPrice + '.' + pathNew + '.' + pathDate,  {                           
		  name: LABEL_CHANGE_PRICE,
		  type: 'string',
		  def: "01.01.1970",
		});
		
		createState(pathInstance + '.' + device + '.' + pathCustomPrice + '.' + pathNew + '.' + pathChanged, false, {
		  read: true, 
		  write: true, 
		  type: 'boolean', 
		  def: false
		});
  }
    
  // enable history on all datapoints
  if(enableHistory) {
  	setHistory(device, pathDay);
  	setHistory(device, pathWeek);
  	setHistory(device, pathMonth);
  	setHistory(device, pathQuarter);
  	setHistory(device, pathYear);
  }
  
  if (logging) log('states created in instance: ' + saveInstance + '.' + pathInstance);   
}


function checkPriceChange(device) {
    
	var _pathWorkingPrice = saveInstance + '.' + pathInstance + '.' + pathPrice + '.' + pathCurrent + '.' + pathWorkingPrice;
	var _pathBasePrice = saveInstance + '.' + pathInstance + '.' + pathPrice + '.' + pathCurrent + '.' + pathBasePrice;
	var _pathFactor = saveInstance + '.' + pathInstance + '.' + pathPrice + '.' + pathCurrent + '.' + pathFactor;
	var _pathDate = saveInstance + '.' + pathInstance + '.' + pathPrice + '.' + pathNew + '.' + pathDate;
	var _pathChanged = saveInstance + '.' + pathInstance + '.' + pathPrice + '.' + pathNew + '.' + pathChanged;
	var _pathWorkingPriceNew = saveInstance + '.' + pathInstance + '.' + pathPrice + '.' + pathNew + '.' + pathWorkingPrice;
	var _pathBasePriceNew = saveInstance + '.' + pathInstance + '.' + pathPrice + '.' + pathNew + '.' + pathBasePrice;
	var _pathFactorNew = saveInstance + '.' + pathInstance + '.' + pathPrice + '.' + pathNew + '.' + pathFactor;
	
	if(typeof device !== "undefined") {
		// change default price
		_pathWorkingPrice = saveInstance + '.' + pathInstance + '.' + device + '.' + pathCustomPrice + '.' + pathCurrent + '.' + pathWorkingPrice;
		_pathBasePrice = saveInstance + '.' + pathInstance + '.' + device + '.' + pathCustomPrice + '.' + pathCurrent + '.' + pathBasePrice;
		_pathFactor = saveInstance + '.' + pathInstance + '.' + device + '.' + pathCustomPrice + '.' + pathCurrent + '.' + pathFactor;
		_pathDate = saveInstance + '.' + pathInstance + '.' + device + '.' + pathCustomPrice + '.' + pathNew + '.' + pathDate;
		_pathChanged = saveInstance + '.' + pathInstance + '.' + device + '.' + pathCustomPrice + '.' + pathNew + '.' + pathChanged;
		_pathWorkingPriceNew = saveInstance + '.' + pathInstance + '.' + device + '.' + pathCustomPrice + '.' + pathNew + '.' + pathWorkingPrice;
		_pathBasePriceNew = saveInstance + '.' + pathInstance + '.' + device + '.' + pathCustomPrice + '.' + pathNew + '.' + pathBasePrice;
		_pathFactor = saveInstance + '.' + pathInstance + '.' + device + '.' + pathCustomPrice + '.' + pathNew + '.' + pathFactor;
	}
	
	if(getObject(_pathDate)) {
	
		var _date = getState(_pathDate).val;
		
		var _dateDay;
		var _dateMonth;
		var _dateYear;
		
		try {
			_date = _date.match(/\d{2}(\.|-)\d{2}(\.|-)\d{4}/g).toString();
			
			_dateDay = _date.split(".")[0];
			_dateMonth = _date.split(".")[1];
			_dateYear = _date.split(".")[2];
		
		} catch (err) {
			console.log("error reading the date. possibly wrong syntax? " + _date + " (Error:" + err + ")");
		}
		
		var newdate = new Date(_dateMonth + " " + _dateDay + " " + _dateYear);
		
		var today = new Date();
		today.setHours(0, 0, 0, 0);
		
		if(today.getTime() === newdate.getTime()) {
			if(!getState(_pathChanged).val) {
			
				setState(_pathChanged, true);
				
				var _oldWorkingPrice = getState(_pathWorkingPrice).val;
				var _oldBasePrice = getState(_pathBasePrice).val;
				var _oldFactor = getState(_pathFactor).val;
				
				var _newWorkingPrice = getState(_pathWorkingPriceNew).val;
				var _newBasePrice = getState(_pathBasePriceNew).val;
				var _newFactor = getState(_pathFactorNew).val;
				
				setState(_pathWorkingPrice, _newWorkingPrice);
				setState(_pathBasePrice, _newBasePrice);
				setState(_pathFactor, _newFactor);
				
				var message = 'price changed for ' + device + ':' + '\n'
				+ 'old working price:' + _oldWorkingPrice + '.\n'
				+ 'old base price:' + _oldBasePrice + '.\n'
				+ 'old factor:' + _oldFactor + '.\n'
				+ 'new working price:' + _newWorkingPrice + '.\n'
				+ 'new base price:' + _newBasePrice + '.\n'
				+ 'new factor:' + _newFactor;
				
				sendMessage(message);
			}
		
		} else if(today.getTime() > newdate.getTime()) {
			// reset var
			setState(_pathChanged, false);
		}
	}
}

//----------------------------------------------------------------------------//

function runCustomData() {
	if (customData.length > 0) {
		for(var i = 0; i < customData.length; i++) {
			var _source = customData[i][0];
			var _alias = customData[i][1];
			var _unit = customData[i][2];
			
			if(logging) console.log("Alias:" + _alias + " Source:" + _source + " Unit:" + _unit);
			
			on(_source, function(obj) {
				for(var i = 0; i < customData.length; i++) {
					if(customData[i][0] === obj.id) run(obj, customData[i][1], customData[i][2]);
				}
			});
		}
	}
}


function setRecognizedChange(cPath, period) {
	cacheSelectorStateMeter.each(function (id, i) {
		var devicename = parseObjects(id);
		rotateConsumptionAndCost(devicename, cPath, period);
		resetConsumptionAndCost(devicename, cPath);
		writeCounter(devicename, cPath);
	});
	
	cacheSelectorStateEnergyCounter.each(function (id, i) {
		var devicename = parseObjects(id);
		rotateConsumptionAndCost(devicename, cPath, period);
		resetConsumptionAndCost(devicename, cPath);
		writeCounter(devicename, cPath);
	});
	
	if (customData.length > 0) {
		for(var i = 0; i < customData.length; i++) {
			var alias = customData[i][1];
			rotateConsumptionAndCost(alias, cPath, period);
			resetConsumptionAndCost(alias, cPath);
			writeCounter(alias, cPath);
		}
	}
}

function rotateConsumptionAndCost(device, cPath, period) {
	var _pathConsumption = saveInstance + '.' + pathInstance + '.' + device + '.' + pathConsumption + '._' + cPath;
	var _pathCosts = saveInstance + '.' + pathInstance + '.' + device + '.' + pathCosts + '._' + cPath;
	
	if(period > 0) {
		for(var i = period; i >= 0; i--) {
			var j = i;
			j++;
			// consumption
			if(getObject(_pathConsumption + '.' + cPath + '_' + j)) {
				if(i === 0) {
					setState(_pathConsumption + '.' + cPath + '_' + j, getState(_pathConsumption).val);
				} else {
					setState(_pathConsumption + '.' + cPath + '_' + j, getState(_pathConsumption + '.' + cPath + '_' + i).val);
				}
			}
			// costs
			if(getObject(_pathCosts + '.' + cPath + '_' + j)) {
				if(i === 0) {
					setState(_pathCosts + '.' + cPath + '_' + j, getState(_pathCosts).val);
				} else {
					setState(_pathCosts + '.' + cPath + '_' + j, getState(_pathCosts + '.' + cPath + '_' + i).val);
				}
			}
		}
	}
}


function resetConsumptionAndCost(device, cPath) {
	// reset of the costs for the transferred period
	setState(saveInstance + '.' + pathInstance + '.' + device + '.' + pathConsumption + '._' + cPath, 0);     
	setState(saveInstance + '.' + pathInstance + '.' + device + '.' + pathCosts + '._' + cPath, 0);
	if (logging) log('costs and gas consumption for device ' + device + ' (' + cPath + ') reset');
}

function writeCounter(device, cPath) {
	var _pathCounter = saveInstance + '.' + pathInstance + '.' + device + '.' + pathCounter;
	setState(_pathCounter + '.' + _cPath, parseFloat( (getState(_pathCounter + '.' + pathCumulated).val).toFixed(decimalCounterReading)));
	if (logging) log('meter reading consumption ' + device + ' (' + cPath + ') saved to object');
}

//----------------------------------------------------------------------------//

function parseObjects(id) {
	var obj = getObject(id);
	return removeDatapoint(obj.common.name);
}


function removeDatapoint(device) {
	var returnData = device;
	var logLabel = 'removeDatapoint - returnData';
	
	// ":2.ENERGY_COUNTER" --> ".ENERGY_COUNTER"
	if (device.indexOf(".ENERGY_COUNTER") != -1) {	
		returnData = device.substring(0, device.indexOf(".ENERGY_COUNTER"));
	} else if (device.indexOf(".METER") != -1) {
		returnData = device.substring(0, device.indexOf(".METER"));
	}
	
	if (logging) log(logLabel + '1:' + returnData);
	
	// Return should not contain special characters or spaces. If they are, they will be removed or replaced
	try {
		returnData = checkBlacklist(returnData);
	}
	catch(err) {
		if (logging) log(logLabel + '2:' + returnData + ' error:' + err);
	}
	finally {
		if (logging) log(logLabel + '2:' + returnData);
	}
	
	try {
		if (returnData.charAt(returnData.length - 1) == "-") returnData = returnData.substr(0, returnData.length - 1);
		if (returnData.charAt(returnData.length - 1) == "\\") returnData = returnData.substr(0, returnData.length - 1);
		if (returnData.charAt(returnData.length - 1) == ":") returnData = returnData.substr(0, returnData.length - 1);
	} catch(err) {
		if (logging) log(logLabel + '3:' + returnData + ' error:' + err);
	} finally {
		if (logging) log(logLabel + '3:' + returnData);
	}
	
	// remove space
	try {
		returnData = returnData.replace(/\s/g, "");
	} catch(err) {
		if (logging) log(logLabel + '4:' + returnData + ' error:' + err);
	} finally {
		if (logging) log(logLabel + '4:' + returnData);
	}
	
	return returnData;
}


function setHistory(device, cPath) {

	if(historyInstance !== '') {	
		sendTo(historyInstance, 'enableHistory', {
			id: saveInstance + '.' + pathInstance + '.' + device + '.' + pathCosts + '.' + cPath,
			options: {
				changesOnly:  true,
				debounce:     0,
				retention:    31536000,
				maxLength:    3,
				changesMinDelta: 0.5
			}
		}, function (result) {
			if (result.error) {
				if (logging) log("error when activating history: " + result.error);
			}
		});
		
		sendTo(historyInstance, 'enableHistory', {
			id: saveInstance + '.' + pathInstance + '.' + device + '.' + pathConsumption + '.' + cPath,
			options: {
				changesOnly:  true,
				debounce:     0,
				retention:    31536000,
				maxLength:    3,
				changesMinDelta: 0.5
			}
		}, function (result) {
			if (result.error) {
				if (logging) log("error when activating history: " + result.error);
			}
		});
		
		sendTo(historyInstance, 'enableHistory', {
			id: saveInstance + '.' + pathInstance + '.' + device + '.' + pathCounter + '.' + cPath,
			options: {
				changesOnly:  true,
				debounce:     0,
				retention:    31536000,
				maxLength:    3,
				changesMinDelta: 0.5
			}
		}, function (result) {
			if (result.error) {
				if (logging) log("error when activating history: " + result.error);
			}
		});
	}
}

function checkBlacklist(name) {

	var _name = "";
	
	if (blacklist.length > 0) {
	for(var i = 0; i < blacklist.length; i++) {
		if (name.indexOf(blacklist[i]) != -1) {
			// delete strings that are in the blacklist from the name
			_name = name.substring(0, name.indexOf(blacklist[i]));
		}
	}
	
	if(_name === "") {
		return name;
	} else {
		return _name;
	}
	
	} else return name;
}
