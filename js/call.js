/*
   $ TEAM    : https://instagram.com/darkxcode_
   $ AUTHOR  : https://t.me/zlaxtert 
   $ CODE    : https://t.me/zexkings 
   $ DESIGN  : https://t.me/danielsmt 
   $ SITE    : https://darkxcode.site/
   $ VERSION : 1.0
*/

$(document).ready(function() {
    // Set current year for copyright
    $('#currentYear').text(new Date().getFullYear());
    
    // Theme toggle functionality
    $('#themeToggle').click(function() {
        $('body').toggleClass('dark-mode');
        if ($('body').hasClass('dark-mode')) {
            $(this).html('<i class="fas fa-sun"></i>');
        } else {
            $(this).html('<i class="fas fa-moon"></i>');
        }
    });
    
    // Toggle API key visibility
    $('#toggleApiKey').click(function() {
        const apiKeyField = $('#apikey');
        const type = apiKeyField.attr('type') === 'password' ? 'text' : 'password';
        apiKeyField.attr('type', type);
        $(this).html(type === 'password' ? '<i class="fas fa-eye"></i>' : '<i class="fas fa-eye-slash"></i>');
    });
    
    // File upload handling
    $('#fileUpload').change(function(e) {
        const file = e.target.files[0];
        if (!file) return;
        
        const reader = new FileReader();
        reader.onload = function(e) {
            $('#emailLists').val(e.target.result);
            updateEmailCount();
        };
        reader.readAsText(file);
    });
    
    // Update email count when textarea changes
    $('#emailLists').on('input', updateEmailCount);
    
    function updateEmailCount() {
        const emails = $('#emailLists').val().split('\n').filter(email => email.trim() !== '');
        $('#totalEmails').text(emails.length);
        $('#remainingEmails').text(emails.length);
    }
    
    // Clear results
    $('#clearResultsBtn').click(function() {
        $('#liveResults').empty();
        $('#dieResults').empty();
        $('#liveCount').text('0 found');
        $('#dieCount').text('0 found');
    });
    
    // Copy live results
    $('#copyLiveBtn').click(function() {
        const liveEmails = [];
        $('#liveResults .list-group-item').each(function() {
            liveEmails.push($(this).data('email'));
        });
        
        if (liveEmails.length > 0) {
            navigator.clipboard.writeText(liveEmails.join('\n'));
            alert('Live emails copied to clipboard!');
        }
    });
    
    // Copy die results
    $('#copyDieBtn').click(function() {
        const dieEmails = [];
        $('#dieResults .list-group-item').each(function() {
            dieEmails.push($(this).data('email'));
        });
        
        if (dieEmails.length > 0) {
            navigator.clipboard.writeText(dieEmails.join('\n'));
            alert('Die emails copied to clipboard!');
        }
    });
    
    // Start checking process
    $('#startBtn').click(startChecking);
    
    // Stop checking process
    $('#stopBtn').click(function() {
        isChecking = false;
        $('#startBtn').prop('disabled', false);
        $('#stopBtn').prop('disabled', true);
        $('#currentStatus').removeClass('alert-warning').addClass('alert-info').text('Checking stopped');
    });
/*
   $ TEAM    : https://instagram.com/darkxcode_
   $ AUTHOR  : https://t.me/zlaxtert 
   $ CODE    : https://t.me/zexkings 
   $ DESIGN  : https://t.me/danielsmt 
   $ SITE    : https://darkxcode.site/
   $ VERSION : 1.0
*/
    // Variables to track checking process
    let isChecking = false;
    let checkedCount = 0;
    let totalCount = 0;
    let liveCount = 0;
    let dieCount = 0;
    let proxyList = [];
    let currentProxyIndex = 0;
    
    // Email validation function
    function isValidEmail(email) {
        const re = /^(([^<>()\[\]\\.,;:\s@"]+(\.[^<>()\[\]\\.,;:\s@"]+)*)|(".+"))@((\[[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}])|(([a-zA-Z\-0-9]+\.)+[a-zA-Z]{2,}))$/;
        return re.test(String(email).toLowerCase());
    }
    
    // Function to get next proxy in rotation
    function getNextProxy() {
        if (proxyList.length === 0) return '';
        
        const proxy = proxyList[currentProxyIndex];
        currentProxyIndex = (currentProxyIndex + 1) % proxyList.length;
        return proxy;
    }
    
    // Main function to start checking emails
    function startChecking() {
        // Validate required fields
        const apiKey = $('#apikey').val().trim();
        if (!apiKey) {
            alert('API Key is required!');
            return;
        }
        
        const emailText = $('#emailLists').val().trim();
        if (!emailText) {
            alert('Email list is required!');
            return;
        }
        
        const proxyType = $('#typeProxy').val();
        if (!proxyType) {
            alert('Proxy type is required!');
            return;
        }
        
        // Get and process email list
        let emails = emailText.split('\n')
            .map(email => email.trim())
            .filter(email => email !== '');
        
        // Filter valid emails if option is enabled
        if ($('#filterValidEmails').is(':checked')) {
            emails = emails.filter(email => isValidEmail(email));
        }
        
        if (emails.length === 0) {
            alert('No valid emails to check!');
            return;
        }
        
        // Process proxy list
        const proxyText = $('#proxy').val().trim();
        proxyList = proxyText ? proxyText.split('\n')
            .map(proxy => proxy.trim())
            .filter(proxy => proxy !== '') : [];
        
        // Initialize counters
        totalCount = emails.length;
        checkedCount = 0;
        liveCount = 0;
        dieCount = 0;
        currentProxyIndex = 0;
        
        // Update UI
        $('#totalEmails').text(totalCount);
        $('#remainingEmails').text(totalCount);
        $('#checkedEmails').text('0');
        $('.progress-bar').css('width', '0%').text('0%');
        $('#currentStatus').removeClass('alert-info alert-danger').addClass('alert-warning').text('Checking in progress...');
        
        // Enable/disable buttons
        $('#startBtn').prop('disabled', true);
        $('#stopBtn').prop('disabled', false);
        
        // Start checking process
        isChecking = true;
        checkNextEmail(emails, apiKey, proxyType);
    }
    
    // Function to check emails sequentially
    function checkNextEmail(emails, apiKey, proxyType) {
        if (!isChecking || checkedCount >= totalCount) {
            // Checking completed or stopped
            $('#startBtn').prop('disabled', false);
            $('#stopBtn').prop('disabled', true);
            $('#currentStatus').removeClass('alert-warning').addClass('alert-info').text('Checking completed');
            return;
        }
        
        const email = emails[checkedCount];
        const proxy = getNextProxy();
        const proxyAuth = $('#proxyAuth').val().trim();
/*
   $ TEAM    : https://instagram.com/darkxcode_
   $ AUTHOR  : https://t.me/zlaxtert 
   $ CODE    : https://t.me/zexkings 
   $ DESIGN  : https://t.me/danielsmt 
   $ SITE    : https://darkxcode.site/
   $ VERSION : 1.0
*/  
        // Update status
        $('#currentStatus').html(`Checking: <strong>${email}</strong>`);
        $('#remainingEmails').text(totalCount - checkedCount - 1);
        
        // Prepare API URL
        let apiUrl = `https://api.darkxcode.site/validator/bounceV4/?list=${encodeURIComponent(email)}&apikey=${encodeURIComponent(apiKey)}&type_proxy=${encodeURIComponent(proxyType)}`;
        
        if (proxy) {
            apiUrl += `&proxy=${encodeURIComponent(proxy)}`;
        }
        
        if (proxyAuth) {
            apiUrl += `&proxyAuth=${encodeURIComponent(proxyAuth)}`;
        }
        
        // Make API request
        $.ajax({
            url: apiUrl,
            method: 'GET',
            timeout: 30000,
            success: function(response) {
                if (response && response.data) {
                    if (response.data.code === 200 && response.data.info && response.data.info.details) {
                        const details = response.data.info.details;
                        
                        if (details.valid && details.reason && (details.reason === 'LIVE DELIVERABLE' || details.reason === 'LIVE RISKY')) {
                            // Live email
                            addLiveResult(details);
                            liveCount++;
                            $('#liveCount').text(`${liveCount} found`);
                        } else {
                            // Die email
                            addDieResult(details);
                            dieCount++;
                            $('#dieCount').text(`${dieCount} found`);
                        }
                    } else if (response.data.info && response.data.info.msg) {
                        // API returned error message
                        addDieResult({
                            email: email,
                            valid: false,
                            reason: response.data.info.msg,
                            result: "ERROR"
                        });
                        dieCount++;
                        $('#dieCount').text(`${dieCount} found`);
                    }
                }
                
                // Update progress
                updateProgress();
            },
            error: function(xhr, status, error) {
                // Handle error
                addDieResult({
                    email: email,
                    valid: false,
                    reason: status === 'timeout' ? 'Timeout error' : 'Request failed',
                    result: "ERROR"
                });
                dieCount++;
                $('#dieCount').text(`${dieCount} found`);
                
                // Update progress
                updateProgress();
            }
        });
        
        function updateProgress() {
            checkedCount++;
            $('#checkedEmails').text(checkedCount);
            
            const progress = Math.round((checkedCount / totalCount) * 100);
            $('.progress-bar').css('width', `${progress}%`).text(`${progress}%`);
            
            // Check next email after a short delay to avoid overwhelming the API
            setTimeout(() => {
                checkNextEmail(emails, apiKey, proxyType);
            }, 100);
        }
    }
    
    // Function to add live result
    function addLiveResult(details) {
        const resultItem = `
            <li class="list-group-item live-email" data-email="${details.reason} | ${details.email} | Score: ${details.score} | Provider: ${details.provider} | Result: ${details.result} | Stat: ${details.statistic}">
                <div class="d-flex justify-content-between align-items-center">
                    <div>
                        <strong>${details.email}</strong>
                        <div class="text-success">${details.reason}</div>
                        <small class="text-muted">Score: ${details.score} | Provider: ${details.provider} | Result: ${details.result} | Stat: ${details.statistic}</small>
                    </div>
                    <div>
                        <button class="btn btn-sm btn-outline-secondary copy-btn" data-email="${details.reason} | ${details.email} | Score: ${details.score} | Provider: ${details.provider} | Result: ${details.result} | Stat: ${details.statistic}">
                            <i class="fas fa-copy"></i>
                        </button>
                        <button class="btn btn-sm btn-outline-danger delete-btn">
                            <i class="fas fa-trash"></i>
                        </button>
                    </div>
                </div>
            </li>
        `;
/*
   $ TEAM    : https://instagram.com/darkxcode_
   $ AUTHOR  : https://t.me/zlaxtert 
   $ CODE    : https://t.me/zexkings 
   $ DESIGN  : https://t.me/danielsmt 
   $ SITE    : https://darkxcode.site/
   $ VERSION : 1.0
*/
        $('#liveResults').append(resultItem);
        
        // Add event handlers for the new buttons
        $('#liveResults .copy-btn:last').click(function() {
            const email = $(this).data('email');
            navigator.clipboard.writeText(email);
        });
        
        $('#liveResults .delete-btn:last').click(function() {
            $(this).closest('.list-group-item').remove();
            liveCount--;
            $('#liveCount').text(`${liveCount} found`);
        });
    }
    
    // Function to add die result
    function addDieResult(details) {
        const resultItem = `
            <li class="list-group-item die-email" data-email="${details.reason} | ${details.email} | Score: ${details.score} | Provider: ${details.provider} | Result: ${details.result} | Stat: ${details.statistic}">
                <div class="d-flex justify-content-between align-items-center">
                    <div>
                        <strong>${details.email}</strong>
                        <div class="text-danger">${details.reason}</div>
                        ${details.score ? `<small class="text-muted">Score: ${details.score} | Provider: ${details.provider} | Result: ${details.result} | Stat: ${details.statistic}</small>` : ''}
                    </div>
                    <div>
                        <button class="btn btn-sm btn-outline-secondary copy-btn" data-email="${details.reason} | ${details.email} | Score: ${details.score} | Provider: ${details.provider} | Result: ${details.result} | Stat: ${details.statistic}">
                            <i class="fas fa-copy"></i>
                        </button>
                        <button class="btn btn-sm btn-outline-danger delete-btn">
                            <i class="fas fa-trash"></i>
                        </button>
                    </div>
                </div>
            </li>
        `;
        
        $('#dieResults').append(resultItem);
        
        // Add event handlers for the new buttons
        $('#dieResults .copy-btn:last').click(function() {
            const email = $(this).data('email');
            navigator.clipboard.writeText(email);
        });
        
        $('#dieResults .delete-btn:last').click(function() {
            $(this).closest('.list-group-item').remove();
            dieCount--;
            $('#dieCount').text(`${dieCount} found`);
        });
    }
    
    // Initialize email count
    updateEmailCount();
});

/*
   $ TEAM    : https://instagram.com/darkxcode_
   $ AUTHOR  : https://t.me/zlaxtert 
   $ CODE    : https://t.me/zexkings 
   $ DESIGN  : https://t.me/danielsmt 
   $ SITE    : https://darkxcode.site/
   $ VERSION : 1.0
*/