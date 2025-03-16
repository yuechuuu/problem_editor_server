快速开始
Linux:

下载nvm:
官方文档:https://github.com/nvm-sh/nvm?tab=readme-ov-file#installing-and-updating


下载指令:curl -o- https://raw.githubusercontent.com/nvm-sh/nvm/v0.40.2/install.sh | bash


export NVM_DIR="$([ -z "${XDG_CONFIG_HOME-}" ] && printf %s "${HOME}/.nvm" || printf %s "${XDG_CONFIG_HOME}/nvm")"


[ -s "$NVM_DIR/nvm.sh" ] && \. "$NVM_DIR/nvm.sh" # This loads nvm

下载完nvm后用
nvm install 22
下载npm 22版本
切换到git文件夹内：
cd problem_editor_server
执行 npm install express
node server.js
即可在网页上访问
todo:
后续可能会加入自动样例生成机等其他模块
