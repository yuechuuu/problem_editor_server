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
let exampleCount = 0;  

function addExample() {  
  exampleCount++;  
  const exampleHTML = `  
    <div class="example" id="example-${exampleCount}">  
      <h4>示例 ${exampleCount}</h4>  
      <textarea placeholder="输入内容" class="example-input"></textarea>  
      <textarea placeholder="输出内容" class="example-output"></textarea>  
      <button class="delete-btn" onclick="removeExample(${exampleCount})">删除</button>  
    </div>  
  `;  
  document.getElementById('examples-container').insertAdjacentHTML('beforeend', exampleHTML);
  
  // 添加新示例后更新预览
  updatePreview();
}  

function removeExample(id) {  
  document.getElementById(`example-${id}`).remove();
  updatePreview();
}  

// 监听编辑器变化
editors.forEach(editor => {  
  editor.on('text-change', updatePreview);  
});

// 监听其他输入变化
['title', 'time-limit', 'memory-limit'].forEach(id => {
  document.getElementById(id).addEventListener('input', updatePreview);
});

// 更新预览区域  
function updatePreview() {  
  const preview = document.getElementById('preview');  
  preview.innerHTML = `  
    <h1>${document.getElementById('title').value || '题目标题'}</h1>  
    <div class="limits-preview">
      <p>时间限制：${document.getElementById('time-limit').value || '--'} ms</p>  
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
  const examples = document.getElementsByClassName('example');
  if (examples.length === 0) {
    return '<p>暂无示例</p>';
  }
  
  return Array.from(examples).map(example => `  
    <div class="preview-example">  
      <h4>${example.querySelector('h4').textContent}</h4>  
      <div class="example-content">
        <pre class="input-box">输入：${example.querySelector('.example-input').value}</pre>  
        <pre class="output-box">输出：${example.querySelector('.example-output').value}</pre>  
      </div>
    </div>  
  `).join('');  
}  

// 保存内容到服务器
async function saveContent() {
  // 显示保存状态
  const statusElement = document.getElementById('save-status');
  statusElement.textContent = "正在保存...";
  
  // 收集所有编辑内容
  const problemData = {
    title: document.getElementById('title').value,
    timeLimit: document.getElementById('time-limit').value,
    memoryLimit: document.getElementById('memory-limit').value,
    problemDescription: problemEditor.root.innerHTML,
    inputDescription: inputEditor.root.innerHTML,
    outputDescription: outputEditor.root.innerHTML,
    examples: getExamplesData(),
    timestamp: new Date().toISOString()
  };
  
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
  }
}

// 获取所有示例数据
function getExamplesData() {
  const examples = document.getElementsByClassName('example');
  return Array.from(examples).map(example => {
    return {
      input: example.querySelector('.example-input').value,
      output: example.querySelector('.example-output').value
    };
  });
}

// 初始化页面时添加一个示例
document.addEventListener('DOMContentLoaded', () => {
  addExample();
  updatePreview();
});

