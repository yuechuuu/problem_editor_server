const express = require('express');
const fs = require('fs').promises;
const path = require('path');
const app = express();
const port = process.env.PORT || 3000;

// 中间件设置
app.use(express.static('.'));  // 提供静态文件
app.use(express.json({ limit: '10mb' }));  // 支持JSON请求体，增加限制以支持大型内容

// 确保存储目录存在
const PROBLEMS_DIR = path.join(__dirname, 'saved_problems');
async function ensureDir() {
  try {
    await fs.mkdir(PROBLEMS_DIR, { recursive: true });
  } catch (err) {
    console.error('创建保存目录失败:', err);
  }
}
ensureDir();

// 保存问题的路由
app.post('/save-problem', async (req, res) => {
  try {
    const problemData = req.body;
    
    // 生成唯一ID (使用时间戳和随机数)
    const id = Date.now() + '-' + Math.floor(Math.random() * 10000);
    problemData.id = id;
    
    // 创建问题专用目录
    const problemDir = path.join(PROBLEMS_DIR, id);
    await fs.mkdir(problemDir, { recursive: true });
    
    // 保存数据到JSON文件
    await fs.writeFile(
      path.join(problemDir, 'problem_data.json'),
      JSON.stringify(problemData, null, 2)
    );
    
    // 生成HTML文件以便直接查看
    const htmlContent = generateViewHtml(problemData);
    await fs.writeFile(
      path.join(problemDir, 'index.html'),
      htmlContent
    );
    
    // 响应成功
    res.json({ success: true, id });
  } catch (error) {
    console.error('保存问题失败:', error);
    res.status(500).json({ error: '服务器错误' });
  }
});

// 生成可查看的HTML
function generateViewHtml(problemData) {
  const examplesHtml = problemData.examples.map((ex, i) => `
    <div class="preview-example">
      <h4>示例 ${i+1}</h4>
      <div class="example-content">
        <pre class="input-box">输入：${ex.input}</pre>
        <pre class="output-box">输出：${ex.output}</pre>
      </div>
    </div>
  `).join('');
  
  return `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="UTF-8">
      <title>${problemData.title || '未命名题目'}</title>
      <link rel="stylesheet" href="../../style.css">
      <link rel="stylesheet" href="../../lib/katex.min.css">
      <script src="../../lib/katex.min.js"></script>
      <style>
        body { padding: 20px; max-width: 1000px; margin: 0 auto; }
      </style>
    </head>
    <body>
      <h1>${problemData.title || '未命名题目'}</h1>
      <div class="limits-preview">
        <p>时间限制：${problemData.timeLimit || '--'} ms</p>
        <p>内存限制：${problemData.memoryLimit || '--'} MB</p>
      </div>
      <div class="section">
        <h2>题目描述</h2>
        ${problemData.problemDescription || ''}
      </div>
      <div class="section">
        <h2>输入描述</h2>
        ${problemData.inputDescription || ''}
      </div>
      <div class="section">
        <h2>输出描述</h2>
        ${problemData.outputDescription || ''}
      </div>
      <div class="section">
        <h2>示例</h2>
        ${examplesHtml || '<p>暂无示例</p>'}
      </div>
      
      <script>
        // 渲染数学公式
        document.addEventListener('DOMContentLoaded', () => {
          document.querySelectorAll('.ql-formula').forEach(element => {
            if (element.getAttribute('data-value')) {
              try {
                while (element.firstChild) {
                  element.removeChild(element.firstChild);
                }
                katex.render(element.getAttribute('data-value'), element, {
                  throwOnError: false,
                  displayMode: true
                });
              } catch (err) {
                console.error('公式渲染错误:', err);
              }
            }
          });
        });
      </script>
    </body>
    </html>
  `;
}

// 启动服务器
app.listen(port, () => {
  console.log(`服务器运行在 http://localhost:${port}`);
});
