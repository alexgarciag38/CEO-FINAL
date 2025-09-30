import React, { useState, useRef, useEffect, useImperativeHandle, forwardRef, useCallback } from 'react';

type DateSegment = 'day' | 'month' | 'year';

export interface SmartDateInputRef {
	focus: () => void;
	processDigit: (digit: string) => void;
}

interface SmartDateInputProps {
	value: string;
	onChange: (value: string) => void;
	isEditing?: boolean;
	onStateChange?: (isEditing: boolean) => void;
	onComplete?: () => void; // nuevo: notificar cuando se completa yyyy
}

const SmartDateInput = forwardRef<SmartDateInputRef, SmartDateInputProps>(
	({ value, onChange, isEditing: parentIsEditing = false, onStateChange, onComplete }, ref) => {
		const [day, setDay] = useState('');
		const [month, setMonth] = useState('');
		const [year, setYear] = useState('');
		const [activeSegment, setActiveSegment] = useState<DateSegment>('day');
		const [isEditing, setIsEditing] = useState(false);

		const inputRef = useRef<HTMLInputElement>(null);

		// Refs para evitar stale closures y tener siempre el último valor
		const dayRef = useRef('');
		const monthRef = useRef('');
		const yearRef = useRef('');
		const activeRef = useRef<DateSegment>('day');

		const syncFromValue = useCallback((val: string) => {
			if (val && val.includes('-')) {
				const [y, m, d] = val.split('-');
				setYear(y || '');
				yearRef.current = y || '';
				setMonth(m || '');
				monthRef.current = m || '';
				setDay(d || '');
				dayRef.current = d || '';
			} else {
				setYear('');
				yearRef.current = '';
				setMonth('');
				monthRef.current = '';
				setDay('');
				dayRef.current = '';
			}
		}, []);

		useEffect(() => {
			if (!isEditing) {
				syncFromValue(value);
			}
		}, [value, isEditing, syncFromValue]);

		useEffect(() => {
			if (parentIsEditing && !isEditing) {
				startEditing(false);
			} else if (!parentIsEditing && isEditing) {
				stopEditing(false);
			}
		}, [parentIsEditing]);
		
		const startEditing = (clear = false) => {
			setIsEditing(true);
			onStateChange?.(true);
			if (clear) {
				setDay(''); dayRef.current = '';
				setMonth(''); monthRef.current = '';
				setYear(''); yearRef.current = '';
			}
			setActiveSegment('day');
			activeRef.current = 'day';
			inputRef.current?.focus();
		};

		const stopEditing = (shouldSaveChanges: boolean) => {
			setIsEditing(false);
			onStateChange?.(false);
			if (shouldSaveChanges) {
				if (dayRef.current.length === 2 && monthRef.current.length === 2 && yearRef.current.length === 4) {
					const newDate = `${yearRef.current}-${monthRef.current}-${dayRef.current}`;
					if (newDate !== value) {
						onChange(newDate);
					}
				}
			}
			inputRef.current?.blur();
			// Notificar completion (usado para mover foco a la derecha)
			if (dayRef.current.length === 2 && monthRef.current.length === 2 && yearRef.current.length === 4) {
				onComplete?.();
			}
		};

		const processDigit = (digit: string) => {
			if (!isEditing) {
				startEditing(true);
				dayRef.current = digit;
				setDay(digit);
				activeRef.current = 'day';
				setActiveSegment('day');
				return;
			}

			switch (activeRef.current) {
				case 'day': {
					if (dayRef.current.length < 2) {
						const newDay = dayRef.current + digit;
						dayRef.current = newDay;
						setDay(newDay);
						if (newDay.length === 2) {
							activeRef.current = 'month';
							setActiveSegment('month');
						}
					}
					break;
				}
				case 'month': {
					if (monthRef.current.length < 2) {
						const newMonth = monthRef.current + digit;
						monthRef.current = newMonth;
						setMonth(newMonth);
						if (newMonth.length === 2) {
							activeRef.current = 'year';
							setActiveSegment('year');
						}
					}
					break;
				}
				case 'year': {
					if (yearRef.current.length < 4) {
						const newYear = yearRef.current + digit;
						yearRef.current = newYear;
						setYear(newYear);
						if (newYear.length === 4) stopEditing(true);
					}
					break;
				}
			}
		};
		
		const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
			if (e.key >= '0' && e.key <= '9') {
				e.preventDefault();
				processDigit(e.key);
			} else if (e.key === 'Backspace') {
				e.preventDefault();
				handleBackspace();
			} else if (e.key === 'Enter' || e.key === 'Tab') {
				e.preventDefault();
				stopEditing(true);
			} else if (e.key === 'Escape') {
				e.preventDefault();
				stopEditing(false);
			} else if (e.key === 'ArrowLeft' || e.key === 'ArrowRight' || e.key === 'ArrowUp' || e.key === 'ArrowDown') {
				// No cambiar de segmento; salir y permitir que el padre navegue
				stopEditing(true);
				// No preventDefault para que el listener global pueda mover el foco
			}
		};

		const handleBackspace = () => {
			switch (activeRef.current) {
				case 'day':
					if (dayRef.current.length > 0) {
						dayRef.current = dayRef.current.slice(0, -1);
						setDay(dayRef.current);
					}
					break;
				case 'month':
					if (monthRef.current.length > 0) {
						monthRef.current = monthRef.current.slice(0, -1);
						setMonth(monthRef.current);
					} else {
						activeRef.current = 'day';
						setActiveSegment('day');
					}
					break;
				case 'year':
					if (yearRef.current.length > 0) {
						yearRef.current = yearRef.current.slice(0, -1);
						setYear(yearRef.current);
					} else {
						activeRef.current = 'month';
						setActiveSegment('month');
					}
					break;
			}
		};

		useImperativeHandle(ref, () => ({
			focus: () => {
				startEditing(false);
				inputRef.current?.focus();
			},
			processDigit: (digit: string) => {
				processDigit(digit);
			}
		}));

		const getSegmentValue = (segment: DateSegment) => {
			if (isEditing) {
				if (segment === 'day') return dayRef.current;
				if (segment === 'month') return monthRef.current;
				if (segment === 'year') return yearRef.current;
			}
			if (value) {
				const [y, m, d] = value.split('-');
				if (segment === 'day') return d;
				if (segment === 'month') return m;
				if (segment === 'year') return y;
			}
			return '';
		};

		const dd = getSegmentValue('day') || '';
		const mm = getSegmentValue('month') || '';
		const aaaa = getSegmentValue('year') || '';

		return (
			<div 
				className="relative w-full h-full flex items-center justify-center cursor-text"
				onClick={() => { if (isEditing) inputRef.current?.focus(); }}
			>
				<div className="flex items-center text-sm tabular-nums">
					<span className="px-1">{dd.padEnd(2, '_')}</span>
					<span>/</span>
					<span className="px-1">{mm.padEnd(2, '_')}</span>
					<span>/</span>
					<span className="px-1">{aaaa.padEnd(4, '_')}</span>
				</div>
				<input
					ref={inputRef}
					type="text"
					className="absolute inset-0 w-full h-full opacity-0 cursor-text"
					onKeyDown={handleKeyDown}
					onBlur={() => stopEditing(true)}
				/>
			</div>
		);
	}
);

SmartDateInput.displayName = 'SmartDateInput';

export default SmartDateInput;
