// npm run build

import emailjs from '@emailjs/browser';

emailjs.init("c0UqVFYtByUWzi-5c");

const availability = {
    "Porto": {
        1: { // Ginecologia/Obstetrícia
            daySlots: {
                2: [  // Tuesday
                    { start: "10:20", end: "13:20" },
                    { start: "15:00", end: "19:00" }
                ],
                5: [  // Friday
                    { start: "10:20", end: "13:20" },
                    { start: "15:00", end: "19:00" }
                ]
            }
        },
        2: { // Pediatria
            daySlots: {
                2: [
                    { start: "15:00", end: "18:00" }
                ]
            }
        }
    },
    "Santo Tirso": {
        1: { // Ginecologia/Obstetrícia
            daySlots: {
                1: [ // Monday
                    { start: "15:00", end: "19:00" }
                ],
                3: [ // Wednesday
                    { start: "09:00", end: "12:40" }
                ]
            }
        }
    }
};

let currentStep = 0;
// Get the current language from the <html> tag
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
let currentMonday = getMonday(new Date(currentYear, currentMonth, 1));

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

function getMonday(d) {
    d = new Date(d);
    const day = d.getDay(),
        diff = d.getDate() - day + (day === 0 ? -6 : 1);
    return new Date(d.setDate(diff));
}

function timeToDate(baseDate, timeStr) {
    const [h, m] = timeStr.split(":").map(Number);
    const date = new Date(baseDate);
    date.setHours(h, m, 0, 0);
    return date;
}

// Generate time slots between start and end for a specific date and interval
function generateTimeSlotsForDate(date, start, end, interval) {
    const times = [];
    let current = timeToDate(date, start);
    const limit = timeToDate(date, end);
    while (current <= limit) {
        times.push(new Date(current));
        current = new Date(current.getTime() + interval * 60000); // add interval in ms
    }
    return times;
}

function renderCalendar(startDate) {
    selectedSlotInput.value = "";
    const settings = availability[location.value]?.[specialty.selectedIndex];
    const calendarWrap = document.querySelector(".calendar");

    const firstOfMonth = new Date(currentYear, currentMonth, 1);
    const monthYear = `${firstOfMonth.toLocaleString(currentLang, { month: 'long' })} ${firstOfMonth.getFullYear()}`;
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

    // 5 days from Monday to Friday
    const days = [...Array(5)].map((_, i) => {
        const date = new Date(startDate);
        date.setDate(startDate.getDate() + i);
        return date;
    });

    const headers = days.map(d => `<th>${d.toLocaleDateString(currentLang, { weekday: 'short', day: 'numeric', month: 'numeric' })}</th>`).join("");

    // Global time range for rows: from 10:00 to 19:00, 20-minute intervals
    const globalTimes = generateTimeSlotsForDate(new Date(), "09:00", "19:00", 20);

    // Build each row per time, but for each column/day generate date-based time for comparison
    const rows = globalTimes.map(globalTime => {
        const timeStr = globalTime.toTimeString().slice(0, 5);
        const rowCells = days.map(dayDate => {
            const day = dayDate.getDay();
            // Generate actual slot time for this cell day
            const cellTime = timeToDate(dayDate, timeStr);

            // Check if cellTime is in availability ranges for this day
            const daySlots = settings.daySlots[day] || [];
            const isAvailable = daySlots.some(slot => {
                const start = timeToDate(dayDate, slot.start);
                const end = timeToDate(dayDate, slot.end);
                return cellTime >= start && cellTime <= end;
            });

            const label = `${dayDate.toLocaleDateString()} ${timeStr}`;
            return `<td class="${isAvailable ? 'slot' : 'disabled-slot'}" data-slot="${label}">${timeStr}</td>`;
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

specialty.addEventListener("change", () => renderCalendar(currentMonday));
location.addEventListener("change", () => renderCalendar(currentMonday));

window.changeWeek = function (offset) {
    currentMonday.setDate(currentMonday.getDate() + offset * 7);

    currentYear = currentMonday.getFullYear();
    currentMonth = currentMonday.getMonth();

    renderCalendar(currentMonday);
};

window.changeMonth = function (monthOffset) {
    const newDate = new Date(currentYear, currentMonth + monthOffset, 1);
    let firstDay = newDate.getDay();

    if (firstDay === 6) {
        newDate.setDate(newDate.getDate() + 2);
    } else if (firstDay === 0) {
        newDate.setDate(newDate.getDate() + 1);
    }

    currentYear = newDate.getFullYear();
    currentMonth = newDate.getMonth();

    currentMonday = getMonday(newDate);
    renderCalendar(currentMonday);
};

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
                if (document.documentElement.lang == "en") {
                    document.getElementById("statusMsg").textContent = "Appointment request successfully submitted! Pending confirmation.";
                } else if (document.documentElement.lang == "es") {
                    document.getElementById("statusMsg").textContent = "¡Solicitud de cita enviada correctamente! Pendiente de confirmación.";
                } else {
                    document.getElementById("statusMsg").textContent = "Pedido de agendamento enviado com sucesso! Pendente de confirmação.";
                }
                form.reset();
            })
            .catch(error => {
                console.error("Erro no email do cliente:", error);
                if (document.documentElement.lang == "en") {
                    document.getElementById("statusMsg").textContent = "Error sending confirmation email. Please try again.";
                } else if (document.documentElement.lang == "es") {
                    document.getElementById("statusMsg").textContent = "Error al enviar el correo electrónico de confirmación. Por favor, inténtalo de nuevo.";
                } else {
                    document.getElementById("statusMsg").textContent = "Erro ao enviar o e-mail de confirmação. Por favor tente novamente.";
                }
                currentStep = 0;
                showStep(currentStep);
            });
    }).catch(error => {
        console.error("Erro no email da clínica:", error);
        if (document.documentElement.lang == "en") {
            document.getElementById("statusMsg").textContent = "Error sending email. Please try again.";
        } else if (document.documentElement.lang == "es") {
            document.getElementById("statusMsg").textContent = "Error al enviar el correo electrónico. Por favor, inténtalo de nuevo.";
        } else {
            document.getElementById("statusMsg").textContent = "Erro ao enviar o e-mail. Por favor tente novamente.";
        }
        currentStep = 0;
        showStep(currentStep);
    });
});

showStep(0);
