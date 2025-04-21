function findPlaceholdersWithPaths(obj, path = '', results = []) {
    for (let key in obj) {
        const newPath = path ? `${path}.${key}` : key;
        if (typeof obj[key] === 'object' && obj[key] !== null) {
            findPlaceholdersWithPaths(obj[key], newPath, results);
        } else if (typeof obj[key] === 'string') {
            const namedMatch = obj[key].match(/\[\['(.*?)',\s*([^\]]*?)(?:,\s*'(.*?)')?(?:,\s*'(.*?)')?\]\]/);
            if (namedMatch) {
                console.log(namedMatch);
                results.push({
                    placeholder: obj[key],
                    path: newPath,
                    currentValue: obj[key],
                    name: namedMatch[1],
                    type: namedMatch[2],
                    section: namedMatch[3] || null,
                    defaultValue: namedMatch[4] || null
                });
            } else {
                const match = obj[key].match(/\[\[(.*?)\]\]/);
                if (match) {
                    results.push({
                        placeholder: match[0],
                        path: newPath,
                        currentValue: obj[key],
                        type: match[1]
                    });
                }
            }
        }
    }
    return results;
}

function setValueByPath(obj, path, value) {
    const parts = path.split('.');
    let current = obj;
    for (let i = 0; i < parts.length - 1; i++) {
        current = current[parts[i]];
    }
    current[parts[parts.length - 1]] = value;
}

function createInputFields() {
    const placeholders = findPlaceholdersWithPaths(window.jsonData);
    const inputsContainer = document.getElementById('dynamicInputs');
    inputsContainer.innerHTML = '';

    // Group placeholders by section
    const sectionMap = {};
    const noSectionPlaceholders = [];

    placeholders.forEach(placeholder => {
        if (placeholder.section) {
            if (!sectionMap[placeholder.section]) {
                sectionMap[placeholder.section] = [];
            }
            sectionMap[placeholder.section].push(placeholder);
        } else {
            noSectionPlaceholders.push(placeholder);
        }
    });

    // Create inputs for each section
    Object.keys(sectionMap).forEach(sectionName => {
        // Create section header
        const sectionHeader = document.createElement('div');
        sectionHeader.className = 'section-header';
        sectionHeader.textContent = sectionName;
        inputsContainer.appendChild(sectionHeader);

        // Create inputs for this section
        sectionMap[sectionName].forEach((placeholder, index) => {
            createPlaceholderInput(placeholder, index, inputsContainer);
        });
    });

    // Add a separator if we have both sectioned and non-sectioned placeholders
    if (Object.keys(sectionMap).length > 0 && noSectionPlaceholders.length > 0) {
        const separator = document.createElement('div');
        separator.className = 'section-separator';
        inputsContainer.appendChild(separator);
    }

    // Create inputs for placeholders without a section
    if (noSectionPlaceholders.length > 0) {
        // Only add "General" header if we have sections above
        if (Object.keys(sectionMap).length > 0) {
            const generalHeader = document.createElement('div');
            generalHeader.className = 'section-header';
            generalHeader.textContent = 'General';
            inputsContainer.appendChild(generalHeader);
        }

        noSectionPlaceholders.forEach((placeholder, index) => {
            createPlaceholderInput(placeholder, index, inputsContainer);
        });
    }
}

function createPlaceholderInput(placeholder, index, container) {
    const instanceDiv = document.createElement('div');
    instanceDiv.className = 'placeholder-instance';

    const header = document.createElement('div');
    header.className = 'placeholder-header';
    const pathParts = placeholder.path.split('.');
    const mainPath = pathParts[pathParts.length - 1];
    
    // Remove the header text completely to eliminate the type label
    // header.textContent = mainPath;
    
    const inputGroup = document.createElement('div');
    inputGroup.className = 'input-group';

    // Create a cleaner label text without the extra information
    let labelText;
    if (placeholder.name) {
        labelText = `${placeholder.name}:`;
    } else {
        labelText = `${placeholder.placeholder}:`;
    }

    const label = document.createElement('label');
    label.textContent = labelText;

    const input = document.createElement('input');
    input.id = `input-${index}`;
    input.dataset.path = placeholder.path;
    
    if (placeholder.type === 'COLOR') {
        input.type = 'color';
    } else if (placeholder.type === 'URL') {
        input.type = 'url';
        input.placeholder = 'Enter URL';
    } else {
        input.type = 'text';
        input.placeholder = 'Enter value';
    }

    if (placeholder.name) {
        input.dataset.isNamed = 'true';
        input.dataset.name = placeholder.name;
        input.dataset.type = placeholder.type;
        
        if (placeholder.section) {
            input.dataset.section = placeholder.section;
        }
    }

    // Set the input value based on the current value
    if (placeholder.defaultValue) {
        input.value = placeholder.defaultValue;
    } else if (placeholder.currentValue !== placeholder.placeholder) {
        // Extract the actual value if it's in the placeholder format
        const namedMatch = placeholder.currentValue.match(/\[\['(.*?)',\s*([^\]]*?)(?:,\s*'(.*?)')?(?:,\s*'(.*?)')?\]\]/);
        if (namedMatch && namedMatch[4]) {
            input.value = namedMatch[4]; // Use the default value from the placeholder
        } else {
            input.value = placeholder.currentValue;
        }
    }

    if (input.type === 'color') {
        input.addEventListener('change', handleInputChange);
    } else {
        input.addEventListener('focusout', handleInputChange);
    }

    // Only append the header if we want to show it (currently commented out)
    // instanceDiv.appendChild(header);
    
    inputGroup.appendChild(label);
    inputGroup.appendChild(input);
    instanceDiv.appendChild(inputGroup);
    container.appendChild(instanceDiv);
}

