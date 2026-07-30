import React, { useEffect, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { ordersAPI, contactAPI } from '../../services/api';
import { useAuth } from '../../context/AuthContext';
import './HelpAssistant.css';

// You can raise an order issue only within this many hours of delivery.
const REPORT_WINDOW_HOURS = 6;

// Friendly labels for order statuses.
const STATUS_LABEL = {
  pending: 'Order placed',
  confirmed: 'Confirmed',
  accepted_by_shopper: 'A shopper accepted your order',
  shopper_at_shop: 'Shopper is at the shop',
  shopping_in_progress: 'Shopper is picking your items',
  final_shopping: 'Finalising your items',
  shopping_completed: 'Shopping done — preparing for delivery',
  out_for_delivery: 'Out for delivery',
  delivered: 'Delivered',
  cancelled: 'Cancelled',
};

const prettyStatus = (s) => STATUS_LABEL[s] || (s ? s.replace(/_/g, ' ') : 'In progress');

// What the shopper is doing right now, phrased for a sentence ("Your shopper <...>").
const shopperActivity = (status) =>
  ({
    pending: 'will be assigned shortly',
    confirmed: 'will start on your order soon',
    accepted_by_shopper: 'is getting ready to shop for you',
    shopper_at_shop: 'has reached the shop',
    shopping_in_progress: 'is picking your items',
    final_shopping: 'is finalising your items',
    shopping_completed: 'has finished shopping and is preparing for delivery',
    out_for_delivery: 'is on the way with your order',
  })[status] || 'is working on your order';

// Best-effort delivery time for an order.
const deliveredAt = (order) => {
  if (order.actualDeliveryTime) return new Date(order.actualDeliveryTime);
  const t = (order.timeline || []).find((e) => e.status === 'delivered');
  if (t?.timestamp) return new Date(t.timestamp);
  if (order.status === 'delivered') return new Date(order.updatedAt || order.createdAt);
  return null;
};

const orderNo = (o) => o.orderNumber || String(o._id).slice(-6);

// Order-issue categories. `photo: 'required'` forces an attachment before sending.
const ISSUE_TYPES = [
  {
    key: 'wrong',
    label: '📦 Wrong / incorrect order',
    title: 'Wrong / incorrect order',
    photo: 'required',
  },
  { key: 'missing', label: '➖ Missing items', title: 'Missing items', photo: 'required' },
  {
    key: 'quality',
    label: '🍽️ Damaged / quality issue',
    title: 'Damaged / quality issue',
    photo: 'required',
  },
  { key: 'other', label: '💬 Something else', title: 'Something else', photo: 'optional' },
];

// Downscale + compress a picked image to a small JPEG data URL for emailing.
const resizeImage = (file, maxDim = 1200, quality = 0.7) =>
  new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => {
      const img = new Image();
      img.onload = () => {
        let { width, height } = img;
        if (width > height && width > maxDim) {
          height = Math.round((height * maxDim) / width);
          width = maxDim;
        } else if (height >= width && height > maxDim) {
          width = Math.round((width * maxDim) / height);
          height = maxDim;
        }
        const canvas = document.createElement('canvas');
        canvas.width = width;
        canvas.height = height;
        canvas.getContext('2d').drawImage(img, 0, 0, width, height);
        resolve(canvas.toDataURL('image/jpeg', quality));
      };
      img.onerror = reject;
      img.src = reader.result;
    };
    reader.onerror = reject;
    reader.readAsDataURL(file);
  });

