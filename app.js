class ClashTimer {
    constructor() {
        this.tasks = [];
        this.nextId = 1;
        // 完全移除每个账号的最大任务数限制
        this.maxTasksPerAccount = Infinity;
        // 初始化账号列表为空，后续根据实际数据动态添加
        this.accounts = [];
        this.loadTasks();
        this.initElements();
        this.populateTimeSelectors();
        this.setDefaultValues();
        this.initEventListeners();
        this.updateUI();
        this.startTimer();
    }

    initElements() {
        this.tasksList = document.getElementById('tasks-list');
        this.addTaskBtn = document.getElementById('add-task-btn');
        this.modal = document.getElementById('task-modal');
        this.closeModal = document.querySelector('.close');
        this.taskForm = document.getElementById('task-form');
        this.accountInput = document.getElementById('account');
        this.buildingCategoryInput = document.getElementById('building-category');
        this.daysInput = document.getElementById('days');
        this.hoursInput = document.getElementById('hours');
        this.minutesInput = document.getElementById('minutes');
        this.totalTasksSpan = document.getElementById('total-tasks');
        this.accountStatsDiv = document.getElementById('account-stats');
        // 添加导入数据相关元素
        this.importDataBtn = document.getElementById('import-data-btn');
        this.importModal = document.getElementById('import-modal');
        this.pasteArea = document.getElementById('paste-area');
        this.parseBtn = document.getElementById('parse-btn');
        // 获取所有关闭按钮
        this.closeButtons = document.querySelectorAll('.close');
    }

    populateTimeSelectors() {
        // 填充天数下拉框 (0-15天)
        for (let i = 0; i <= 15; i++) {
            const option = document.createElement('option');
            option.value = i;
            option.textContent = i + ' 天';
            this.daysInput.appendChild(option);
        }

        // 填充小时数下拉框 (0-23小时)
        for (let i = 0; i <= 23; i++) {
            const option = document.createElement('option');
            option.value = i;
            option.textContent = i + ' 小时';
            this.hoursInput.appendChild(option);
        }

        // 填充分钟数下拉框 (0-59分钟)
        for (let i = 0; i <= 59; i++) {
            const option = document.createElement('option');
            option.value = i;
            option.textContent = i + ' 分钟';
            this.minutesInput.appendChild(option);
        }
    }

    updateAccountOptions() {
        // 清空现有选项
        this.accountInput.innerHTML = '';
        
        // 为每个账号添加选项
        this.accounts.forEach(account => {
            const option = document.createElement('option');
            option.value = account;
            option.textContent = account;
            this.accountInput.appendChild(option);
        });
    }

    setDefaultValues() {
        // 设置建筑类型默认为进攻
        this.buildingCategoryInput.value = "进攻";
        
        // 设置时间默认为0天0小时0分钟
        this.daysInput.value = 0;
        this.hoursInput.value = 0;
        this.minutesInput.value = 0;
        
        // 更新账号选项并设置默认值
        this.updateAccountOptions();
        if (this.accounts.length > 0) {
            this.accountInput.value = this.accounts[0];
        }
    }

    initEventListeners() {
        this.addTaskBtn.addEventListener('click', () => {
            this.checkAndOpenModal();
        });

        // 添加导入数据按钮事件监听器
        this.importDataBtn.addEventListener('click', () => {
            this.openImportModal();
        });

        // 修改关闭按钮事件监听器
        this.closeButtons.forEach(button => {
            button.addEventListener('click', (e) => {
                // 判断是哪个模态框的关闭按钮
                const modal = e.target.closest('.modal');
                this.closeModalFunc(modal);
            });
        });

        window.addEventListener('click', (e) => {
            // 点击模态框外部区域关闭模态框
            if (e.target === this.modal) {
                this.closeModalFunc(this.modal);
            } else if (e.target === this.importModal) {
                this.closeModalFunc(this.importModal);
            }
        });

        this.taskForm.addEventListener('submit', (e) => {
            e.preventDefault();
            this.addTask();
        });

        // 添加粘贴区域事件监听器
        this.parseBtn.addEventListener('click', () => {
            this.parseAndImportData();
        });
    }

    loadTasks() {
        const savedTasks = localStorage.getItem('clashTimerTasks');
        if (savedTasks) {
            const data = JSON.parse(savedTasks);
            this.tasks = data.tasks || [];
            this.accounts = data.accounts || [];
            
            // 更新nextId以避免ID冲突
            const ids = this.tasks.map(task => task.id);
            this.nextId = ids.length > 0 ? Math.max(...ids) + 1 : 1;
        }
    }

    saveTasks() {
        const data = {
            tasks: this.tasks,
            accounts: this.accounts
        };
        localStorage.setItem('clashTimerTasks', JSON.stringify(data));
    }

    checkAndOpenModal() {
        // 完全移除账号任务上限检查，直接打开模态框
        this.openModal();
    }

    addTask() {
        const account = this.accountInput.value;
        const buildingCategory = this.buildingCategoryInput.value;
        const days = parseInt(this.daysInput.value) || 0;
        const hours = parseInt(this.hoursInput.value) || 0;
        const minutes = parseInt(this.minutesInput.value) || 0;

        if (!account) {
            alert('请选择账号');
            return;
        }

        if (!buildingCategory) {
            alert('请选择建筑类型');
            return;
        }

        if (isNaN(days) || isNaN(hours) || isNaN(minutes) || 
            (days === 0 && hours === 0 && minutes === 0)) {
            alert('请选择有效的升级时间');
            return;
        }

        // 如果账号不存在，则添加到账号列表中
        if (!this.accounts.includes(account)) {
            this.accounts.push(account);
        }

        const totalTimeInMs = ((days * 24 * 60) + (hours * 60) + minutes) * 60 * 1000;
        const endTime = Date.now() + totalTimeInMs;

        const task = {
            id: this.nextId++,
            account,
            buildingCategory,
            days,
            hours,
            minutes,
            endTime,
            completed: false
        };

        this.tasks.push(task);
        this.saveTasks();
        this.updateUI();
        this.closeModalFunc();
        this.showNotification(`已添加新任务: ${account} - ${buildingCategory}`);
        
        // 重置表单默认值
        this.setDefaultValues();
    }

    // 解析并导入部落.txt数据
    parseAndImportData() {
        const rawData = this.pasteArea.value.trim();
        if (!rawData) {
            alert('请先粘贴部落.txt文件的内容');
            return;
        }

        try {
            // 按行分割数据
            const lines = rawData.split('\n').filter(line => line.trim() !== '');
            let importedTasks = 0;
            // 记录已处理的账号，避免重复删除
            const processedAccounts = new Set();

            // 解析每一行数据
            lines.forEach(line => {
                try {
                    const data = JSON.parse(line);
                    // 使用tag作为账号标识
                    const accountTag = data.tag;
                    
                    // 如果账号不存在，则添加到账号列表中
                    if (!this.accounts.includes(accountTag)) {
                        this.accounts.push(accountTag);
                    }
                    
                    // 如果还没有处理过这个账号，则先删除该账号的原有任务
                    if (!processedAccounts.has(accountTag)) {
                        this.tasks = this.tasks.filter(task => task.account !== accountTag);
                        processedAccounts.add(accountTag);
                    }
                    
                    // 递归函数，用于查找对象及其嵌套结构中的所有timer
                    const extractTimers = (obj, path = '') => {
                        if (!obj || typeof obj !== 'object') {
                            return [];
                        }
                        
                        const timers = [];
                        
                        Object.keys(obj).forEach(key => {
                            const value = obj[key];
                            const currentPath = path ? `${path}.${key}` : key;
                            
                            // 如果当前属性是timer，添加到结果中
                            if (key === 'timer' && typeof value === 'number') {
                                timers.push({
                                    path: path,
                                    timer: value
                                });
                            } 
                            // 如果是对象或数组，递归查找
                            else if (value && typeof value === 'object') {
                                timers.push(...extractTimers(value, currentPath));
                            }
                        });
                        
                        return timers;
                    };
                    
                    // 提取所有timer数据
                    const allTimers = extractTimers(data);
                    
                    // 为每个timer创建任务
                    allTimers.forEach(({ path, timer }) => {
                        // 根据路径确定升级类型
                        let category = '未知升级';
                        if (path.includes('buildings')) {
                            category = '建筑升级';
                        } else if (path.includes('heroes')) {
                            category = '英雄升级';
                        } else if (path.includes('spells')) {
                            category = '法术升级';
                        } else if (path.includes('equipment')) {
                            category = '装备升级';
                        } else if (path.includes('pets')) {
                            category = '宠物升级';
                        } else if (path.includes('units')) {
                            category = '部队升级';
                        } else if (path.includes('siege')) {
                            category = '攻城机器';
                        } else if (path.includes('laboratory')) {
                            category = '实验室升级';
                        } else if (path.includes('castle')) {
                            category = '城堡升级';
                        }
                        
                        this.createTaskFromTimer(accountTag, category, timer);
                        importedTasks++;
                    });
                } catch (e) {
                    console.error('解析单行数据时出错:', e);
                }
            });

            // 保存并更新UI
            this.saveTasks();
            this.updateUI();
            
            // 清空输入框内容
            this.pasteArea.value = '';
            
            // 关闭导入弹窗
            this.closeModalFunc(this.importModal);
            
            if (importedTasks > 0) {
                this.showNotification(`成功导入 ${importedTasks} 个任务`);
            } else {
                this.showNotification('未找到可导入的倒计时任务');
            }
        } catch (e) {
            console.error('解析数据时出错:', e);
            alert('数据解析失败，请确保粘贴的是有效的部落.txt文件内容');
        }
    }

    // 根据秒数创建任务
    createTaskFromTimer(account, buildingCategory, seconds) {
        // 移除账号任务上限检查
        
        // 将秒数转换为天、小时、分钟
        const days = Math.floor(seconds / (24 * 60 * 60));
        const hours = Math.floor((seconds % (24 * 60 * 60)) / (60 * 60));
        const minutes = Math.floor((seconds % (60 * 60)) / 60);
        
        // 计算结束时间
        const totalTimeInMs = seconds * 1000;
        const endTime = Date.now() + totalTimeInMs;

        const task = {
            id: this.nextId++,
            account,
            buildingCategory,
            days,
            hours,
            minutes,
            endTime,
            completed: false
        };

        this.tasks.push(task);
    }

    deleteTask(id) {
        this.tasks = this.tasks.filter(task => task.id !== id);
        this.saveTasks();
        this.updateUI();
    }

    finishTask(id) {
        const task = this.tasks.find(task => task.id === id);
        if (task) {
            task.completed = true;
            this.saveTasks();
            this.updateUI();
        }
    }

    formatTime(ms) {
        if (ms <= 0) {
            return "已完成";
        }

        const seconds = Math.floor(ms / 1000) % 60;
        const minutes = Math.floor(ms / (1000 * 60)) % 60;
        const hours = Math.floor(ms / (1000 * 60 * 60)) % 24;
        const days = Math.floor(ms / (1000 * 60 * 60 * 24));

        if (days > 0) {
            return `${days}天 ${hours}小时 ${minutes}分 ${seconds}秒`;
        } else if (hours > 0) {
            return `${hours}小时 ${minutes}分 ${seconds}秒`;
        } else if (minutes > 0) {
            return `${minutes}分 ${seconds}秒`;
        } else {
            return `${seconds}秒`;
        }
    }

    updateAccountStats() {
        let statsHTML = '';
        
        this.accounts.forEach(account => {
            const accountTasks = this.tasks.filter(task => task.account === account && !task.completed);
            // 显示任务数量而不是剩余数量
            statsHTML += `<span class="account-stat">${account}: ${accountTasks.length} 个任务</span>`;
        });
        
        this.accountStatsDiv.innerHTML = statsHTML;
    }

    updateCountdowns() {
        const now = Date.now();
        let activeTasks = 0;

        this.tasks.forEach(task => {
            const timeLeft = task.endTime - now;
            
            if (!task.completed) {
                if (timeLeft <= 0) {
                    // 任务已完成
                    if (!task.completed) {
                        task.completed = true;
                        this.sendNotification(`建筑升级完成: ${task.account} - ${task.buildingCategory}`);
                        this.playNotificationSound();
                    }
                } else {
                    activeTasks++;
                }
            }
        });

        this.totalTasksSpan.textContent = `正在进行: ${activeTasks} 个建筑升级`;
        this.saveTasks(); // 保存可能的状态更改
    }

    renderTasks() {
        this.tasksList.innerHTML = '';

        if (this.tasks.length === 0) {
            this.tasksList.innerHTML = '<li class="empty-state">暂无升级任务</li>';
            return;
        }

        const now = Date.now();

        // 按完成状态排序（未完成在前）
        this.tasks.sort((a, b) => {
            if (a.completed && !b.completed) return 1;
            if (!a.completed && b.completed) return -1;
            return a.endTime - b.endTime;
        });

        this.tasks.forEach(task => {
            const timeLeft = task.endTime - now;
            const isFinished = timeLeft <= 0 || task.completed;

            const li = document.createElement('li');
            li.className = `task-card ${isFinished ? 'completed' : ''}`;
            
            // 计算预计完成时间
            const finishDate = new Date(task.endTime);
            const finishTimeStr = `${finishDate.getFullYear()}-${(finishDate.getMonth()+1).toString().padStart(2, '0')}-${finishDate.getDate().toString().padStart(2, '0')} ${finishDate.getHours().toString().padStart(2, '0')}:${finishDate.getMinutes().toString().padStart(2, '0')}:${finishDate.getSeconds().toString().padStart(2, '0')}`;

            li.innerHTML = `
                <button class="delete-task" data-id="${task.id}">❌</button>
                <div class="task-header">
                    <div class="building-name">${task.account} - ${task.buildingCategory}</div>
                    <div class="countdown" data-id="${task.id}">
                        ${isFinished ? '已完成' : this.formatTime(timeLeft)}
                    </div>
                </div>
                <div class="task-details">
                    预计完成: ${finishTimeStr}
                </div>
            `;

            this.tasksList.appendChild(li);
        });

        // 添加事件监听器到删除按钮
        document.querySelectorAll('.delete-task').forEach(button => {
            button.addEventListener('click', (e) => {
                e.stopPropagation();
                const id = parseInt(e.target.dataset.id);
                this.deleteTask(id);
            });
        });
    }

    updateUI() {
        this.renderTasks();
        this.updateCountdowns();
        this.updateAccountStats();
    }

    startTimer() {
        setInterval(() => {
            this.updateCountdowns();
            // 只更新倒计时显示，不重新渲染整个列表
            const now = Date.now();
            document.querySelectorAll('.countdown').forEach(element => {
                const taskId = parseInt(element.dataset.id);
                const task = this.tasks.find(t => t.id === taskId);
                
                if (task && !task.completed) {
                    const timeLeft = task.endTime - now;
                    if (timeLeft > 0) {
                        element.textContent = this.formatTime(timeLeft);
                    } else if (timeLeft <= 0) {
                        element.textContent = "已完成";
                        // 检查是否需要发送通知
                        if (!task.completed) {
                            task.completed = true;
                            this.saveTasks();
                            this.sendNotification(`建筑升级完成: ${task.account} - ${task.buildingCategory}`);
                            this.playNotificationSound();
                            this.updateUI(); // 重新渲染以更新按钮
                        }
                    }
                }
            });
        }, 1000);
    }

    openModal() {
        this.modal.style.display = 'block';
        this.accountInput.focus();
    }

    // 添加打开导入数据模态框的方法
    openImportModal() {
        this.importModal.style.display = 'block';
        this.pasteArea.focus();
    }

    closeModalFunc(modal) {
        // 如果没有指定模态框，则关闭所有模态框
        if (modal) {
            modal.style.display = 'none';
        } else {
            this.modal.style.display = 'none';
            this.importModal.style.display = 'none';
        }
    }

    showNotification(message) {
        const notification = document.createElement('div');
        notification.className = 'notification';
        notification.textContent = message;
        document.body.appendChild(notification);

        setTimeout(() => {
            notification.remove();
        }, 3000);
    }

    sendNotification(message) {
        if ('Notification' in window) {
            if (Notification.permission === 'granted') {
                new Notification('部落冲突建筑升级', {
                    body: message,
                    icon: 'icons/icon-192x192.png'
                });
            } else if (Notification.permission !== 'denied') {
                Notification.requestPermission().then(permission => {
                    if (permission === 'granted') {
                        new Notification('部落冲突建筑升级', {
                            body: message,
                            icon: 'icons/icon-192x192.png'
                        });
                    }
                });
            }
        }
    }

    playNotificationSound() {
        try {
            // 创建一个简单的音调作为通知音
            const context = new (window.AudioContext || window.webkitAudioContext)();
            const oscillator = context.createOscillator();
            const gainNode = context.createGain();
            
            oscillator.connect(gainNode);
            gainNode.connect(context.destination);
            
            oscillator.type = 'sine';
            oscillator.frequency.value = 880;
            gainNode.gain.value = 0.3;
            
            oscillator.start();
            
            // 200ms后停止播放
            setTimeout(() => {
                oscillator.stop();
            }, 200);
        } catch (e) {
            console.log("音频播放失败:", e);
        }
    }
}

// 当页面加载完成后初始化应用
document.addEventListener('DOMContentLoaded', () => {
    new ClashTimer();
});