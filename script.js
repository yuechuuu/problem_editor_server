// 导入必要的Quill模块
const Formula = Quill.import('formats/formula');
Quill.register(Formula, true);

// 创建通用的工具栏配置
const toolbarOptions = [
  ['bold', 'italic', 'underline'],
  ['formula', 'image', 'code-block'],
  [{ 'list': 'ordered' }, { 'list': 'bullet' }]
];

// 初始化所有编辑器
const problemEditor = new Quill('#problem-description-editor', {  
  modules: {  
    toolbar: toolbarOptions,
    formula: true  
  },  
  theme: 'snow'  
});  

const inputEditor = new Quill('#input-description-editor', {
  modules: {  
    toolbar: toolbarOptions,
    formula: true  
  },  
  theme: 'snow'  
});

const outputEditor = new Quill('#output-description-editor', {
  modules: {  
    toolbar: toolbarOptions,
    formula: true  
  },  
  theme: 'snow' 
});

// 组织编辑器列表
const editors = [problemEditor, inputEditor, outputEditor];

// 为所有编辑器添加工具栏处理程序
editors.forEach(editor => {
  // 添加公式处理程序
  editor.getModule('toolbar').addHandler('formula', () => {
    const range = editor.getSelection(true);
    
    if (range) {
      const formula = prompt('请输入LaTeX公式:', '\\sum_{i=0}^n i^2 = \\frac{(n^2+n)(2n+1)}{6}');
      
      if (formula) {
        // 插入公式
        editor.insertEmbed(range.index, 'formula', formula);
        editor.setSelection(range.index + 1);
      }
    }
  });
  
  // 添加图片处理程序
  editor.getModule('toolbar').addHandler('image', () => {  
    const input = document.createElement('input');  
    input.type = 'file';  
    input.accept = 'image/*';
    input.onchange = async () => {  
      const file = input.files[0];  
      if (file) {
        const url = await uploadImageToServer(file);
        const range = editor.getSelection(true);
        editor.insertEmbed(range.index, 'image', url);
      }
    };  
    input.click();  
  });
});

// 图片上传函数
async function uploadImageToServer(file) {  
  return new Promise((resolve) => {  
    const reader = new FileReader();  
    reader.onload = (e) => resolve(e.target.result);  
    reader.readAsDataURL(file);  
  });  
}

// 示例管理
let examples = [];
let nextExampleId = 1;

// 从本地存储加载数据
function loadFromLocalStorage() {
  const savedData = localStorage.getItem('problemEditorData');
  if (savedData) {
    const data = JSON.parse(savedData);
    
    // 恢复标题和限制
    document.getElementById('title').value = data.title || '';
    document.getElementById('time-limit').value = data.timeLimit || '';
    document.getElementById('memory-limit').value = data.memoryLimit || '';
    
    // 恢复编辑器内容
    if (data.problemDescription) problemEditor.root.innerHTML = data.problemDescription;
    if (data.inputDescription) inputEditor.root.innerHTML = data.inputDescription;
    if (data.outputDescription) outputEditor.root.innerHTML = data.outputDescription;
    
    // 恢复示例
    if (data.examples && data.examples.length > 0) {
      examples = data.examples;
      nextExampleId = Math.max(...examples.map(e => e.id)) + 1;
      
      // 清除默认的示例区域
      document.querySelectorAll('.example').forEach(el => el.remove());
      
      // 重新创建示例
      examples.forEach(example => {
        createExampleDOM(example);
      });
    } else {
      addExample(); // 如果没有保存的示例，添加一个默认示例
    }
    
    // 更新预览
    updatePreview();
  } else {
    // 初始化时添加一个默认示例
    addExample();
  }
}

// 保存到本地存储
function saveToLocalStorage() {
  const problemData = {
    title: document.getElementById('title').value,
    timeLimit: document.getElementById('time-limit').value,
    memoryLimit: document.getElementById('memory-limit').value,
    problemDescription: problemEditor.root.innerHTML,
    inputDescription: inputEditor.root.innerHTML,
    outputDescription: outputEditor.root.innerHTML,
    examples: examples
  };
  
  localStorage.setItem('problemEditorData', JSON.stringify(problemData));
}

