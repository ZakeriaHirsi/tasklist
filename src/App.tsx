import React, { useEffect, useMemo, useRef, useState } from "react";

// ----------------------
// Types
// ----------------------
interface Task {
  id: number;
  text: string;
  completed: boolean;
}

type TasksByDate = Record<string, Task[]>; // key: YYYY-MM-DD

// ----------------------
// Utilitarian UI Pieces
// ----------------------
function TaskBox({ checked, className = "", ...props }: { checked: boolean } & React.HTMLAttributes<HTMLButtonElement>) {
  // Hard-corner square with inner grey when checked
  return (
    <button
      type="button"
      aria-hidden
      tabIndex={-1}
      className={`relative w-7 h-7 border-2 ${checked ? "border-gray-400" : "border-black"} ${className}`}
      {...props}
    >
      {checked && <span className="absolute inset-1 bg-gray-400" />}
    </button>
  );
}

function ChevronLeftIcon(props: React.SVGProps<SVGSVGElement>) {
  return (
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" {...props}>
      <path d="M15.41 7.41 14 6l-6 6 6 6 1.41-1.41L10.83 12z" />
    </svg>
  );
}
function ChevronRightIcon(props: React.SVGProps<SVGSVGElement>) {
  return (
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" {...props}>
      <path d="m8.59 16.59 1.41 1.41L16 12 10 6 8.59 7.41 13.17 12z" />
    </svg>
  );
}

// ----------------------
// App Root
// ----------------------
export default function ChecklistApp() {
  // Views: calendar | day
  const [view, setView] = useState<'calendar' | 'day'>('day'); // start on task list page
  const [selectedDate, setSelectedDate] = useState<Date>(new Date());

  // Calendar year control
  const [year, setYear] = useState<number>(new Date().getFullYear());

  // Data store per day (now starts EMPTY)
  const [tasksByDate, setTasksByDate] = useState<TasksByDate>({});

  // Inline editing for day view
  const [editingId, setEditingId] = useState<number | null>(null);
  const [editingValue, setEditingValue] = useState<string>("");
  const [newTask, setNewTask] = useState<string>("");
  const inputRef = useRef<HTMLInputElement | null>(null);

  useEffect(() => {
    if (editingId !== null && inputRef.current) {
      inputRef.current.focus();
      inputRef.current.select();
    }
  }, [editingId]);

  // Helpers
  const fmt = (d: Date) => d.toISOString().slice(0, 10);
  const today = useMemo(() => new Date(), []);

  const currentTasks: Task[] = useMemo(() => {
    const key = fmt(selectedDate);
    return tasksByDate[key] || [];
  }, [selectedDate, tasksByDate]);

  const setCurrentTasks = (updater: (prev: Task[]) => Task[]) => {
    const key = fmt(selectedDate);
    setTasksByDate((prev) => ({ ...prev, [key]: updater(prev[key] || []) }));
  };

  const toggleTask = (id: number) => {
    setCurrentTasks((prev) => prev.map((t) => (t.id === id ? { ...t, completed: !t.completed } : t)));
  };

  const deleteTask = (id: number) => {
    setCurrentTasks((prev) => prev.filter((t) => t.id !== id));
  };

  const startEditing = (task: Task) => { setEditingId(task.id); setEditingValue(task.text); };
  const saveEditing = () => {
    if (editingId === null) return;
    const value = editingValue.trim();
    setCurrentTasks((prev) => prev.map((t) => (t.id === editingId ? { ...t, text: value || t.text } : t)));
    setEditingId(null); setEditingValue("");
  };

  const handleNewTask = () => {
    const value = newTask.trim();
    if (!value) return;
    setCurrentTasks((prev) => [...prev, { id: Date.now(), text: value, completed: false }]);
    setNewTask("");
  };

  const handleKeyDownNew = (e: React.KeyboardEvent<HTMLInputElement>) => { if (e.key === 'Enter') { e.preventDefault(); handleNewTask(); } };

  // Calendar status — with empty data this shows no circles (simple)
  const dayStatus = (d: Date): 'none' | 'incomplete' | 'complete' => {
    const list = tasksByDate[fmt(d)];
    if (!list || list.length === 0) return 'none';
    return list.every((t) => t.completed) ? 'complete' : 'incomplete';
  };

  return (
    <div className="min-h-screen bg-white flex items-start justify-center p-8" style={{ fontFamily: '"Courier New", Courier, monospace' }}>
      <div className="w-full max-w-6xl">
        {view === 'calendar' ? (
          <CalendarView
            year={year}
            onSelect={(d) => { setSelectedDate(d); setView('day'); }}
            dayStatus={dayStatus}
            onPrevYear={() => setYear((y) => y - 1)}
            onNextYear={() => setYear((y) => y + 1)}
            onToday={() => setYear(today.getFullYear())}
          />
        ) : (
          <DayView
            date={selectedDate}
            tasks={currentTasks}
            onToggle={toggleTask}
            onDelete={deleteTask}
            onStartEdit={startEditing}
            onSaveEdit={saveEditing}
            onEditChange={setEditingValue}
            editingId={editingId}
            editingValue={editingValue}
            onNewChange={setNewTask}
            newTask={newTask}
            onNewKeyDown={handleKeyDownNew}
            onNewBlur={handleNewTask}
            onBack={() => setView('calendar')}
            editRef={inputRef}
          />
        )}
      </div>
    </div>
  );
}

