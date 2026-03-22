import React, { useEffect, useState, useRef } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { useAuth } from '../../context/AuthContext'
import { useToast } from '../../context/ToastContext'
import {
  getThreadsForUser,
  getMessages,
  sendMessage as apiSend,
  subscribeToMessages,
} from '../../lib/api'
import { timeAgo, formatTime } from '../../lib/utils'
import { Avatar, Spinner, EmptyState } from '../../components/shared'
import { IconMessage } from '../../components/shared/Icons'

export default function MessagesPage({ basePath = '/customer' }) {
  const { profile }     = useAuth()
  const { toast }       = useToast()
  const { threadId: paramThreadId } = useParams()
  const navigate        = useNavigate()
  const bottomRef       = useRef()
  const inputRef        = useRef()

  const [threads,       setThreads]       = useState([])
  const [activeThread,  setActiveThread]  = useState(null)
  const [messages,      setMessages]      = useState([])
  const [text,          setText]          = useState('')
  const [loadingThreads,setLoadingThreads]= useState(true)
  const [loadingMsgs,   setLoadingMsgs]   = useState(false)
  const [sending,       setSending]       = useState(false)

  // Load threads
  useEffect(() => {
    if (profile) loadThreads()
  }, [profile])

  async function loadThreads() {
    try {
      const data = await getThreadsForUser(profile.id)
      setThreads(data)
      // Auto-select from URL param or first thread
      const target = paramThreadId
        ? data.find(t => t.id === paramThreadId)
        : data[0]
      if (target) selectThread(target)
    } catch (err) {
      toast(err.message, 'error')
    } finally {
      setLoadingThreads(false)
    }
  }

  async function selectThread(thread) {
    setActiveThread(thread)
    setLoadingMsgs(true)
    navigate(`${basePath}/messages/${thread.id}`, { replace: true })
    try {
      const msgs = await getMessages(thread.id)
      setMessages(msgs)
    } catch (err) {
      toast(err.message, 'error')
    } finally {
      setLoadingMsgs(false)
    }
  }

  // Realtime subscription
  useEffect(() => {
    if (!activeThread) return
    const channel = subscribeToMessages(activeThread.id, (newMsg) => {
      setMessages(prev => {
        if (prev.find(m => m.id === newMsg.id)) return prev
        return [...prev, newMsg]
      })
    })
    return () => channel.unsubscribe()
  }, [activeThread?.id])

  // Scroll to bottom on new messages
  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages])

  async function handleSend() {
    if (!text.trim() || !activeThread || sending) return
    const content = text.trim()
    setText('')
    setSending(true)
    try {
      const other = activeThread.thread_participants
        ?.find(p => p.users?.id !== profile.id)?.users
      await apiSend({
        threadId:   activeThread.id,
        senderId:   profile.id,
        receiverId: other?.id,
        productId:  activeThread.product_id,
        content,
      })
      // Optimistic update
      setMessages(prev => [...prev, {
        id: Date.now(),
        sender_id: profile.id,
        content,
        created_at: new Date().toISOString(),
      }])
    } catch (err) {
      toast(err.message, 'error')
      setText(content)
    } finally {
      setSending(false)
      inputRef.current?.focus()
    }
  }

  const getOtherUser = (thread) => {
    return thread.thread_participants
      ?.find(p => p.users?.id !== profile.id)?.users
  }

  if (loadingThreads) return <Spinner />

  return (
    <div>
      <div className="page-header">
        <h1>Messages</h1>
      </div>

      {!threads.length ? (
        <EmptyState
          icon={<IconMessage width={48} height={48} />}
          title="No conversations yet"
          message="Browse products and tap 'Message Seller' to start a conversation"
        />
      ) : (
        <div className="chat-layout">
          {/* Thread list */}
          <div className="chat-sidebar">
            {threads.map(thread => {
              const other = getOtherUser(thread)
              const product = thread.products
              const isActive = activeThread?.id === thread.id
              return (
                <div
                  key={thread.id}
                  className={`chat-thread-item ${isActive ? 'active' : ''}`}
                  onClick={() => selectThread(thread)}
                >
                  <div className="flex-align gap-10">
                    <Avatar name={other?.name || '?'} size="sm" src={other?.avatar_url} />
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div style={{ fontWeight: 600, fontSize: 14, color: 'var(--gray-900)' }}>{other?.name || 'User'}</div>
                      {product && (
                        <div className="text-xs text-muted" style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                           {product.title}
                        </div>
                      )}
                      {thread.last_message && (
                        <div className="text-xs text-muted" style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                          {thread.last_message}
                        </div>
                      )}
                    </div>
                    {thread.last_time && (
                      <div className="text-xs text-muted" style={{ flexShrink: 0 }}>{timeAgo(thread.last_time)}</div>
                    )}
                  </div>
                </div>
              )
            })}
          </div>

          {/* Chat area */}
          <div className="chat-main">
            {activeThread ? (
              <>
                {/* Header */}
                <div className="chat-header">
                  <Avatar name={getOtherUser(activeThread)?.name || '?'} size="sm" src={getOtherUser(activeThread)?.avatar_url} />
                  <div>
                    <div style={{ fontWeight: 600, fontSize: 15 }}>{getOtherUser(activeThread)?.name}</div>
                    {activeThread.products && (
                      <div className="text-xs text-muted">Re: {activeThread.products.title}</div>
                    )}
                  </div>
                </div>

                {/* Messages */}
                <div className="chat-messages">
                  {loadingMsgs ? (
                    <div style={{ textAlign: 'center', padding: 24 }}><Spinner small /></div>
                  ) : messages.length === 0 ? (
                    <div style={{ textAlign: 'center', color: 'var(--gray-500)', fontSize: 14, padding: 40 }}>
                      No messages yet. Say hello! 👋
                    </div>
                  ) : (
                    messages.map(msg => {
                      const mine = msg.sender_id === profile.id
                      return (
                        <div key={msg.id} className={`msg-wrap ${mine ? 'mine' : 'theirs'}`}>
                          <div className="msg-bubble">{msg.content}</div>
                          <div className="msg-time">{formatTime(msg.created_at)}</div>
                        </div>
                      )
                    })
                  )}
                  <div ref={bottomRef} />
                </div>

                {/* Input */}
                <div className="chat-input-row">
                  <textarea
                    ref={inputRef}
                    className="chat-input"
                    rows={1}
                    placeholder="Type a message..."
                    value={text}
                    onChange={e => setText(e.target.value)}
                    onKeyDown={e => {
                      if (e.key === 'Enter' && !e.shiftKey) {
                        e.preventDefault()
                        handleSend()
                      }
                    }}
                  />
                  <button
                    className="btn btn-primary"
                    onClick={handleSend}
                    disabled={!text.trim() || sending}
                  >
                    {sending ? '...' : 'Send'}
                  </button>
                </div>
              </>
            ) : (
              <div style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--gray-500)' }}>
                Select a conversation
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  )
}