function updateJSON() {
    const inputs = document.querySelectorAll('#dynamicInputs input');
    
    inputs.forEach(input => {
        const path = input.dataset.path;
        const value = input.value;
        if (value) {
            if (input.dataset.isNamed === 'true') {
                setValueByPath(window.jsonData, path, value);
            } else {
                setValueByPath(window.jsonData, path, value);
            }
            
            // Add highlight effect
            const placeholderInstance = input.closest('.placeholder-instance');
            placeholderInstance.classList.add('updated');
            
            // Remove highlight after 1.5 seconds
            setTimeout(() => {
                placeholderInstance.classList.remove('updated');
            }, 1500);
        }
    });

    const formattedJson = JSON.stringify(window.jsonData, null, 2);
    document.getElementById('jsonUpdated').value = formattedJson;
}

function parseJSON() {
    const jsonInput = document.getElementById('jsonInput');
    const errorElement = document.getElementById('jsonError');
    
    try {
        window.jsonData = JSON.parse(jsonInput.value);
        errorElement.textContent = '';
        createInputFields();
    } catch (e) {
        errorElement.textContent = 'Invalid JSON: ' + e.message;
    }
}

function formatJSON() {
    const jsonInput = document.getElementById('jsonInput');
    const errorElement = document.getElementById('jsonError');
    
    try {
        const formatted = JSON.stringify(JSON.parse(jsonInput.value), null, 2);
        jsonInput.value = formatted;
        errorElement.textContent = '';
    } catch (e) {
        errorElement.textContent = 'Invalid JSON: ' + e.message;
    }
}

async function loadTemplate(templateName) {
    const url = window.templates[templateName];
    const jsonInput = document.getElementById('jsonInput');
    const jsonUpdated = document.getElementById('jsonUpdated');
    const errorElement = document.getElementById('jsonError');
    try {
        errorElement.textContent = 'Loading...';
        errorElement.style.color = '#666';

        const response = await fetch(url);
        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
        }
        
        const data = await response.json();
        window.jsonData = data;
        const formattedJson = JSON.stringify(data, null, 2);
        
        // Update both textareas
        jsonInput.value = formattedJson;
        jsonUpdated.value = formattedJson;
        
        errorElement.textContent = '';
        
        // Clear all highlights before creating new input fields
        const existingHighlights = document.querySelectorAll('.placeholder-instance.updated');
        existingHighlights.forEach(el => el.classList.remove('updated'));
        
        createInputFields();

        // Add a function to clear the undefined text
        clearUndefinedText();
        
        // Update JSON after loading template and creating input fields
        updateJSONAfterLoad();

    } catch (error) {
        errorElement.textContent = `Error loading template: ${error.message}`;
        errorElement.style.color = 'red';
    }
}

function copyToClipboard() {
    const textarea = document.getElementById('jsonUpdated');
    textarea.select();
    document.execCommand('copy');
    
    const button = document.querySelector('.copy-button');
    button.classList.add('show-message');
    
    setTimeout(() => {
        button.classList.remove('show-message');
    }, 2000);
}

