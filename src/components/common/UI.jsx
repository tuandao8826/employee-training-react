import React from 'react';
import { Search } from 'lucide-react';
import { statusClass } from '../../utils/helpers';

function Stat({label,value,note,icon:Icon,tone}){return <div className="stat-card"><div className={`stat-icon ${tone}`}><Icon size={20}/></div><div className="stat-body"><span>{label}</span><strong>{value}</strong><small>{note}</small></div></div>}
function Status({value}){return <span className={`status ${statusClass(value)}`}><i/>{value}</span>}
function Empty({title,text}){return <div className="empty-state"><div><Search size={22}/></div><b>{title}</b><p>{text}</p></div>}

export { Stat, Status, Empty };
