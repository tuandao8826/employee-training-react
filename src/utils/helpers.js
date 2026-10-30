export const readStore = (key, fallback) => { try { const v = localStorage.getItem(key); return v ? JSON.parse(v) : fallback; } catch { return fallback; } };
export const persist = (key, value) => { try { localStorage.setItem(key, JSON.stringify(value)); } catch {} };
export const initials = (name='') => name.split(' ').slice(-2).map(x => x[0]).join('').toUpperCase();
export const statusClass = s => s === 'Hoàn thành' || s === 'Đang làm việc' ? 'success' : s === 'Đang học' || s === 'Đang diễn ra' ? 'info' : s === 'Chưa bắt đầu' || s === 'Sắp diễn ra' ? 'warning' : s === 'Tạm nghỉ' ? 'muted' : 'neutral';
export const avatarTone = id => ['avatar-blue','avatar-green','avatar-pink','avatar-orange','avatar-purple','avatar-teal'][Number(id)%6];
