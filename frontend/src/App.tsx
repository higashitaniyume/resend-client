import { useState, useEffect } from 'react';
import './App.css';
import { SendEmail, GetAPIKey, SaveAPIKey, GetHistory, ClearHistory } from '../wailsjs/go/main/App';
import { Mail, Send, History, Settings, Key, Trash2, Clock } from 'lucide-react';
import ReactQuill from 'react-quill';
import 'react-quill/dist/quill.snow.css';

interface EmailHistory {
  id: string;
  from: string;
  to: string[];
  subject: string;
  sentAt: string;
  status: string;
  resendId?: string;
}

function App() {
  const [activeTab, setActiveTab] = useState<'compose' | 'history' | 'settings'>('compose');
  const [apiKey, setApiKey] = useState('');
  const [hasApiKey, setHasApiKey] = useState(false);
  
  const [from, setFrom] = useState('');
  const [to, setTo] = useState('');
  const [subject, setSubject] = useState('');
  const [content, setContent] = useState('');
  const [sending, setSending] = useState(false);
  const [message, setMessage] = useState<{type: 'success' | 'error', text: string} | null>(null);
  const [history, setHistory] = useState<EmailHistory[]>([]);

  useEffect(() => {
    loadApiKey();
    loadHistory();
  }, []);

  const loadApiKey = async () => {
    try {
      const key = await GetAPIKey();
      if (key) {
        setHasApiKey(true);
        setApiKey(key);
      }
    } catch (error) {
      console.error('Failed to load API key:', error);
    }
  };

  const loadHistory = async () => {
    try {
      const hist = await GetHistory();
      setHistory(hist || []);
    } catch (error) {
      console.error('Failed to load history:', error);
    }
  };

  const handleSaveApiKey = async () => {
    try {
      await SaveAPIKey(apiKey);
      setHasApiKey(true);
      setMessage({ type: 'success', text: 'API Key 保存成功！' });
      setTimeout(() => setMessage(null), 3000);
    } catch (error) {
      setMessage({ type: 'error', text: '保存失败：' + error });
    }
  };

  const handleSendEmail = async () => {
    if (!from || !to || !subject || !content) {
      setMessage({ type: 'error', text: '请填写所有必填字段' });
      return;
    }

    setSending(true);
    setMessage(null);

    try {
      const toArray = to.split(',').map(email => email.trim());
      
      const tempDiv = document.createElement("div");
      tempDiv.innerHTML = content;
      const textContent = tempDiv.textContent || tempDiv.innerText || "";

      const resendId = await SendEmail(from, toArray, subject, content, textContent);
      setMessage({ type: 'success', text: `邮件发送成功！ID: ${resendId}` });
      setTo('');
      setSubject('');
      setContent('');
      await loadHistory();
      setTimeout(() => setMessage(null), 5000);
    } catch (error: any) {
      setMessage({ type: 'error', text: '发送失败：' + error });
    } finally {
      setSending(false);
    }
  };

  const handleClearHistory = async () => {
    if (confirm('确定要清除所有历史记录吗？')) {
      try {
        await ClearHistory();
        setHistory([]);
        setMessage({ type: 'success', text: '历史记录已清除' });
        setTimeout(() => setMessage(null), 3000);
      } catch (error) {
        setMessage({ type: 'error', text: '清除失败：' + error });
      }
    }
  };

  return (
    <div className="app">
      <div className="sidebar">
        <div className="logo">
          <Mail size={32} />
          <h1>Resend Client</h1>
        </div>
        <nav className="nav">
          <button className={`nav-item ${activeTab === 'compose' ? 'active' : ''}`} onClick={() => setActiveTab('compose')}>
            <Send size={20} />
            <span>撰写邮件</span>
          </button>
          <button className={`nav-item ${activeTab === 'history' ? 'active' : ''}`} onClick={() => setActiveTab('history')}>
            <History size={20} />
            <span>发送历史</span>
          </button>
          <button className={`nav-item ${activeTab === 'settings' ? 'active' : ''}`} onClick={() => setActiveTab('settings')}>
            <Settings size={20} />
            <span>设置</span>
          </button>
        </nav>
      </div>

      <div className="main-content">
        {message && <div className={`message ${message.type}`}>{message.text}</div>}
        {!hasApiKey && activeTab !== 'settings' && (
          <div className="warning"><Key size={20} /><span>请先在设置中配置 Resend API Key</span></div>
        )}

        {activeTab === 'compose' && (
          <div className="compose-gmail">
            <div className="compose-header">
              <h2>新邮件</h2>
            </div>
            <div className="compose-body">
              <div className="gmail-input-row">
                <label>发件人</label>
                <input type="email" value={from} onChange={(e) => setFrom(e.target.value)} disabled={!hasApiKey} />
              </div>
              <div className="gmail-input-row">
                <label>收件人</label>
                <input type="text" value={to} onChange={(e) => setTo(e.target.value)} disabled={!hasApiKey} />
              </div>
              <div className="gmail-input-row border-bottom">
                <input type="text" placeholder="主题" value={subject} onChange={(e) => setSubject(e.target.value)} disabled={!hasApiKey} className="subject-input" />
              </div>
              
              <div className="gmail-editor-container">
                <ReactQuill 
                  theme="snow" 
                  value={content} 
                  onChange={setContent} 
                  readOnly={!hasApiKey}
                  modules={{
                    toolbar: [
                      [{ 'font': [] }, { 'size': [] }],
                      ['bold', 'italic', 'underline', 'strike'],
                      [{ 'color': [] }, { 'background': [] }],
                      [{ 'list': 'ordered'}, { 'list': 'bullet'}],
                      ['link', 'image', 'clean']
                    ]
                  }}
                />
              </div>
              
              <div className="compose-footer">
                <button className="btn-send" onClick={handleSendEmail} disabled={sending || !hasApiKey}>
                  {sending ? '发送中...' : '发送'}
                </button>
              </div>
            </div>
          </div>
        )}

        {activeTab === 'history' && (
          <div className="history">
            <div className="history-header">
              <h2>发送历史</h2>
              {history.length > 0 && <button className="btn-danger" onClick={handleClearHistory}><Trash2 size={18} />清除历史</button>}
            </div>
            {history.length === 0 ? (
              <div className="empty-state"><Mail size={48} /><p>暂无发送记录</p></div>
            ) : (
              <div className="history-list">
                {history.map((item) => (
                  <div key={item.id} className="history-item">
                    <div className="history-item-header">
                      <h3>{item.subject}</h3>
                      <span className={`status ${item.status}`}>{item.status}</span>
                    </div>
                    <div className="history-item-details">
                      <div><strong>发件人:</strong> {item.from}</div>
                      <div><strong>收件人:</strong> {item.to.join(', ')}</div>
                      {item.resendId && <div><strong>Resend ID:</strong> {item.resendId}</div>}
                      <div className="history-item-time"><Clock size={14} />{new Date(item.sentAt).toLocaleString('zh-CN')}</div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {activeTab === 'settings' && (
          <div className="settings">
            <h2>设置</h2>
            <div className="form">
              <div className="form-group">
                <label>Resend API Key</label>
                <input type="password" placeholder="re_xxxxxxxxxxxxxxxxxxxxxxxx" value={apiKey} onChange={(e) => setApiKey(e.target.value)} />
                <small>你的 API Key 将被加密存储在本地</small>
              </div>
              <button className="btn-primary" onClick={handleSaveApiKey}><Key size={18} />保存 API Key</button>
              <div className="info-box">
                <h3>关于 Resend</h3>
                <p>Resend 是一个现代化的邮件发送服务。你需要：</p>
                <ol>
                  <li>在 <a href="https://resend.com" target="_blank">resend.com</a> 注册账号</li>
                  <li>创建 API Key</li>
                  <li>验证你的发件域名</li>
                  <li>在此处配置 API Key</li>
                </ol>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

export default App
