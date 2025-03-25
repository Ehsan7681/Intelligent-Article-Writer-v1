// متغیرهای سراسری
let selectedModel = null;
let uploadedSamples = [];
let allModels = []; // نگهداری همه مدل‌های بارگزاری شده
let searchHistory = []; // نگهداری تاریخچه جستجو
const MAX_SAMPLES = 10;
const MAX_SEARCH_HISTORY = 5; // حداکثر تعداد جستجوهای ذخیره شده

// دریافت المان‌ها
const modelStatusEl = document.getElementById('modelStatus');
const modelSelectEl = document.getElementById('modelSelect');
const modelSearchEl = document.getElementById('modelSearch');
const historyTagsEl = document.getElementById('historyTags');
const confirmModelBtn = document.getElementById('confirmModel');
const refreshModelsBtn = document.getElementById('refreshModels');
const apiKeyInput = document.getElementById('apiKey');
const saveApiKeyBtn = document.getElementById('saveApiKey');
const sampleFilesInput = document.getElementById('sampleFiles');
const filesCountEl = document.getElementById('filesCount');
const uploadSamplesBtn = document.getElementById('uploadSamples');
const articleTopicInput = document.getElementById('articleTopic');
const articleKeywordsInput = document.getElementById('articleKeywords');
const languageRadios = document.querySelectorAll('input[name="language"]');
const articleSizeRadios = document.querySelectorAll('input[name="articleSize"]');
const wordCountInput = document.getElementById('wordCount');
const generateArticleBtn = document.getElementById('generateArticle');
const articleContentEl = document.getElementById('article-content');
const copyArticleBtn = document.getElementById('copyBtn');
const saveAsWordBtn = document.getElementById('saveAsWordBtn');
const uploadProgressEl = document.getElementById('uploadProgress');
const uploadProgressFillEl = document.getElementById('uploadProgressFill');
const uploadProgressTextEl = document.getElementById('uploadProgressText');
const generationProgressEl = document.getElementById('generation-progress');
const generationProgressFillEl = document.getElementById('generation-progress-fill');
const generationProgressTextEl = document.getElementById('generation-progress-text');
const sampleCountInput = document.getElementById('sampleCount') || { value: '5' }; // اگر وجود نداشت، مقدار پیش‌فرض ۵

// بررسی و بارگذاری داده‌های ذخیره شده
document.addEventListener('DOMContentLoaded', () => {
    // بارگزاری کلید API
    const savedApiKey = localStorage.getItem('openrouter_api_key');
    if (savedApiKey) {
        apiKeyInput.value = savedApiKey;
        fetchModels();
    }
    
    // بارگزاری آخرین مدل انتخاب شده
    const lastSelectedModel = localStorage.getItem('last_selected_model');
    if (lastSelectedModel) {
        selectedModel = lastSelectedModel;
    }
    
    // بارگزاری تاریخچه جستجو
    const savedSearchHistory = localStorage.getItem('search_history');
    if (savedSearchHistory) {
        searchHistory = JSON.parse(savedSearchHistory);
        updateSearchHistoryUI();
    }
    
    // رویدادهای فرم
    setupEventListeners();
});

