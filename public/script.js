(() => {
    const threats = [
        { time: '17:13:25', ip: '185.141.23.56', type: 'DDoS', risk: 'High', prediction: 'Malicious', confidence: 98.6, action: 'Block' },
        { time: '17:12:40', ip: '103.21.44.77', type: 'Phishing', risk: 'High', prediction: 'Malicious', confidence: 97.1, action: 'Block' },
        { time: '17:11:52', ip: '192.168.1.54', type: 'Brute Force', risk: 'Medium', prediction: 'Suspicious', confidence: 89.3, action: 'Monitor' },
        { time: '17:10:18', ip: '45.76.232.19', type: 'Web Attack', risk: 'High', prediction: 'Malicious', confidence: 96.8, action: 'Block' },
        { time: '17:09:37', ip: '203.0.113.12', type: 'Malware', risk: 'Medium', prediction: 'Suspicious', confidence: 87.5, action: 'Monitor' },
        { time: '17:08:14', ip: '172.67.34.88', type: 'Reconnaissance', risk: 'Low', prediction: 'Benign', confidence: 78.2, action: 'Allow' },
        { time: '17:07:03', ip: '98.142.67.201', type: 'Malware', risk: 'High', prediction: 'Malicious', confidence: 95.4, action: 'Block' },
        { time: '17:06:21', ip: '10.0.0.25', type: 'Port Scan', risk: 'Low', prediction: 'Benign', confidence: 72.6, action: 'Allow' },
        { time: '17:04:58', ip: '198.51.100.42', type: 'SQL Injection', risk: 'High', prediction: 'Malicious', confidence: 94.2, action: 'Block' },
        { time: '17:03:36', ip: '192.0.2.81', type: 'Brute Force', risk: 'Medium', prediction: 'Suspicious', confidence: 84.9, action: 'Monitor' }
    ];
    const reasons = {
        Phishing: ['URL contains suspicious domain patterns', 'Similar to known phishing URLs in training data', 'Uses URL shortener and obfuscated characters', 'High similarity with phishing behavior'],
        DDoS: ['Unusually high request rate from this source', 'Traffic pattern matches known denial-of-service signatures', 'Requests are distributed across multiple endpoints'],
        'Brute Force': ['Repeated authentication failures detected', 'Login attempts are occurring at an abnormal rate', 'Behavior is consistent with credential guessing'],
        'Web Attack': ['Request contains suspicious web payload patterns', 'Payload resembles common injection signatures', 'Request deviates from normal application traffic'],
        Malware: ['Connection matches a known malicious indicator', 'Destination behavior is associated with malware activity', 'Traffic characteristics are anomalous'],
        Reconnaissance: ['Source is probing multiple service ports', 'Observed activity is consistent with service discovery'],
        'Port Scan': ['Multiple sequential ports were contacted', 'Pattern may indicate early-stage network reconnaissance'],
        'SQL Injection': ['Request contains SQL control characters and operators', 'Payload matches common injection patterns', 'Input was flagged for unsafe query structure']
    };

    const $ = (selector, root = document) => root.querySelector(selector);
    const $$ = (selector, root = document) => [...root.querySelectorAll(selector)];
    const rows = $('#threat-rows');
    const search = $('#global-search');
    const riskFilter = $('#risk-filter');
    let activeView = 'dashboard';
    let live = true;
    let toastTimer;
    let zoom = 1;
    let uploadedDatasets = [];

    function notify(message) {
        try {
            if (localStorage.getItem('cybershield-notifications') === 'false') return;
        } catch (error) {
            console.warn('Unable to read notification preference:', error);
        }
        const toast = $('#toast');
        if (!toast) return;
        toast.textContent = message;
        toast.classList.remove('hidden');
        clearTimeout(toastTimer);
        toastTimer = setTimeout(() => toast.classList.add('hidden'), 3200);
    }

    function renderThreats() {
        const term = search.value.trim().toLowerCase();
        const selectedRisk = riskFilter.value;
        const visible = threats.filter((threat) => {
            const matchesTerm = !term || Object.values(threat).join(' ').toLowerCase().includes(term);
            return matchesTerm && (selectedRisk === 'all' || threat.risk === selectedRisk);
        });
        rows.innerHTML = visible.map((threat) => {
            const index = threats.indexOf(threat);
            return `<tr data-index="${index}" tabindex="0">
                <td>${threat.time}</td><td>${threat.ip}</td><td>${threat.type}</td>
                <td><span class="risk-pill ${threat.risk}">${threat.risk}</span></td>
                <td class="prediction-${threat.prediction.toLowerCase()}">${threat.prediction}</td>
                <td>${threat.confidence.toFixed(1)}%</td>
                <td><button class="action-button ${threat.action}" type="button" data-action-index="${index}">${threat.action}</button></td>
            </tr>`;
        }).join('');
        $('#result-count').textContent = `(${visible.length})`;
        $('#empty-state').classList.toggle('hidden', visible.length > 0);
        $$('#threat-rows tr').forEach((row) => {
            row.addEventListener('click', (event) => {
                if (event.target.closest('.action-button')) return;
                selectThreat(Number(row.dataset.index), row);
            });
            row.addEventListener('keydown', (event) => {
                if (event.key === 'Enter' || event.key === ' ') {
                    event.preventDefault();
                    selectThreat(Number(row.dataset.index), row);
                }
            });
        });
        $$('.action-button', rows).forEach((button) => button.addEventListener('click', () => {
            const threat = threats[Number(button.dataset.actionIndex)];
            const nextAction = {
                Block: 'Blocked', Blocked: 'Block',
                Monitor: 'Monitoring', Monitoring: 'Monitor',
                Allow: 'Allowed', Allowed: 'Allow'
            }[threat.action];
            threat.action = nextAction;
            renderThreats();
            const removed = nextAction === 'Block' || nextAction === 'Monitor' || nextAction === 'Allow';
            const actionName = { Block: 'block', Blocked: 'block', Monitor: 'monitor', Monitoring: 'monitor', Allow: 'allow', Allowed: 'allow' }[threat.action];
            notify(`${removed ? 'Demo action cleared' : `${actionName} action recorded`} for ${threat.ip}. No firewall change was made.`);
        }));
    }

    function selectThreat(index, row) {
        const threat = threats[index];
        $$('#threat-rows tr').forEach((item) => item.classList.remove('selected'));
        if (row) row.classList.add('selected');
        $('#explain-type').textContent = threat.type;
        const risk = $('#explain-risk');
        risk.textContent = threat.risk;
        risk.className = `risk-text-${threat.risk.toLowerCase()}`;
        $('#explain-confidence').textContent = `${threat.confidence.toFixed(1)}%`;
        $('#explain-ip').textContent = threat.ip;
        $('#reason-title').textContent = `Why is this classified as ${threat.prediction.toLowerCase()}?`;
        $('#reason-list').innerHTML = (reasons[threat.type] || reasons['Web Attack']).map((reason) => `<li>${reason}</li>`).join('');
    }

    function drawChart(canvas, datasets, options = {}) {
        const rect = canvas.getBoundingClientRect();
        if (!rect.width || !rect.height) return;
        const ratio = window.devicePixelRatio || 1;
        canvas.width = Math.round(rect.width * ratio);
        canvas.height = Math.round(rect.height * ratio);
        const context = canvas.getContext('2d');
        context.scale(ratio, ratio);
        const width = rect.width;
        const height = rect.height;
        const pad = { left: options.bars ? 27 : 25, right: 6, top: 11, bottom: 21 };
        const chartWidth = width - pad.left - pad.right;
        const chartHeight = height - pad.top - pad.bottom;
        const max = options.max || 200;
        context.font = '10px DM Sans, sans-serif';
        context.textBaseline = 'middle';

        for (let value = 0; value <= max; value += 50) {
            const y = pad.top + chartHeight - (value / max) * chartHeight;
            context.strokeStyle = '#17334a';
            context.lineWidth = 1;
            context.beginPath();
            context.moveTo(pad.left, y);
            context.lineTo(width - pad.right, y);
            context.stroke();
            context.fillStyle = '#a7b8cc';
            context.textAlign = 'right';
            context.fillText(String(value), pad.left - 6, y);
        }
        const labels = options.labels || ['00:00', '04:00', '08:00', '12:00', '16:00', '20:00', '24:00'];
        labels.forEach((label, index) => {
            const x = pad.left + (index / (labels.length - 1)) * chartWidth;
            context.strokeStyle = '#122b40';
            context.beginPath();
            context.moveTo(x, pad.top);
            context.lineTo(x, pad.top + chartHeight);
            context.stroke();
            context.fillStyle = '#b7c6d8';
            context.textAlign = index === 0 ? 'left' : index === labels.length - 1 ? 'right' : 'center';
            context.fillText(label, x, height - 7);
        });
        if (options.bars) {
            const groupWidth = chartWidth / datasets[0].values.length;
            const barWidth = Math.max(2, groupWidth * .18);
            datasets[0].values.forEach((_, index) => {
                const x = pad.left + index * groupWidth + groupWidth * .18;
                let base = pad.top + chartHeight;
                datasets.forEach((dataset) => {
                    const barHeight = (dataset.values[index] / max) * chartHeight;
                    base -= barHeight;
                    context.fillStyle = dataset.color;
                    context.fillRect(x, base, barWidth, barHeight);
                });
            });
            return;
        }
        datasets.forEach((dataset) => {
            const points = dataset.values.map((value, index) => ({
                x: pad.left + (index / (dataset.values.length - 1)) * chartWidth,
                y: pad.top + chartHeight - (value / max) * chartHeight
            }));
            context.beginPath();
            points.forEach((point, index) => index ? context.lineTo(point.x, point.y) : context.moveTo(point.x, point.y));
            context.lineTo(points[points.length - 1].x, pad.top + chartHeight);
            context.lineTo(points[0].x, pad.top + chartHeight);
            context.closePath();
            context.fillStyle = dataset.fill;
            context.fill();
            context.beginPath();
            points.forEach((point, index) => index ? context.lineTo(point.x, point.y) : context.moveTo(point.x, point.y));
            context.strokeStyle = dataset.color;
            context.lineWidth = 2;
            context.lineJoin = 'round';
            context.stroke();
        });
    }

    function drawCharts() {
        drawChart($('#trend-chart'), [
            { color: '#ff4b55', fill: 'rgba(255,75,85,.15)', values: [81, 72, 86, 76, 83, 69, 98, 91, 104, 126, 124, 139, 155, 190, 151, 142, 118, 150, 141, 138, 121, 134, 126, 143] },
            { color: '#ffad32', fill: 'rgba(255,173,50,.11)', values: [47, 38, 52, 43, 55, 45, 59, 55, 68, 75, 70, 89, 94, 122, 91, 87, 59, 74, 82, 71, 85, 76, 68, 99] },
            { color: '#368cff', fill: 'rgba(54,140,255,.14)', values: [15, 10, 18, 23, 13, 20, 32, 25, 31, 27, 34, 49, 47, 57, 44, 49, 27, 18, 39, 36, 42, 35, 31, 40] }
        ]);
        drawChart($('#risk-chart'), [
            { color: '#ff4b55', values: [45, 39, 48, 43, 56, 51, 61, 56, 67, 63, 72, 61] },
            { color: '#ffad32', values: [44, 39, 52, 48, 53, 57, 51, 48, 42, 51, 56, 45] },
            { color: '#368cff', values: [42, 38, 44, 46, 39, 45, 38, 42, 37, 47, 44, 40] }
        ], { bars: true, max: 200, labels: ['00:00', '04:00', '08:00', '12:00', '16:00', '20:00', '24:00'] });
    }

    const viewCopy = {
        live: ['Live Monitoring', 'Review the latest observed events. The sample feed is paused by default controls; actions here are local dashboard demonstrations.', [
            ['Feed status', 'Live feed connected', 'Use the control below to pause or resume the demo feed.'],
            ['Events in view', '10 recent events', 'Search and risk filters are available on the dashboard table.'],
            ['Detection engine', 'Operational', 'Incoming production traffic is not connected in this project.']
        ]],
        analysis: ['Threat Analysis', 'Explore the threat mix and review the current sample detections.', [
            ['Malware', '32%', 'Largest category in the current 24-hour sample.'],
            ['Phishing', '22%', 'Suspicious URL and domain behavior.'],
            ['DDoS', '15%', 'Elevated request rates and traffic anomalies.']
        ]],
        risk: ['Risk Classification', 'Risk levels summarize the potential impact and confidence of each sample event.', [
            ['High risk', '186 events', 'Malicious behavior with immediate investigation priority.'],
            ['Medium risk', '423 events', 'Suspicious activity that should be reviewed and monitored.'],
            ['Low risk', '639 events', 'Low-confidence or likely benign activity.']
        ]],
        explanations: ['AI Explanations', 'Select any threat row on the dashboard to see its explanation and supporting signals.', [
            ['Explainable signals', 'Behavior + pattern', 'Reasons are tied to the selected sample threat type.'],
            ['Confidence score', 'Per event', 'The displayed confidence belongs to each sample event.'],
            ['Review guidance', 'Human review', 'Treat these example classifications as decision support, not a production model output.']
        ]],
        reports: ['Reports', 'Export the current sample threat events for offline review.', [
            ['Threat events', `${threats.length} records`, 'CSV export includes IP, type, risk, prediction and confidence.'],
            ['Time window', 'Latest sample', 'This project currently uses representative sample data.'],
            ['Export format', 'CSV', 'A spreadsheet-friendly file will be downloaded to your device.']
        ]],
        datasets: ['Datasets', 'Add a local CSV, JSON, or text file to this browser session. Files are not uploaded to a server.', [
            ['Supported files', 'CSV / JSON / TXT', 'Select a local file to add its name to this session list.'],
            ['Storage', 'Browser session', 'The selected file contents are not sent or persisted.'],
            ['Detection data', 'Sample events', 'Uploading a dataset does not train a model or change threat classifications.']
        ]],
        settings: ['Settings', 'Manage local dashboard display preferences.', [
            ['Notifications', 'Dashboard toasts', 'Show confirmations for demo actions.'],
            ['Reduced motion', 'Animation preference', 'Use a calmer interface where supported.'],
            ['Auto-refresh', 'Dashboard charts', 'Refresh chart drawings when the page is resized.']
        ]]
    };

    function createSecondary(view) {
        const data = viewCopy[view];
        const secondary = $('#secondary-view');
        const title = data[0];
        let cards = data[2].map(([name, value, description]) =>
            `<article class="info-card"><h3>${name}</h3><span class="info-value">${value}</span><p>${description}</p></article>`
        ).join('');
        let actions = '';
        if (view === 'live') actions = `<div class="secondary-actions"><button class="primary-button" id="feed-toggle" type="button">${live ? 'Pause demo feed' : 'Resume demo feed'}</button><button class="secondary-button" data-view="dashboard" type="button">Back to dashboard</button></div>`;
        if (view === 'reports') actions = '<div class="secondary-actions"><button class="primary-button" id="export-report" type="button">Download threat report (CSV)</button><button class="secondary-button" data-view="dashboard" type="button">Back to dashboard</button></div>';
        if (view === 'datasets') {
            const datasetList = uploadedDatasets.length
                ? `<div class="info-card dataset-list"><h3>Selected in this session</h3><p>${uploadedDatasets.map((name) => escapeHtml(name)).join('<br>')}</p></div>`
                : '';
            actions = `<div class="secondary-actions"><label class="file-input-label" for="dataset-file">Choose a dataset file</label><button class="secondary-button" data-view="dashboard" type="button">Back to dashboard</button></div>${datasetList}`;
        }
        if (view === 'settings') {
            const settings = [
                ['notifications', 'Action confirmations', 'Show a confirmation message after dashboard actions.', true],
                ['reduced-motion', 'Reduced motion', 'Minimize non-essential animations.', false],
                ['auto-refresh', 'Refresh charts on resize', 'Redraw charts when the browser window changes size.', true]
            ];
            cards = `<div class="settings-list">${settings.map(([key, label, description, defaultValue]) => {
                let enabled = defaultValue;
                try {
                    const saved = localStorage.getItem(`cybershield-${key}`);
                    if (saved !== null) enabled = saved === 'true';
                } catch (error) {
                    console.warn('Unable to read dashboard preference:', error);
                }
                return `<div class="setting-row"><span><strong>${label}</strong><small>${description}</small></span><button class="toggle" type="button" role="switch" aria-checked="${enabled}" data-setting="${key}" aria-label="${label}"></button></div>`;
            }).join('')}</div>`;
            actions = '<div class="secondary-actions"><button class="secondary-button" id="reset-settings" type="button">Reset preferences</button></div>';
        }
        secondary.innerHTML = `<h2>${title}</h2><p>${data[1]}</p>${view === 'settings' ? cards : `<div class="secondary-grid">${cards}</div>`}${actions}`;
        $$('#secondary-view [data-view]').forEach((button) => button.addEventListener('click', () => setView(button.dataset.view)));
        const feedToggle = $('#feed-toggle');
        if (feedToggle) feedToggle.addEventListener('click', () => {
            live = !live;
            setView('live');
            notify(`Demo monitoring feed ${live ? 'resumed' : 'paused'}.`);
        });
        const exportButton = $('#export-report');
        if (exportButton) exportButton.addEventListener('click', exportCsv);
        $$('.toggle').forEach((button) => button.addEventListener('click', () => {
            const enabled = button.getAttribute('aria-checked') !== 'true';
            button.setAttribute('aria-checked', String(enabled));
            try {
                localStorage.setItem(`cybershield-${button.dataset.setting}`, String(enabled));
            } catch (error) {
                console.error('Unable to save dashboard preference:', error);
                notify('Could not save this preference in browser storage.');
                return;
            }
            if (button.dataset.setting === 'reduced-motion') document.body.classList.toggle('reduced-motion', enabled);
            notify(`${button.getAttribute('aria-label')} ${enabled ? 'enabled' : 'disabled'}.`);
        }));
        const reset = $('#reset-settings');
        if (reset) reset.addEventListener('click', () => {
            try {
                ['notifications', 'reduced-motion', 'auto-refresh'].forEach((key) => localStorage.removeItem(`cybershield-${key}`));
            } catch (error) {
                console.error('Unable to reset dashboard preferences:', error);
                notify('Could not reset preferences in browser storage.');
                return;
            }
            document.body.classList.remove('reduced-motion');
            setView('settings');
            notify('Dashboard preferences reset.');
        });
    }

    function escapeHtml(value) {
        return value.replace(/[&<>"']/g, (character) => ({
            '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;'
        })[character]);
    }

    function setView(view) {
        if (view === 'dashboard') {
            activeView = view;
            $('#dashboard-view').classList.remove('hidden');
            $('#secondary-view').classList.add('hidden');
            $('#page-title').textContent = 'Dashboard';
        } else if (viewCopy[view]) {
            activeView = view;
            $('#dashboard-view').classList.add('hidden');
            $('#secondary-view').classList.remove('hidden');
            $('#page-title').textContent = viewCopy[view][0];
            createSecondary(view);
        } else return;
        $$('.nav-item').forEach((button) => button.classList.toggle('active', button.dataset.view === activeView));
        if (activeView === 'dashboard') requestAnimationFrame(drawCharts);
    }

    function exportCsv() {
        const header = ['Time', 'Source IP', 'Threat Type', 'Risk Level', 'Prediction', 'Confidence', 'Action'];
        const csv = [header, ...threats.map((threat) => [
            threat.time, threat.ip, threat.type, threat.risk, threat.prediction, `${threat.confidence.toFixed(1)}%`, threat.action
        ])].map((record) => record.map((value) => `"${String(value).replace(/"/g, '""')}"`).join(',')).join('\r\n');
        const blob = new Blob([csv], { type: 'text/csv;charset=utf-8' });
        const url = URL.createObjectURL(blob);
        const anchor = document.createElement('a');
        anchor.href = url;
        anchor.download = 'cybershield-threat-report.csv';
        document.body.append(anchor);
        anchor.click();
        anchor.remove();
        URL.revokeObjectURL(url);
        notify('Threat report downloaded as CSV.');
    }

    function updateDate() {
        const now = new Date();
        $('#current-date').textContent = new Intl.DateTimeFormat(undefined, {
            month: 'short', day: 'numeric', year: 'numeric', hour: '2-digit', minute: '2-digit'
        }).format(now);
    }

    try {
        document.body.classList.toggle('reduced-motion', localStorage.getItem('cybershield-reduced-motion') === 'true');
    } catch (error) {
        console.warn('Unable to read motion preference:', error);
    }

    $$('#main-nav [data-view]').forEach((button) => button.addEventListener('click', () => setView(button.dataset.view)));
    $$('#dashboard-view [data-view]').forEach((button) => button.addEventListener('click', () => setView(button.dataset.view)));
    search.addEventListener('input', renderThreats);
    riskFilter.addEventListener('change', renderThreats);
    $('#refresh-button').addEventListener('click', () => {
        renderThreats();
        drawCharts();
        updateDate();
        notify('Dashboard refreshed.');
    });
    $('#profile-button').addEventListener('click', () => {
        const menu = $('#profile-menu');
        const expanded = $('#profile-button').getAttribute('aria-expanded') === 'true';
        $('#profile-button').setAttribute('aria-expanded', String(!expanded));
        menu.classList.toggle('hidden', expanded);
    });
    $('#profile-menu').addEventListener('click', (event) => {
        const view = event.target.closest('[data-view]');
        if (view) {
            setView(view.dataset.view);
            $('#profile-menu').classList.add('hidden');
            $('#profile-button').setAttribute('aria-expanded', 'false');
        }
    });
    $('#about-button').addEventListener('click', () => {
        $('#profile-menu').classList.add('hidden');
        $('#profile-button').setAttribute('aria-expanded', 'false');
        notify('XAI-CyberShield dashboard — a frontend demo using representative sample threats.');
    });
    $('#zoom-in').addEventListener('click', () => {
        zoom = Math.min(zoom + .15, 1.6);
        $('.map-area svg').style.transform = `scale(${zoom})`;
    });
    $('#zoom-out').addEventListener('click', () => {
        zoom = Math.max(zoom - .15, .85);
        $('.map-area svg').style.transform = `scale(${zoom})`;
    });
    $('#dataset-file').addEventListener('change', (event) => {
        const files = [...event.target.files];
        if (!files.length) return;
        uploadedDatasets.push(...files.map((file) => file.name));
        notify(`${files.length} dataset file${files.length === 1 ? '' : 's'} added to this browser session.`);
        if (activeView === 'datasets') createSecondary('datasets');
        event.target.value = '';
    });
    document.addEventListener('keydown', (event) => {
        if (event.key === '/' && !['INPUT', 'TEXTAREA'].includes(document.activeElement.tagName)) {
            event.preventDefault();
            search.focus();
        }
        if (event.key === 'Escape') {
            $('#profile-menu').classList.add('hidden');
            $('#profile-button').setAttribute('aria-expanded', 'false');
        }
    });
    let resizeTimer;
    window.addEventListener('resize', () => {
        clearTimeout(resizeTimer);
        resizeTimer = setTimeout(() => {
            let shouldRefresh = true;
            try {
                shouldRefresh = localStorage.getItem('cybershield-auto-refresh') !== 'false';
            } catch (error) {
                console.warn('Unable to read chart refresh preference:', error);
            }
            if (shouldRefresh && activeView === 'dashboard') drawCharts();
        }, 120);
    });

    updateDate();
    renderThreats();
    requestAnimationFrame(drawCharts);
})();