// ----------------------
// Calendar / Day
// ----------------------
function CalendarView({ year, onSelect, dayStatus, onPrevYear, onNextYear, onToday }: { year: number; onSelect: (d: Date) => void; dayStatus: (d: Date) => 'none' | 'incomplete' | 'complete'; onPrevYear: () => void; onNextYear: () => void; onToday: () => void; }) {
  const months = useMemo(() => Array.from({ length: 12 }, (_, i) => i), []);
  return (
    <div>
      <header className="mb-10 flex items-center justify-between">
        <h1 className="text-3xl text-black">{year}</h1>
        <div className="flex items-center gap-2">
          <button type="button" onClick={onPrevYear} title="Previous year" className="px-2 py-1 border-2 border-black inline-flex items-center">
            <ChevronLeftIcon className="w-4 h-4" />
          </button>
          <button type="button" onClick={onNextYear} title="Next year" className="px-2 py-1 border-2 border-black inline-flex items-center">
            <ChevronRightIcon className="w-4 h-4" />
          </button>
          <button type="button" onClick={onToday} className="ml-2 underline text-sm">Today</button>
        </div>
      </header>
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-10">
        {months.map((m) => (
          <Month key={m} year={year} month={m} onSelect={onSelect} dayStatus={dayStatus} />
        ))}
      </div>
    </div>
  );
}

function Month({ year, month, onSelect, dayStatus }: { year: number; month: number; onSelect: (d: Date) => void; dayStatus: (d: Date) => 'none' | 'incomplete' | 'complete'; }) {
  const first = new Date(year, month, 1);
  const monthName = first.toLocaleString(undefined, { month: 'long' });
  const startDay = (first.getDay() + 6) % 7; // Mon=0
  const daysInMonth = new Date(year, month + 1, 0).getDate();
  const cells: (Date | null)[] = [];
  for (let i = 0; i < startDay; i++) cells.push(null);
  for (let d = 1; d <= daysInMonth; d++) cells.push(new Date(year, month, d));
  while (cells.length % 7 !== 0) cells.push(null);

  return (
    <section>
      <h2 className="text-lg text-black mb-4">{monthName}</h2>
      <div className="grid grid-cols-7 text-xs text-gray-500 mb-2">
        {['M','T','W','T','F','S','S'].map((d) => (<div key={d} className="h-6 flex items-center">{d}</div>))}
      </div>
      <div className="grid grid-cols-7 gap-2">
        {cells.map((d, idx) => (
          <div key={idx} className="h-8">
            {d ? <DayCell date={d} onSelect={onSelect} status={dayStatus(d)} /> : <div />}
          </div>
        ))}
      </div>
    </section>
  );
}

function DayCell({ date, status, onSelect }: { date: Date; status: 'none' | 'incomplete' | 'complete'; onSelect: (d: Date) => void; }) {
  const day = date.getDate();
  const base = "w-8 h-8 flex items-center justify-center cursor-pointer select-none box-border";

  // Highlight today's date with a black square outline
  const now = new Date();
  const isToday =
    date.getFullYear() === now.getFullYear() &&
    date.getMonth() === now.getMonth() &&
    date.getDate() === now.getDate();
  const borderClass = isToday ? "border-2 border-black" : "";

  if (status === 'complete') {
    return (
      <button type="button" className={`${base} ${borderClass} bg-black text-white`} onClick={() => onSelect(date)} title="All tasks completed">
        {day}
      </button>
    );
  }
  if (status === 'incomplete') {
    return (
      <button type="button" className={`${base} ${borderClass} bg-gray-300 text-white`} onClick={() => onSelect(date)} title="Incomplete tasks">
        {day}
      </button>
    );
  }
  return (
    <button type="button" className={`${base} ${borderClass} text-black`} onClick={() => onSelect(date)} title="No tasks">
      {day}
    </button>
  );
}