// تنظیم گوش‌دهنده‌های رویداد
function setupEventListeners() {
    // ذخیره کلید API
    saveApiKeyBtn.addEventListener('click', () => {
        const apiKey = apiKeyInput.value.trim();
        if (apiKey) {
            localStorage.setItem('openrouter_api_key', apiKey);
            fetchModels();
        } else {
            alert('لطفاً کلید API را وارد کنید');
        }
    });
    
    // بازخوانی لیست مدل‌ها
    refreshModelsBtn.addEventListener('click', fetchModels);
    
    // جستجوی مدل‌ها
    modelSearchEl.addEventListener('input', filterModels);
    
    // اضافه کردن جستجو به تاریخچه با enter
    modelSearchEl.addEventListener('keypress', (e) => {
        if (e.key === 'Enter' && modelSearchEl.value.trim() !== '') {
            addToSearchHistory(modelSearchEl.value.trim());
        }
    });
    
    // انتخاب مدل از لیست کشویی
    modelSelectEl.addEventListener('change', () => {
        selectedModel = modelSelectEl.value;
        // ذخیره مدل انتخاب شده
        if (selectedModel) {
            localStorage.setItem('last_selected_model', selectedModel);
        }
    });
    
    // تایید مدل انتخاب شده
    confirmModelBtn.addEventListener('click', () => {
        if (!selectedModel) {
            alert('لطفاً یک مدل را انتخاب کنید');
            return;
        }
        
        // ذخیره مدل انتخاب شده
        localStorage.setItem('last_selected_model', selectedModel);
        
        // اضافه کردن به تاریخچه جستجو اگر جستجویی انجام شده است
        if (modelSearchEl.value.trim() !== '') {
            addToSearchHistory(modelSearchEl.value.trim());
        }
        
        alert(`مدل "${selectedModel}" با موفقیت انتخاب شد`);
    });
    
    // انتخاب فایل‌های نمونه
    sampleFilesInput.addEventListener('change', updateFilesList);
    
    // بارگذاری فایل‌های نمونه
    uploadSamplesBtn.addEventListener('click', () => {
        if (sampleFilesInput.files.length === 0) {
            alert('لطفاً حداقل یک فایل نمونه انتخاب کنید');
            return;
        }
        
        uploadSamples();
    });
    
    // تولید مقاله
    generateArticleBtn.addEventListener('click', generateArticle);
    
    // کپی مقاله
    copyArticleBtn.addEventListener('click', () => {
        const content = articleContentEl.innerText;
        if (content && !content.includes('مقاله‌ای تولید نشده است')) {
            navigator.clipboard.writeText(content)
                .then(() => alert('مقاله با موفقیت کپی شد'))
                .catch(err => alert('خطا در کپی مقاله: ' + err));
        }
    });
    
    // دانلود مقاله به صورت Word
    saveAsWordBtn.addEventListener('click', saveAsWord);

    // تنظیم تعداد کلمات بر اساس اندازه انتخاب شده
    articleSizeRadios.forEach(radio => {
        radio.addEventListener('change', () => {
            switch(radio.value) {
                case 'short':
                    wordCountInput.value = '400';
                    break;
                case 'medium':
                    wordCountInput.value = '750';
                    break;
                case 'long':
                    wordCountInput.value = '1500';
                    break;
            }
        });
    });

    // تنظیم اندازه مقاله بر اساس تعداد کلمات وارد شده
    wordCountInput.addEventListener('input', () => {
        const count = parseInt(wordCountInput.value);
        if (count >= 300 && count <= 500) {
            document.querySelector('input[name="articleSize"][value="short"]').checked = true;
        } else if (count >= 600 && count <= 900) {
            document.querySelector('input[name="articleSize"][value="medium"]').checked = true;
        } else if (count >= 1000 && count <= 2000) {
            document.querySelector('input[name="articleSize"][value="long"]').checked = true;
        }
    });
}

// فیلتر کردن مدل‌ها براساس جستجو
function filterModels() {
    const searchTerm = modelSearchEl.value.trim().toLowerCase();
    
    if (!allModels.length) return;
    
    if (!searchTerm) {
        // نمایش همه مدل‌ها
        displayModels(allModels);
        return;
    }
    
    // فیلتر مدل‌ها براساس عبارت جستجو
    const filteredModels = allModels.filter(model => {
        const modelName = (model.name || model.id).toLowerCase();
        return modelName.includes(searchTerm);
    });
    
    displayModels(filteredModels);
}

// اضافه کردن جستجو به تاریخچه
function addToSearchHistory(searchTerm) {
    // اگر جستجو تکراری است، آن را حذف کنیم تا دوباره در انتهای لیست اضافه شود
    searchHistory = searchHistory.filter(item => item.toLowerCase() !== searchTerm.toLowerCase());
    
    // اضافه کردن جستجوی جدید
    searchHistory.unshift(searchTerm);
    
    // محدود کردن تعداد جستجوها
    if (searchHistory.length > MAX_SEARCH_HISTORY) {
        searchHistory = searchHistory.slice(0, MAX_SEARCH_HISTORY);
    }
    
    // ذخیره تاریخچه جستجو
    localStorage.setItem('search_history', JSON.stringify(searchHistory));
    
    // بروزرسانی UI
    updateSearchHistoryUI();
}