// 创建示例DOM元素
function createExampleDOM(example) {
  const exampleHTML = `  
    <div class="example" id="example-${example.id}">  
      <h4>示例 ${example.index}</h4>  
      <textarea placeholder="输入内容" class="example-input">${example.input || ''}</textarea>  
      <textarea placeholder="输出内容" class="example-output">${example.output || ''}</textarea>  
      <button class="delete-btn" onclick="removeExample(${example.id})">删除</button>  
    </div>  
  `;  
  document.getElementById('examples-container').insertAdjacentHTML('beforeend', exampleHTML);
  
  // 添加输入监听器以便实时更新预览
  const inputEl = document.querySelector(`#example-${example.id} .example-input`);
  const outputEl = document.querySelector(`#example-${example.id} .example-output`);
  
  inputEl.addEventListener('input', () => {
    example.input = inputEl.value;
    updatePreview();
    saveToLocalStorage();
  });
  
  outputEl.addEventListener('input', () => {
    example.output = outputEl.value;
    updatePreview();
    saveToLocalStorage();
  });
}

function addExample() {
  // 创建新示例对象
  const newExample = {
    id: nextExampleId++,
    index: examples.length + 1,
    input: '',
    output: ''
  };
  
  // 添加到示例数组
  examples.push(newExample);
  
  // 创建DOM元素
  createExampleDOM(newExample);
  
  // 更新预览和保存
  updatePreview();
  saveToLocalStorage();
}  

function removeExample(id) {
  // 找到要删除的示例索引
  const index = examples.findIndex(e => e.id === id);
  if (index !== -1) {
    // 从数组中移除
    examples.splice(index, 1);
    
    // 更新后续示例的索引
    for (let i = index; i < examples.length; i++) {
      examples[i].index = i + 1;
    }
    
    // 从DOM中移除
    document.getElementById(`example-${id}`).remove();
    
    // 更新所有示例标题
    examples.forEach(example => {
      const titleEl = document.querySelector(`#example-${example.id} h4`);
      if (titleEl) {
        titleEl.textContent = `示例 ${example.index}`;
      }
    });
    
    // 更新预览和保存
    updatePreview();
    saveToLocalStorage();
  }
}  

// 监听编辑器变化
editors.forEach(editor => {  
  editor.on('text-change', () => {
    updatePreview();
    saveToLocalStorage();
  });
});

// 监听其他输入变化
['title', 'time-limit', 'memory-limit'].forEach(id => {
  document.getElementById(id).addEventListener('input', () => {
    updatePreview();
    saveToLocalStorage();
  });
});

// 更新预览区域  
function updatePreview() {  
  const preview = document.getElementById('preview');  
  preview.innerHTML = `  
    <h1>${document.getElementById('title').value || '题目标题'}</h1>  
    <div class="limits-preview">
      <p>时间限制：${document.getElementById('time-limit').value || '--'} s</p>  
      <p>内存限制：${document.getElementById('memory-limit').value || '--'} MB</p>  
    </div>
    <div class="section">
      <h2>题目描述</h2>  
      ${problemEditor.root.innerHTML}  
    </div>
    <div class="section">
      <h2>输入描述</h2>  
      ${inputEditor.root.innerHTML}  
    </div>
    <div class="section">
      <h2>输出描述</h2>  
      ${outputEditor.root.innerHTML}  
    </div>
    <div class="section">
      <h2>示例</h2>  
      ${getExamplesHtml()}  
    </div>
  `;  
  
  // 使用MathJax渲染所有公式
  if (typeof MathJax !== 'undefined') {
    MathJax.typeset();
  }
}  

