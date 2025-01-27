function findPlaceholdersWithPaths(obj, path = '', results = []) {
    for (let key in obj) {
        const newPath = path ? `${path}.${key}` : key;
        if (typeof obj[key] === 'object' && obj[key] !== null) {
            findPlaceholdersWithPaths(obj[key], newPath, results);
        } else if (typeof obj[key] === 'string') {
            const namedMatch = obj[key].match(/\[\['(.*?)',\s*([^\]]*?)\]\]/);
            if (namedMatch) {
                results.push({
                    placeholder: obj[key],
                    path: newPath,
                    currentValue: obj[key],
                    name: namedMatch[1],
                    type: namedMatch[2]
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

    placeholders.forEach((placeholder, index) => {
        const instanceDiv = document.createElement('div');
        instanceDiv.className = 'placeholder-instance';

        const header = document.createElement('div');
        header.className = 'placeholder-header';
        const pathParts = placeholder.path.split('.');
        const mainPath = pathParts[pathParts.length - 1];
        const fullPath = placeholder.path;
        header.innerHTML = `${mainPath}<br><span style="font-size: 11px; color: #888;">Path: ${fullPath}</span>`;
        
        const inputGroup = document.createElement('div');
        inputGroup.className = 'input-group';

        const labelText = placeholder.name 
            ? `${placeholder.name} (${placeholder.type}):`
            : `${placeholder.placeholder}:`;

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
        }

        if (placeholder.currentValue !== placeholder.placeholder) {
            input.value = placeholder.currentValue;
        }

        instanceDiv.appendChild(header);
        inputGroup.appendChild(label);
        inputGroup.appendChild(input);
        instanceDiv.appendChild(inputGroup);
        inputsContainer.appendChild(instanceDiv);
    });
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
        jsonInput.value = JSON.stringify(data, null, 2);
        errorElement.textContent = '';
        createInputFields();

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
    
    if (Hls.isSupported()) {
        const hls = new Hls();
        hls.loadSource(videoSrc);
        hls.attachMedia(video);
    }
    else if (video.canPlayType('application/vnd.apple.mpegurl')) {
        video.src = videoSrc;
    }
}

window.onload = function() {
    const formattedJson = JSON.stringify(window.jsonData, null, 2);
    document.getElementById('jsonInput').value = formattedJson;
    document.getElementById('jsonUpdated').value = formattedJson;
    createInputFields();
    initializeVideoPlayer();
};