// به‌روزرسانی نمایش تاریخچه جستجو
function updateSearchHistoryUI() {
    historyTagsEl.innerHTML = '';
    
    if (searchHistory.length === 0) {
        historyTagsEl.innerHTML = '<span class="no-history">تاریخچه‌ای وجود ندارد</span>';
        return;
    }
    
    searchHistory.forEach((term, index) => {
        const tag = document.createElement('div');
        tag.className = 'history-tag';
        tag.innerHTML = `
            <button class="remove-tag" data-index="${index}">&times;</button>
            <span>${term}</span>
        `;
        
        // اضافه کردن رویداد کلیک برای استفاده از جستجوی قبلی
        tag.addEventListener('click', (e) => {
            // اگر روی دکمه حذف کلیک شد، جستجو را اعمال نکنیم
            if (e.target.classList.contains('remove-tag')) return;
            
            modelSearchEl.value = term;
            filterModels();
        });
        
        historyTagsEl.appendChild(tag);
    });
    
    // اضافه کردن رویداد کلیک برای دکمه‌های حذف
    document.querySelectorAll('.remove-tag').forEach(btn => {
        btn.addEventListener('click', (e) => {
            e.stopPropagation(); // جلوگیری از رویداد کلیک والد
            const index = parseInt(e.target.dataset.index);
            
            // حذف از تاریخچه
            searchHistory.splice(index, 1);
            localStorage.setItem('search_history', JSON.stringify(searchHistory));
            
            // بروزرسانی UI
            updateSearchHistoryUI();
        });
    });
}

// دریافت لیست مدل‌ها از OpenRouter
async function fetchModels() {
    const apiKey = apiKeyInput.value.trim();
    if (!apiKey) {
        modelStatusEl.innerText = 'کلید API وارد نشده است. لطفاً کلید API را وارد کنید.';
        return;
    }
    
    modelStatusEl.innerText = 'در حال دریافت لیست مدل‌ها...';
    modelSelectEl.innerHTML = '<option value="">-- یک مدل انتخاب کنید --</option>';
    
    try {
        const response = await fetch('https://openrouter.ai/api/v1/models', {
            method: 'GET',
            headers: {
                'Authorization': `Bearer ${apiKey}`,
                'Content-Type': 'application/json'
            }
        });
        
        if (!response.ok) {
            throw new Error(`خطا در دریافت مدل‌ها: ${response.status} ${response.statusText}`);
        }
        
        const data = await response.json();
        
        if (data && data.data && data.data.length > 0) {
            modelStatusEl.innerText = `${data.data.length} مدل یافت شد`;
            allModels = data.data; // ذخیره همه مدل‌ها
            
            // اگر عبارت جستجویی وجود دارد، فیلتر کنیم، در غیر این صورت همه را نمایش دهیم
            if (modelSearchEl.value.trim()) {
                filterModels();
            } else {
                displayModels(allModels);
            }
        } else {
            modelStatusEl.innerText = 'هیچ مدلی یافت نشد';
        }
    } catch (error) {
        modelStatusEl.innerText = error.message || 'خطا در دریافت مدل‌ها';
        console.error('Error fetching models:', error);
    }
}

// نمایش مدل‌ها در لیست کشویی
function displayModels(models) {
    // ابتدا لیست را خالی می‌کنیم به جز گزینه پیش‌فرض
    modelSelectEl.innerHTML = '<option value="">-- یک مدل انتخاب کنید --</option>';
    
    // مدل‌ها را مرتب می‌کنیم براساس نام
    models.sort((a, b) => (a.name || a.id).localeCompare(b.name || b.id));
    
    models.forEach(model => {
        const option = document.createElement('option');
        option.value = model.id;
        
        // نمایش نام مدل و تعداد توکن‌ها (اگر موجود باشد)
        const tokenCount = model.context_length || model.contextLength || '';
        const tokenText = tokenCount ? ` (${tokenCount} توکن)` : '';
        
        option.textContent = `${model.name || model.id}${tokenText}`;
        
        modelSelectEl.appendChild(option);
    });
    
    // اگر مدلی قبلاً انتخاب شده، آن را مجدداً انتخاب می‌کنیم
    if (selectedModel) {
        modelSelectEl.value = selectedModel;
    }
}

// به‌روزرسانی لیست فایل‌های انتخاب شده
function updateFilesList() {
    const files = sampleFilesInput.files;
    
    if (files.length > MAX_SAMPLES) {
        alert(`حداکثر ${MAX_SAMPLES} فایل می‌توانید انتخاب کنید`);
        sampleFilesInput.value = '';
        filesCountEl.textContent = '0';
        return;
    }
    
    filesCountEl.textContent = files.length;
    
    const filesList = document.getElementById('filesList');
    filesList.innerHTML = `<p>فایل‌های انتخاب شده: <span id="filesCount">${files.length}</span></p>`;
    
    for (let i = 0; i < files.length; i++) {
        const file = files[i];
        const fileItem = document.createElement('div');
        fileItem.className = 'file-item';
        fileItem.innerHTML = `
            <span>${file.name}</span>
            <small>(${(file.size / 1024).toFixed(2)} KB)</small>
        `;
        filesList.appendChild(fileItem);
    }
}