// 获取示例的 HTML  
function getExamplesHtml() {
  if (examples.length === 0) {
    return '<p>暂无示例</p>';
  }
  
  return examples.map(example => {
    // 获取示例的最新输入输出值
    const exampleEl = document.getElementById(`example-${example.id}`);
    let input = '';
    let output = '';
    
    if (exampleEl) {
      input = exampleEl.querySelector('.example-input').value;
      output = exampleEl.querySelector('.example-output').value;
    } else {
      input = example.input || '';
      output = example.output || '';
    }
    
    return `  
      <div class="preview-example">  
        <h4>示例 ${example.index}</h4>  
        <div class="example-content">
          <pre class="input-box">输入：${input}</pre>  
          <pre class="output-box">输出：${output}</pre>  
        </div>
      </div>  
    `;
  }).join('');  
}  

let problemList = [];
let currentProblemId = null;

// 生成唯一ID
function generateUniqueId() {
  return Date.now().toString(36) + Math.random().toString(36).substring(2);
}

// 修改保存内容到服务器的函数
async function saveContent() {
  // 显示保存状态
  const statusElement = document.getElementById('save-status');
  statusElement.textContent = "正在保存...";
  
  // 收集所有编辑内容
  const problemData = {
    id: currentProblemId || generateUniqueId(), // 如果是新题目，生成一个新ID
    title: document.getElementById('title').value || '未命名题目',
    timeLimit: document.getElementById('time-limit').value,
    memoryLimit: document.getElementById('memory-limit').value,
    problemDescription: problemEditor.root.innerHTML,
    inputDescription: inputEditor.root.innerHTML,
    outputDescription: outputEditor.root.innerHTML,
    examples: getExamplesData(),
    timestamp: new Date().toISOString()
  };
  
  // 设置当前题目ID
  currentProblemId = problemData.id;
  
  try {
    // 发送到服务器
    const response = await fetch('/save-problem', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(problemData)
    });
    
    if (response.ok) {
      const result = await response.json();
      
      // 更新本地题目列表
      const existingIndex = problemList.findIndex(p => p.id === problemData.id);
      if (existingIndex !== -1) {
        // 更新已有题目
        problemList[existingIndex] = problemData;
      } else {
        // 添加新题目
        problemList.push(problemData);
      }
      
      // 保存到本地存储
      localStorage.setItem('problemList', JSON.stringify(problemList));
      
      // 更新侧边栏
      updateProblemList();
      
      statusElement.textContent = "保存成功！ID: " + result.id;
      // 3秒后清除状态信息
      setTimeout(() => {
        statusElement.textContent = "";
      }, 3000);
    } else {
      statusElement.textContent = "保存失败：" + response.statusText;
    }
  } catch (error) {
    console.error('保存失败:', error);
    statusElement.textContent = "保存失败：" + error.message;
    
    // 离线模式：如果服务器不可用，仍然保存到本地
    const existingIndex = problemList.findIndex(p => p.id === problemData.id);
    if (existingIndex !== -1) {
      problemList[existingIndex] = problemData;
    } else {
      problemList.push(problemData);
    }
    localStorage.setItem('problemList', JSON.stringify(problemList));
    updateProblemList();
  }
}

// 更新侧边栏题目列表
function updateProblemList() {
  const problemListContainer = document.getElementById('problem-list');
  problemListContainer.innerHTML = '';
  
  // 按时间戳排序，最新的在前面
  problemList.sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp));
  
  // 为每个题目创建一个列表项
  problemList.forEach(problem => {
    const problemItem = document.createElement('div');
    problemItem.className = 'problem-item' + (problem.id === currentProblemId ? ' active' : '');
    problemItem.setAttribute('data-id', problem.id);
    
    // 格式化日期
    const date = new Date(problem.timestamp);
    const formattedDate = `${date.getFullYear()}-${(date.getMonth() + 1).toString().padStart(2, '0')}-${date.getDate().toString().padStart(2, '0')} ${date.getHours().toString().padStart(2, '0')}:${date.getMinutes().toString().padStart(2, '0')}`;
    
    problemItem.innerHTML = `
      <div class="problem-title">${problem.title}</div>
      <div class="problem-date">${formattedDate}</div>
    `;
    
    // 添加点击事件，加载题目
    problemItem.addEventListener('click', () => loadProblem(problem.id));
    
    problemListContainer.appendChild(problemItem);
  });
}

