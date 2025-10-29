// npm run build

import emailjs from '@emailjs/browser';

emailjs.init("c0UqVFYtByUWzi-5c");

/**
 * =========================
 * AVAILABILITY CONFIGURATION
 * =========================
 *
 * Each clinic location has one or more specialties.
 * For each specialty, you define availability by weekday (1 = Monday ... 5 = Friday).
 *
 * Structure:
 *  availability = {
 *      "LocationName": {
 *          SpecialtyIndex: {
 *              daySlots: {
 *                  <weekdayNumber>: [
 *                      {
 *                          start: "HH:MM",   // Start time (24h format)
 *                          end: "HH:MM",     // End time (24h format)
 *
 *                          // --- Optional parameters controlling repetition ---
 *
 *                          repeat: "weekly" | "biweekly" | "monthly"
 *                              - "weekly"   → (default) repeats every week
 *                              - "biweekly" → repeats every 2 weeks starting from 'startDate'
 *                              - "monthly"  → repeats once per month on the 'dayOfMonth'
 *
 *                          // For biweekly slots:
 *                          startDate: "YYYY-MM-DD"
 *                              → the starting week for the 2-week cycle
 *                              → determines whether this week is the "on" or "off" week
 *
 *                          // For monthly slots:
 *                          dayOfMonth: <number>
 *                              → the calendar day (1–31) the slot applies to
 *                              → e.g., { repeat: "monthly", dayOfMonth: 10 } = 10th of each month
 *                      }
 *                  ]
 *              }
 *          }
 *      }
 *  };
 *
 * Example:
 *  const availability = {
 *      "Porto": {
 *          1: { // Ginecologia/Obstetrícia
 *              daySlots: {
 *                  2: [ // Tuesday
 *                      { start: "12:00", end: "14:00", repeat: "weekly" },
 *                      { start: "15:00", end: "19:00", repeat: "biweekly", startDate: "2025-10-21" }
 *                  ],
 *                  5: [ // Friday
 *                      { start: "9:00", end: "13:20", repeat: "monthly", dayOfMonth: 10 },
 *                      { start: "15:00", end: "19:00" } // weekly by default
 *                  ]
 *              }
 *          }
 *      }
 *  };
 */

const availability = {
    "Porto": {
        1: { // Ginecologia/Obstetrícia
            daySlots: {
                2: [  // Tuesday
                    { start: "12:00", end: "14:00" },
                    { start: "15:00", end: "19:00" }
                ],
                5: [  // Friday
                    { start: "9:00", end: "13:20" },
                    { start: "15:00", end: "19:00" }
                ]
            }
        }
    },
    "Santo Tirso": {
        1: {
            daySlots: {
                1: [
                    { start: "15:00", end: "19:00" }
                ],
                3: [
                    { start: "09:00", end: "12:40", repeat: "biweekly", startDate: "2025-10-29" }
                ]
            }
        }
    }
};


const version = process.env.VERSION;
let calendarRules = { blockedDates: [], holidaysMessage: '' };
let appointments = [];
let currentStep = 0;

const currentLang = document.documentElement.lang || 'pt-PT';
const steps = document.querySelectorAll(".form-step");
const form = document.getElementById("appointmentForm");
const weekLabel = document.getElementById("weekLabel");
const calendarTable = document.getElementById("calendarTable");
const selectedSlotInput = document.getElementById("selectedSlot");
const specialty = form.elements["specialty"];
const location = form.elements["location"];

let currentYear = new Date().getFullYear();
let currentMonth = new Date().getMonth();
let currentMonday = getMonday(new Date());

// ---------------------- LOADERS ----------------------

async function loadCalendarRules() {
    try {
        const res = await fetch(`/calendar-rules.json?v=${version}`, { cache: 'no-store' });
        if (res.ok) {
            calendarRules = await res.json();
        } else {
            console.error('Failed to load calendar rules:', res.status);
        }
    } catch (e) {
        console.error('Erro ao carregar regras do calendário', e);
    }
}

async function loadAppointments() {
    try {
        const res = await fetch(`/appointments.json?v=${version}`, { cache: 'no-store' });
        if (res.ok) {
            appointments = await res.json();
        } else {
            console.error('Failed to load appointments:', res.status);
        }
    } catch (e) {
        console.error('Erro ao carregar appointments.json', e);
    }
}

