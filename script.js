(function () {
    // ---- Tab switching ----
    const tabs = document.querySelectorAll('.tab-btn');
    const panels = {
        timetable: document.getElementById('timetable'),
        map: document.getElementById('map'),
        booking: document.getElementById('booking')
    };
    tabs.forEach(btn => {
        btn.addEventListener('click', () => {
            const tabId = btn.dataset.tab;
            tabs.forEach(b => b.classList.remove('active'));
            btn.classList.add('active');
            Object.values(panels).forEach(p => p.classList.remove('active'));
            if (panels[tabId]) panels[tabId].classList.add('active');
        });
    });

    // ---- Constants ----
    const PX_PER_HOUR = 48;
    const DAY_START_HOUR = 7;            // timetable in screenshot starts at 7am
    const DAY_END_HOUR = 18;             // ends at 6pm
    const WEEK_START = '2026-10-26';     // Monday 26 Oct 2026
    const WEEK_END = '2026-11-01';     // Sunday 1 Nov 2026

    // Official University of Hull Computer Science lecturers
    const HULL_LECTURERS = [
        { name: 'Dr Adeel Mehmood', role: 'Lecturer' },
        { name: 'Mr Baseer Ahmad', role: 'Lecturer in Robotics and AI' },
        { name: 'Dr John Dixon', role: 'Lecturer / Programme Lead' },
        { name: 'Dr David Parker', role: 'Senior Lecturer' },
        { name: 'Dr Muhammad Khalid', role: 'Lecturer / Assistant Professor' },
        { name: 'Dr Peter Robinson', role: 'Senior Lecturer' },
        { name: 'Darren McKie', role: 'Lecturer / Director of Student Experience' },
        { name: 'Dr Xinhui Ma', role: 'Lecturer' },
        { name: 'Dr Tareq Al Jaber', role: 'Lecturer / Assistant Professor' },
        { name: 'Dr Jamshed Iqbal', role: 'Senior Lecturer' },
        { name: 'Professor Neil Gordon', role: 'Professor in Computer Science' },
        { name: 'Professor Dhaval Thakker', role: 'Professor of AI and IoT' },
        { name: 'Professor Fiona Polack', role: 'Professor and Head of School' }
    ];

    // Baseline timetable from the screenshot
    const BASE_TIMETABLE = {
        Monday: [
            {
                time: '09:00', end: '11:00',
                module: 'Professional Development [Lab]', code: '441108_A26_T1L1ab1/01',
                lecturer: 'John Whelan',
                location: 'Robert Blackburn Building - Room 209A',
                roomType: 'PC Computer Science Engineering Image - Second Floor',
                icon: 'fa-chalkboard-teacher'
            },
            {
                time: '14:00', end: '15:00',
                module: 'Professional Development [Lec]', code: '441108_A26_T1L1/01 <07-08, 10-13>',
                lecturer: 'John Whelan',
                location: 'Wilberforce Building - Lecture Theatre 15',
                roomType: 'Ground Floor',
                icon: 'fa-chalkboard-teacher'
            },
            {
                time: '15:00', end: '16:00',
                module: 'Extra-Curricular Activities [Lec]', code: '441190_A26_T12L1/01, 441108_A26_T11/2/01 - J/T',
                lecturer: 'John Whelan',
                location: 'Wilberforce Building - Lecture Theatre 15',
                roomType: 'Ground Floor',
                icon: 'fa-star'
            }
        ],
        Tuesday: [
            {
                time: '09:00', end: '10:00',
                module: 'Programming Portfolio [Lec]', code: '441101_A26_T12L1/01 <04-08>',
                lecturer: 'Simon Grey',
                location: 'Wilberforce Building - Lecture Theatre 2',
                roomType: 'First Floor',
                icon: 'fa-laptop-code'
            },
            {
                time: '14:00', end: '15:00',
                module: 'Algorithms and Data Structures [Lec]', code: '441105_A26_T1L2/01 <04-08>',
                lecturer: 'Zhibao Mian',
                location: 'Wilberforce Building - Lecture Theatre 2',
                roomType: 'First Floor',
                icon: 'fa-calculator'
            },
            {
                time: '16:00', end: '17:00',
                module: 'Algorithms and Data Structures [Prac]', code: '441105_A26_T1P1/01 <04-08>',
                lecturer: 'Zhibao Mian',
                location: 'Fenner Building - Room 052 B&C',
                roomType: 'Computer Science Engineering Image - Ground Floor',
                icon: 'fa-code'
            }
        ],
        Wednesday: [],
        Thursday: [
            {
                time: '09:00', end: '10:00',
                module: 'Algorithms and Data Structures [Lec]', code: '441105_A26_T1L1/01 <04-08>',
                lecturer: 'Zhibao Mian',
                location: 'Larkin Building - Lecture Theatre C',
                roomType: 'Ground Floor',
                icon: 'fa-calculator'
            },
            {
                time: '10:00', end: '11:00',
                module: 'Programming Portfolio [Lec]', code: '441101_A26_T12L2/01 <08-15>',
                lecturer: 'Simon Grey',
                location: 'Robert Blackburn Building - Lecture Theatre A',
                roomType: 'Ground Floor',
                icon: 'fa-laptop-code'
            }
        ],
        Friday: [
            {
                time: '13:00', end: '15:00',
                module: 'Programming Portfolio [Lab]', code: '441101_A26_T12Lab1/02',
                lecturer: 'Simon Grey',
                location: 'Fenner Building - Room 052 B&C',
                roomType: 'Computer Science Engineering Image - Ground Floor',
                icon: 'fa-laptop-code'
            }
        ]
    };

    const roomBookings = [];
    const libraryBookings = [];
    const meetingBookings = [];
    let meetingIdCounter = 0;

    // ---- Helpers ----
    const toMin = t => { const [h, m] = t.split(':').map(Number); return h * 60 + m; };
    const toHM = mins => `${String(Math.floor(mins / 60)).padStart(2, '0')}:${String(mins % 60).padStart(2, '0')}`;
    const roundTo15 = mins => Math.round(mins / 15) * 15;
    const formatDate = dateStr => {
        if (!dateStr) return '—';
        const d = new Date(dateStr + 'T00:00:00');
        return d.toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' });
    };
    const getDayName = dateStr => new Date(dateStr + 'T00:00:00').toLocaleDateString('en-GB', { weekday: 'long' });
    const isWeekend = dateStr => { const d = new Date(dateStr + 'T00:00:00').getDay(); return d === 0 || d === 6; };
    const isInDisplayedWeek = dateStr => dateStr >= WEEK_START && dateStr <= WEEK_END;
    const dateForDay = dayName => ({
        Monday: '2026-10-26', Tuesday: '2026-10-27', Wednesday: '2026-10-28',
        Thursday: '2026-10-29', Friday: '2026-10-30'
    }[dayName] || '2026-10-26');

    function sizeFor(heightPx) {
        if (heightPx < 48) return 'tiny';
        if (heightPx < 72) return 'small';
        if (heightPx < 120) return 'medium';
        return 'large';
    }
    function durationLabel(startTime, endTime) {
        const mins = toMin(endTime) - toMin(startTime);
        const h = Math.floor(mins / 60);
        const m = mins % 60;
        if (h && m) return `${h}h ${m}m`;
        if (h) return `${h} hour${h > 1 ? 's' : ''}`;
        return `${m} minutes`;
    }

    // ---- Populate lecturer dropdowns ----
    function populateLecturerSelect(selectEl) {
        selectEl.innerHTML = HULL_LECTURERS.map(l =>
            `<option value="${l.name}">${l.name} — ${l.role}</option>`
        ).join('');
    }
    populateLecturerSelect(document.getElementById('meetLecturer'));
    populateLecturerSelect(document.getElementById('modalLecturer'));

    // ---- Toggle lecturer dropdown visibility ----
    document.getElementById('meetWithType').addEventListener('change', (e) => {
        document.getElementById('meetLecturerGroup').style.display =
            e.target.value === 'lecturer' ? 'block' : 'none';
    });
    document.getElementById('modalWithType').addEventListener('change', (e) => {
        document.getElementById('modalLecturerGroup').style.display =
            e.target.value === 'lecturer' ? 'block' : 'none';
    });

    // ---- Build time axis ----
    function buildTimeAxis(totalHeight) {
        const axis = document.createElement('div');
        axis.className = 'time-axis';
        const label = document.createElement('div');
        label.className = 'time-axis-label';
        label.style.height = totalHeight + 'px';
        for (let h = DAY_START_HOUR; h <= DAY_END_HOUR; h++) {
            const tick = document.createElement('div');
            tick.className = 'time-tick';
            tick.style.top = ((h - DAY_START_HOUR) * PX_PER_HOUR) + 'px';
            const fmt = h === 12 ? '12pm' : (h > 12 ? `${h - 12}pm` : `${h}am`);
            tick.innerHTML = `<span>${fmt}</span>`;
            label.appendChild(tick);
        }
        axis.appendChild(label);
        return axis;
    }

    // ---- Lesson details modal ----
    const lessonModal = document.getElementById('lessonModal');
    const lessonModalHeader = document.getElementById('lessonModalHeader');
    const lessonDetails = document.getElementById('lessonDetails');
    function openLessonModal(lesson, dayName, date) {
        lessonModalHeader.innerHTML = `<i class="fas ${lesson.icon}"></i> ${lesson.module} · ${formatDate(date)} (${dayName})`;
        lessonDetails.innerHTML = `
      <div class="detail-row"><dt>Module code</dt><dd>${lesson.code || '—'}</dd></div>
      <div class="detail-row"><dt>Lecturer</dt><dd>${lesson.lecturer || '—'}</dd></div>
      <div class="detail-row"><dt>Room type</dt><dd>${lesson.roomType || '—'}</dd></div>
      <div class="detail-row"><dt>Location</dt><dd><i class="fas fa-location-dot"></i> ${lesson.location || '—'}</dd></div>
      <div class="detail-row"><dt>Starts</dt><dd>${lesson.time}</dd></div>
      <div class="detail-row"><dt>Ends</dt><dd>${lesson.end}</dd></div>
      <div class="detail-row"><dt>Duration</dt><dd>${durationLabel(lesson.time, lesson.end)}</dd></div>
    `;
        lessonModal.classList.add('show');
    }
    document.getElementById('lessonCloseBtn').addEventListener('click', () => {
        lessonModal.classList.remove('show');
    });
    lessonModal.addEventListener('click', (e) => {
        if (e.target === lessonModal) lessonModal.classList.remove('show');
    });

    // ---- Render timetable ----
    function renderTimetable() {
        const dayNames = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday'];
        const totalHeight = (DAY_END_HOUR - DAY_START_HOUR) * PX_PER_HOUR;
        const weekGrid = document.getElementById('weekGrid');
        if (!weekGrid) return;

        if (!weekGrid.parentElement.classList.contains('timetable-wrap')) {
            const wrap = document.createElement('div');
            wrap.className = 'timetable-wrap';
            weekGrid.parentNode.insertBefore(wrap, weekGrid);
            wrap.appendChild(buildTimeAxis(totalHeight));
            wrap.appendChild(weekGrid);
        }

        dayNames.forEach(dayName => {
            const slotsContainer = document.getElementById('slots-' + dayName);
            if (!slotsContainer) return;
            slotsContainer.innerHTML = '';

            const timeline = document.createElement('div');
            timeline.className = 'timeline';
            timeline.style.height = totalHeight + 'px';

            timeline.addEventListener('click', (e) => {
                if (e.target.closest('.tt-slot, .meeting-slot')) return;
                const rect = timeline.getBoundingClientRect();
                const clickY = e.clientY - rect.top;
                const minutesFromStart = Math.max(0, Math.min(totalHeight, clickY)) / PX_PER_HOUR * 60;
                const rounded = roundTo15(minutesFromStart);
                const clamped = Math.max(0, Math.min((DAY_END_HOUR - DAY_START_HOUR) * 60 - 60, rounded));
                const startTime = toHM(DAY_START_HOUR * 60 + clamped);
                const dayDate = dateForDay(dayName);
                openModalForSlot({
                    day: dayName, date: dayDate,
                    timeRange: `${startTime}–${toHM(toMin(startTime) + 60)}`,
                    moduleName: '', location: ''
                });
            });

            const events = [];
            (BASE_TIMETABLE[dayName] || []).forEach(c => events.push({ kind: 'class', ...c }));
            meetingBookings.forEach(m => {
                if (getDayName(m.date) !== dayName) return;
                if (!isInDisplayedWeek(m.date)) return;
                if (isWeekend(m.date)) return;
                events.push({
                    kind: 'meeting', id: m.id,
                    start: m.time, end: toHM(toMin(m.time) + 60),
                    title: m.reason, location: m.location || 'TBC', date: m.date,
                    withType: m.withType, lecturer: m.lecturer
                });
            });

            events.forEach(ev => {
                const startMin = toMin(ev.start || ev.time);
                const endMin = toMin(ev.end);
                const topPx = (startMin - DAY_START_HOUR * 60) / 60 * PX_PER_HOUR;
                const heightPx = (endMin - startMin) / 60 * PX_PER_HOUR;
                const timeRange = `${ev.start || ev.time}–${ev.end}`;
                const dayDate = dateForDay(dayName);
                const size = sizeFor(heightPx);

                let el;
                if (ev.kind === 'class') {
                    el = document.createElement('div');
                    el.className = 'tt-slot';
                    el.dataset.size = size;
                    el.style.top = topPx + 'px';
                    el.style.height = heightPx + 'px';
                    el.innerHTML = `
            <div class="slot-header">
              <i class="fas ${ev.icon}"></i>
              <span class="slot-time">${ev.time}</span>
            </div>
            <span class="slot-title">${ev.module}</span>
            <span class="slot-meta"><i class="fas fa-location-dot"></i> ${ev.location}</span>
            <span class="slot-meta"><i class="fas fa-clock"></i> ${timeRange}</span>
          `;
                    el.addEventListener('click', (e) => {
                        e.stopPropagation();
                        openLessonModal(ev, dayName, dayDate);
                    });
                } else {
                    el = document.createElement('div');
                    el.className = 'tt-slot meeting-slot';
                    el.dataset.size = size;
                    el.style.top = topPx + 'px';
                    el.style.height = heightPx + 'px';
                    const withLabel = ev.withType === 'lecturer' ? ev.lecturer : 'Students';
                    el.innerHTML = `
            <button class="remove-meeting" title="Remove meeting" aria-label="Remove meeting"><i class="fas fa-times"></i></button>
            <div class="slot-header">
              <i class="fas fa-handshake"></i>
              <span class="slot-time">${ev.start}</span>
            </div>
            <span class="slot-title">${ev.title}</span>
            <span class="slot-date">${formatDate(ev.date)}</span>
            <span class="slot-meta"><i class="fas fa-user"></i> ${withLabel}</span>
            <span class="slot-meta"><i class="fas fa-location-dot"></i> ${ev.location}</span>
            <span class="slot-meta"><i class="fas fa-clock"></i> ${timeRange}</span>
          `;
                    el.addEventListener('click', (e) => {
                        e.stopPropagation();
                        if (e.target.closest('.remove-meeting')) return;
                        openModalForMeeting(meetingBookings.find(m => m.id === ev.id));
                    });
                    el.querySelector('.remove-meeting').addEventListener('click', (e) => {
                        e.stopPropagation();
                        const m = meetingBookings.find(x => x.id === ev.id);
                        if (!m) return;
                        if (confirm(`Remove meeting "${m.reason}"?`)) {
                            const idx = meetingBookings.findIndex(x => x.id === ev.id);
                            if (idx !== -1) meetingBookings.splice(idx, 1);
                            renderMeetingBookings();
                            renderTimetable();
                        }
                    });
                }
                timeline.appendChild(el);
            });

            slotsContainer.appendChild(timeline);
        });
    }

    // ---- Booking lists ----
    function renderRoomBookings() {
        const list = document.getElementById('roomBookingsList');
        if (roomBookings.length === 0) {
            list.innerHTML = '<div style="color:#7b98b3; font-size:0.85rem; padding:0.5rem 0;"><i class="fas fa-info-circle"></i> No rooms booked yet.</div>';
            return;
        }
        list.innerHTML = roomBookings.map(b => `
      <div class="booking-item">
        <i class="fas fa-door-open"></i>
        <div class="info"><strong>${b.room}</strong><small>${formatDate(b.date)} · ${b.time}</small></div>
      </div>
    `).join('');
    }
    function renderLibraryBookings() {
        const list = document.getElementById('libraryBookingsList');
        if (libraryBookings.length === 0) {
            list.innerHTML = '<div style="color:#7b98b3; font-size:0.85rem; padding:0.5rem 0;"><i class="fas fa-info-circle"></i> No library spaces booked yet.</div>';
            return;
        }
        list.innerHTML = libraryBookings.map(b => `
      <div class="booking-item">
        <i class="fas fa-book-open"></i>
        <div class="info"><strong>${b.space}</strong><small>${formatDate(b.date)} · ${b.time}</small></div>
      </div>
    `).join('');
    }
    function renderMeetingBookings() {
        const list = document.getElementById('meetingBookingsList');
        if (meetingBookings.length === 0) {
            list.innerHTML = '<div style="color:#7b98b3; font-size:0.85rem; padding:0.5rem 0;"><i class="fas fa-info-circle"></i> No meetings scheduled.</div>';
            return;
        }
        list.innerHTML = meetingBookings.map(m => {
            const withLabel = m.withType === 'lecturer' ? m.lecturer : 'Students';
            return `
        <div class="booking-item">
          <i class="fas fa-handshake"></i>
          <div class="info">
            <strong>${m.reason}</strong>
            <small>${formatDate(m.date)} (${getDayName(m.date)}) · ${m.time}${m.location ? ' · ' + m.location : ''} · With: ${withLabel}</small>
          </div>
        </div>
      `;
        }).join('');
    }

    // ---- Booking actions ----
    document.getElementById('bookRoomBtn').addEventListener('click', () => {
        const room = document.getElementById('roomSelect').value;
        const date = document.getElementById('roomDate').value;
        const time = document.getElementById('roomTime').value;
        if (!date) { alert('Please select a date.'); return; }
        roomBookings.push({ room, date, time });
        renderRoomBookings();
    });
    document.getElementById('bookLibraryBtn').addEventListener('click', () => {
        const space = document.getElementById('librarySelect').value;
        const date = document.getElementById('libraryDate').value;
        const time = document.getElementById('libraryTime').value;
        if (!date) { alert('Please select a date.'); return; }
        libraryBookings.push({ space, date, time });
        renderLibraryBookings();
    });
    document.getElementById('scheduleMeetingBtn').addEventListener('click', () => {
        const reason = document.getElementById('meetReason').value.trim() || 'Meeting';
        const date = document.getElementById('meetDate').value;
        const time = document.getElementById('meetTime').value;
        const location = document.getElementById('meetLocation').value.trim();
        const withType = document.getElementById('meetWithType').value;
        const lecturer = withType === 'lecturer'
            ? document.getElementById('meetLecturer').value
            : null;
        if (!date) { alert('Please pick a date.'); return; }
        if (!time) { alert('Please pick a time.'); return; }
        if (isWeekend(date)) { alert('Meetings cannot be scheduled on weekends. Please choose a weekday (Mon–Fri).'); return; }
        meetingBookings.push({ id: ++meetingIdCounter, reason, date, time, location, withType, lecturer });
        renderMeetingBookings();
        renderTimetable();
        document.getElementById('meetReason').value = 'Project discussion';
    });

    // ---- Meeting modal ----
    const modal = document.getElementById('meetingModal');
    const modalSlotInfo = document.getElementById('modalSlotInfo');
    const modalReason = document.getElementById('modalReason');
    const modalDate = document.getElementById('modalDate');
    const modalTime = document.getElementById('modalTime');
    const modalLocation = document.getElementById('modalLocation');

    function openModalForSlot({ day, date, timeRange, moduleName, location }) {
        const startTime = (timeRange.split('–')[0] || '10:00').trim();
        modalSlotInfo.innerHTML = `<i class="fas fa-calendar-day"></i> ${day} · ${timeRange} · ${formatDate(date)}`;
        modalReason.value = 'Study session';
        modalDate.value = date;
        modalTime.value = /^\d{2}:\d{2}$/.test(startTime) ? startTime : '10:00';
        modalLocation.value = location || 'Library pod 2';
        document.getElementById('modalWithType').value = 'students';
        document.getElementById('modalLecturerGroup').style.display = 'none';
        delete modal.dataset.editId;
        modal.dataset.mode = 'new';
        modal.classList.add('show');
    }
    function openModalForMeeting(meeting) {
        if (!meeting) return;
        modalSlotInfo.innerHTML = `<i class="fas fa-pen"></i> Editing meeting · ${formatDate(meeting.date)} (${getDayName(meeting.date)})`;
        modalReason.value = meeting.reason;
        modalDate.value = meeting.date;
        modalTime.value = meeting.time;
        modalLocation.value = meeting.location || '';
        const wt = meeting.withType || 'students';
        document.getElementById('modalWithType').value = wt;
        document.getElementById('modalLecturerGroup').style.display = wt === 'lecturer' ? 'block' : 'none';
        if (wt === 'lecturer' && meeting.lecturer) {
            document.getElementById('modalLecturer').value = meeting.lecturer;
        }
        modal.dataset.editId = meeting.id;
        modal.dataset.mode = 'edit';
        modal.classList.add('show');
    }
    document.getElementById('modalCancelBtn').addEventListener('click', () => {
        modal.classList.remove('show');
        delete modal.dataset.editId;
        delete modal.dataset.mode;
    });
    modal.addEventListener('click', (e) => {
        if (e.target === modal) {
            modal.classList.remove('show');
            delete modal.dataset.editId;
            delete modal.dataset.mode;
        }
    });
    document.getElementById('modalConfirmBtn').addEventListener('click', () => {
        const reason = modalReason.value.trim() || 'Meeting';
        const date = modalDate.value;
        const time = modalTime.value;
        const location = modalLocation.value.trim();
        const withType = document.getElementById('modalWithType').value;
        const lecturer = withType === 'lecturer'
            ? document.getElementById('modalLecturer').value
            : null;
        if (!date) { alert('Please choose a date.'); return; }
        if (!time) { alert('Please choose a time.'); return; }
        if (isWeekend(date)) { alert('Meetings cannot be scheduled on weekends. Please choose a weekday (Mon–Fri).'); return; }

        const mode = modal.dataset.mode;
        const editId = modal.dataset.editId;
        if (mode === 'edit' && editId) {
            const idx = meetingBookings.findIndex(m => m.id === parseInt(editId, 10));
            if (idx !== -1) meetingBookings.splice(idx, 1);
        }
        meetingBookings.push({ id: ++meetingIdCounter, reason, date, time, location, withType, lecturer });
        renderMeetingBookings();
        renderTimetable();
        document.querySelector('.tab-btn[data-tab="timetable"]').click();
        modal.classList.remove('show');
        delete modal.dataset.editId;
        delete modal.dataset.mode;
    });

    // ---- Initial renders (no auto meeting) ----
    renderRoomBookings();
    renderLibraryBookings();
    renderMeetingBookings();
    renderTimetable();
})();