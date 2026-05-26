"use client";

import type { ChangeEvent } from "react";
import { Plus, Trash2 } from "lucide-react";
import Input from "@/components/input";
import {
  formatCurrency,
  lineSubtotal,
  type VoucherItemInput,
} from "@/lib/voucher";

export type ItemRow = VoucherItemInput;

type Props = {
  items: ItemRow[];
  currency: string;
  onChange: (next: ItemRow[]) => void;
  error?: string;
};

export default function ItemsEditor({ items, currency, onChange, error }: Props) {
  function updateItem(idx: number, patch: Partial<ItemRow>) {
    onChange(items.map((it, i) => (i === idx ? { ...it, ...patch } : it)));
  }

  function addItem() {
    onChange([
      ...items,
      { description: "", quantity: 1, unitPrice: 0, taxRate: 0 },
    ]);
  }

  function removeItem(idx: number) {
    if (items.length === 1) return;
    onChange(items.filter((_, i) => i !== idx));
  }

  function handleNumberInput(
    e: ChangeEvent<HTMLInputElement>,
    onValue: (n: number) => void,
  ) {
    const v = parseFloat(e.target.value);
    onValue(Number.isFinite(v) && v >= 0 ? v : 0);
  }

  return (
    <>
      <div className="overflow-hidden rounded-lg border border-zinc-200 dark:border-zinc-800">
        <div className="hidden bg-zinc-50 px-3 py-2 text-[10.5px] font-semibold uppercase tracking-wider text-zinc-500 sm:grid sm:grid-cols-[1fr_90px_120px_90px_120px_36px] sm:gap-2 dark:bg-zinc-900/60 dark:text-zinc-400">
          <span>Description</span>
          <span className="text-right">Qty</span>
          <span className="text-right">Unit price</span>
          <span className="text-right">Tax %</span>
          <span className="text-right">Line total</span>
          <span></span>
        </div>
        <ul className="divide-y divide-zinc-100 dark:divide-zinc-800">
          {items.map((it, idx) => (
            <li
              key={idx}
              className="grid grid-cols-1 gap-2 p-3 sm:grid-cols-[1fr_90px_120px_90px_120px_36px] sm:items-center"
            >
              <Input
                value={it.description}
                onChange={(e) =>
                  updateItem(idx, { description: e.target.value })
                }
                placeholder="Item or service description"
                maxLength={500}
              />
              <Input
                type="number"
                min={0}
                step="0.01"
                value={String(it.quantity)}
                onChange={(e) =>
                  handleNumberInput(e, (n) => updateItem(idx, { quantity: n }))
                }
                className="sm:text-right"
              />
              <Input
                type="number"
                min={0}
                step="0.01"
                value={String(it.unitPrice)}
                onChange={(e) =>
                  handleNumberInput(e, (n) => updateItem(idx, { unitPrice: n }))
                }
                className="sm:text-right"
              />
              <Input
                type="number"
                min={0}
                max={100}
                step="0.01"
                value={String(it.taxRate)}
                onChange={(e) =>
                  handleNumberInput(e, (n) => updateItem(idx, { taxRate: n }))
                }
                className="sm:text-right"
              />
              <div className="text-right text-[13px] font-medium tabular-nums text-zinc-700 dark:text-zinc-300">
                {formatCurrency(lineSubtotal(it), currency)}
              </div>
              <button
                type="button"
                aria-label="Remove line"
                onClick={() => removeItem(idx)}
                disabled={items.length === 1}
                className="grid h-8 w-8 place-items-center justify-self-end rounded-md text-zinc-400 transition-colors hover:bg-rose-50 hover:text-rose-600 disabled:cursor-not-allowed disabled:opacity-40 dark:hover:bg-rose-950/40 dark:hover:text-rose-300"
              >
                <Trash2 className="h-3.5 w-3.5" />
              </button>
            </li>
          ))}
        </ul>
        <div className="flex items-center justify-between border-t border-zinc-100 bg-zinc-50/50 px-3 py-2 dark:border-zinc-800 dark:bg-zinc-900/40">
          <button
            type="button"
            onClick={addItem}
            className="inline-flex items-center gap-1.5 text-[12.5px] font-medium text-primary hover:text-primary/80"
          >
            <Plus className="h-3.5 w-3.5" />
            Add line
          </button>
          <p className="text-[11px] text-zinc-500 dark:text-zinc-400">
            {items.length} {items.length === 1 ? "line" : "lines"}
          </p>
        </div>
      </div>
      {error ? (
        <p className="mt-2 text-[11.5px] text-red-600 dark:text-red-400">
          {error}
        </p>
      ) : null}
    </>
  );
}