const HelpAssistant = ({ open, onClose }) => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const scrollRef = useRef(null);
  const fileRef = useRef(null);

  const greeting = {
    from: 'bot',
    text: `Hi ${user?.name ? user.name.split(' ')[0] : 'there'} 👋 I'm your DelhiveryWay helper. How can I help?`,
  };

  // mode: 'menu' | 'orderSelect' | 'issueTypes' | 'form'
  const [messages, setMessages] = useState([greeting]);
  const [mode, setMode] = useState('menu');
  const [orderList, setOrderList] = useState([]);
  const [issueOrder, setIssueOrder] = useState(null);
  const [issue, setIssue] = useState(null);
  const [draft, setDraft] = useState('');
  const [imageData, setImageData] = useState(null);
  const [imageName, setImageName] = useState('');
  const [busy, setBusy] = useState(false);

  const resetToMenu = () => {
    setMode('menu');
    setOrderList([]);
    setIssueOrder(null);
    setIssue(null);
    setDraft('');
    setImageData(null);
    setImageName('');
  };

  // Reset the conversation each time the panel is opened.
  useEffect(() => {
    if (open) {
      setMessages([greeting]);
      resetToMenu();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open]);

  useEffect(() => {
    if (scrollRef.current) scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
  }, [messages, mode]);

  const say = (msg) => setMessages((prev) => [...prev, msg]);

  const go = (path) => {
    onClose();
    navigate(path);
  };

  const fetchOrders = async () => {
    const res = await ordersAPI.getCustomerOrders();
    const raw = res?.data?.data || res?.data || [];
    const orders = Array.isArray(raw) ? raw : raw.orders || [];
    return orders.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
  };

  const handleWhereOrder = async () => {
    say({ from: 'user', text: "Where's my order?" });
    say({ from: 'bot', text: 'Let me check your recent orders…' });
    setBusy(true);
    try {
      const orders = await fetchOrders();
      const active = orders.filter((o) => !['delivered', 'cancelled'].includes(o.status));
      const list = (active.length ? active : orders.slice(0, 1)).slice(0, 3);

      if (!list.length) {
        say({ from: 'bot', text: "You don't have any recent orders right now." });
      } else {
        list.forEach((o) => {
          say({ from: 'bot', text: `Order #${orderNo(o)} — ${prettyStatus(o.status)}.` });
        });
        say({
          from: 'bot',
          text: 'You can follow live updates on your orders page.',
          actions: [{ label: 'View my orders →', onClick: () => go('/orders') }],
        });
      }
    } catch (e) {
      say({
        from: 'bot',
        text: "I couldn't load your orders just now. You can still check them on your orders page.",
        actions: [{ label: 'View my orders →', onClick: () => go('/orders') }],
      });
    } finally {
      setBusy(false);
    }
  };

  const handleReportIssue = async () => {
    say({ from: 'user', text: 'I have an issue with my order' });
    setBusy(true);
    try {
      const orders = await fetchOrders();
      const list = orders.slice(0, 6);
      setOrderList(list);
      if (!list.length) {
        say({ from: 'bot', text: "You don't have any orders yet." });
      } else {
        say({
          from: 'bot',
          text: `Which order do you need help with? You can report an issue within ${REPORT_WINDOW_HOURS} hours of delivery.`,
        });
        setMode('orderSelect');
      }
    } catch (e) {
      say({
        from: 'bot',
        text: "I couldn't load your orders just now. Please try again in a moment.",
      });
    } finally {
      setBusy(false);
    }
  };

  const selectOrder = (order) => {
    const num = orderNo(order);
    say({ from: 'user', text: `Order #${num}` });

    if (order.status !== 'delivered') {
      say({
        from: 'bot',
        text: `Order #${num} is ${prettyStatus(order.status).toLowerCase()} — it hasn't been delivered yet, so there's nothing to report on it. I can help you track it or reach your shopper.`,
        actions: [
          { label: 'Where is my order? →', onClick: handleWhereOrder },
          { label: 'Talk to my shopper →', onClick: handleShopper },
        ],
      });
      return;
    }

    const dAt = deliveredAt(order);
    const hoursSince = dAt ? (Date.now() - dAt.getTime()) / 3600000 : Infinity;
    if (hoursSince > REPORT_WINDOW_HOURS) {
      say({
        from: 'bot',
        text: `Order #${num} was delivered${dAt ? ` on ${dAt.toLocaleString()}` : ''}. Issues can be reported within ${REPORT_WINDOW_HOURS} hours of delivery, and that window has now closed.`,
      });
      return;
    }

    setIssueOrder(order);
    say({ from: 'bot', text: `Sorry about that. What kind of issue is it with order #${num}?` });
    setMode('issueTypes');
  };

  const selectIssue = (t) => {
    say({ from: 'user', text: t.title });
    setIssue(t);
    setDraft('');
    setImageData(null);
    setImageName('');
    say({
      from: 'bot',
      text:
        t.photo === 'required'
          ? 'Please describe what happened and attach a photo — a photo is required for this so our team can help faster.'
          : 'Please describe what happened. You can attach a photo if it helps (optional).',
    });
    setMode('form');
  };

  const handleShopper = async () => {
    say({ from: 'user', text: 'Talk to my shopper' });
    say({ from: 'bot', text: 'Let me check your order…' });
    setBusy(true);
    try {
      const orders = await fetchOrders();
      const order = orders.filter((o) => !['delivered', 'cancelled'].includes(o.status))[0];

      if (!order) {
        say({ from: 'bot', text: "You don't have an active order right now." });
        return;
      }

      const shopper = order.personalShopperId;
      if (!shopper || !shopper.phone) {
        say({
          from: 'bot',
          text: 'A personal shopper hasn’t been assigned to your order yet — hang tight, we’ll notify you once they start.',
        });
        return;
      }

      const name = shopper.name ? ` ${shopper.name}` : '';
      const activity = shopperActivity(order.status);

      // Same gate as the order page: contact opens only after the shop's inquiry window.
      const inquiryTime = order.shopId?.inquiryAvailableTime || 15;
      const minsElapsed = (Date.now() - new Date(order.createdAt).getTime()) / 60000;

      if (minsElapsed < inquiryTime) {
        const left = Math.max(1, Math.ceil(inquiryTime - minsElapsed));
        say({
          from: 'bot',
          text: `Your shopper${name} ${activity}. So they can focus on your order, direct contact opens in about ${left} minute${left === 1 ? '' : 's'} — please check back then.`,
        });
        return;
      }

      say({
        from: 'bot',
        text: `Your shopper${name} ${activity}. You can reach them now:`,
        actions: [
          {
            label: `📞 Call ${shopper.phone}`,
            onClick: () => window.open(`tel:${shopper.phone}`, '_self'),
          },
        ],
      });
    } catch (e) {
      say({
        from: 'bot',
        text: "I couldn't check your order just now. You can also reach your shopper from the order page once the contact window opens.",
        actions: [{ label: 'Go to my orders →', onClick: () => go('/orders') }],
      });
    } finally {
      setBusy(false);
    }
  };

  const handleSomethingElse = () => {
    say({ from: 'user', text: 'Something else' });
    say({
      from: 'bot',
      text: 'No problem — send us a message and we’ll get back to you.',
      actions: [{ label: 'Contact us →', onClick: () => go('/community') }],
    });
  };

  const onPickImage = async (e) => {
    const file = e.target.files?.[0];
    e.target.value = '';
    if (!file) return;
    if (!file.type.startsWith('image/')) {
      say({ from: 'bot', text: 'Please attach an image file (JPG or PNG).' });
      return;
    }
    try {
      const data = await resizeImage(file);
      setImageData(data);
      setImageName(file.name || 'photo.jpg');
    } catch (err) {
      say({ from: 'bot', text: "I couldn't read that image. Please try another one." });
    }
  };

  const sendIssue = async () => {
    const text = draft.trim();
    if (!text) return;
    if (issue?.photo === 'required' && !imageData) return;

    say({ from: 'user', text: imageData ? `${text} (📎 photo attached)` : text });
    setBusy(true);
    const payload = {
      type: 'complaint',
      category: issue?.title || 'Order issue',
      orderNumber: issueOrder ? orderNo(issueOrder) : undefined,
      name: user?.name || 'Customer',
      email: user?.email || '',
      message: text,
      image: imageData || undefined,
      imageName: imageData ? imageName : undefined,
    };
    resetToMenu();
    try {
      const res = await contactAPI.send(payload);
      const ok = res?.data?.success || res?.success;
      say({
        from: 'bot',
        text: ok
          ? 'Thanks — we’ve received your report and will get back to you soon. 🙏'
          : 'Hmm, that didn’t send. Please try again from our contact page.',
        actions: ok ? undefined : [{ label: 'Contact us →', onClick: () => go('/community') }],
      });
    } catch (e) {
      say({
        from: 'bot',
        text: 'Sorry, I couldn’t send that. Please try our contact page.',
        actions: [{ label: 'Contact us →', onClick: () => go('/community') }],
      });
    } finally {
      setBusy(false);
    }
  };

  if (!open) return null;

  const menuReplies = [
    { label: "📦 Where's my order?", onClick: handleWhereOrder },
    { label: '⚠️ Report an order issue', onClick: handleReportIssue },
    { label: '🛍️ Talk to my shopper', onClick: handleShopper },
    { label: '❓ Something else', onClick: handleSomethingElse },
  ];

  const photoRequired = issue?.photo === 'required';
  const canSend = !busy && draft.trim() && (!photoRequired || !!imageData);

  return (
    <div className="ha-root" role="dialog" aria-label="Help assistant">
      <button className="ha-backdrop" aria-label="Close help" onClick={onClose} />
      <div className="ha-panel">
        <div className="ha-header">
          <div className="ha-title">
            <span className="ha-avatar">💬</span>
            <div>
              <strong>Help</strong>
              <span className="ha-sub">Quick support</span>
            </div>
          </div>
          <button className="ha-close" onClick={onClose} aria-label="Close">
            ✕
          </button>
        </div>

        <div className="ha-body" ref={scrollRef}>
          {messages.map((m, i) => (
            <div key={i} className={`ha-msg ha-${m.from}`}>
              <div className="ha-bubble">
                {m.text}
                {m.actions && (
                  <div className="ha-actions">
                    {m.actions.map((a, j) => (
                      <button key={j} className="ha-action" onClick={a.onClick}>
                        {a.label}
                      </button>
                    ))}
                  </div>
                )}
              </div>
            </div>
          ))}
        </div>

        {mode === 'menu' && (
          <div className="ha-quick">
            {menuReplies.map((r, i) => (
              <button key={i} className="ha-chip" onClick={r.onClick} disabled={busy}>
                {r.label}
              </button>
            ))}
          </div>
        )}

        {mode === 'orderSelect' && (
          <div className="ha-quick">
            {orderList.map((o) => (
              <button
                key={o._id}
                className="ha-chip ha-order"
                onClick={() => selectOrder(o)}
                disabled={busy}
              >
                #{orderNo(o)} · {prettyStatus(o.status)} ·{' '}
                {new Date(o.createdAt).toLocaleDateString()}
              </button>
            ))}
            <button className="ha-chip ha-back" onClick={resetToMenu} disabled={busy}>
              ← Back
            </button>
          </div>
        )}

        {mode === 'issueTypes' && (
          <div className="ha-quick">
            {ISSUE_TYPES.map((t) => (
              <button
                key={t.key}
                className="ha-chip"
                onClick={() => selectIssue(t)}
                disabled={busy}
              >
                {t.label}
              </button>
            ))}
            <button
              className="ha-chip ha-back"
              onClick={() => setMode('orderSelect')}
              disabled={busy}
            >
              ← Back
            </button>
          </div>
        )}

        {mode === 'form' && (
          <div className="ha-form">
            {imageData && (
              <div className="ha-attach-preview">
                <img src={imageData} alt="attachment preview" />
                <button
                  type="button"
                  className="ha-attach-remove"
                  onClick={() => {
                    setImageData(null);
                    setImageName('');
                  }}
                  aria-label="Remove photo"
                >
                  ✕
                </button>
              </div>
            )}
            <div className="ha-form-row">
              <button
                type="button"
                className="ha-attach-btn"
                onClick={() => fileRef.current?.click()}
                title="Attach a photo"
              >
                📷
              </button>
              <input ref={fileRef} type="file" accept="image/*" hidden onChange={onPickImage} />
              <input
                value={draft}
                onChange={(e) => setDraft(e.target.value)}
                placeholder={
                  photoRequired ? 'Describe the issue (photo required)…' : 'Describe the issue…'
                }
                aria-label="Describe the issue"
                onKeyDown={(e) => {
                  if (e.key === 'Enter' && canSend) sendIssue();
                }}
              />
              <button type="button" onClick={sendIssue} disabled={!canSend}>
                Send
              </button>
            </div>
            {photoRequired && !imageData && (
              <div className="ha-hint">📎 A photo is required for this issue.</div>
            )}
            <button className="ha-textlink" onClick={resetToMenu} disabled={busy}>
              ← Back to menu
            </button>
          </div>
        )}
      </div>
    </div>
  );
};

export default HelpAssistant;
