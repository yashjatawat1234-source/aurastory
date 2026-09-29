import React, { useRef } from 'react';

export type ElementType =
    | 'SCENE_HEADING'
    | 'ACTION'
    | 'CHARACTER'
    | 'PARENTHETICAL'
    | 'DIALOGUE'
    | 'TRANSITION';

export interface ScriptBlock {
    id: string;
    type: ElementType;
    text: string;
}

const ENTER_NEXT_MAP: Record<ElementType, ElementType> = {
    SCENE_HEADING: 'ACTION',
    ACTION: 'ACTION',
    CHARACTER: 'DIALOGUE',
    PARENTHETICAL: 'DIALOGUE',
    DIALOGUE: 'CHARACTER',
    TRANSITION: 'SCENE_HEADING',
};

interface ScreenplayEditorProps {
    blocks: ScriptBlock[];
    onChange: (updatedBlocks: ScriptBlock[]) => void;
}

export function ScreenplayEditor({ blocks, onChange }: ScreenplayEditorProps) {
    const blockRefs = useRef<Record<string, HTMLInputElement | null>>({});

    const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>, id: string, type: ElementType, text: string) => {
        const currentIndex = blocks.findIndex((b) => b.id === id);

        // 1. TAB KEY: Move cursor to next/previous line without changing element type
        if (e.key === 'Tab') {
            e.preventDefault();

            if (e.shiftKey) {
                if (currentIndex > 0) {
                    const prevId = blocks[currentIndex - 1].id;
                    blockRefs.current[prevId]?.focus();
                }
            } else {
                if (currentIndex < blocks.length - 1) {
                    const nextId = blocks[currentIndex + 1].id;
                    blockRefs.current[nextId]?.focus();
                } else {
                    const nextType = ENTER_NEXT_MAP[type] || 'ACTION';
                    addNewBlockAfter(id, nextType);
                }
            }
            return;
        }

        // 2. ENTER KEY: Create a new line below
        if (e.key === 'Enter') {
            e.preventDefault();

            if ((type === 'DIALOGUE' || type === 'CHARACTER' || type === 'PARENTHETICAL') && text.trim() === '') {
                updateBlockType(id, 'ACTION');
                return;
            }

            const nextType = ENTER_NEXT_MAP[type];
            addNewBlockAfter(id, nextType);
        }

        // 3. BACKSPACE KEY: Delete empty block and focus previous line
        if (e.key === 'Backspace' && text === '') {
            e.preventDefault();
            deleteBlock(id);
        }
    };

    const updateBlockText = (id: string, text: string, type: ElementType) => {
        let formattedText = text;

        if (type === 'SCENE_HEADING' || type === 'CHARACTER' || type === 'TRANSITION') {
            formattedText = text.toUpperCase();
        }

        const updated = blocks.map((b) => (b.id === id ? { ...b, text: formattedText } : b));
        onChange(updated);
    };

    const updateBlockType = (id: string, newType: ElementType) => {
        const updated = blocks.map((b) => (b.id === id ? { ...b, type: newType } : b));
        onChange(updated);
    };

    const addNewBlockAfter = (currentId: string, nextType: ElementType) => {
        const currentIndex = blocks.findIndex((b) => b.id === currentId);
        const newId = Date.now().toString();
        const newBlock: ScriptBlock = { id: newId, type: nextType, text: '' };

        const updated = [...blocks];
        updated.splice(currentIndex + 1, 0, newBlock);
        onChange(updated);

        setTimeout(() => {
            blockRefs.current[newId]?.focus();
        }, 50);
    };

    const deleteBlock = (id: string) => {
        if (blocks.length <= 1) return;

        const currentIndex = blocks.findIndex((b) => b.id === id);
        const prevBlock = blocks[currentIndex - 1] || blocks[currentIndex + 1];

        const updated = blocks.filter((b) => b.id !== id);
        onChange(updated);

        if (prevBlock) {
            setTimeout(() => {
                blockRefs.current[prevBlock.id]?.focus();
            }, 50);
        }
    };

    const getElementStyle = (type: ElementType) => {
        switch (type) {
            case 'SCENE_HEADING':
                return 'font-bold uppercase tracking-wide my-3 text-emerald-400';
            case 'ACTION':
                return 'my-1 text-slate-200';
            case 'CHARACTER':
                return 'uppercase font-semibold text-center mt-4 mb-0 max-w-[220px] mx-auto text-cyan-400';
            case 'PARENTHETICAL':
                return 'text-center my-0 max-w-[250px] mx-auto text-sm text-slate-400';
            case 'DIALOGUE':
                return 'text-left max-w-[360px] mx-auto mb-3 text-slate-100';
            case 'TRANSITION':
                return 'uppercase text-right my-3 font-bold text-slate-400';
            default:
                return 'text-left';
        }
    };

    return (
        <div className="w-[8.5in] min-h-[11in] bg-slate-950 border border-slate-800 rounded-xl mx-auto p-[1in] shadow-2xl font-mono text-[12pt]">
            {blocks.map((block) => (
                <div key={block.id} className="relative group flex items-center my-1">
                    <div className="absolute -left-36 top-1/2 -translate-y-1/2 flex items-center gap-1">
                        <select
                            value={block.type}
                            onChange={(e) => updateBlockType(block.id, e.target.value as ElementType)}
                            className="bg-slate-900 border border-slate-800 text-[10px] font-sans text-slate-400 uppercase rounded px-2 py-1 outline-none hover:text-emerald-400 hover:border-emerald-500 transition cursor-pointer"
                        >
                            <option value="SCENE_HEADING">SCENE</option>
                            <option value="ACTION">ACTION</option>
                            <option value="CHARACTER">CHARACTER</option>
                            <option value="PARENTHETICAL">PARENTHETICAL</option>
                            <option value="DIALOGUE">DIALOGUE</option>
                            <option value="TRANSITION">TRANSITION</option>
                        </select>
                    </div>

                    <input
                        ref={(el) => { blockRefs.current[block.id] = el; }}
                        type="text"
                        value={block.text}
                        onChange={(e) => updateBlockText(block.id, e.target.value, block.type)}
                        onKeyDown={(e) => handleKeyDown(e, block.id, block.type, block.text)}
                        className={`w-full bg-transparent outline-none border-none ${getElementStyle(block.type)}`}
                        placeholder={`[ ${block.type.replace('_', ' ')} ]`}
                    />
                </div>
            ))}
        </div>
    );
}