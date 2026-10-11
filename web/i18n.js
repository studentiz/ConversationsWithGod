(function(root){
'use strict';
const chinese=(navigator.language||'en').startsWith('zh');
const translations={
 'Say something…':'说点什么…','Type your message':'输入对话','Send message':'发送','Conversation':'对话',
 'Open menu':'打开菜单','Menu options':'菜单','Change font size':'调整字号','Toggle dark mode':'深色外观','Dark appearance':'深色外观','Light appearance':'浅色外观',
 'Export conversation':'导出对话','Clear conversation':'清空对话','Install app':'添加到主屏幕',
 'Install as App':'添加到主屏幕','Add this app to your home screen for a better experience':'从主屏幕打开对话。','Not Now':'稍后','Install':'添加',
 'Opening conversation…':'正在打开对话…','Save conversation':'导出对话','Close save dialog':'关闭导出窗口',
 'Save for':'用途','Reading':'阅读','Backup':'备份','Continuing with AI':'交给 AI 继续对话','Fine-tuning a model':'微调模型','Other formats':'其他格式',
 'Format':'格式','Messages history · JSON':'对话历史 · JSON','Use this file in your AI tool or API client.':'在 AI 工具或 API 客户端中使用此文件。',
 'Model':'模型','Model name from your AI service':'填写模型名称','Next question':'接下来想问什么','Next question (optional)':'接下来想问什么（可选）',
 'What would you like to ask next?':'写下你的下一个问题','Added to this file only.':'只加入导出的文件。','Training tool':'训练工具',
 'ShareGPT · complete JSON':'ShareGPT · 完整 JSON','Claude · Human / Assistant text':'Claude · Human / Assistant 文本','Llama 2 · INST text':'Llama 2 · INST 文本',
 'Options':'选项','Earlier exchanges to include':'包含之前几轮对话','Include earlier questions and replies with each example.':'为每个样本保留之前的问答。',
 'Add instructions for the model':'添加给模型的说明','Instructions for the model':'给模型的说明','How would you like the model to respond?':'希望模型怎样回应？',
 'Cancel':'取消','Save text':'保存文本','Save backup':'保存备份','Save history':'保存对话历史','Save training file':'保存训练文件','Save API request':'保存 API 请求','Save file':'保存文件','Saving…':'正在保存…',
 'Clear Conversation':'清空对话','Close clear conversation dialog':'关闭清空窗口','This removes all messages. You can undo for 5 seconds afterward.':'清空后，5 秒内可以撤销。','Clear':'清空',
 'User: ':'自己：','God: ':'内在智慧：','User':'自己','God':'内在智慧','Delete this message':'删除这条对话','Delete message':'删除对话','Dismiss notification':'关闭提示',
 'Not saved':'尚未保存','Your latest changes couldn’t be saved.':'刚才的内容未能保存。','Save a copy':'导出一份备份','Unable to open saved conversation':'未能打开已保存的对话',
 'Your conversation couldn’t be opened.':'未能打开对话。','Try again':'重试','Message deleted':'已删除','Conversation cleared':'已清空','Undo':'撤销',
 'There isn’t a conversation to save yet.':'还没有可以导出的对话。',
 'This conversation needs a question followed by a reply before it can be used for training.':'先写下一轮完整的问答，再导出训练文件。',
 'This format needs the conversation to start with a question. Choose Messages history to keep every message.':'此格式需要以提问开始。选择“对话历史”可保留所有内容。',
 'Choose a number from 0 to 50 for earlier exchanges in Options.':'请在选项中填写 0 到 50 之间的轮数。',
 'This conversation couldn’t be prepared in that format. Save a backup instead.':'无法导出此格式，可以先保存备份。',
 'Enter the model name supplied by your AI service.':'请填写模型名称。','Enter the question you would like to ask next.':'请写下接下来想问的问题。',
 'This file couldn’t be prepared. Try another format.':'无法生成此文件，请换一种格式。',
 'The file couldn’t be saved. Choose another location and try again.':'文件未能保存，请换一个位置重试。',
 'The opening reply has no preceding question, so it isn’t included.':'开头的回应没有对应提问，未加入训练文件。',
 'Your last question has no reply yet, so it isn’t included.':'最后的提问还没有回应，未加入训练文件。',
 'OpenAI needs at least 10 examples. Add more answered exchanges before training.':'OpenAI 训练至少需要 10 个样本，请再补充几轮完整问答。',
 'This format saves question-and-answer pairs without earlier exchanges.':'此格式只保存问答对。','Consecutive messages from the same voice are grouped together.':'连续的同角色内容会合并。'
};
function t(text){return chinese?(translations[text]??text):text;}
document.documentElement.lang=chinese?'zh-CN':'en';
function apply(container){
 const walker=document.createTreeWalker(container,NodeFilter.SHOW_TEXT),nodes=[];let node;
 while((node=walker.nextNode()))if(!node.parentElement.closest('script,style'))nodes.push(node);
 for(const node of nodes){const key=node.textContent.trim();if(translations[key])node.textContent=node.textContent.replace(key,t(key));}
 for(const el of container.querySelectorAll('[placeholder],[aria-label],[title]'))for(const attr of ['placeholder','aria-label','title'])if(el.hasAttribute(attr))el.setAttribute(attr,t(el.getAttribute(attr)));
}
root.CWGI18n={t,apply,chinese};
})(globalThis);