function initializeVideoPlayer() {
    const video = document.getElementById('video-player');
    const videoSrc = 'https://2432eaf2dccf48859f8ea489fd5e0f8f.mediatailor.us-east-1.amazonaws.com/v1/master/7c8ce5ad5bcc5198ca301174a2ead89b25915ca4/stitchtest/index.m3u8';
    
    // Initialize HLS player
    if (Hls.isSupported()) {
        const hls = new Hls();
        hls.loadSource(videoSrc);
        hls.attachMedia(video);
    }
    else if (video.canPlayType('application/vnd.apple.mpegurl')) {
        video.src = videoSrc;
    }

    // Initialize InTheGame SDK
    if (window.inthegame) {
        window.inthegame.init({
            videoPlayerId: "video-player",
            accountId: '6742d3571cc96f979c9bc1d5',
            clocksMode: 'manual',
            adsMetadata: [{time: 75,duration: 10}],
            channelSlug: 'dpgtest'
        });
    }

    console.log('InTheGame SDK status:', window.inthegame ? 'loaded' : 'not loaded');
}

function injectJSON() {
    const jsonUpdated = document.getElementById('jsonUpdated');
    try {
        const jsonData = JSON.parse(jsonUpdated.value);
        const stringifiedJson = JSON.stringify(jsonData);
        console.log('Attempting to inject JSON:', stringifiedJson);
        
        if (window.inthegame && window.inthegame.injectFlexi) {
            window.inthegame.injectFlexi(stringifiedJson);
            
            const button = document.querySelector('.inject-button');
            button.classList.add('show-message');
            
            setTimeout(() => {
                button.classList.remove('show-message');
            }, 2000);
        } else {
            console.error('InTheGame SDK not loaded or injectFlexi not available');
        }
    } catch (error) {
        console.error('Error parsing JSON:', error);
    }
}

// Add this new function to handle input changes
function handleInputChange(event) {
    const input = event.target;
    const path = input.dataset.path;
    const value = input.value;
    
    if (value) {
        if (input.dataset.isNamed === 'true') {
            setValueByPath(window.jsonData, path, value);
        } else {
            setValueByPath(window.jsonData, path, value);
        }
        
        // Add highlight effect without removing it
        const placeholderInstance = input.closest('.placeholder-instance');
        placeholderInstance.classList.add('updated');

        // Update the JSON in the Updated JSON box
        const formattedJson = JSON.stringify(window.jsonData, null, 2);
        document.getElementById('jsonUpdated').value = formattedJson;
    }
}

function getClientFromURL() {
    const urlParams = new URLSearchParams(window.location.search);
    return urlParams.get('client') || 'default';
}

function loadClientTemplates() {
    const client = getClientFromURL();
    const scriptElement = document.getElementById('client-templates');
    scriptElement.src = `templates/${client}.js`;
    
    scriptElement.onload = () => {
        window.templates = window.clientTemplates;
        updateTemplateButtons();
    };
    
    scriptElement.onerror = () => {
        console.error('Error loading client templates, falling back to default');
        scriptElement.src = 'templates/default.js';
    };
}

function updateTemplateButtons() {
    const templateSelect = document.getElementById('template-select');
    templateSelect.innerHTML = '<option value="">Select Template</option>';
    
    // Add options for each template
    Object.keys(window.templates).forEach(templateName => {
        const option = document.createElement('option');
        option.textContent = templateName;
        option.value = templateName;
        templateSelect.appendChild(option);
    });
    
    // Add change event listener
    templateSelect.addEventListener('change', (e) => {
        if (e.target.value) {
            loadTemplate(e.target.value);
        }
    });
}

window.onload = function() {
    loadClientTemplates();
    
    // Initialize with empty strings instead of undefined
    document.getElementById('jsonInput').value = window.jsonData ? 
        JSON.stringify(window.jsonData, null, 2) : '';
    document.getElementById('jsonUpdated').value = window.jsonData ? 
        JSON.stringify(window.jsonData, null, 2) : '';
    
    createInputFields();
    initializeVideoPlayer();
};

// Add a function to clear the undefined text
function clearUndefinedText() {
    const textareas = document.querySelectorAll('.json-textarea');
    textareas.forEach(textarea => {
        if (textarea.value === 'undefined') {
            textarea.value = '';
        }
    });
}

function updateJSONAfterLoad() {
    // Get all inputs from the dynamic inputs container
    const inputs = document.querySelectorAll('#dynamicInputs input');
    
    // Process each input to update the JSON
    inputs.forEach(input => {
        const path = input.dataset.path;
        const value = input.value;
        
        if (value) {
            // Update the JSON data with the input value
            setValueByPath(window.jsonData, path, value);
        }
    });
    
    // Update the JSON in the output textarea
    const formattedJson = JSON.stringify(window.jsonData, null, 2);
    document.getElementById('jsonUpdated').value = formattedJson;
}