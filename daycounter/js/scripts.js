(function() {

    // Store References
    var counters = document.getElementById('counters');
    var noCounters = document.getElementById('no-counters');
    var addCounterBtn = document.getElementById('add-counter-btn');
    var addCounterForm = document.getElementById('add-counter');
    var closeFormBtn = document.getElementById('close-modal');
    var submitFormBtn = document.getElementById('modal-submit');
    var eventNameField = document.getElementById('event-name');
    var eventDateField = document.getElementById('event-date');
    var eventRecurField = document.getElementById('event-recurring');
    var eventNameError = document.getElementById('event-name-error');
    var eventDateError = document.getElementById('event-date-error');
    var deleteModal = document.getElementById('delete-counter');
    var deleteCancel = document.getElementById('delete-cancel');
    var deleteConfirm = document.getElementById('delete-confirm');
    var settingsToggle = document.getElementById('settings-toggle');
    var settings = document.getElementById('settings');
    var settingsSize = document.getElementById('setting-size-list');
    var settingsScheme = document.getElementById('setting-scheme-list');
    var settingsVisible = document.getElementById('setting-visible-list');
    var settingsRange = document.getElementById('setting-range-list');
    var settingsFader = document.getElementById('setting-fader-list');
    var settingsSave = document.getElementById('settings-save');

    // Define Variables
    var countersObj, editing, editNode, deleteID, timer, settingsObj;

    /**
     * Initialize date picker
     */
    var picker = new Pikaday({
        field: document.getElementById('event-date'),
        format: 'YYYY-MM-D'
    });

    /**
     * Initialize sortable and call reorder function on end
     */
    Sortable.create(counters, {
        animation: 150,
        onEnd: function () {
			console.log('heree')
            setCounterIDs();
        }
    });

    /**
     * Clears the event name and event date field
     */
    var clearFields = function() {
        eventNameField.value = '';
        eventDateField.value = '';
    };

    /**
     * Removes any warnings on the create counter form
     */
    var removeWarnings = function() {
        eventNameError.classList.remove('active');
        eventDateError.classList.remove('active');
    };

    /**
     * Iterates through all counters and adjusts IDs
     */
    var setCounterIDs = function() {
        // Store counters
        var allCounters = document.getElementsByClassName('counter');

        // Empty the counters object
        countersObj = {};

        // If counters exist, loop over them
        if (allCounters.length > 0) {
            for (var i = 0; i < allCounters.length; i++) {
                // Set the ID of the counter
                allCounters[i].id = 'counter-' + (i + 1);

                // Add information to the counter object
                countersObj[i + 1] = {
                    'event': allCounters[i].getElementsByClassName('event-name')[0].innerHTML,
                    'original': allCounters[i].dataset.original,
                    'recurring': allCounters[i].dataset.recurring
                };
            }

            // Check if no-counters is visible
            if (noCounters.className === 'active') noCounters.className = '';

        } else {
            noCounters.className = 'active';
        }

        // Resave counters
        saveCounters();
    };

    /**
     * Creates / appends counter to DOM and returns it
     * @param {string} cEvent - Event name for the counter
     * @param {number} cDays - Number of days to / since event
     * @param {string} cType - Type of event (past or future)
     * @param {string} cOriginal - Original date of the event
     * @param {string} cRecur - If the counter recurs or not
     */
    var createCounter = function(cEvent, cDays, cType, cOriginal, cRecur) {
        // Create the counter list element
        var counter = document.createElement('li');

        // Set data attribute
        counter.dataset.recurring = cRecur;
        counter.dataset.original = cOriginal;

        // Add counter class
        counter.classList.add('counter');

        // Change format of original
        var cDate = moment(cOriginal).format('ddd, ll');

        // Create the HTML
        counter.innerHTML = '<a class="counter-delete transition" href="#"><i class="fa fa-times" aria-hidden="true"></i></a><h3 class="event-name">' + cEvent + '</h3><span class="event-days">' + cDays + '</span><p class="event-type">' + cType + '</p><span class="event-date">' + cDate + '</span><a class="counter-edit transition" href="#">Edit Counter</a>';

        // Append it to the other counters
        counters.appendChild(counter);

        // Return the counter
        return counter;
    };

    /**
     * Checks if a provided date is valid or not
     * @param {string} dateStr - Date in string format
     */
    var isValidDate = function(dateStr) {
        // Return if invalid format
        if (!/^\d{4}\-\d{2}\-\d{1,2}$/.test(dateStr)) {
            return false;
        }

        // Store year, month, and day
        var date = dateStr.split('-');
        var year = parseInt(date[0]);
        var month = parseInt(date[1]);
        var day = parseInt(date[2]);

        // Do basic validation
        if (year < 1000 || year > 3000 || month <= 0 || month > 12) {
            return false;
        }

        // Store all month lengths
        var months = [31, 28, 31, 30, 31, 30, 31, 31, 30, 31, 30, 31];

        // Adjust for leap years
        if (year % 400 === 0 || (year % 100 !== 0 && year % 4 === 0)) {
            months[1] = 29;
        }

        // Return the result after checking days
        return day > 0 && day <= months[month - 1];
    };

    /**
     * Get days between now and the given date
     * @param {string} date - A Date String
     */
    var daysBetween = function(date) {
        // Get day in milliseconds
        var day = 1000 * 60 * 60 * 24;

        // Get current time and convert to ISO string
        var currentTime = new Date();
        currentTime.setHours(0, 0, 0, 0);
        var currentISO = currentTime.toISOString();

        // Convert given date into ISO string
        var givenISO = new Date(date).toISOString();

        // Create dates out of both ISO strings
        var currentDate = new Date(currentISO);
        var givenDate = new Date(givenISO);

        // Create empty results array
        var result = {
            'days': null,
            'type': null
        };

        // If given date is in future, use days left, otherwise, days since
        if (givenDate > currentDate) {
            result.days = Math.round((givenDate.getTime() - currentDate.getTime()) / day);
            result.type = 'Days Until';
        } else {
            result.days = Math.round((currentDate.getTime() - givenDate.getTime()) / day);
            result.type = 'Days Since';
        }

        // Set to "Today" if zero
        if (result.days === 0) {
            result.days = 'Today';
            result.type = '<br />';
        }

        // Return the result
        return result;
    };

    /**
     * Saves the current counter states to Chrome storage
     */
    var saveCounters = function() {
        // Set new counters
        chrome.storage.sync.set({
            'counters': countersObj
        }, function() {
            console.log('Counters updated.');
        });
    };

    /**
     * Loads the counter states from Chrome storage
     */
    var loadCounters = function() {
        chrome.storage.sync.get('counters', function(data) {
            for (var savedCounter in data.counters) {
                // skip loop if the property is from prototype
                if (!data.counters.hasOwnProperty(savedCounter)) continue;

                // Get the counter object
                var counterObj = data.counters[savedCounter];

                // Store counter properties
                var loadedCounter = {
                    days: null,
                    type: null,
                    original: null
                };

                // Backwards compatability
                if (!counterObj.hasOwnProperty('recurring')) {
                    counterObj.recurring = 'none';
                }

                // Check if in the past and has a recurrence set
                if (counterObj.recurring !== 'none' && moment(counterObj.original).isBefore(moment().startOf('day'))) {
                    var recurrenceResult = checkRecurrence(counterObj.recurring, counterObj.original);

                    loadedCounter = {
                        days: recurrenceResult.days,
                        type: 'Days Until',
                        original: recurrenceResult.original,
                    };
                } else { // No recurrence update is needed
                    // Get updated counter result
                    var counterResult = daysBetween(counterObj.original);

                    loadedCounter = {
                        days: counterResult.days,
                        type: counterResult.type,
                        original: counterObj.original
                    };
                }

                // Rebuild the counter
                createCounter(counterObj.event, loadedCounter.days, loadedCounter.type, loadedCounter.original, counterObj.recurring);
            }

            
            // Set the counter IDs again
            setCounterIDs();
            
            // Setup counters
            setupCounters();
        });
    };

    /**
     * Setup the counters
     */
    var setupCounters = function() {
        // Store reference to counter buttons
        var editCounters = document.getElementsByClassName('counter-edit');
        var deleteCounters = document.getElementsByClassName('counter-delete');

        // Add event listener to edit counter
        for (var ei = 0; ei < editCounters.length; ei++) {
            createEditButtons(editCounters[ei]);
        }

        // Add event listener to delete counter
        for (var di = 0; di < deleteCounters.length; di++) {
            createDeleteButtons(deleteCounters[di]);
        }
    };

    /**
     * Create the edit button for a counter
     * @param {object} editBtn - The counter's edit button
     */
    var createEditButtons = function(editBtn) {
        editBtn.addEventListener('click', function(e) {
            // Stop anchor functionality
            e.preventDefault();

            // Get current node
            editNode = this.parentNode;

            // Set editing to true
            editing = true;

            // Set date picker to date that is currently there
            picker.setMoment(moment(editNode.dataset.original));

            // Ensure values are correct
            document.getElementById('modal-header-title').innerHTML = 'Edit Day Counter';
            document.getElementById('modal-submit').value = 'Save Day Counter';

            // Set values
            document.getElementById('event-name').value = editNode.getElementsByClassName('event-name')[0].innerHTML;
            document.getElementById('event-date').value = editNode.dataset.original;
            document.getElementById('event-recurring').value = editNode.dataset.recurring;

            // Show modal
            addCounterForm.classList.add('active');
        });
    };

    /**
     * Create the delete button for a counter
     * @param {object} deleteBtn - The counter's delete button
     */
    var createDeleteButtons = function(deleteBtn) {
        deleteBtn.addEventListener('click', function() {
            // Store parent node
            var parent = this.parentNode;

            // ID to be deleted
            deleteID = parseInt(parent.id.split('-')[1]);

            // Add delete class
            deleteModal.classList.add('active');
        });
    };

    /**
     * Filters counter visibility by user settings
     * @param {object} currentSettings - The current user settings
     */
    var counterFilters = function(currentSettings) {
        // Store counters
        var allCounters = document.getElementsByClassName('counter');

        // Check if setting is set
        if (typeof currentSettings.counterVisibility === 'undefined') return;

        // Show all
        for (var c = 0; c < allCounters.length; c++) {
            allCounters[c].classList.remove('invisible');
        }

        // If future, hide past
        if (currentSettings.counterVisibility === 'future') {
            for (var fc = 0; fc < allCounters.length; fc++) {
                if (allCounters[fc].getElementsByClassName('event-type')[0].innerHTML.indexOf('Since') !== -1) {
                    allCounters[fc].classList.add('invisible');
                }
            }
        }

        // If past, hide future
        if (currentSettings.counterVisibility === 'past') {
            for (var pc = 0; pc < allCounters.length; pc++) {
                if (allCounters[pc].getElementsByClassName('event-type')[0].innerHTML.indexOf('Until') !== -1) {
                    allCounters[pc].classList.add('invisible');
                }
            }
        }
    };

    /**
     * Filters counter date range by user settings
     * @param {string} range - The filter range setting
     */
    var counterRange = function(range) {
        // Store counters
        var allCounters = document.getElementsByClassName('counter');

        // Check if setting is set
        if (typeof range === 'undefined') return;

        // Show all
        for (var c = 0; c < allCounters.length; c++) {
            allCounters[c].classList.remove('disabled');
        }

        // Define variables
        var i, original, counterDate;

        // Check the range
        if (range === 'week') {
            for (i = 0; i < allCounters.length; i++) {
                original = allCounters[i].dataset.original;
                counterDate = moment(original);
                var weekAway = moment().startOf('day').add(1, 'week');
                if (!counterDate.isSameOrBefore(weekAway)) {
                    allCounters[i].classList.add('disabled');
                }
            }
        } else if (range === 'month') {
            for (i = 0; i < allCounters.length; i++) {
                original = allCounters[i].dataset.original;
                counterDate = moment(original);
                var monthAway = moment().startOf('day').add(1, 'month');
                if (!counterDate.isSameOrBefore(monthAway)) {
                    allCounters[i].classList.add('disabled');
                }
            }
        } else if (range === 'quarter') {
            for (i = 0; i < allCounters.length; i++) {
                original = allCounters[i].dataset.original;
                counterDate = moment(original);
                var quarterAway = moment().startOf('day').add(3, 'months');
                if (!counterDate.isSameOrBefore(quarterAway)) {
                    allCounters[i].classList.add('disabled');
                }
            }
        } else if (range === 'half') {
            for (i = 0; i < allCounters.length; i++) {
                original = allCounters[i].dataset.original;
                counterDate = moment(original);
                var halfAway = moment().startOf('day').add(6, 'months');
                if (!counterDate.isSameOrBefore(halfAway)) {
                    allCounters[i].classList.add('disabled');
                }
            }
        } else if (range === 'year') {
            for (i = 0; i < allCounters.length; i++) {
                original = allCounters[i].dataset.original;
                counterDate = moment(original);
                var yearAway = moment().startOf('day').add(1, 'year');
                if (!counterDate.isSameOrBefore(yearAway)) {
                    allCounters[i].classList.add('disabled');
                }
            }
        }
    };

    /**
     * Adds a privacy filter to the fader if enabled
     * @param {string} fader - The fader value (enable or disable)
     */
    var counterFader = function(fader) {
        // Check if setting is set
        if (typeof fader === 'undefined') return;

        // Remove any previous event listener
        document.removeEventListener('mousemove', fadeListener);

        // Remove faded class
        counters.classList.remove('faded');

        // Clear timer
        clearTimeout(timer);

        // Check if it is disabled
        if (fader === 'disable') return;

        // Fade it initially
        counters.classList.add('faded');

        // Clear timer on mouse move
        document.addEventListener('mousemove', fadeListener);
    };

    /**
     *
     */
    var fadeListener = function() {
        // If there is a timer, clear it and remove class
        if (timer) {
            clearTimeout(timer);
            counters.classList.remove('faded');
        }

        // Create timer and store reference
        timer = setTimeout(function() {
            counters.classList.add('faded');
        }, 3000);
    };

    /**
     * Loads the user settings
     */
    var loadSettings = function() {
        chrome.storage.sync.get('settings', function(data) {

            // Check if settings exist
            if (typeof data.settings === 'undefined') return;

            // Set Settings dropdowns
            settingsSize.value = data.settings.counterSize;
            settingsScheme.value = data.settings.counterScheme;

            // Backwards compatability for counter visibility
            if (typeof data.settings.counterVisibility !== 'undefined') {
                settingsVisible.value = data.settings.counterVisibility;
            }

            // Backwards compatability for counter filter range
            if (typeof data.settings.counterRange !== 'undefined') {
                settingsRange.value = data.settings.counterRange;
            }

            // Backwards compatability for fader
            if (typeof data.settings.fader !== 'undefined') {
                settingsFader.value = data.settings.fader;
            }

            // Add body class
            document.documentElement.className = settingsScheme.value;

            // Add counter class
            counters.className = settingsSize.value;

            // Wait 0.5s
            window.setTimeout(function() {
                // Add transition to html, body
                document.documentElement.style.transition = '0.5s ease all';
                document.body.style.transition = '0.5s ease all';
            }, 500);

            // Check filters
            counterFilters(data.settings);

            // Check range
            counterRange(data.settings.counterRange);

            // Check fader
            counterFader(data.settings.fader);
        });
    };

    /**
     * Saves the user settings
     */
    var saveSettings = function() {
       // Clear counters storage and set new counters
        chrome.storage.sync.remove('settings', function() {
            chrome.storage.sync.set({
                'settings': settingsObj
            }, function() {
                console.log('Settings updated.');
                loadSettings();
            });
        });
    };

    /**
     * Checks if any counters are recurring and need updating
     */
    var checkRecurrence = function(recurrence, originalDate) {
        // Variable to store new date
        var newDate;

        // Get new date based on recurrence type
        if (recurrence === 'weekly') {
            newDate = moment(originalDate).add(1, 'week').format('YYYY-MM-D');
            while (moment(newDate).isBefore(moment())) {
                newDate = moment(newDate).add(1, 'week').format('YYYY-MM-D');
            }
        } else if (recurrence === 'biweekly') {
            newDate = moment(originalDate).add(2, 'week').format('YYYY-MM-D');
            while (moment(newDate).isBefore(moment())) {
                newDate = moment(newDate).add(2, 'week').format('YYYY-MM-D');
            }
        } else if (recurrence === 'monthly') {
            newDate = moment(originalDate).add(1, 'month').format('YYYY-MM-D');
            while (moment(newDate).isBefore(moment())) {
                newDate = moment(newDate).add(1, 'month').format('YYYY-MM-D');
            }
        } else if (recurrence === 'yearly') {
            newDate = moment(originalDate).add(1, 'year').format('YYYY-MM-D');
            while (moment(newDate).isBefore(moment())) {
                newDate = moment(newDate).add(1, 'year').format('YYYY-MM-D');
            }
        }

        // Store result from daysBetween call
        var result = daysBetween(newDate);

        // Return new days and original date
        return {
            days: result.days,
            original: newDate
        };
    };

    /**
     * Initializes the page
     */
    var init = function() {
        // Load counters
        loadCounters();

        // Get settings
        loadSettings();

        // Open create counter form
        addCounterBtn.addEventListener('click', function(e) {
            // Stop anchor functionality
            e.preventDefault();

            // Reset date picker to today
            picker.gotoDate(new Date());

            // Show add counter form
            addCounterForm.classList.add('active');

            // Ensure values are correct
            document.getElementById('modal-header-title').innerHTML = 'Add a New Day Counter';
            document.getElementById('modal-submit').value = 'Add Day Counter';

            // Add class to body
            document.body.classList.add('active');
        });

        // Close the create counter form
        closeFormBtn.addEventListener('click', function(e) {
            // Stop anchor functionality
            e.preventDefault();

            // Remove active class
            addCounterForm.classList.remove('active');

            // Clear fields
            clearFields();

            // Clear any warnings
            removeWarnings();

            // Remove overflow hidden class from body
            document.body.classList.remove('active');
        });

        // Create counter
        submitFormBtn.addEventListener('click', function() {
            var eventName = eventNameField.value;
            var eventDate = eventDateField.value;
            var eventRecur = eventRecurField.value;
            var errors = false;

            // Validate event name
            if (eventName === '' || eventName === null) {
                eventNameError.classList.add('active');
                errors = true;
            } else {
                eventNameError.classList.remove('active');
            }

            // Validate event date
            if (eventDate === '' || eventDate === null || !isValidDate(eventDate)) {
                eventDateError.classList.add('active');
                errors = true;
            } else {
                eventDateError.classList.remove('active');
            }

            // Return if there were errors
            if (errors) return;

            // Get event date result
            var dateResult = daysBetween(eventDate);

            // If currently editing
            if (editing) {
                // Update counter
                editNode.getElementsByClassName('event-name')[0].innerHTML = eventName;
                editNode.getElementsByClassName('event-days')[0].innerHTML = dateResult.days;
                editNode.getElementsByClassName('event-type')[0].innerHTML = dateResult.type;
                editNode.getElementsByClassName('event-date')[0].innerHTML = moment(eventDate).format('ddd, ll');
                editNode.dataset.original = eventDate;
                editNode.dataset.recurring = eventRecur;

                // Reset editing node
                editNode = null;

                // Set editing to false
                editing = false;
            } else { // If currently creating
                // Create the counter and store it
                var counter = createCounter(eventName, dateResult.days, dateResult.type, eventDate, eventRecur);

                // Setup the counter
                createEditButtons(counter.getElementsByClassName('counter-edit')[0]);
                createDeleteButtons(counter.getElementsByClassName('counter-delete')[0]);
            }


            // Close the window
            addCounterForm.classList.remove('active');

            // Remove body active state
            document.body.classList.remove('active');

            // Clear fields
            clearFields();

            // Clear any warnings
            removeWarnings();

            // Set counter IDs
            setCounterIDs();
        });

        // Delete Confirm
        deleteConfirm.addEventListener('click', function(e) {
            // Stop anchor functionality
            e.preventDefault();

            // Remove counter of stored ID
            document.getElementById('counter-' + deleteID).remove();

            // Set counter IDs
            setCounterIDs();

            // Close delete modal
            deleteModal.classList.remove('active');
        });

        // Delete cancel
        deleteCancel.addEventListener('click', function(e) {
            // Stop anchor functionality
            e.preventDefault();

            // Reset deleteID
            deleteID = null;

            // Close delete modal
            deleteModal.classList.remove('active');
        });

        // Show settings
        settingsToggle.addEventListener('click', function() {

            if (this.classList.contains('active')) {
                this.classList.remove('active');
                settings.classList.remove('active');
            } else {
                this.classList.add('active');
                settings.classList.add('active');
            }

        });

        // Save settings
        settingsSave.addEventListener('click', function(e) {

            // Stop anchor functionality
            e.preventDefault();

            // Set empty object
            settingsObj = {};

            // Get counter size
            settingsObj.counterSize = settingsSize.options[settingsSize.selectedIndex].value;

            // Get colour scheme
            settingsObj.counterScheme = settingsScheme.options[settingsScheme.selectedIndex].value;

            // Get counter visibility
            settingsObj.counterVisibility = settingsVisible.options[settingsVisible.selectedIndex].value;

            // Get counter filter range
            settingsObj.counterRange = settingsRange.options[settingsRange.selectedIndex].value;

            // Get fader
            settingsObj.fader = settingsFader.options[settingsFader.selectedIndex].value;

            // Set settings
            saveSettings();

            // Close settings
            settingsToggle.classList.remove('active');
            settings.classList.remove('active');

        });
    };

    // Wait for DOM content to have loaded
    document.addEventListener('DOMContentLoaded', init);
})();
