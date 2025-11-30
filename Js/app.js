 /**
 * School Result Management System - Fixed Calculation Engine
 */

 /**
 * School Result Management System - Fixed Calculation Engine
 */

const app = {
    // --- 1. INITIALIZATION ---
    init: () => {
        if (typeof DB === 'undefined' || typeof Utils === 'undefined') {
            alert('System Error: Essential files missing.'); return;
        }
        DB.init();
        
        // Ensure Database Arrays Exist
        ['classes', 'subjects', 'students', 'results', 'settings'].forEach(table => {
            const data = DB.read(table);
            if (!data || (table !== 'settings' && !Array.isArray(data))) {
                DB.write(table, table === 'settings' ? {} : []);
            }
        });

        app.nav('dashboard');
    },

    // --- 2. NAVIGATION ---
    nav: (view) => {
        const container = document.getElementById('view-container');
        const title = document.getElementById('page-title');
        
        if(title) title.innerText = view.charAt(0).toUpperCase() + view.slice(1);
        
        if (app.views[view]) {
            container.innerHTML = app.views[view]();
            // Initialize specific pages
            if(view === 'students') app.handlers.initStudentsPage();
            if(view === 'settings') app.handlers.initSettingsPage();
            if(view === 'results') app.handlers.initResultsPage();
        }
        // Auto-close menu on mobile
        if(window.innerWidth < 768) ui.toggleSidebar();
    },

    // --- 3. VIEWS ---
    views: {
        dashboard: () => `
            <div class="grid-2">
                <div class="card"><h3>Total Students</h3><p class="display-4">${DB.read('students').length}</p></div>
                <div class="card"><h3>Classes</h3><p class="display-4">${DB.read('classes').length}</p></div>
                <div class="card"><h3>Subjects</h3><p class="display-4">${DB.read('subjects').length}</p></div>
            </div>`,
        
        settings: () => `
            <div class="grid-2">
                <div class="card">
                    <h3>School Identity</h3>
                    <form onsubmit="app.handlers.saveSchoolDetails(event)">
                        <div class="form-group"><label>School Name</label><input type="text" id="set-name" class="form-control"></div>
                        <div class="form-group"><label>Address</label><input type="text" id="set-addr" class="form-control"></div>
                        <div class="form-group"><label>Motto</label><input type="text" id="set-motto" class="form-control" placeholder="e.g. Knowledge is Power"></div>
                        <div class="form-group"><label>School Logo</label><input type="file" id="set-logo" class="form-control" accept="image/*"></div>
                        <button class="btn btn-primary">Save Details</button>
                    </form>
                </div>
                <div class="card">
                    <h3>Manage Academic Data</h3>
                    <div class="form-group grid-2"><input type="text" id="new-class" class="form-control" placeholder="Class Name"><button onclick="app.handlers.addClass()" class="btn">Add Class</button></div><ul id="class-list"></ul>
                    <hr>
                    <div class="form-group grid-2"><input type="text" id="new-subject" class="form-control" placeholder="Subject Name"><button onclick="app.handlers.addSubject()" class="btn">Add Subject</button></div><ul id="subject-list"></ul>
                </div>
            </div>`,
        
        students: () => `
            <div class="card"><h3>Register Student</h3><form onsubmit="app.handlers.saveStudent(event)"><div class="grid-2">
            <input name="name" placeholder="Full Name" class="form-control" required><input name="admNo" placeholder="Admission No" class="form-control" required>
            <select name="className" id="std-class-select" class="form-control" required></select><input type="file" id="std-photo" class="form-control" accept="image/*">
            </div><button class="btn btn-primary">Save Student</button></form></div>
            <div class="card"><h3>Student List</h3><input id="search-std" class="form-control" placeholder="Search..." onkeyup="app.handlers.searchStudent()"><table id="student-table"><tbody></tbody></table></div>`,
        
        results: () => `
            <div class="card grid-2"><select id="res-class" class="form-control" onchange="app.handlers.loadResultSheet()"></select><select id="res-subject" class="form-control" onchange="app.handlers.loadResultSheet()"></select></div>
            <div id="result-area" class="card hidden"><table id="res-table"><thead><tr><th>Student</th><th>Test(40)</th><th>Exam(60)</th><th>Total</th><th>Grd</th></tr></thead><tbody></tbody></table><button class="btn btn-primary" onclick="app.handlers.saveResults()">Save & Calculate Positions</button></div>`,
        
        reports: () => `
            <div class="card no-print grid-2"><input id="rep-adm" class="form-control" placeholder="Enter Admission No"><button class="btn btn-primary" onclick="app.handlers.generateReport()">Generate Result Sheet</button></div>
            <div id="report-output"></div>`
    },

    // --- 4. HANDLERS ---
    handlers: {
        // SETTINGS
        initSettingsPage: () => {
            const s = DB.read('settings');
            if(s.schoolName) { 
                document.getElementById('set-name').value = s.schoolName; 
                document.getElementById('set-addr').value = s.address; 
                document.getElementById('set-motto').value = s.motto || ''; 
            }
            app.handlers.renderList('classes', 'class-list'); 
            app.handlers.renderList('subjects', 'subject-list');
        },
        saveSchoolDetails: async (e) => {
            e.preventDefault(); 
            const file = document.getElementById('set-logo').files[0]; 
            let logo = null; if (file) logo = await Utils.fileToBase64(file);
            const s = DB.read('settings');
            DB.write('settings', { 
                ...s, 
                schoolName: document.getElementById('set-name').value, 
                address: document.getElementById('set-addr').value, 
                motto: document.getElementById('set-motto').value, 
                logo: logo || s.logo 
            });
            alert('Settings Saved!');
        },
        addClass: () => app.handlers.addItem('classes', 'new-class'), 
        addSubject: () => app.handlers.addItem('subjects', 'new-subject'),
        addItem: (t, id) => { const v = document.getElementById(id).value; if(!v)return; const l=DB.read(t); if(!l.includes(v)){l.push(v);DB.write(t,l);app.handlers.renderList(t, id==='new-class'?'class-list':'subject-list');document.getElementById(id).value='';}},
        renderList: (t, id) => { document.getElementById(id).innerHTML = DB.read(t).map(i => `<li>${i} <button onclick="app.handlers.deleteItem('${t}','${i}')">X</button></li>`).join(''); },
        deleteItem: (t, v) => { if(confirm('Delete?')){ DB.write(t, DB.read(t).filter(x=>x!==v)); app.handlers.initSettingsPage();}},

        // STUDENTS
        initStudentsPage: () => { document.getElementById('std-class-select').innerHTML = DB.read('classes').map(c => `<option>${c}</option>`).join(''); app.handlers.loadStudentTable(); },
        saveStudent: async (e) => { e.preventDefault(); const f = e.target; const file = document.getElementById('std-photo').files[0]; let photo = null; if(file) photo = await Utils.fileToBase64(file);
            DB.insert('students', { name: f.name.value, admNo: f.admNo.value, className: f.className.value, photo }); alert('Saved'); f.reset(); app.handlers.loadStudentTable(); },
        loadStudentTable: () => app.handlers.renderStudentRows(DB.read('students')),
        searchStudent: () => { const q = document.getElementById('search-std').value.toLowerCase(); app.handlers.renderStudentRows(DB.read('students').filter(s => s.name.toLowerCase().includes(q) || s.admNo.toLowerCase().includes(q))); },
        renderStudentRows: (d) => document.querySelector('#student-table tbody').innerHTML = d.map(s => `<tr><td>${s.photo?`<img src="${s.photo}" style="height:30px">`:''}</td><td>${s.name}</td><td>${s.className}</td><td><button onclick="app.handlers.deleteStudent('${s.id}')">X</button></td></tr>`).join(''),
        deleteStudent: (id) => { if(confirm('Delete?')) { DB.delete('students', id); app.handlers.loadStudentTable(); } },

        // RESULTS
        initResultsPage: () => { document.getElementById('res-class').innerHTML = `<option value="">Class</option>`+DB.read('classes').map(c=>`<option>${c}</option>`); document.getElementById('res-subject').innerHTML = `<option value="">Subject</option>`+DB.read('subjects').map(s=>`<option>${s}</option>`); },
        loadResultSheet: () => {
            const c=document.getElementById('res-class').value, s=document.getElementById('res-subject').value; if(!c||!s)return;
            const studs = DB.read('students').filter(st => st.className === c); const res = DB.read('results');
            document.getElementById('result-area').classList.remove('hidden');
            document.querySelector('#res-table tbody').innerHTML = studs.map(st => {
                const r = res.find(x => x.studentId === st.id) || { scores: {} }; const sc = r.scores[s] || { test:'', exam:'', total:0, grade:'-' };
                return `<tr data-id="${st.id}"><td>${st.name}</td><td><input type="number" class="ts" value="${sc.test}" oninput="app.handlers.calc(this)"></td><td><input type="number" class="es" value="${sc.exam}" oninput="app.handlers.calc(this)"></td><td class="tot">${sc.total}</td><td class="grd">${sc.grade}</td></tr>`;
            }).join('');
        },
        calc: (el) => { const r = el.closest('tr'); const t=Number(r.querySelector('.ts').value)||0, e=Number(r.querySelector('.es').value)||0; r.querySelector('.tot').innerText = t+e; r.querySelector('.grd').innerText = Utils.getGrade(t+e).grade; },
        
        saveResults: () => {
            const className = document.getElementById('res-class').value;
            const subject = document.getElementById('res-subject').value;
            let allResults = DB.read('results');

            // 1. Update ONLY the selected subject scores
            document.querySelectorAll('#res-table tbody tr').forEach(row => {
                const studentId = row.dataset.id;
                // Find or Create Record
                let record = allResults.find(x => x.studentId === studentId && x.term === '1st Term');
                if(!record) { 
                    record = { id: Date.now() + Math.random(), studentId, className, term: '1st Term', scores: {} }; 
                    allResults.push(record); 
                }
                
                // Update Subject Score
                record.scores[subject] = { 
                    test: row.querySelector('.ts').value, 
                    exam: row.querySelector('.es').value, 
                    total: Number(row.querySelector('.tot').innerText), 
                    grade: row.querySelector('.grd').innerText 
                };
            });

            // 2. Save Basic Data First
            DB.write('results', allResults);

            // 3. Trigger Calculation Engine (Separated for reliability)
            app.handlers.recalculateClassPositions(className);
            
            alert('Results Saved & Positions Recalculated!');
        },

        // --- CALCULATION ENGINE (FIXED) ---
        recalculateClassPositions: (className) => {
            let allResults = DB.read('results');
            
            // Get all records for this class
            let classRecords = allResults.filter(r => r.className === className && r.term === '1st Term');

            // 1. Calculate Grand Totals & Averages
            classRecords.forEach(record => {
                let sum = 0;
                let count = 0;
                
                // Ensure we loop through valid scores
                if (record.scores) {
                    Object.values(record.scores).forEach(s => {
                        const val = parseFloat(s.total);
                        if (!isNaN(val)) {
                            sum += val;
                            count++;
                        }
                    });
                }

                record.grandTotal = sum;
                record.average = count > 0 ? (sum / count).toFixed(1) : 0;
            });

            // 2. Sort by Grand Total (Descending)
            classRecords.sort((a, b) => b.grandTotal - a.grandTotal);

            // 3. Assign Positions (Handling Ties)
            for (let i = 0; i < classRecords.length; i++) {
                if (i > 0 && classRecords[i].grandTotal === classRecords[i-1].grandTotal) {
                    classRecords[i].position = classRecords[i-1].position; // Tie
                } else {
                    classRecords[i].position = Utils.ordinal(i + 1);
                }
            }

            // 4. Merge Updates back into Main Database
            classRecords.forEach(updatedRecord => {
                const index = allResults.findIndex(r => r.id === updatedRecord.id);
                if (index !== -1) {
                    allResults[index] = updatedRecord;
                }
            });

            DB.write('results', allResults);
        },

        // --- GENERATE REPORT ---
        generateReport: () => {
            const adm = document.getElementById('rep-adm').value;
            const student = DB.read('students').find(s => s.admNo === adm);
            if(!student) return alert('Student not found');
            
            // Re-read results to ensure we have the latest Calculations
            const result = DB.read('results').find(r => r.studentId === student.id);
            if(!result) return alert('No results found for this student. Please enter scores first.');
            
            const settings = DB.read('settings');
            const classCount = DB.read('students').filter(s => s.className === student.className).length;

            // 1. Build Subject Rows (Dynamic - No Empty Boxes)
            let subjectRowsHTML = '';
            const subjects = Object.keys(result.scores); 
            
            subjects.forEach(subName => {
                 const s = result.scores[subName];
                 const gInfo = Utils.getGrade(s.total);
                 
                 subjectRowsHTML += `
                    <div class="rs-subject-row">
                        <div class="rs-box-input sub-name">${subName}</div> 
                        <div class="rs-box-input">${s.test}</div> 
                        <div class="rs-box-input">${s.exam}</div> 
                        <div class="rs-box-input">${s.total}</div> 
                        <div class="rs-box-input">${s.grade}</div> 
                        <div class="rs-box-input sub-name">${gInfo.remark}</div> 
                    </div>`;
            });

            // 2. Skills (Static)
            const buildSkills = (skills) => skills.map(k => `
                <div class="rs-skill-row">
                    <div class="rs-skill-name-box">${k}</div>
                    <input class="rs-skill-check-box" type="text">
                </div>`).join('');
            const affectiveHTML = buildSkills(['Punctuality', 'Neatness', 'Politeness', 'Honesty']);
            const psychomotiveHTML = buildSkills(['Handwriting', 'Fluency', 'Sports', 'Crafts']);

            // 3. Render
            const html = `
            <div class="result-sheet-v2">
                <div class="rs-header">
                    <div class="rs-logo-box">${settings.logo ? `<img src="${settings.logo}">` : ''}</div>
                    <div class="rs-school-text">
                        <div class="rs-school-name">${settings.schoolName || 'SCHOOL NAME'}</div>
                        <div class="rs-school-addr">${settings.address || 'Address'}</div>
                        <div class="rs-school-motto">"${settings.motto || ''}"</div>
                    </div>
                </div>

                <div class="rs-student-info">
                    <div class="rs-info-fields">
                        <div class="rs-input-row"><span class="rs-label-lg">FULL NAME:</span><div class="rs-input-field">${student.name}</div></div>
                        <div class="rs-input-row"><span>REG NO:</span><div class="rs-input-field">${student.admNo}</div> <span>CLASS:</span><div class="rs-input-field">${student.className}</div></div>
                        <div class="rs-input-row"><span>TERM:</span><div class="rs-input-field">1ST TERM</div> <span>SESSION:</span><div class="rs-input-field">2024/2025</div></div>
                    </div>
                    <div class="rs-photo-box">${student.photo ? `<img src="${student.photo}">` : ''}</div>
                </div>

                <div class="rs-body-grid">
                    <div class="rs-academic-panel">
                        <div class="rs-academic-header"><div>SUBJECTS</div><div>CA</div><div>EX</div><div>TOT</div><div>GR</div><div>REMARK</div></div>
                        <div class="rs-subject-rows-container">
                            ${subjectRowsHTML}
                        </div>
                        
                        <div class="rs-stats-footer">
                            <div class="rs-stat-item"><span class="rs-stat-label">TOTAL SCORE</span><div class="rs-stat-box">${result.grandTotal || 0}</div></div>
                            <div class="rs-stat-item"><span class="rs-stat-label">AVERAGE</span><div class="rs-stat-box">${result.average || 0}</div></div>
                            <div class="rs-stat-item"><span class="rs-stat-label">NO IN CLASS</span><div class="rs-stat-box">${classCount}</div></div>
                            <div class="rs-stat-item"><span class="rs-stat-label">POSITION</span><div class="rs-stat-box" style="color:#b71c1c">${result.position || 'N/A'}</div></div>
                             <div class="rs-stat-item"><span class="rs-stat-label">OBTAINABLE</span><div class="rs-stat-box">${subjects.length * 100}</div></div>
                        </div>
                    </div>

                    <div class="rs-skills-panel">
                        <div><div class="rs-skill-section-header">AFFECTIVE</div>${affectiveHTML}</div>
                        <div><div class="rs-skill-section-header">PSYCHOMOTIVE</div>${psychomotiveHTML}</div>
                        <div><div class="rs-skill-section-header">SIGNATURE</div><div class="rs-signature-box"></div></div>
                    </div>
                </div>

                <div class="rs-footer">
                    <div class="rs-footer-row">
                         <div class="rs-input-row" style="flex:1"><span>NEXT TERM BEGINS:</span><input class="rs-input-field" value="10th Jan 2025"></div>
                         <div class="rs-input-row" style="flex:1; margin-left:20px;"><span>NEXT TERM FEE:</span><input class="rs-input-field"></div>
                    </div>
                    <div class="rs-comment-block">
                        <div class="rs-comment-line">TEACHER'S COMMENT: <input class="rs-input-field" value="Satisfactory result."></div>
                        <div class="rs-comment-line">PRINCIPAL'S COMMENT: <input class="rs-input-field"></div>
                    </div>
                </div>
            </div>
            <br><button onclick="window.print()" class="btn btn-primary no-print" style="width:100%">PRINT RESULT SHEET</button>
            `;
            document.getElementById('report-output').innerHTML = html;
        }
    }
};

