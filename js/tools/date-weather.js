// js/tools/date-weather.js

/**
 * Initializes the Date and Weather tool.
 */
export function initDateWeather() {
    // --- DOM Elements ---
    const calendarGrid = document.getElementById('dw-calendar-grid');
    const calendarHeader = document.getElementById('dw-calendar-header');
    const prevMonthBtn = document.getElementById('dw-prev-month-btn');
    const nextMonthBtn = document.getElementById('dw-next-month-btn');
    const monthDisplay = document.getElementById('dw-month-display');
    const dayDisplay = document.getElementById('dw-day-display');
    const dateDisplay = document.getElementById('dw-date-display');
    const timeDisplay = document.getElementById('dw-time-display');
    const weatherSelect = document.getElementById('dw-weather-select');
    const weatherImg = document.getElementById('dw-weather-img');
    const weatherText = document.getElementById('dw-weather-text');

    // --- State ---
    let currentDisplayDate = new Date();
    let selectedDate = new Date();
    let timeInterval = null;

    const MONTH_NAMES = ["January", "February", "March", "April", "May", "June", "July", "August", "September", "October", "November", "December"];
    const DAY_NAMES = ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"];

    /**
     * Renders the calendar for a given month and year.
     */
    function renderCalendar() {
        const year = currentDisplayDate.getFullYear();
        const month = currentDisplayDate.getMonth();
        const today = new Date();

        calendarHeader.textContent = `${MONTH_NAMES[month]} ${year}`;
        calendarGrid.innerHTML = '';

        // Add day names to the grid header
        ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].forEach(day => {
            const dayNameEl = document.createElement('div');
            dayNameEl.className = 'dw-day-name';
            dayNameEl.textContent = day;
            calendarGrid.appendChild(dayNameEl);
        });

        const firstDayOfMonth = new Date(year, month, 1);
        const lastDayOfMonth = new Date(year, month + 1, 0);
        const startDayOfWeek = firstDayOfMonth.getDay(); // 0=Sun, 1=Mon, ...
        const totalDays = lastDayOfMonth.getDate();

        // Add empty cells for days before the 1st
        for (let i = 0; i < startDayOfWeek; i++) {
            const emptyCell = document.createElement('div');
            emptyCell.className = 'dw-date-cell empty';
            calendarGrid.appendChild(emptyCell);
        }

        // Add date cells for the month
        for (let day = 1; day <= totalDays; day++) {
            const dateCell = document.createElement('div');
            dateCell.className = 'dw-date-cell';
            dateCell.textContent = day;
            dateCell.dataset.date = new Date(year, month, day).toISOString();

            // Highlight today's date
            if (year === today.getFullYear() && month === today.getMonth() && day === today.getDate()) {
                dateCell.classList.add('current-day');
            }

            // Highlight the selected date
            if (year === selectedDate.getFullYear() && month === selectedDate.getMonth() && day === selectedDate.getDate()) {
                dateCell.classList.add('selected-day');
            }
            
            calendarGrid.appendChild(dateCell);
        }
    }

    /**
     * Updates the main display with the selected date's information.
     */
    function updateMainDisplay() {
        monthDisplay.textContent = MONTH_NAMES[selectedDate.getMonth()];
        dayDisplay.textContent = DAY_NAMES[selectedDate.getDay()];
        
        // Add ordinal suffix to the date
        const dayOfMonth = selectedDate.getDate();
        let suffix = 'th';
        if (dayOfMonth === 1 || dayOfMonth === 21 || dayOfMonth === 31) suffix = 'st';
        else if (dayOfMonth === 2 || dayOfMonth === 22) suffix = 'nd';
        else if (dayOfMonth === 3 || dayOfMonth === 23) suffix = 'rd';
        dateDisplay.innerHTML = `${dayOfMonth}<sup>${suffix}</sup>`;
        
        // Update calendar selection highlight
        const previouslySelected = calendarGrid.querySelector('.selected-day');
        if (previouslySelected) {
            previouslySelected.classList.remove('selected-day');
        }
        
        // Find the newly selected cell, accounting for time zone differences by only comparing date parts
        const selectedDateString = new Date(selectedDate.getFullYear(), selectedDate.getMonth(), selectedDate.getDate()).toISOString();
        const newSelectedCell = calendarGrid.querySelector(`[data-date="${selectedDateString}"]`);
        
        if (newSelectedCell) {
            newSelectedCell.classList.add('selected-day');
        }
    }

    /**
     * Updates the time display every second.
     */
    function updateTime() {
        const now = new Date();
        const hours = String(now.getHours()).padStart(2, '0');
        const minutes = String(now.getMinutes()).padStart(2, '0');
        const seconds = String(now.getSeconds()).padStart(2, '0');
        timeDisplay.textContent = `${hours}:${minutes}:${seconds}`;
    }

    /**
     * Handles the change of the weather dropdown.
     */
    function handleWeatherChange(event) {
        const weatherValue = event.target.value;
        const weatherName = event.target.options[event.target.selectedIndex].text;
        weatherImg.src = `assets/weather/${weatherValue}.png`;
        weatherImg.alt = weatherName;
        weatherText.textContent = weatherName;
    }

    // --- Event Listeners ---

    prevMonthBtn.addEventListener('click', () => {
        currentDisplayDate.setMonth(currentDisplayDate.getMonth() - 1);
        renderCalendar();
    });

    nextMonthBtn.addEventListener('click', () => {
        currentDisplayDate.setMonth(currentDisplayDate.getMonth() + 1);
        renderCalendar();
    });

    calendarGrid.addEventListener('click', (event) => {
        const target = event.target;
        if (target.classList.contains('dw-date-cell') && !target.classList.contains('empty')) {
            selectedDate = new Date(target.dataset.date);
            updateMainDisplay();
        }
    });

    weatherSelect.addEventListener('change', handleWeatherChange);

    // --- Initialization ---
    function initialize() {
        renderCalendar();
        updateMainDisplay();
        updateTime();
        if (timeInterval) clearInterval(timeInterval);
        timeInterval = setInterval(updateTime, 1000);
        // Set initial weather
        weatherSelect.dispatchEvent(new Event('change'));
    }

    initialize();
}