// ---------------------- TIME HELPERS ----------------------

// Parse UTC string as a Date object without timezone shift
function parseUTC(dateStr) {
    return new Date(dateStr); // Date object automatically interprets Z as UTC
}

// Convert a base date + "HH:MM" string to UTC Date
function timeToUTCDate(baseDate, timeStr) {
    const [h, m] = timeStr.split(":").map(Number);
    const date = new Date(Date.UTC(baseDate.getUTCFullYear(), baseDate.getUTCMonth(), baseDate.getUTCDate(), h, m, 0));
    return date;
}

// Generate time slots between start and end in UTC
function generateTimeSlotsForDateUTC(date, start, end, interval) {
    const times = [];
    let current = timeToUTCDate(date, start);
    const limit = timeToUTCDate(date, end);
    while (current < limit) {
        times.push(new Date(current));
        current = new Date(current.getTime() + interval * 60000);
    }
    return times;
}

// Get Monday of a given date (UTC)
function getMonday(d) {
    d = new Date(d);
    const day = d.getUTCDay(),
        diff = d.getUTCDate() - day + (day === 0 ? -6 : 1);
    return new Date(Date.UTC(d.getUTCFullYear(), d.getUTCMonth(), diff));
}

// Get ISO week number
function getWeekNumber(date) {
    const d = new Date(Date.UTC(date.getUTCFullYear(), date.getUTCMonth(), date.getUTCDate()));
    d.setUTCDate(d.getUTCDate() + 4 - (d.getUTCDay() || 7));
    const yearStart = new Date(Date.UTC(d.getUTCFullYear(), 0, 1));
    return Math.ceil(((d - yearStart) / 86400000 + 1) / 7);
}

// Get the difference in full weeks between two dates (ISO weeks)
function weeksBetween(date1, date2) {
    const oneWeekMs = 7 * 24 * 60 * 60 * 1000;
    const diff = (Date.UTC(date2.getUTCFullYear(), date2.getUTCMonth(), date2.getUTCDate()) -
        Date.UTC(date1.getUTCFullYear(), date1.getUTCMonth(), date1.getUTCDate()));
    return Math.floor(diff / oneWeekMs);
}

// Determine if a slot should show based on its repeat rule
function shouldShowSlotThisWeek(slot, date) {
    const repeat = slot.repeat || "weekly";

    // --- Weekly ---
    if (repeat === "weekly") return true;

    // --- Biweekly ---
    if (repeat === "biweekly" && slot.startDate) {
        const start = new Date(slot.startDate + "T00:00:00Z");
        const weeksDiff = weeksBetween(start, date);
        return weeksDiff % 2 === 0 && date >= start;
    }

    // --- Monthly ---
    if (repeat === "monthly" && slot.dayOfMonth) {
        const sameMonth = date.getUTCDate() === slot.dayOfMonth;
        return sameMonth;
    }

    // fallback if repeat data missing
    return true;
}

// ---------------------- CALENDAR RENDERING ----------------------

function showStep(index) {
    steps.forEach((step, i) => step.classList.toggle("active", i === index));
}

window.nextStep = function () {
    const inputs = steps[currentStep].querySelectorAll("input, select");
    for (let input of inputs) {
        if (!input.checkValidity()) {
            input.reportValidity();
            return;
        }
    }
    currentStep++;
    showStep(currentStep);
    renderCalendar(currentMonday);
};

window.prevStep = function () {
    currentStep--;
    showStep(currentStep);
};