// بارگذاری فایل‌های نمونه
function uploadSamples() {
    const files = sampleFilesInput.files;
    uploadedSamples = [];
    
    // نمایش نوار پیشرفت
    uploadProgressEl.style.display = 'block';
    uploadProgressFillEl.style.width = '0%';
    uploadProgressTextEl.textContent = 'در حال بارگذاری...';
    
    let processedFiles = 0;
    
    for (let i = 0; i < files.length; i++) {
        const file = files[i];
        
        // خواندن محتوای فایل‌ها
        const reader = new FileReader();
        
        reader.onload = function(e) {
            const fileName = file.name;
            const fileContent = e.target.result;
            
            uploadedSamples.push({
                name: fileName,
                content: fileContent,
                type: file.type
            });
            
            processedFiles++;
            
            // به‌روزرسانی پیشرفت
            const progress = (processedFiles / files.length) * 100;
            uploadProgressFillEl.style.width = `${progress}%`;
            uploadProgressTextEl.textContent = `در حال بارگذاری... ${processedFiles} از ${files.length} فایل`;
            
            if (processedFiles === files.length) {
                uploadProgressTextEl.textContent = 'بارگذاری با موفقیت انجام شد';
                setTimeout(() => {
                    uploadProgressEl.style.display = 'none';
                    alert(`${files.length} فایل با موفقیت بارگذاری شد`);
                }, 1000);
            }
        };
        
        if (file.type.includes('pdf')) {
            reader.readAsArrayBuffer(file);
        } else {
            reader.readAsText(file);
        }
    }
}