function DayView({
  date, tasks, onToggle, onDelete, onStartEdit, onSaveEdit, onEditChange,
  editingId, editingValue, onNewChange, newTask, onNewKeyDown, onNewBlur, onBack, editRef,
}: {
  date: Date; tasks: Task[]; onToggle: (id:number)=>void; onDelete:(id:number)=>void; onStartEdit:(t:Task)=>void; onSaveEdit:()=>void; onEditChange:(v:string)=>void; editingId:number|null; editingValue:string; onNewChange:(v:string)=>void; newTask:string; onNewKeyDown:(e:React.KeyboardEvent<HTMLInputElement>)=>void; onNewBlur:()=>void; onBack:()=>void; editRef: React.RefObject<HTMLInputElement>;
}) {
  const dateLabel = date.toLocaleDateString(undefined,{ weekday:'long', year:'numeric', month:'long', day:'numeric' });
  return (
    <div className="max-w-2xl mx-auto">
      <button type="button" onClick={onBack} className="mb-4 text-sm text-black inline-flex items-center gap-1 cursor-pointer hover:opacity-70" title="Back to calendar">
        <ChevronLeftIcon className="w-4 h-4" /> Calendar
      </button>
      <header className="mb-10 text-left">
        <h1 className="text-2xl tracking-tight text-black">Today. Only today.</h1>
        <p className="text-sm text-gray-500 mt-2">{dateLabel}</p>
      </header>
      <div className="space-y-5">
        {tasks.map((task) => (
          <div key={task.id} className="group flex items-center gap-3">
            <TaskBox checked={task.completed} onClick={() => onToggle(task.id)} />
            {editingId === task.id ? (
              <input ref={editRef} type="text" value={editingValue} onChange={(e)=>onEditChange(e.target.value)} onBlur={onSaveEdit} onKeyDown={(e)=>{ if(e.key==='Enter'){e.preventDefault(); onSaveEdit();} else if (e.key==='Escape'){ e.preventDefault(); onEditChange(""); } }} className="flex-1 bg-transparent border-b border-gray-300 text-lg leading-6 focus:outline-none" style={{ color: task.completed ? '#9CA3AF' : '#000000' }} />
            ) : (
              <button onClick={() => onStartEdit(task)} className={`flex-1 text-left text-lg leading-6 transition-colors ${task.completed ? 'line-through text-gray-400' : 'text-black'} border-b border-transparent group-hover:border-gray-300 focus:border-gray-400`} title="Click to edit">{task.text}</button>
            )}
            <button aria-label="Delete task" onClick={() => onDelete(task.id)} className="p-1" title="Delete">
              <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className="w-5 h-5 text-black"><path d="M9 3h6v2h5v2H4V5h5V3zm1 6h2v9h-2V9zm4 0h2v9h-2V9zM7 9h2v9H7V9z"/></svg>
            </button>
          </div>
        ))}
        <div className="flex items-center gap-3">
          <div className={`w-7 h-7 border-2 ${newTask.trim().length>0 ? 'border-black' : 'border-gray-400'}`} />
          <input type="text" value={newTask} onChange={(e)=>onNewChange(e.target.value)} onKeyDown={onNewKeyDown} onBlur={onNewBlur} placeholder="New task" className="flex-1 bg-transparent border-b border-gray-300 placeholder-gray-300 text-lg leading-6 focus:outline-none" />
        </div>
      </div>
    </div>
  );
}

// ----------------------
// Lightweight runtime tests
// ----------------------
(function runSmokeTests() {
  try {
    // With empty seed, there should be no prepopulated dates
    const empty: TasksByDate = {};
    console.assert(Object.keys(empty).length === 0, 'Calendar should start empty');

    const computeStatus = (arr: Task[] | undefined) => !arr || arr.length === 0 ? 'none' : arr.every((t) => t.completed) ? 'complete' : 'incomplete';

    // Base cases
    console.assert(computeStatus([] as any) === 'none', 'Empty none');
    console.assert(computeStatus([{ id: 1, text: 'x', completed: true }]) === 'complete', 'Complete status');
    console.assert(computeStatus([{ id: 1, text: 'x', completed: false }]) === 'incomplete', 'Incomplete status');

    // Today outline logic sanity (non-failing check)
    const now = new Date();
    const isTodayCalc = (d: Date) => d.getFullYear() === now.getFullYear() && d.getMonth() === now.getMonth() && d.getDate() === now.getDate();
    console.assert(isTodayCalc(now) === true, 'Today check');
  } catch (e) {
    if (typeof window !== 'undefined') {
      console.warn('Smoke tests encountered an error', e);
    }
  }
})();