function renderCalendar(startDate) {
    selectedSlotInput.value = "";
    const settings = availability[location.value]?.[specialty.selectedIndex];
    const calendarWrap = document.querySelector(".calendar");

    const firstOfMonth = new Date(Date.UTC(currentYear, currentMonth, 1));
    const monthYear = `${firstOfMonth.toLocaleString(currentLang, { month: 'long' })} ${firstOfMonth.getUTCFullYear()}`;
    weekLabel.innerHTML = `
        <div class="calendar-header">
            <button onclick="changeMonth(-1)">&lt;</button>
            <strong>${monthYear}</strong>
            <button onclick="changeMonth(1)">&gt;</button>
        </div>
    `;

    if (!settings || !settings.daySlots) {
        calendarWrap.style.display = "none";
        calendarTable.innerHTML = "";
        return;
    } else {
        calendarWrap.style.display = "block";
    }

    let gabineteId = null;
    if (location.value === "Porto") {
        if (specialty.selectedIndex === 1) gabineteId = 1;
        else if (specialty.selectedIndex === 2) gabineteId = 2;
    } else if (location.value === "Santo Tirso") {
        if (specialty.selectedIndex === 1) gabineteId = 4;
    }

    // --- Get booked slots ---
    const bookedSlots = appointments
        .filter(a => a.IdGabinete === gabineteId)
        .map(a => ({
            start: parseUTC(a.DataInicio),
            end: parseUTC(a.DataFim)
        }));

    // --- Generate days Mon–Fri ---
    const days = [...Array(5)].map((_, i) => {
        const date = new Date(startDate);
        date.setUTCDate(startDate.getUTCDate() + i);
        return date;
    });

    const nowUTC = new Date();
    nowUTC.setUTCHours(0, 0, 0, 0);
    const tomorrowUTC = new Date(nowUTC.getTime() + 24 * 60 * 60 * 1000);

    const headers = days.map(d => {
        const isPast = d < tomorrowUTC;
        const label = d.toLocaleDateString(currentLang, { weekday: 'short', day: 'numeric', month: 'numeric' });
        return `<th class="${isPast ? 'disabled-slot' : ''}">${label}</th>`;
    }).join("");

    const interval = specialty.selectedIndex === 2 ? 30 : 20;
    const globalTimes = generateTimeSlotsForDateUTC(new Date(), "09:00", "19:00", interval);

    const rows = globalTimes.map(globalTimeUTC => {
        const timeStr = globalTimeUTC.toISOString().substr(11, 5); // HH:MM UTC
        const rowCells = days.map(dayDate => {
            const day = dayDate.getUTCDay();
            const cellTime = new Date(Date.UTC(dayDate.getUTCFullYear(), dayDate.getUTCMonth(), dayDate.getUTCDate(), globalTimeUTC.getUTCHours(), globalTimeUTC.getUTCMinutes()));

            const daySlots = settings.daySlots[day] || [];
            const isWithinAvailability = daySlots.some(slot => {
                const start = timeToUTCDate(dayDate, slot.start);
                const end = timeToUTCDate(dayDate, slot.end);
                const slotDay = dayDate.getUTCDay();
                const showThisWeek = shouldShowSlotThisWeek({ ...slot, day: slotDay }, dayDate);
                return showThisWeek && cellTime >= start && cellTime < end && cellTime >= tomorrowUTC;
            });

            // --- Check blocked / open exceptions ---
            const blockedDates = calendarRules.holidays?.[specialty.selectedIndex] || [];
            const openDates = calendarRules.openExceptions?.[specialty.selectedIndex] || [];

            const isBlocked = blockedDates.some(d => cellTime >= parseUTC(d.DataInicio) && cellTime < parseUTC(d.DataFim));
            const isOpen = openDates.some(d => cellTime >= parseUTC(d.DataInicio) && cellTime < parseUTC(d.DataFim));

            // --- Check booked slots (only consider available or open slots) ---
            const isBooked = bookedSlots.some(b => cellTime >= b.start && cellTime < b.end && (isWithinAvailability || isOpen));

            const isAvailable = ((isWithinAvailability || isOpen) && !isBooked && !isBlocked) || isOpen;

            const label = `${dayDate.toLocaleDateString()} ${timeStr}`;

            let cssClass = "disabled-slot";
            let tooltip = "";
            if (isAvailable) cssClass = "slot";
            else if (isBooked) {
                cssClass = "booked-slot";
                tooltip = "Horário já ocupado";
            } else if (isBlocked && !isOpen) {
                tooltip = calendarRules.holidaysMessage;
            } else if (isOpen) {
                tooltip = "Aberto excecionalmente";
            }

            return `<td class="${cssClass}" data-slot="${label}" ${tooltip ? `title="${tooltip}"` : ""}>${timeStr}</td>`;
        });
        return `<tr>${rowCells.join("")}</tr>`;
    });

    calendarTable.innerHTML = `
        <table>
            <thead><tr>${headers}</tr></thead>
            <tbody>${rows.join("")}</tbody>
        </table>
    `;

    document.querySelectorAll(".slot").forEach(cell => {
        cell.addEventListener("click", () => {
            document.querySelectorAll(".slot").forEach(c => c.classList.remove("selected"));
            cell.classList.add("selected");
            selectedSlotInput.value = cell.dataset.slot;
        });
    });
}