// Utils Helper
Utils.ordinal = (n) => { const s=["th","st","nd","rd"], v=n%100; return n+(s[(v-20)%10]||s[v]||s[0]); };
const ui = { toggleSidebar: () => { document.getElementById('sidebar').classList.toggle('active'); } };
document.addEventListener('DOMContentLoaded', app.init);
￼Enterconst app = {
    // --- 1. INITIALIZATION ---
    init: () => {
        if (typeof DB === 'undefined' || typeof Utils === 'undefined') {
            alert('System Error: Essential files missing.'); return;
        }
        DB.init();
        
        // Ensure Database Arrays Exist
        ['classes', 'subjects', 'students', 'results', 'settings'].forEach(table => {
            const data = DB.read(table);
            if (!data || (table !== 'settings' && !Array.isArray(data))) {
                DB.write(table, table === 'settings' ? {} : []);
            }
        });

        app.nav('dashboard');
    },

    // --- 2. NAVIGATION ---
    nav: (view) => {
        const container = document.getElementById('view-container');
        const title = document.getElementById('page-title');
        
        if(title) title.innerText = view.charAt(0).toUpperCase() + view.slice(1);
        
        if (app.views[view]) {
            container.innerHTML = app.views[view]();
            // Initialize specific pages
            if(view === 'students') app.handlers.initStudentsPage();
            if(view === 'settings') app.handlers.initSettingsPage();
            if(view === 'results') app.handlers.initResultsPage();
        }
        // Auto-close menu on mobile
        if(window.innerWidth < 768) ui.toggleSidebar();
    },

    // --- 3. VIEWS ---
    views: {
        dashboard: () => `
            <div class="grid-2">
                <div class="card"><h3>Total Students</h3><p class="display-4">${DB.read('students').length}</p></div>
                <div class="card"><h3>Classes</h3><p class="display-4">${DB.read('classes').length}</p></div>
                <div class="card"><h3>Subjects</h3><p class="display-4">${DB.read('subjects').length}</p></div>
            </div>`,
        
        settings: () => `
            <div class="grid-2">
                <div class="card">
                    <h3>School Identity</h3>
                    <form onsubmit="app.handlers.saveSchoolDetails(event)">
                        <div class="form-group"><label>School Name</label><input type="text" id="set-name" class="form-control"></div>
                        <div class="form-group"><label>Address</label><input type="text" id="set-addr" class="form-control"></div>
                        <div class="form-group"><label>Motto</label><input type="text" id="set-motto" class="form-control" placeholder="e.g. Knowledge is Power"></div>
                        <div class="form-group"><label>School Logo</label><input type="file" id="set-logo" class="form-control" accept="image/*"></div>
                        <button class="btn btn-primary">Save Details</button>
                    </form>
                </div>
                <div class="card">
                    <h3>Manage Academic Data</h3>
                    <div class="form-group grid-2"><input type="text" id="new-class" class="form-control" placeholder="Class Name"><button onclick="app.handlers.addClass()" class="btn">Add Class</button></div><ul id="class-list"></ul>
                    <hr>
                    <div class="form-group grid-2"><input type="text" id="new-subject" class="form-control" placeholder="Subject Name"><button onclick="app.handlers.addSubject()" class="btn">Add Subject</button></div><ul id="subject-list"></ul>
                </div>
            </div>`,
        
        students: () => `
            <div class="card"><h3>Register Student</h3><form onsubmit="app.handlers.saveStudent(event)"><div class="grid-2">
            <input name="name" placeholder="Full Name" class="form-control" required><input name="admNo" placeholder="Admission No" class="form-control" required>
            <select name="className" id="std-class-select" class="form-control" required></select><input type="file" id="std-photo" class="form-control" accept="image/*">
            </div><button class="btn btn-primary">Save Student</button></form></div>
            <div class="card"><h3>Student List</h3><input id="search-std" class="form-control" placeholder="Search..." onkeyup="app.handlers.searchStudent()"><table id="student-table"><tbody></tbody></table></div>`,
        
        results: () => `
            <div class="card grid-2"><select id="res-class" class="form-control" onchange="app.handlers.loadResultSheet()"></select><select id="res-subject" class="form-control" onchange="app.handlers.loadResultSheet()"></select></div>
            <div id="result-area" class="card hidden"><table id="res-table"><thead><tr><th>Student</th><th>Test(40)</th><th>Exam(60)</th><th>Total</th><th>Grd</th></tr></thead><tbody></tbody></table><button class="btn btn-primary" onclick="app.handlers.saveResults()">Save & Calculate Positions</button></div>`,
        
        reports: () => `
            <div class="card no-print grid-2"><input id="rep-adm" class="form-control" placeholder="Enter Admission No"><button class="btn btn-primary" onclick="app.handlers.generateReport()">Generate Result Sheet</button></div>
            <div id="report-output"></div>`
    },

    // --- 4. HANDLERS ---
    handlers: {
        // SETTINGS
        initSettingsPage: () => {
            const s = DB.read('settings');
            if(s.schoolName) { 
                document.getElementById('set-name').value = s.schoolName; 
                document.getElementById('set-addr').value = s.address; 
                document.getElementById('set-motto').value = s.motto || ''; 
            }
            app.handlers.renderList('classes', 'class-list'); 
            app.handlers.renderList('subjects', 'subject-list');
        },
        saveSchoolDetails: async (e) => {
            e.preventDefault(); 
            const file = document.getElementById('set-logo').files[0]; 
            let logo = null; if (file) logo = await Utils.fileToBase64(file);
            const s = DB.read('settings');
            DB.write('settings', { 
                ...s, 
                schoolName: document.getElementById('set-name').value, 
                address: document.getElementById('set-addr').value, 
                motto: document.getElementById('set-motto').value, 
                logo: logo || s.logo 
            });
            alert('Settings Saved!');
        },
  addClass: () => app.handlers.addItem('classes', 'new-class'), 
        addSubject: () => app.handlers.addItem('subjects', 'new-subject'),
        addItem: (t, id) => { const v = document.getElementById(id).value; if(!v)return; const l=DB.read(t); if(!l.includes(v)){l.push(v);DB.write(t,l);app.handlers.renderList(t, id==='new-class'?'class-list':'subject-list');document.getElementById(id).value='';}},
        renderList: (t, id) => { document.getElementById(id).innerHTML = DB.read(t).map(i => `<li>${i} <button onclick="app.handlers.deleteItem('${t}','${i}')">X</button></li>`).join(''); },
        deleteItem: (t, v) => { if(confirm('Delete?')){ DB.write(t, DB.read(t).filter(x=>x!==v)); app.handlers.initSettingsPage();}},

        // STUDENTS
        initStudentsPage: () => { document.getElementById('std-class-select').innerHTML = DB.read('classes').map(c => `<option>${c}</option>`).join(''); app.handlers.loadStudentTable(); },
        saveStudent: async (e) => { e.preventDefault(); const f = e.target; const file = document.getElementById('std-photo').files[0]; let photo = null; if(file) photo = await Utils.fileToBase64(file);
            DB.insert('students', { name: f.name.value, admNo: f.admNo.value, className: f.className.value, photo }); alert('Saved'); f.reset(); app.handlers.loadStudentTable(); },
        loadStudentTable: () => app.handlers.renderStudentRows(DB.read('students')),
        searchStudent: () => { const q = document.getElementById('search-std').value.toLowerCase(); app.handlers.renderStudentRows(DB.read('students').filter(s => s.name.toLowerCase().includes(q) || s.admNo.toLowerCase().includes(q))); },
        renderStudentRows: (d) => document.querySelector('#student-table tbody').innerHTML = d.map(s => `<tr><td>${s.photo?`<img src="${s.photo}" style="height:30px">`:''}</td><td>${s.name}</td><td>${s.className}</td><td><button onclick="app.handlers.deleteStudent('${s.id}')">X</button></td></tr>`).join(''),
        deleteStudent: (id) => { if(confirm('Delete?')) { DB.delete('students', id); app.handlers.loadStudentTable(); } },

        // RESULTS
        initResultsPage: () => { document.getElementById('res-class').innerHTML = `<option value="">Class</option>`+DB.read('classes').map(c=>`<option>${c}</option>`); document.getElementById('res-subject').innerHTML = `<option value="">Subject</option>`+DB.read('subjects').map(s=>`<option>${s}</option>`); },
        loadResultSheet: () => {
            const c=document.getElementById('res-class').value, s=document.getElementById('res-subject').value; if(!c||!s)return;
            const studs = DB.read('students').filter(st => st.className === c); const res = DB.read('results');
            document.getElementById('result-area').classList.remove('hidden');
            document.querySelector('#res-table tbody').innerHTML = studs.map(st => {
                const r = res.find(x => x.studentId === st.id) || { scores: {} }; const sc = r.scores[s] || { test:'', exam:'', total:0, grade:'-' };
                return `<tr data-id="${st.id}"><td>${st.name}</td><td><input type="number" class="ts" value="${sc.test}" oninput="app.handlers.calc(this)"></td><td><input type="number" class="es" value="${sc.exam}" oninput="app.handlers.calc(this)"></td><td class="tot">${sc.total}</td><td class="grd">${sc.grade}</td></tr>`;
            }).join('');
        },
        calc: (el) => { const r = el.closest('tr'); const t=Number(r.querySelector('.ts').value)||0, e=Number(r.querySelector('.es').value)||0; r.querySelector('.tot').innerText = t+e; r.querySelector('.grd').innerText = Utils.getGrade(t+e).grade; },
        
        saveResults: () => {
            const className = document.getElementById('res-class').value;
            const subject = document.getElementById('res-subject').value;
            let allResults = DB.read('results');

            // 1. Update ONLY the selected subject scores
            document.querySelectorAll('#res-table tbody tr').forEach(row => {
                const studentId = row.dataset.id;
                // Find or Create Record
                let record = allResults.find(x => x.studentId === studentId && x.term === '1st Term');
                if(!record) { 
                    record = { id: Date.now() + Math.random(), studentId, className, term: '1st Term', scores: {} }; 
                    allResults.push(record); 
                }
                
                // Update Subject Score
                record.scores[subject] = { 
                    test: row.querySelector('.ts').value, 
                    exam: row.querySelector('.es').value, 
                    total: Number(row.querySelector('.tot').innerText), 
                    grade: row.querySelector('.grd').innerText 
                };
            });

            // 2. Save Basic Data First
            DB.write('results', allResults);

            // 3. Trigger Calculation Engine (Separated for reliability)
            app.handlers.recalculateClassPositions(className);
            
            alert('Results Saved & Positions Recalculated!');
        },

        // --- CALCULATION ENGINE (FIXED) ---
        recalculateClassPositions: (className) => {
            let allResults = DB.read('results');
            
            // Get all records for this class
            let classRecords = allResults.filter(r => r.className === className && r.term === '1st Term');

            // 1. Calculate Grand Totals & Averages
            classRecords.forEach(record => {
                let sum = 0;
                let count = 0;
                
                // Ensure we loop through valid scores
                if (record.scores) {
                    Object.values(record.scores).forEach(s => {
                        const val = parseFloat(s.total);
                        if (!isNaN(val)) {
                            sum += val;
                            count++;
                        }
                    });
                }

                record.grandTotal = sum;
                record.average = count > 0 ? (sum / count).toFixed(1) : 0;
            });

            // 2. Sort by Grand Total (Descending)
            classRecords.sort((a, b) => b.grandTotal - a.grandTotal);

            // 3. Assign Positions (Handling Ties)
            for (let i = 0; i < classRecords.length; i++) {
                if (i > 0 && classRecords[i].grandTotal === classRecords[i-1].grandTotal) {
                    classRecords[i].position = classRecords[i-1].position; // Tie
                } else {
                    classRecords[i].position = Utils.ordinal(i + 1);
                }
            }

            // 4. Merge Updates back into Main Database
            classRecords.forEach(updatedRecord => {
                const index = allResults.findIndex(r => r.id === updatedRecord.id);
                if (index !== -1) {
                    allResults[index] = updatedRecord;
                }
            });

            DB.write('results', allResults);
