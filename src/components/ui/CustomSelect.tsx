import React, { useEffect, useRef, useState } from 'react';

type Option = { value: string; label: string; color?: string | null; disabled?: boolean };

interface CustomSelectProps {
	value: string | null;
	onChange: (value: string | null) => void;
	options: Option[];
	placeholder?: string;
	disabled?: boolean;
	className?: string;
	direction?: 'up' | 'down';
	renderSelected?: (opt: Option | null) => React.ReactNode;
}

export const CustomSelect: React.FC<CustomSelectProps> = ({ value, onChange, options, placeholder = 'Selecciona…', disabled, className, direction = 'down', renderSelected }) => {
	const [open, setOpen] = useState(false);
	const ref = useRef<HTMLDivElement | null>(null);
  const buttonRef = useRef<HTMLButtonElement | null>(null);
  const [menuStyle, setMenuStyle] = useState<React.CSSProperties>({});

	useEffect(() => {
		const onDoc = (e: MouseEvent) => {
			if (!ref.current) return;
			if (!ref.current.contains(e.target as Node)) setOpen(false);
		};
		document.addEventListener('mousedown', onDoc);
		return () => document.removeEventListener('mousedown', onDoc);
	}, []);

  useEffect(() => {
    if (open) {
      const updatePosition = () => {
        if (!buttonRef.current) return;
        const rect = buttonRef.current.getBoundingClientRect();
        const margin = 6;
        const maxHeight = Math.min(260, direction === 'up' ? rect.top - margin : window.innerHeight - rect.bottom - margin);
        const style: React.CSSProperties = {
          position: 'absolute',
          left: 0,
          width: rect.width,
          maxHeight,
          zIndex: 50,
        };
        if (direction === 'up') {
          style.bottom = '100%';
          style.marginBottom = margin;
        } else {
          style.top = '100%';
          style.marginTop = margin;
        }
        setMenuStyle(style);
      };
      updatePosition();
    }
  }, [open, direction]);

	const selected = options.find(o => o.value === value) || null;

	// Fallback de color determinístico por etiqueta si no hay color definido
	const palette = ['#7C3AED', '#2563EB', '#059669', '#D97706', '#DC2626', '#0891B2', '#16A34A', '#F59E0B', '#BE185D'];
	const colorFromLabel = (label?: string) => {
		if (!label) return undefined;
		let hash = 0;
		for (let i = 0; i < label.length; i++) hash = ((hash << 5) - hash) + label.charCodeAt(i);
		const idx = Math.abs(hash) % palette.length;
		return palette[idx];
	};

	const selectedColor = selected?.color || colorFromLabel(selected?.label);

	return (
		<div ref={ref} className={`relative ${className || ''}`}>
			<button
				type="button"
				disabled={disabled}
				onClick={() => !disabled && setOpen(v => !v)}
				ref={buttonRef}
				className={`w-full inline-flex items-center justify-between rounded border px-3 py-2 text-sm bg-white ${disabled ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer'} focus:ring-2 focus:ring-blue-500 focus:border-transparent`}
			>
				<span className="inline-flex items-center gap-2 min-w-0 w-full">
					{renderSelected
						? (renderSelected(selected))
						: (<>
							{(selectedColor) && (
								<span className="inline-block w-3 h-3 rounded-full" style={{ backgroundColor: selectedColor }} />
							)}
							<span className={`${selected ? 'text-gray-900' : 'text-gray-500'} truncate`}>{selected ? selected.label : placeholder}</span>
						</>)}
				</span>
				<span className="ml-2 text-gray-500">▾</span>
			</button>
			{open && (
				<div 
					className="absolute z-50 rounded-md border bg-white shadow-lg overflow-auto" 
					style={menuStyle}
				>
					{options.map(opt => (
						<button
							key={opt.value}
							type="button"
							onClick={(e) => { 
								e.preventDefault();
								e.stopPropagation();
								console.log('CustomSelect clicked:', opt.value, opt.label);
								if (opt.disabled) return; 
								onChange(opt.value); 
								setOpen(false); 
							}}
							disabled={opt.disabled}
							className={`w-full text-left px-3 py-2 text-sm inline-flex items-center gap-2 hover:bg-gray-50 ${opt.disabled ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer'}`}
						>
							<span className="inline-block w-3 h-3 rounded-full" style={{ backgroundColor: (opt.color || colorFromLabel(opt.label)) }} />
							<span>{opt.label}</span>
						</button>
					))}
				</div>
			)}
		</div>
	);
};

export default CustomSelect;