// ---------------------- EVENTS ----------------------

specialty.addEventListener("change", () => Promise.all([loadCalendarRules(), loadAppointments()]).then(() => renderCalendar(currentMonday)));
location.addEventListener("change", () => Promise.all([loadCalendarRules(), loadAppointments()]).then(() => renderCalendar(currentMonday)));

window.changeWeek = async function (offset) {
    currentMonday.setUTCDate(currentMonday.getUTCDate() + offset * 7);
    currentYear = currentMonday.getUTCFullYear();
    currentMonth = currentMonday.getUTCMonth();
    renderCalendar(currentMonday);
};

window.changeMonth = function (monthOffset) {
    const newDate = new Date(Date.UTC(currentYear, currentMonth + monthOffset, 1));
    let firstDay = newDate.getUTCDay();
    if (firstDay === 6) newDate.setUTCDate(newDate.getUTCDate() + 2);
    else if (firstDay === 0) newDate.setUTCDate(newDate.getUTCDate() + 1);
    currentYear = newDate.getUTCFullYear();
    currentMonth = newDate.getUTCMonth();
    currentMonday = getMonday(newDate);
    renderCalendar(currentMonday);
};

// ---------------------- FORM SUBMISSION ----------------------

form.addEventListener("submit", function (e) {
    e.preventDefault();
    if (!selectedSlotInput.value && availability[form.elements["location"].value]?.[form.elements["specialty"].value]) {
        alert("Por favor selecione um horário.");
        return;
    }

    const response = grecaptcha.getResponse();
    if (!response) {
        alert("Por favor confirma que não és um robô.");
        return;
    }

    const formData = {
        name: document.getElementById('name').value,
        email: document.getElementById('email').value,
        birthday: document.getElementById('birthday').value,
        contact: document.getElementById('contact').value,
        specialty: specialty.value,
        location: location.value,
        selectedSlot: selectedSlotInput.value || "Sem horário selecionado",
        notes: form.querySelector('[name="notes"]')?.value || ""
    };

    emailjs.send("service_2mkemrj", "template_yaezzgg", formData).then(() => {
        currentStep = 0;
        showStep(currentStep);
        emailjs.send("service_2mkemrj", "template_ppny0sk", formData)
            .then(() => {
                const statusMsg = document.getElementById("statusMsg");
                if (currentLang === "en") statusMsg.textContent = "Appointment request successfully submitted! Pending confirmation.";
                else if (currentLang === "es") statusMsg.textContent = "¡Solicitud de cita enviada correctamente! Pendiente de confirmación.";
                else statusMsg.textContent = "Pedido de agendamento enviado com sucesso! Pendente de confirmação.";
                form.reset();
            })
            .catch(error => {
                console.error("Erro no email do cliente:", error);
                const statusMsg = document.getElementById("statusMsg");
                if (currentLang === "en") statusMsg.textContent = "Error sending confirmation email. Please try again.";
                else if (currentLang === "es") statusMsg.textContent = "Error al enviar el correo electrónico de confirmación. Por favor, inténtalo de nuevo.";
                else statusMsg.textContent = "Erro ao enviar o e-mail de confirmação. Por favor tente novamente.";
                currentStep = 0;
                showStep(currentStep);
            });
    }).catch(error => {
        console.error("Erro no email da clínica:", error);
        const statusMsg = document.getElementById("statusMsg");
        if (currentLang === "en") statusMsg.textContent = "Error sending email. Please try again.";
        else if (currentLang === "es") statusMsg.textContent = "Error al enviar el correo electrónico. Por favor, inténtalo de nuevo.";
        else statusMsg.textContent = "Erro ao enviar o e-mail. Por favor tente novamente.";
        currentStep = 0;
        showStep(currentStep);
    });
});

// ---------------------- INIT ----------------------

(async () => {
    await loadCalendarRules();
    await loadAppointments();
    showStep(0);
})();