// 加载指定ID的题目
async function loadProblem(id) {
  // 先尝试从本地列表加载
  let problem = problemList.find(p => p.id === id);
  
  // 如果本地没有，尝试从服务器获取
  if (!problem) {
    try {
      const response = await fetch(`/get-problem/${id}`);
      if (response.ok) {
        problem = await response.json();
        // 添加到本地列表
        problemList.push(problem);
        localStorage.setItem('problemList', JSON.stringify(problemList));
      } else {
        console.error('无法从服务器获取题目:', response.statusText);
        return;
      }
    } catch (error) {
      console.error('加载题目失败:', error);
      return;
    }
  }
  
  // 设置当前题目ID
  currentProblemId = problem.id;
  
  // 加载题目内容到编辑器
  document.getElementById('title').value = problem.title || '';
  document.getElementById('time-limit').value = problem.timeLimit || '';
  document.getElementById('memory-limit').value = problem.memoryLimit || '';
  
  problemEditor.root.innerHTML = problem.problemDescription || '';
  inputEditor.root.innerHTML = problem.inputDescription || '';
  outputEditor.root.innerHTML = problem.outputDescription || '';
  
  // 清除现有的示例
  document.querySelectorAll('.example').forEach(el => el.remove());
  
  // 设置示例
  if (problem.examples && problem.examples.length > 0) {
    examples = problem.examples;
    nextExampleId = Math.max(...examples.map(e => e.id)) + 1;
    examples.forEach(example => {
      createExampleDOM(example);
    });
  } else {
    examples = [];
    nextExampleId = 1;
    addExample(); // 添加一个默认的空示例
  }
  
  // 更新预览
  updatePreview();
  
  // 更新侧边栏的活动状态
  document.querySelectorAll('.problem-item').forEach(item => {
    item.classList.toggle('active', item.getAttribute('data-id') === id);
  });
}

// 创建新题目函数
function createNewProblem() {
  // 清除当前题目ID
  currentProblemId = null;
  
  // 清空所有编辑器内容
  problemEditor.setText('');
  inputEditor.setText('');
  outputEditor.setText('');
  
  // 清空标题和限制
  document.getElementById('title').value = '';
  document.getElementById('time-limit').value = '';
  document.getElementById('memory-limit').value = '';
  
  // 清除所有示例
  examples.forEach(example => {
    document.getElementById(`example-${example.id}`).remove();
  });
  examples = [];
  nextExampleId = 1;
  
  // 添加一个新的空示例
  addExample();
  
  // 更新预览
  updatePreview();
  
  // 更新侧边栏活动状态
  document.querySelectorAll('.problem-item').forEach(item => {
    item.classList.remove('active');
  });
}

// 初始化页面时加载本地存储的题目列表
function initializeProblemList() {
  const savedProblemList = localStorage.getItem('problemList');
  if (savedProblemList) {
    problemList = JSON.parse(savedProblemList);
    updateProblemList();
  }
  
  // 加载最后编辑的问题数据
  loadFromLocalStorage();
}

// 获取所有示例数据
function getExamplesData() {
  return examples.map(example => {
    const exampleEl = document.getElementById(`example-${example.id}`);
    if (exampleEl) {
      return {
        id: example.id,
        index: example.index,
        input: exampleEl.querySelector('.example-input').value,
        output: exampleEl.querySelector('.example-output').value
      };
    }
    return example;
  });
}

// 初始化页面
document.addEventListener('DOMContentLoaded', () => {
  // 初始化题目列表
  initializeProblemList();
  
  // 为新建题目按钮添加事件监听器
  document.getElementById('new-problem-btn').addEventListener('click', createNewProblem);
});