// تابع تولید مقاله بهبود یافته
async function generateArticle() {
    const apiKey = apiKeyInput.value.trim();
    if (!apiKey) {
        alert("لطفاً کلید API را وارد کنید.");
        return;
    }

    if (!selectedModel) {
        alert("لطفاً یک مدل هوش مصنوعی را انتخاب کنید.");
        return;
    }

    const topic = articleTopicInput.value.trim();
    if (!topic) {
        alert("لطفاً موضوع مقاله را وارد کنید.");
        return;
    }

    const keywords = articleKeywordsInput.value.trim();
    const sampleCount = parseInt(sampleCountInput.value) || 0;

    if (sampleCount > 0 && uploadedSamples.length === 0) {
        alert("لطفاً حداقل یک نمونه مقاله بارگذاری کنید.");
        return;
    }

    articleContentEl.innerHTML = '<div class="placeholder">در حال تولید مقاله...</div>';
    
    // نمایش نوار پیشرفت
    generationProgressEl.style.display = 'block';
    generationProgressFillEl.style.width = '5%';
    generationProgressTextEl.innerText = 'در حال آماده‌سازی...';

    try {
        let samplesText = "";
        if (uploadedSamples.length > 0) {
            const usedSamples = uploadedSamples.slice(0, sampleCount).map(sample => sample.content);
            samplesText = "نمونه مقالات:\n\n" + usedSamples.join("\n\n----------\n\n");
        }

        const prompt = `تو یک متخصص نویسنده مقالات علمی و تخصصی هستی. 
        لطفاً یک مقاله جامع، یکپارچه و کامل در مورد "${topic}" بنویس.
        ${keywords ? `کلمات کلیدی: ${keywords}` : ""}
        ${samplesText ? `\n\n${samplesText}` : ""}
        
        مقاله باید شامل:
        1. عنوان کامل و گویا
        2. چکیده کوتاه
        3. متن اصلی مقاله با پاراگراف‌های مرتبط و پیوسته
        4. نتیجه‌گیری
        5. منابع (در صورت لزوم)
        
        نکات مهم:
        - مقاله یکپارچه و پیوسته باشد، نه بخش‌های جدا از هم
        - هر پاراگراف به طور منطقی به پاراگراف بعدی متصل باشد
        - از عنوان‌های فرعی به صورت محدود استفاده کن تا پیوستگی مقاله حفظ شود
        - فرمت HTML استفاده شود
        - چکیده در ابتدای مقاله و منابع در انتهای آن قرار گیرد`;

        // بروزرسانی نوار پیشرفت
        generationProgressFillEl.style.width = '15%';
        generationProgressTextEl.innerText = 'در حال ارسال درخواست...';

        const response = await fetch("https://openrouter.ai/api/v1/chat/completions", {
            method: "POST",
            headers: {
                "Content-Type": "application/json",
                "Authorization": `Bearer ${apiKey}`,
                "HTTP-Referer": window.location.href,
                "X-Title": "Smart Article Writer"
            },
            body: JSON.stringify({
                model: selectedModel,
                messages: [
                    { role: "user", content: prompt }
                ],
                stream: true
            })
        });

        // بروزرسانی نوار پیشرفت
        generationProgressFillEl.style.width = '25%';
        generationProgressTextEl.innerText = 'شروع دریافت پاسخ...';

        if (!response.ok) {
            let errorMsg = `خطا: ${response.status}`;
            if (response.status === 402) {
                errorMsg = "خطای 402: اعتبار کافی در حساب کاربری OpenRouter وجود ندارد. لطفاً وضعیت حساب خود را بررسی کنید.";
            }
            throw new Error(errorMsg);
        }

        // پاک کردن محتوای قبلی
        articleContentEl.innerHTML = '';
        
        let articleHtml = '';
        let progressCounter = 25;
        
        if (response.body) {
            const reader = response.body.getReader();
            const decoder = new TextDecoder();
            let partialLine = '';
            
            while (true) {
                const { value, done } = await reader.read();
                if (done) break;
                
                const text = decoder.decode(value, { stream: true });
                const lines = (partialLine + text).split('\n');
                partialLine = lines.pop() || '';
                
                // پردازش هر خط پاسخ
                for (const line of lines) {
                    if (line.trim() === '') continue;
                    if (!line.startsWith('data:')) continue;
                    if (line === 'data: [DONE]') continue;
                    
                    try {
                        const content = JSON.parse(line.substring(6)).choices[0]?.delta?.content || '';
                        if (content) {
                            articleHtml += content;
                            
                            // بروزرسانی پیشرفت
                            progressCounter += 0.5;
                            if (progressCounter < 95) {
                                generationProgressFillEl.style.width = `${progressCounter}%`;
                                if (progressCounter < 40) {
                                    generationProgressTextEl.innerText = 'در حال تولید عنوان و چکیده...';
                                } else if (progressCounter < 70) {
                                    generationProgressTextEl.innerText = 'در حال تولید متن اصلی مقاله...';
                                } else {
                                    generationProgressTextEl.innerText = 'در حال تکمیل نتیجه‌گیری و منابع...';
                                }
                            }
                        }
                    } catch (parseError) {
                        console.error('خطا در تجزیه پاسخ:', parseError);
                    }
                }
                
                // به‌روزرسانی محتوای مقاله با نمایش HTML
                articleContentEl.innerHTML = articleHtml;
            }
        }
        
        // پردازش نهایی محتوا
        let finalHtml = articleHtml;
        
        // بررسی و اصلاح ساختار HTML
        if (!finalHtml.includes('<h1') && !finalHtml.includes('<h2')) {
            // اگر تگ‌های HTML صحیح نداشت، محتوا را با ساختار مناسب فرمت‌بندی می‌کنیم
            const lines = finalHtml.split('\n').filter(line => line.trim());
            finalHtml = '';
            
            // پیدا کردن عنوان
            let title = lines[0];
            if (title) {
                // حذف علامت‌های احتمالی از ابتدای عنوان
                title = title.replace(/^[#*\s]+/, '');
                finalHtml += `<h1 class="article-title">${title}</h1>`;
            }
            
            // تشخیص چکیده و بدنه اصلی
            let abstractFound = false;
            let bodyContent = '';
            let conclusionContent = '';
            let referencesContent = '';
            
            for (let i = 1; i < lines.length; i++) {
                const line = lines[i].trim();
                
                // تشخیص بخش‌های مختلف
                if (line.toLowerCase().includes('چکیده') || line.toLowerCase().includes('abstract')) {
                    abstractFound = true;
                    finalHtml += `<div class="article-section abstract">
                        <h2>چکیده</h2>
                        <div class="section-content">`;
                    continue;
                } else if (line.toLowerCase().includes('نتیجه') || line.toLowerCase().includes('جمع‌بندی') || line.toLowerCase().includes('conclusion')) {
                    if (abstractFound) finalHtml += `</div></div>`;
                    finalHtml += `<div class="article-section conclusion">
                        <h2>نتیجه‌گیری</h2>
                        <div class="section-content">`;
                    continue;
                } else if (line.toLowerCase().includes('منابع') || line.toLowerCase().includes('references')) {
                    if (abstractFound) finalHtml += `</div></div>`;
                    finalHtml += `<div class="article-section references">
                        <h2>منابع</h2>
                        <div class="section-content">`;
                    continue;
                }
                
                // اضافه کردن محتوا به بخش فعلی
                if (line) {
                    if (!line.endsWith('.') && !line.endsWith('؟') && !line.endsWith('!') && 
                        !line.endsWith('،') && !line.endsWith(':') && !line.endsWith('؛')) {
                        finalHtml += `<p>${line}</p>`;
                    } else {
                        finalHtml += `<p>${line}</p>`;
                    }
                }
            }
            
            // بستن آخرین بخش
            if (abstractFound) finalHtml += `</div></div>`;
        }
        
        // نمایش محتوای نهایی
        articleContentEl.innerHTML = finalHtml;
        
        // تکمیل نوار پیشرفت
        generationProgressFillEl.style.width = '100%';
        generationProgressTextEl.innerText = 'مقاله با موفقیت تولید شد';
        
        setTimeout(() => {
            generationProgressEl.style.display = 'none';
        }, 3000);
    } catch (error) {
        console.error('خطا در تولید مقاله:', error);
        articleContentEl.innerHTML = `<div class="error">${error.message}</div>`;
        
        // نمایش خطا در نوار پیشرفت
        generationProgressFillEl.style.width = '100%';
        generationProgressFillEl.style.backgroundColor = '#e74c3c';
        generationProgressTextEl.innerText = 'خطا در تولید مقاله';
    }
}

// ذخیره مقاله به صورت Word
async function saveAsWord() {
    try {
        // بررسی وجود محتوا
        const content = articleContentEl.innerText;
        if (!content || content.includes('مقاله‌ای تولید نشده است')) {
            alert('ابتدا یک مقاله تولید کنید');
            return;
        }

        // استفاده از کتابخانه docx.js
        const { Document, Paragraph, TextRun, HeadingLevel, Packer } = docx;

        // ایجاد سند جدید
        const doc = new Document({
            sections: [{
                properties: {},
                children: []
            }]
        });

        // دریافت عنوان مقاله
        const topic = articleTopicInput.value.trim() || 'مقاله';
        
        // اضافه کردن عنوان به نام فایل
        const fileName = `${topic}_${new Date().toLocaleDateString('fa-IR')}.docx`;

        // تبدیل محتوا به پاراگراف‌های docx
        const sections = articleContentEl.children;
        
        for (const section of sections) {
            if (section.tagName === 'H1') {
                // عنوان مقاله
                doc.addParagraph(new Paragraph({
                    text: section.textContent,
                    heading: HeadingLevel.HEADING_1,
                    spacing: { after: 400 }
                }));
            } else if (section.classList.contains('article-section')) {
                // عنوان بخش
                const sectionTitle = section.querySelector('h2');
                if (sectionTitle) {
                    doc.addParagraph(new Paragraph({
                        text: sectionTitle.textContent,
                        heading: HeadingLevel.HEADING_2,
                        spacing: { before: 400, after: 200 }
                    }));
                }
                
                // محتوای بخش
                const sectionContent = section.querySelector('.section-content');
                if (sectionContent) {
                    const paragraphs = sectionContent.querySelectorAll('p');
                    
                    paragraphs.forEach(p => {
                        if (p.textContent.trim()) {
                            doc.addParagraph(new Paragraph({
                                children: [new TextRun(p.textContent.trim())],
                                spacing: { after: 200 }
                            }));
                        }
                    });
                }
            } else if (section.tagName === 'P' || section.tagName === 'DIV') {
                // پاراگراف‌های متن اصلی
                if (section.textContent.trim() && 
                    !section.textContent.includes('مقاله‌ای تولید نشده است') && 
                    !section.classList.contains('placeholder')) {
                    doc.addParagraph(new Paragraph({
                        children: [new TextRun(section.textContent.trim())],
                        spacing: { after: 200 }
                    }));
                }
            }
        }

        // تبدیل به Blob و ذخیره
        const blob = await Packer.toBlob(doc);
        saveAs(blob, fileName);
        
    } catch (error) {
        console.error('Error creating Word document:', error);
        alert('خطا در ایجاد فایل Word: ' + error.message);
    }
} 